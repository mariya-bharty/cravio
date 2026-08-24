from django.contrib import admin
from .models import Food, Category

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'icon']

@admin.register(Food)
class FoodAdmin(admin.ModelAdmin):
    list_display = ['name', 'restaurant', 'category', 'price', 'is_veg', 'is_available']
    list_filter = ['is_veg', 'is_available', 'category']
    search_fields = ['name', 'restaurant__name']
