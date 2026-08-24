from rest_framework import serializers
from .models import Restaurant, Expense
import os


class ExpenseSerializer(serializers.ModelSerializer):
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)

    class Meta:
        model = Expense
        fields = ['id', 'restaurant', 'restaurant_name', 'category', 'amount', 'date', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']


class RestaurantSerializer(serializers.ModelSerializer):
    owner_name = serializers.SerializerMethodField()
    image_file = serializers.ImageField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Restaurant
        fields = '__all__'
        read_only_fields = ['owner', 'average_rating', 'total_reviews', 'created_at', 'updated_at']

    def get_owner_name(self, obj):
        return f'{obj.owner.first_name} {obj.owner.last_name}'.strip() or obj.owner.email

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Remove write-only field from output
        data.pop('image_file', None)
        return data

    def _save_image_file(self, image_file):
        """Save uploaded file to media/restaurants/ and return relative path."""
        import uuid
        from django.conf import settings

        ext = os.path.splitext(image_file.name)[1].lower() or '.jpg'
        filename = f'{uuid.uuid4().hex}{ext}'
        rel_path = f'restaurants/{filename}'
        abs_path = os.path.join(settings.MEDIA_ROOT, 'restaurants', filename)

        os.makedirs(os.path.dirname(abs_path), exist_ok=True)
        with open(abs_path, 'wb+') as dest:
            for chunk in image_file.chunks():
                dest.write(chunk)

        return f'/media/{rel_path}'

    def create(self, validated_data):
        image_file = validated_data.pop('image_file', None)
        validated_data['owner'] = self.context['request'].user

        if image_file:
            validated_data['image'] = self._save_image_file(image_file)

        return Restaurant.objects.create(**validated_data)

    def update(self, instance, validated_data):
        image_file = validated_data.pop('image_file', None)

        # Prevent non-admin users from changing the restaurant status
        request = self.context.get('request')
        if request and 'status' in validated_data:
            if not request.user.is_authenticated or request.user.role != 'admin':
                validated_data.pop('status')

        if image_file:
            validated_data['image'] = self._save_image_file(image_file)

        return super().update(instance, validated_data)
