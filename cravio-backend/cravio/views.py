from django.core.mail import send_mail
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status


@api_view(['POST'])
@permission_classes([AllowAny])
def contact_us(request):
    name = request.data.get('name', '').strip()
    email = request.data.get('email', '').strip()
    subject = request.data.get('subject', '').strip()
    message = request.data.get('message', '').strip()

    if not all([name, email, subject, message]):
        return Response(
            {'detail': 'All fields are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    full_message = (
        f"New Contact Form Submission\n"
        f"{'=' * 40}\n\n"
        f"Name: {name}\n"
        f"Email: {email}\n"
        f"Subject: {subject}\n\n"
        f"Message:\n{message}\n"
    )

    try:
        send_mail(
            subject=f'[Cravio Contact] {subject}',
            message=full_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=['cravio.email@gmail.com'],
            fail_silently=False,
        )
    except Exception:
        return Response(
            {'detail': 'Failed to send message. Please try again later.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response({'detail': 'Message sent successfully.'}, status=status.HTTP_200_OK)
