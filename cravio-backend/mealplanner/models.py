from django.db import models


DAY_CHOICES = [
    ('monday',    'Monday'),
    ('tuesday',   'Tuesday'),
    ('wednesday', 'Wednesday'),
    ('thursday',  'Thursday'),
    ('friday',    'Friday'),
    ('saturday',  'Saturday'),
    ('sunday',    'Sunday'),
]

SLOT_CHOICES = [
    ('breakfast', 'Breakfast'),
    ('lunch',     'Lunch'),
    ('dinner',    'Dinner'),
]


class MealPlan(models.Model):
    """A single food item pinned to a day+slot in a user's weekly meal plan."""
    user        = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='meal_plans')
    day_of_week = models.CharField(max_length=12, choices=DAY_CHOICES)
    meal_slot   = models.CharField(max_length=12, choices=SLOT_CHOICES)
    food        = models.ForeignKey('foods.Food', on_delete=models.CASCADE, related_name='meal_plans')
    notes       = models.CharField(max_length=300, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['day_of_week', 'meal_slot']

    def __str__(self):
        return f'{self.user} – {self.day_of_week} {self.meal_slot}: {self.food.name}'
