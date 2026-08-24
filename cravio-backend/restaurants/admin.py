from django.contrib import admin
from .models import Restaurant


@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'city', 'cuisine', 'status', 'average_rating', 'created_at']
    list_filter = ['status', 'city', 'cuisine']
    search_fields = ['name', 'city', 'cuisine']
    list_editable = ['status']
