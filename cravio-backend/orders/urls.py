from django.urls import path
from .views import (
    OrderCreateView, MyOrdersView, RestaurantOrdersView, OrderDetailView,
    OwnerStatsView, OrderTrackView, ValidatePromoView,
    AdminPromoCodeListView, AdminPromoCodeDetailView, OfflineOrderCreateView
)

urlpatterns = [
    path('', OrderCreateView.as_view(), name='order-create'),
    path('offline/', OfflineOrderCreateView.as_view(), name='offline-order-create'),
    path('validate-promo/', ValidatePromoView.as_view(), name='validate-promo'),
    path('promos/', AdminPromoCodeListView.as_view(), name='admin-promos-list'),
    path('promos/<int:pk>/', AdminPromoCodeDetailView.as_view(), name='admin-promos-detail'),
    path('my/', MyOrdersView.as_view(), name='my-orders'),
    path('restaurant/', RestaurantOrdersView.as_view(), name='restaurant-orders'),
    path('stats/', OwnerStatsView.as_view(), name='owner-stats'),
    path('<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('<int:pk>/track/', OrderTrackView.as_view(), name='order-track'),
]

