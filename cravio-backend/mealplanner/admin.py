from django.contrib import admin
from .models import MealPlan


@admin.register(MealPlan)
class MealPlanAdmin(admin.ModelAdmin):
    list_display = ['user', 'day_of_week', 'meal_slot', 'food']
    list_filter = ['day_of_week', 'meal_slot']
