from rest_framework import serializers
from .models import Food, Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class FoodSerializer(serializers.ModelSerializer):
    category_name = serializers.SerializerMethodField()
    restaurant_name = serializers.SerializerMethodField()

    class Meta:
        model = Food
        fields = '__all__'
        read_only_fields = ['created_at', 'restaurant']

    def get_category_name(self, obj):
        return obj.category.name if obj.category else None

    def get_restaurant_name(self, obj):
        return obj.restaurant.name
