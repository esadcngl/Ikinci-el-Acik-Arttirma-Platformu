from rest_framework_simplejwt.authentication import JWTAuthentication
from django.utils.deprecation import MiddlewareMixin

class JWTAuthCookieMiddleware(MiddlewareMixin):
    def process_request(self, request):
        token = request.COOKIES.get('access')
        if token:
            try:
                validated_token = JWTAuthentication().get_validated_token(token)
                user = JWTAuthentication().get_user(validated_token)
                request.user = user
            except Exception:
                pass  # token hatalıysa sessiz geç
