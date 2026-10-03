from rest_framework import generics, permissions
from .models import Review
from .serializers import ReviewSerializer


class ReviewListView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        restaurant_id = self.request.query_params.get('restaurant')
        if restaurant_id:
            try:
                from restaurants.models import Restaurant
                restaurant = Restaurant.objects.get(id=restaurant_id)
                if restaurant.swiggy_id:
                    if not Review.objects.filter(restaurant=restaurant).exists():
                        from restaurants.swiggy_helper import sync_swiggy_reviews
                        sync_swiggy_reviews(restaurant)
            except Exception as e:
                print(f"Error syncing Swiggy reviews: {e}")

        qs = Review.objects.select_related('user', 'restaurant')
        if restaurant_id:
            qs = qs.filter(restaurant_id=restaurant_id)
        return qs


class ReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(user=self.request.user)
