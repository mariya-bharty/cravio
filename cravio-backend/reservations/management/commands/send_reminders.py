"""
Management command: python manage.py send_reminders

Sends reminder emails to users whose reservation is 2 hours away.
Run this every 15 minutes via a cron job or Windows Task Scheduler:

  Windows Task Scheduler (every 15 min):
    python manage.py send_reminders

  Linux cron (every 15 min):
    */15 * * * * /path/to/venv/bin/python /path/to/manage.py send_reminders
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta, datetime
from reservations.models import Reservation
from reservations.email_service import send_reminder_email


class Command(BaseCommand):
    help = 'Send reminder emails for reservations happening in ~2 hours'

    def handle(self, *args, **options):
        now = timezone.localtime(timezone.now())
        today = now.date()

        # Window: reservations between 1h45m and 2h15m from now
        window_start = (now + timedelta(hours=1, minutes=45)).time()
        window_end   = (now + timedelta(hours=2, minutes=15)).time()

        candidates = Reservation.objects.filter(
            date=today,
            status='confirmed',
            otp_verified=True,
            reminder_sent=False,
        )

        sent_count = 0
        for res in candidates:
            # Check if reservation time falls in the reminder window
            res_time = res.time
            if window_start <= res_time <= window_end:
                success = send_reminder_email(res)
                if success:
                    sent_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Reminder sent: {res.user.email} → {res.restaurant.name} at {res.time}'
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f'Failed to send to {res.user.email}')
                    )

        self.stdout.write(f'Done. {sent_count} reminder(s) sent.')
