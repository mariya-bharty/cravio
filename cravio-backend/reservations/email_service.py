"""
Cravio email service — reservation OTP and reminders.
Uses Django's built-in email backend (configure SMTP in settings.py).
"""
from django.core.mail import send_mail
from django.conf import settings


def send_otp_email(reservation, override_email=None):
    """Send a 6-digit OTP to the user's email for reservation confirmation.
    If override_email is provided, send there instead of the account email.
    """
    user = reservation.user
    restaurant = reservation.restaurant
    recipient = override_email or user.email

    subject = f"Your Cravio Reservation OTP — {restaurant.name}"

    message = f"""
Hi {user.first_name or 'there'},

You have a table reservation request at {restaurant.name}.

━━━━━━━━━━━━━━━━━━━━━━━━
  Your confirmation OTP
━━━━━━━━━━━━━━━━━━━━━━━━

         {reservation.otp}

━━━━━━━━━━━━━━━━━━━━━━━━

Reservation Details:
  Date     : {reservation.date.strftime('%A, %d %B %Y')}
  Time     : {reservation.time.strftime('%I:%M %p')}
  Guests   : {reservation.guests}
  Restaurant: {restaurant.name}
  Address  : {restaurant.address}, {restaurant.city}

This OTP is valid for 10 minutes. Enter it on the Cravio
app to confirm your booking.

If you didn't request this reservation, please ignore this email.

— Team Cravio
"""

    html_message = f"""
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f5f0e8;margin:0;padding:30px">
  <div style="max-width:480px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
    <div style="background:#4a5c3f;padding:28px 32px;text-align:center">
      <h1 style="color:white;margin:0;font-size:1.6rem;letter-spacing:1px">Cravio</h1>
      <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:0.85rem">Good Food. Great Times.</p>
    </div>
    <div style="padding:32px">
      <p style="color:#333;font-size:1rem;margin-top:0">Hi <strong>{user.first_name or 'there'}</strong>,</p>
      <p style="color:#555;font-size:0.92rem">Your reservation at <strong>{restaurant.name}</strong> is almost confirmed. Use the OTP below to verify:</p>

      <div style="background:#f5f0e8;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
        <p style="color:#888;font-size:0.78rem;margin:0 0 8px;letter-spacing:2px;text-transform:uppercase">Confirmation OTP</p>
        <div style="font-size:2.4rem;font-weight:800;letter-spacing:10px;color:#4a5c3f">{reservation.otp}</div>
        <p style="color:#aaa;font-size:0.75rem;margin:10px 0 0">Valid for 10 minutes</p>
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:0.88rem;color:#555">
        <tr><td style="padding:6px 0;color:#888">Date</td><td style="padding:6px 0;font-weight:600;color:#333">{reservation.date.strftime('%A, %d %B %Y')}</td></tr>
        <tr><td style="padding:6px 0;color:#888">Time</td><td style="padding:6px 0;font-weight:600;color:#333">{reservation.time.strftime('%I:%M %p')}</td></tr>
        <tr><td style="padding:6px 0;color:#888">Guests</td><td style="padding:6px 0;font-weight:600;color:#333">{reservation.guests}</td></tr>
        <tr><td style="padding:6px 0;color:#888">Restaurant</td><td style="padding:6px 0;font-weight:600;color:#333">{restaurant.name}</td></tr>
        <tr><td style="padding:6px 0;color:#888">Address</td><td style="padding:6px 0;color:#555">{restaurant.address}, {restaurant.city}</td></tr>
      </table>

      <p style="color:#aaa;font-size:0.78rem;margin-top:24px;border-top:1px solid #eee;padding-top:16px">
        If you didn't request this, please ignore this email.
      </p>
    </div>
  </div>
</body>
</html>
"""

    print(f"\n[EMAIL / OTP] OTP for Reservation #{reservation.id}: {reservation.otp} (Sent to {recipient})\n")
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],   # uses override or account email
            html_message=html_message,
            fail_silently=False,
        )
        print(f"[EMAIL SUCCESS] Sent OTP to {recipient} via Gmail SMTP")
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] OTP send failed for {recipient}: {e}")
        return False


