from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'phone', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Şifreler eşleşmiyor."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
         model = User
         fields = ('id', 'username', 'email', 'phone', 'profile_image')


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'email', 'phone', 'first_name', 'last_name' ,'profile_image')
        read_only_fields = ('username', 'email')  # e-mail ve username değiştirilemesin
    def validate_profile_image(self, value):
        if value:
            allowed_types = ['image/jpeg', 'image/png']
            if value.content_type not in allowed_types:
                raise serializers.ValidationError("Sadece JPG veya PNG yükleyebilirsiniz.")
        return value