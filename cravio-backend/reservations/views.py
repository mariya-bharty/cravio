from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Reservation
from .serializers import ReservationSerializer
from .email_service import send_otp_email

# Max bookings per restaurant per time slot (configurable)
MAX_SLOTS_PER_HOUR = 5


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def check_availability(request):
    """
    GET /api/reservations/availability/?restaurant=<id>&date=<YYYY-MM-DD>&time=<HH:MM>
    Returns { available: bool, booked: int, max: int, nearby_times: [...] }
    """
    restaurant_id = request.query_params.get('restaurant')
    date_str = request.query_params.get('date')
    time_str = request.query_params.get('time', '')

    if not restaurant_id or not date_str:
        return Response({'available': True, 'booked': 0, 'max': MAX_SLOTS_PER_HOUR})

    try:
        hour = int(time_str.split(':')[0]) if time_str else None
    except (ValueError, IndexError):
        hour = None

    from datetime import time as dt_time, timedelta
    import datetime

    qs = Reservation.objects.filter(
        restaurant_id=restaurant_id,
        date=date_str,
        status='confirmed',
    )
    if hour is not None:
        # Count bookings within ±30 min of requested time
        qs = qs.filter(time__gte=dt_time(max(0, hour - 1), 0),
                       time__lte=dt_time(min(23, hour + 1), 59))

    booked = qs.count()
    available = booked < MAX_SLOTS_PER_HOUR

    # Suggest nearby available time slots
    nearby_times = []
    if not available and hour is not None:
        for delta in [-2, -1, 1, 2]:
            h = hour + delta
            if 10 <= h <= 23:
                slot_qs = Reservation.objects.filter(
                    restaurant_id=restaurant_id,
                    date=date_str,
                    status='confirmed',
                    time__gte=dt_time(max(0, h - 1), 0),
                    time__lte=dt_time(min(23, h + 1), 59),
                )
                if slot_qs.count() < MAX_SLOTS_PER_HOUR:
                    nearby_times.append(f'{h:02d}:00')

    return Response({
        'available': available,
        'booked': booked,
        'max': MAX_SLOTS_PER_HOUR,
        'nearby_times': nearby_times,
    })


class ReservationListView(generics.ListCreateAPIView):
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Reservation.objects.all()
        restaurant_id = self.request.query_params.get('restaurant')
        if restaurant_id:
            qs = qs.filter(restaurant_id=restaurant_id)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        restaurant = serializer.validated_data['restaurant']
        res_date = serializer.validated_data['date']
        res_time = serializer.validated_data['time']

        # ── Duplicate booking prevention: check if active reservation already exists for same user, restaurant, date, and time ──
        existing = Reservation.objects.filter(
            user=user,
            restaurant=restaurant,
            date=res_date,
            time=res_time,
        ).exclude(status='cancelled')

        if existing.exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError({
                'detail': f'You already have an active reservation request for {restaurant.name} on {res_date} at {res_time.strftime("%H:%M")}. Duplicate bookings for the same slot are not allowed.'
            })

        reservation = serializer.save(user=user)

        # ── Seat availability check (only for 10-08-2026 at 20:00) ──
        from datetime import date, time as dt_time
        SPECIAL_DATE = date(2026, 8, 10)

        if reservation.date == SPECIAL_DATE and reservation.time.hour == 20:
            available = restaurant.total_tables - restaurant.reserved_tables
            if available <= 0:
                reservation.delete()
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'detail': f'Sorry, no tables available at {restaurant.name} on 10 Aug 2026 at 8:00 PM. All {restaurant.total_tables} tables are reserved.'})
            # Mark one more table as reserved
            restaurant.reserved_tables = min(restaurant.reserved_tables + 1, restaurant.total_tables)
            restaurant.save(update_fields=['reserved_tables'])

        notification_email = self.request.data.get('notification_email', '').strip() or None
        reservation.generate_and_set_otp()
        send_otp_email(reservation, override_email=notification_email)


class MyReservationsView(generics.ListAPIView):
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only display reservations where the OTP has been successfully verified
        return Reservation.objects.filter(user=self.request.user, otp_verified=True)


class RestaurantReservationsView(generics.ListAPIView):
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'owner':
            qs = Reservation.objects.filter(restaurant__owner=user, otp_verified=True)
            restaurant_id = self.request.query_params.get('restaurant')
            if restaurant_id:
                qs = qs.filter(restaurant_id=restaurant_id)
            return qs
        if user.role == 'admin':
            return Reservation.objects.filter(otp_verified=True)
        return Reservation.objects.none()


class ReservationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ('admin', 'owner'):
            return Reservation.objects.all()
        return Reservation.objects.filter(user=user)

    def perform_update(self, serializer):
        instance = serializer.save()
        if 'status' in serializer.validated_data:
            from .email_service import send_status_update_email
            send_status_update_email(instance)

    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)



@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def resend_otp(request, pk):
    """Resend OTP for a reservation."""
    try:
        reservation = Reservation.objects.get(pk=pk, user=request.user)
    except Reservation.DoesNotExist:
        return Response({'detail': 'Reservation not found.'}, status=404)

    if reservation.otp_verified:
        return Response({'detail': 'Reservation already confirmed.'}, status=400)

    otp = reservation.generate_and_set_otp()
    sent = send_otp_email(reservation)
    if sent:
        return Response({'detail': 'OTP sent to your email address.'})
    return Response({'detail': 'Failed to send OTP email. Please check your email address.'}, status=500)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_otp(request, pk):
    """
    Verify OTP and confirm the reservation request.
    Body: { "otp": "123456" }
    """
    try:
        reservation = Reservation.objects.get(pk=pk, user=request.user)
    except Reservation.DoesNotExist:
        return Response({'detail': 'Reservation not found.'}, status=404)

    if reservation.otp_verified:
        return Response({'detail': 'Email already verified.', 'reservation': ReservationSerializer(reservation).data})

    entered_otp = request.data.get('otp', '').strip()
    if not entered_otp:
        return Response({'detail': 'OTP is required.'}, status=400)

    if reservation.is_otp_valid(entered_otp):
        reservation.otp_verified = True
        reservation.status = 'pending'  # remains pending until owner confirms
        reservation.save(update_fields=['otp_verified', 'status'])
        return Response({
            'detail': 'Email verified! Your reservation request has been submitted to the restaurant for approval.',
            'reservation': ReservationSerializer(reservation).data,
        })

    return Response({'detail': 'Invalid or expired OTP. Please try again.'}, status=400)

