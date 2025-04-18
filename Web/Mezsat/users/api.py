from rest_framework import generics, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .serializers import RegisterSerializer,UserUpdateSerializer ,ProfileSerializer , UserPublicProfileSerializer

User = get_user_model()

# Kayıt (Register) API
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

# Profil API (JWT doğrulamalı)
class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = ProfileSerializer(request.user)
        return Response(serializer.data)

class ProfileUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = UserUpdateSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self):
        return self.request.user
    
class UserPublicProfileView(APIView):
    def get(self, request, user_id):
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'Kullanıcı bulunamadı.'}, status=404)

        serializer = UserPublicProfileSerializer(user)
        return Response(serializer.data)
