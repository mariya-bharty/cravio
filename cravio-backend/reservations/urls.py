from django.urls import path
from .views import (
    ReservationListView, MyReservationsView,
    RestaurantReservationsView, ReservationDetailView,
    resend_otp, verify_otp, check_availability,
)

urlpatterns = [
    path('', ReservationListView.as_view(), name='reservation-list'),
    path('my/', MyReservationsView.as_view(), name='my-reservations'),
    path('availability/', check_availability, name='reservation-availability'),
    path('restaurant/', RestaurantReservationsView.as_view(), name='restaurant-reservations'),
    path('<int:pk>/', ReservationDetailView.as_view(), name='reservation-detail'),
    path('<int:pk>/verify-otp/', verify_otp, name='verify-otp'),
    path('<int:pk>/resend-otp/', resend_otp, name='resend-otp'),
]
