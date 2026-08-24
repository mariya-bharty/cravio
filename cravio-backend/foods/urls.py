from django.urls import path
from .views import FoodListView, FoodDetailView, MyFoodsView, MenuExtractionView, BulkFoodCreateView, FlavorDuelView

urlpatterns = [
    path('', FoodListView.as_view(), name='food-list'),
    path('mine/', MyFoodsView.as_view(), name='my-foods'),
    path('duel/', FlavorDuelView.as_view(), name='food-duel'),
    path('extract-menu/', MenuExtractionView.as_view(), name='extract-menu'),
    path('bulk-create/', BulkFoodCreateView.as_view(), name='bulk-food-create'),
    path('<int:pk>/', FoodDetailView.as_view(), name='food-detail'),
]

