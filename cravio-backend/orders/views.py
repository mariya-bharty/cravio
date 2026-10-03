from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Count
from .models import Order, OrderItem, PromoCode
from .serializers import OrderSerializer, OrderCreateSerializer, PromoCodeSerializer


class OrderCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        from restaurants.models import Restaurant
        try:
            restaurant = Restaurant.objects.get(id=data['restaurant'])
        except Restaurant.DoesNotExist:
            return Response({'detail': 'Restaurant not found.'}, status=404)

        # Check that the delivery address matches the restaurant's city
        import re
        restaurant_city = ' '.join(restaurant.city.strip().lower().split())
        delivery_address_lower = ' '.join(data['delivery_address'].lower().split())

        # City aliases mapping
        CITY_ALIASES = {
            'bengaluru': ['bangalore'],
            'bangalore': ['bengaluru'],
            'mumbai': ['bombay'],
            'bombay': ['mumbai'],
            'chennai': ['madras'],
            'madras': ['chennai'],
            'kolkata': ['calcutta'],
            'calcutta': ['kolkata'],
        }

        def city_in_address(city_name, address):
            pattern = r'\b' + re.escape(city_name) + r'\b'
            return bool(re.search(pattern, address))

        is_match = city_in_address(restaurant_city, delivery_address_lower)
        if not is_match:
            for alias in CITY_ALIASES.get(restaurant_city, []):
                if city_in_address(alias, delivery_address_lower):
                    is_match = True
                    break

        if not is_match:
            return Response(
                {'detail': f"Your delivery address must be in {restaurant.city}. Please update your city and try again."},
                status=status.HTTP_400_BAD_REQUEST
            )

        order = Order.objects.create(
            user=request.user,
            restaurant=restaurant,
            delivery_address=data['delivery_address'],
            notes=data.get('notes', ''),
            total_amount=data['total_amount'],
            promo_code=data.get('promo_code', None),
            discount_amount=data.get('discount_amount', 0.00),
        )

        from foods.models import Food
        for item_data in data['items']:
            try:
                food = Food.objects.get(id=item_data['food'])
                OrderItem.objects.create(
                    order=order,
                    food=food,
                    quantity=item_data['quantity'],
                    price=item_data['price'],
                )
            except Food.DoesNotExist:
                pass

        # Clear cart after order
        from cart.models import Cart
        Cart.objects.filter(user=request.user).delete()

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class ValidatePromoView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        code_str = request.data.get('code', '').strip().upper()
        try:
            subtotal = float(request.data.get('subtotal', 0))
        except (ValueError, TypeError):
            subtotal = 0.0

        if not code_str:
            return Response({'detail': 'Please enter a promo code.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            promo = PromoCode.objects.get(code__iexact=code_str, is_active=True)
        except PromoCode.DoesNotExist:
            return Response({'detail': 'Invalid or expired promo code.'}, status=status.HTTP_400_BAD_REQUEST)

        # Min order check
        min_order = float(promo.min_order_amount)
        if subtotal < min_order:
            return Response(
                {'detail': f'This code requires a minimum order of ₹{min_order:.0f}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # First order only check
        if promo.first_order_only:
            user_orders = Order.objects.filter(user=request.user).count()
            if user_orders > 0:
                return Response(
                    {'detail': 'This promo code is valid for first-time orders only.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # One time per user check
        if promo.one_time_per_user:
            used_before = Order.objects.filter(user=request.user, promo_code__iexact=promo.code).exists()
            if used_before:
                return Response(
                    {'detail': 'You have already used this promo code.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Calculate discount
        val = float(promo.discount_value)
        if promo.discount_type == 'percentage':
            discount = subtotal * (val / 100.0)
            if promo.max_discount_amount and float(promo.max_discount_amount) > 0:
                discount = min(discount, float(promo.max_discount_amount))
        else:
            discount = min(subtotal, val)

        discount = round(discount, 2)

        return Response({
            'valid': True,
            'code': promo.code,
            'discount_type': promo.discount_type,
            'discount_value': float(promo.discount_value),
            'discount_amount': discount,
            'description': promo.description or (f"{val:.0f}% off" if promo.discount_type == 'percentage' else f"₹{val:.0f} off"),
        })


class AdminPromoCodeListView(generics.ListCreateAPIView):
    serializer_class = PromoCodeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'admin':
            return PromoCode.objects.none()
        return PromoCode.objects.all()

    def perform_create(self, serializer):
        if self.request.user.role != 'admin':
            raise permissions.PermissionDenied("Only admins can manage promo codes.")
        serializer.save()


class AdminPromoCodeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PromoCodeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'admin':
            return PromoCode.objects.none()
        return PromoCode.objects.all()


class MyOrdersView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related('items', 'items__food')


class RestaurantOrdersView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Order.objects.all().prefetch_related('items', 'items__food')
        if user.role == 'owner':
            qs = Order.objects.filter(restaurant__owner=user)
            restaurant_id = self.request.query_params.get('restaurant')
            if restaurant_id:
                qs = qs.filter(restaurant_id=restaurant_id)
            return qs.prefetch_related('items', 'items__food')
        return Order.objects.none()


class OrderDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Order.objects.all()
        if user.role == 'owner':
            return Order.objects.filter(restaurant__owner=user)
        return Order.objects.filter(user=user)

    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)


class OwnerStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'owner':
            return Response({'detail': 'Forbidden'}, status=403)

        orders = Order.objects.filter(restaurant__owner=request.user)
        from foods.models import Food
        total_foods = Food.objects.filter(restaurant__owner=request.user).count()
        revenue = orders.filter(status='delivered').aggregate(total=Sum('total_amount'))['total'] or 0

        return Response({
            'total_orders': orders.count(),
            'pending_orders': orders.filter(status='pending').count(),
            'total_revenue': revenue,
            'total_foods': total_foods,
        })


class OrderTrackView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        import json
        import time
        from django.http import StreamingHttpResponse

        def event_stream():
            STATUS_STEPS = ['pending', 'accepted', 'preparing', 'ready', 'delivered']
            last_status = None
            max_iterations = 200

            for _ in range(max_iterations):
                try:
                    order = Order.objects.get(pk=pk, user=request.user)
                except Order.DoesNotExist:
                    yield f"data: {json.dumps({'error': 'Order not found'})}\n\n"
                    break

                current_status = order.status
                step_index = STATUS_STEPS.index(current_status) if current_status in STATUS_STEPS else 0

                if current_status != last_status:
                    payload = {
                        'order_id': order.id,
                        'status': current_status,
                        'step_index': step_index,
                        'total_steps': len(STATUS_STEPS),
                        'restaurant': order.restaurant.name,
                        'updated_at': order.updated_at.isoformat(),
                    }
                    yield f"data: {json.dumps(payload)}\n\n"
                    last_status = current_status

                if current_status in ('delivered', 'cancelled'):
                    yield f"data: {json.dumps({'done': True, 'status': current_status})}\n\n"
                    break

                time.sleep(3)

        response = StreamingHttpResponse(
            event_stream(),
            content_type='text/event-stream',
        )
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response


class OfflineOrderCreateView(APIView):
    """
    POST /api/orders/offline/
    Allows restaurant owners to record offline / walk-in POS orders.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role not in ('owner', 'admin'):
            return Response({'detail': 'Only restaurant owners can record offline orders.'}, status=status.HTTP_403_FORBIDDEN)

        restaurant_id = request.data.get('restaurant')
        from restaurants.models import Restaurant
        restaurant = Restaurant.objects.filter(id=restaurant_id).first()
        if not restaurant:
            return Response({'detail': 'Restaurant not found.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.role != 'admin' and restaurant.owner != request.user:
            return Response({'detail': 'You do not own this restaurant.'}, status=status.HTTP_403_FORBIDDEN)

        customer_name = request.data.get('customer_name', '').strip() or 'Walk-In Diner'
        notes = request.data.get('notes', '').strip() or 'POS Offline Order'
        items_data = request.data.get('items', [])
        total_amount = request.data.get('total_amount', 0.0)

        if not items_data:
            return Response({'detail': 'Please add at least one item to the order.'}, status=status.HTTP_400_BAD_REQUEST)

        order = Order.objects.create(
            user=None,
            restaurant=restaurant,
            order_type='offline',
            customer_name=customer_name,
            delivery_address='Dine-In / Counter Pick',
            notes=notes,
            total_amount=total_amount,
            status='delivered'  # Offline orders are completed immediately
        )

        from foods.models import Food
        for item in items_data:
            food_id = item.get('food')
            quantity = int(item.get('quantity', 1))
            price = float(item.get('price', 0.0))
            food = Food.objects.filter(id=food_id).first()
            if food:
                OrderItem.objects.create(
                    order=order,
                    food=food,
                    quantity=quantity,
                    price=price
                )

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

