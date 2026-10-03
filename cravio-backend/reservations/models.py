from django.db import models
import random, string
from django.utils import timezone


def generate_otp():
    return ''.join(random.choices(string.digits, k=6))


class Reservation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    ]
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='reservations')
    restaurant = models.ForeignKey('restaurants.Restaurant', on_delete=models.CASCADE, related_name='reservations')
    date = models.DateField()
    time = models.TimeField()
    guests = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    special_requests = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # OTP fields
    otp = models.CharField(max_length=6, blank=True)
    otp_verified = models.BooleanField(default=False)
    otp_sent_at = models.DateTimeField(null=True, blank=True)

    # Reminder flag
    reminder_sent = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} @ {self.restaurant.name} on {self.date}'

    def generate_and_set_otp(self):
        self.otp = generate_otp()
        self.otp_sent_at = timezone.now()
        self.otp_verified = False
        self.save(update_fields=['otp', 'otp_sent_at', 'otp_verified'])
        return self.otp

    def is_otp_valid(self, entered_otp):
        """OTP valid for 10 minutes."""
        if not self.otp or not self.otp_sent_at:
            return False
        expired = (timezone.now() - self.otp_sent_at).total_seconds() > 600
        return not expired and self.otp == entered_otp
