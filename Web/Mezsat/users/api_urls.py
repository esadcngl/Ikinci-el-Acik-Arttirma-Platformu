from django.urls import path
from .api import RegisterView, ProfileView , ProfileUpdateView , UserPublicProfileView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='api-register'),
    path('profile/', ProfileView.as_view(), name='api-profile'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/update/', ProfileUpdateView.as_view(), name='api-profile-update'),
    path('users/<int:user_id>/profile/', UserPublicProfileView.as_view(), name='user-public-profile'),
]