def send_reminder_email(reservation):
    """Send a reminder 2 hours before the reservation."""
    user = reservation.user
    restaurant = reservation.restaurant

    subject = f"Reminder: Your table at {restaurant.name} is in 2 hours!"

    message = f"""
Hi {user.first_name or 'there'},

Just a reminder — your table at {restaurant.name} is booked for TODAY!

  Time     : {reservation.time.strftime('%I:%M %p')}
  Date     : {reservation.date.strftime('%A, %d %B %Y')}
  Guests   : {reservation.guests}
  Address  : {restaurant.address}, {restaurant.city}

See you there!

— Team Cravio
"""

    html_message = f"""
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f5f0e8;margin:0;padding:30px">
  <div style="max-width:480px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
    <div style="background:#4a5c3f;padding:28px 32px;text-align:center">
      <h1 style="color:white;margin:0;font-size:1.6rem;letter-spacing:1px">Cravio</h1>
      <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:0.85rem">Good Food. Great Times.</p>
    </div>
    <div style="padding:32px">
      <div style="background:#fff9e6;border:1px solid #f0c040;border-radius:10px;padding:14px 18px;margin-bottom:22px;display:flex;align-items:center;gap:12px">
        <span style="font-size:1.8rem">⏰</span>
        <div>
          <div style="font-weight:700;color:#333;font-size:0.95rem">Your reservation is in 2 hours!</div>
          <div style="color:#888;font-size:0.82rem;margin-top:2px">Don't be late — your table is waiting.</div>
        </div>
      </div>

      <p style="color:#333;font-size:1rem;margin-top:0">Hi <strong>{user.first_name or 'there'}</strong>,</p>
      <p style="color:#555;font-size:0.92rem">Your table at <strong>{restaurant.name}</strong> is confirmed for today. Here are your details:</p>

      <table style="width:100%;border-collapse:collapse;font-size:0.88rem;color:#555;margin:16px 0">
        <tr style="background:#f5f0e8"><td style="padding:10px 12px;color:#888;border-radius:6px">Time</td><td style="padding:10px 12px;font-weight:700;color:#4a5c3f;font-size:1rem">{reservation.time.strftime('%I:%M %p')}</td></tr>
        <tr><td style="padding:10px 12px;color:#888">Date</td><td style="padding:10px 12px;font-weight:600;color:#333">{reservation.date.strftime('%A, %d %B %Y')}</td></tr>
        <tr style="background:#f5f0e8"><td style="padding:10px 12px;color:#888">Guests</td><td style="padding:10px 12px;font-weight:600;color:#333">{reservation.guests}</td></tr>
        <tr><td style="padding:10px 12px;color:#888">Restaurant</td><td style="padding:10px 12px;font-weight:600;color:#333">{restaurant.name}</td></tr>
        <tr style="background:#f5f0e8"><td style="padding:10px 12px;color:#888">Address</td><td style="padding:10px 12px;color:#555">{restaurant.address}, {restaurant.city}</td></tr>
      </table>

      <p style="color:#aaa;font-size:0.78rem;margin-top:24px;border-top:1px solid #eee;padding-top:16px">
        See you soon! — Team Cravio
      </p>
    </div>
  </div>
</body>
</html>
"""

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        reservation.reminder_sent = True
        reservation.save(update_fields=['reminder_sent'])
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Reminder send failed for {user.email}: {e}")
        return False


def send_status_update_email(reservation):
    """Send an email notification to the user when the reservation status is updated."""
    user = reservation.user
    restaurant = reservation.restaurant
    recipient = user.email

    if reservation.status == 'confirmed':
        status_text = "CONFIRMED"
        subject = f"Your Cravio Reservation is CONFIRMED — {restaurant.name}"
        color = "#155724"
        bg_color = "#d4edda"
        alert_emoji = "✅"
        body_msg = "Great news! Your table reservation request has been approved by the restaurant. Here are your booking details:"
    elif reservation.status == 'cancelled':
        status_text = "CANCELLED"
        subject = f"Your Cravio Reservation is CANCELLED — {restaurant.name}"
        color = "#721c24"
        bg_color = "#f8d7da"
        alert_emoji = "❌"
        body_msg = "We regret to inform you that your table reservation request has been cancelled by the restaurant (possibly due to no seats being available). Here are the details of the request:"
    else:
        return False

    message = f"""
Hi {user.first_name or 'there'},

Your reservation at {restaurant.name} is {status_text}.

Reservation Details:
  Date     : {reservation.date.strftime('%A, %d %B %Y')}
  Time     : {reservation.time.strftime('%I:%M %p')}
  Guests   : {reservation.guests}
  Restaurant: {restaurant.name}
  Address  : {restaurant.address}, {restaurant.city}

— Team Cravio
"""

    html_message = f"""
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f5f0e8;margin:0;padding:30px">
  <div style="max-width:480px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
    <div style="background:#4a5c3f;padding:28px 32px;text-align:center">
      <h1 style="color:white;margin:0;font-size:1.6rem;letter-spacing:1px">Cravio</h1>
      <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:0.85rem">Good Food. Great Times.</p>
    </div>
    <div style="padding:32px">
      <div style="background:{bg_color};border:1px solid {color};border-radius:10px;padding:14px 18px;margin-bottom:22px;display:flex;align-items:center;gap:12px">
        <span style="font-size:1.8rem">{alert_emoji}</span>
        <div>
          <div style="font-weight:700;color:{color};font-size:0.95rem">Reservation {status_text}</div>
          <div style="color:{color};font-size:0.82rem;margin-top:2px">{body_msg}</div>
        </div>
      </div>

      <p style="color:#333;font-size:1rem;margin-top:0">Hi <strong>{user.first_name or 'there'}</strong>,</p>

      <table style="width:100%;border-collapse:collapse;font-size:0.88rem;color:#555;margin:16px 0">
        <tr style="background:#f5f0e8"><td style="padding:10px 12px;color:#888;border-radius:6px">Status</td><td style="padding:10px 12px;font-weight:700;color:{color};font-size:1rem">{status_text}</td></tr>
        <tr><td style="padding:10px 12px;color:#888">Date</td><td style="padding:10px 12px;font-weight:600;color:#333">{reservation.date.strftime('%A, %d %B %Y')}</td></tr>
        <tr style="background:#f5f0e8"><td style="padding:10px 12px;color:#888">Time</td><td style="padding:10px 12px;font-weight:600;color:#333">{reservation.time.strftime('%I:%M %p')}</td></tr>
        <tr><td style="padding:10px 12px;color:#888">Guests</td><td style="padding:10px 12px;font-weight:600;color:#333">{reservation.guests}</td></tr>
        <tr style="background:#f5f0e8"><td style="padding:10px 12px;color:#888">Restaurant</td><td style="padding:10px 12px;font-weight:600;color:#333">{restaurant.name}</td></tr>
        <tr><td style="padding:10px 12px;color:#888">Address</td><td style="padding:10px 12px;color:#555">{restaurant.address}, {restaurant.city}</td></tr>
      </table>

      <p style="color:#aaa;font-size:0.78rem;margin-top:24px;border-top:1px solid #eee;padding-top:16px">
        Thank you for choosing Cravio! — Team Cravio
      </p>
    </div>
  </div>
</body>
</html>
"""

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Status email send failed for {recipient}: {e}")
        return False
