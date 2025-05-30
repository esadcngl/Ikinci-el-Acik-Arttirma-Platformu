from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Notification

def create_notification(user, message, link=None):
    notification = Notification.objects.create(
        user=user,
        message=message,
        link=link
    )

    # WebSocket üzerinden bildirimi canlı gönder
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"user_{user.id}",
        {
            "type": "send_notification",
            "message": message,
            "link": link or ""
        }
    )

    return notification
