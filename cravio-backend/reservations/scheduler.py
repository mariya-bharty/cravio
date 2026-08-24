"""
APScheduler setup — runs reminder job every 15 minutes
inside the Django process. No external process needed.
Starts automatically when Django starts.
"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

_scheduler = None


def send_reminders_job():
    """Called by scheduler every 15 minutes."""
    try:
        from django.utils import timezone
        from datetime import timedelta
        from reservations.models import Reservation
        from reservations.email_service import send_reminder_email

        now = timezone.localtime(timezone.now())
        today = now.date()

        window_start = (now + timedelta(hours=1, minutes=45)).time()
        window_end   = (now + timedelta(hours=2, minutes=15)).time()

        candidates = Reservation.objects.filter(
            date=today,
            status='confirmed',
            otp_verified=True,
            reminder_sent=False,
        )

        for res in candidates:
            if window_start <= res.time <= window_end:
                success = send_reminder_email(res)
                if success:
                    logger.info(f'Reminder sent: {res.user.email} → {res.restaurant.name} at {res.time}')

    except Exception as e:
        logger.error(f'Reminder job error: {e}')


def start():
    global _scheduler
    if _scheduler is not None:
        return  # already running

    _scheduler = BackgroundScheduler(timezone=settings.TIME_ZONE)
    _scheduler.add_job(
        send_reminders_job,
        trigger=IntervalTrigger(minutes=15),
        id='send_reservation_reminders',
        name='Send reservation reminders',
        replace_existing=True,
    )
    _scheduler.start()
    logger.info('Reservation reminder scheduler started (every 15 min)')
