from django.urls import path
from .views import CartListView, CartDetailView

urlpatterns = [
    path('', CartListView.as_view(), name='cart-list'),
    path('<int:pk>/', CartDetailView.as_view(), name='cart-detail'),
]
