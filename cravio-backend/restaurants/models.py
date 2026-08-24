from django.db import models


class Restaurant(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    owner = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='restaurants')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    cuisine = models.CharField(max_length=100)
    address = models.TextField()
    city = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    email = models.EmailField(blank=True)
    image = models.CharField(max_length=500, blank=True, null=True)
    pincode = models.CharField(max_length=10, blank=True)
    state = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_active = models.BooleanField(default=True)
    opening_time = models.TimeField()
    closing_time = models.TimeField()
    average_rating = models.FloatField(default=0.0)
    total_reviews = models.IntegerField(default=0)
    swiggy_id = models.CharField(max_length=100, blank=True, null=True, unique=True)
    google_maps_link = models.TextField(blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    total_tables = models.PositiveIntegerField(default=8)
    reserved_tables = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} ({self.city})'


class Expense(models.Model):
    CATEGORY_CHOICES = [
        ('Ingredients', 'Ingredients & Raw Materials'),
        ('Staff Salary', 'Staff Salary & Wages'),
        ('Rent', 'Rent & Real Estate'),
        ('Utilities', 'Electricity, Gas & Water'),
        ('Marketing', 'Marketing & Promotions'),
        ('Maintenance', 'Maintenance & Repairs'),
        ('Other', 'Other Operating Expenses'),
    ]

    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='expenses')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='Ingredients')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f'{self.restaurant.name} - {self.category} (₹{self.amount}) on {self.date}'

