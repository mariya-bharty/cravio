from django.apps import AppConfig


class ReservationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'reservations'

    def ready(self):
        # Start the background scheduler when Django starts.
        # Guard against double-start in dev (Django reloader runs ready() twice).
        import os
        if os.environ.get('RUN_MAIN') != 'true':
            # In production (gunicorn/uwsgi) RUN_MAIN is not set,
            # so this runs once per worker process.
            from reservations.scheduler import start
            start()
