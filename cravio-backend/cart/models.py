from django.db import models


class Cart(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='cart_items')
    food = models.ForeignKey('foods.Food', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'food')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} – {self.food.name} x{self.quantity}'
