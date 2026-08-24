from rest_framework import serializers
from .models import MealPlan
from foods.models import Food


class FoodMiniSerializer(serializers.ModelSerializer):
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)

    class Meta:
        model = Food
        fields = ['id', 'name', 'image', 'price', 'is_veg', 'restaurant_name']


class MealPlanSerializer(serializers.ModelSerializer):
    food_detail = FoodMiniSerializer(source='food', read_only=True)

    class Meta:
        model = MealPlan
        fields = ['id', 'day_of_week', 'meal_slot', 'food', 'food_detail', 'notes', 'created_at']
        read_only_fields = ['id', 'created_at', 'food_detail']
