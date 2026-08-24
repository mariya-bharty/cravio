from django.urls import path
from .views import MealPlanListCreateView, MealPlanDeleteView, MealPlanClearDayView

urlpatterns = [
    path('', MealPlanListCreateView.as_view(), name='meal-plan-list'),
    path('<int:pk>/', MealPlanDeleteView.as_view(), name='meal-plan-delete'),
    path('clear/<str:day>/', MealPlanClearDayView.as_view(), name='meal-plan-clear-day'),
]
