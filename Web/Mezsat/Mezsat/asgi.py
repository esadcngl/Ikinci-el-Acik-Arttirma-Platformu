"""
ASGI config for Mezsat project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Mezsat.settings")
django.setup()
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack
from Mezsat.routing import websocket_urlpatterns
from auctions.middleware import JWTAuthMiddleware

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JWTAuthMiddleware(  # 👈 yeni ASGI middleware burada
        AuthMiddlewareStack(
            URLRouter(websocket_urlpatterns)
        )
    ),
})