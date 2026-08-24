from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import MealPlan
from .serializers import MealPlanSerializer


class MealPlanListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/meal-planner/  — return the current user's full weekly meal plan
    POST /api/meal-planner/  — add a food item to a day+slot
    """
    serializer_class = MealPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return MealPlan.objects.filter(user=self.request.user).select_related('food', 'food__restaurant')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class MealPlanDeleteView(generics.DestroyAPIView):
    """
    DELETE /api/meal-planner/<id>/  — remove a meal plan entry
    """
    serializer_class = MealPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return MealPlan.objects.filter(user=self.request.user)


class MealPlanClearDayView(APIView):
    """
    DELETE /api/meal-planner/clear/<day>/  — clear all entries for a specific day
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, day):
        deleted_count, _ = MealPlan.objects.filter(user=request.user, day_of_week=day).delete()
        return Response({'deleted': deleted_count, 'day': day})
