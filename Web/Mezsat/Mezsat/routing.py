from django.urls import re_path
from auctions.consumers import AuctionConsumer ,NotificationConsumer

websocket_urlpatterns = [
    re_path(r'ws/auctions/(?P<auction_id>\d+)/$', AuctionConsumer.as_asgi()),
    re_path(r'ws/notifications/$', NotificationConsumer.as_asgi()),
]
