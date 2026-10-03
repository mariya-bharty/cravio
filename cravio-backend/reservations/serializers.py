from rest_framework import serializers
from .models import Reservation


class ReservationSerializer(serializers.ModelSerializer):
    customer_name  = serializers.SerializerMethodField()
    restaurant_name = serializers.SerializerMethodField()

    class Meta:
        model = Reservation
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at',
                            'otp', 'otp_verified', 'otp_sent_at', 'reminder_sent']

    def get_customer_name(self, obj):
        return f'{obj.user.first_name} {obj.user.last_name}'.strip() or obj.user.email

    def get_restaurant_name(self, obj):
        return obj.restaurant.name

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data.pop('otp', None)
        return data

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get('request')
        if request and 'status' in validated_data:
            user = request.user
            # Only admin or restaurant owner can update reservation status
            is_owner = (user.role == 'owner') or (instance.restaurant.owner == user)
            is_admin = (user.role == 'admin') or user.is_staff or user.is_superuser
            if not (is_owner or is_admin):
                validated_data.pop('status')

        return super().update(instance, validated_data)
