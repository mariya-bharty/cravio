from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    restaurant_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'user', 'user_name', 'restaurant', 'restaurant_name', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

    def get_user_name(self, obj):
        return f'{obj.user.first_name} {obj.user.last_name}'.strip() or obj.user.email

    def get_restaurant_name(self, obj):
        return obj.restaurant.name

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        review = super().create(validated_data)
        self._update_restaurant_rating(review.restaurant)
        return review

    def _update_restaurant_rating(self, restaurant):
        from django.db.models import Avg, Count
        agg = Review.objects.filter(restaurant=restaurant).aggregate(
            avg=Avg('rating'), count=Count('id')
        )
        restaurant.average_rating = round(agg['avg'] or 0, 1)
        restaurant.total_reviews = agg['count']
        restaurant.save(update_fields=['average_rating', 'total_reviews'])
