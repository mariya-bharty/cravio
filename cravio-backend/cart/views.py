from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Cart
from .serializers import CartSerializer


class CartListView(generics.ListCreateAPIView):
    serializer_class = CartSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user).select_related('food', 'food__restaurant')

    def create(self, request, *args, **kwargs):
        food_id = request.data.get('food')
        quantity = int(request.data.get('quantity', 1))

        from foods.models import Food
        try:
            food = Food.objects.get(id=food_id)
        except (Food.DoesNotExist, ValueError, TypeError):
            return Response({'detail': 'Food item not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Enforce same-city constraint
        existing_items = Cart.objects.filter(user=request.user).select_related('food__restaurant')
        if existing_items.exists():
            first_item = existing_items.first()
            existing_city = first_item.food.restaurant.city
            new_city = food.restaurant.city
            if existing_city.strip().lower() != new_city.strip().lower():
                return Response(
                    {'detail': f'You can only order food from the same city. Your cart already contains items from {existing_city}.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        cart_item, created = Cart.objects.get_or_create(
            user=request.user,
            food_id=food_id,
            defaults={'quantity': quantity}
        )
        if not created:
            cart_item.quantity += quantity
            cart_item.save()
        return Response(CartSerializer(cart_item).data, status=status.HTTP_201_CREATED)


class CartDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CartSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user)
