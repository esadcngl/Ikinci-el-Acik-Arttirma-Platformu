from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from auctions.models import Favorite, Auction
from .models import CustomUser
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
         fields = ('id', 'username', 'email', 'phone', 'profile_image','balance', 'blocked_balance')


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

class AuctionMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Auction
        fields = ['id', 'title', 'image', 'starting_price']

class ProfileSerializer(serializers.ModelSerializer):
    favorites = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'phone', 'profile_image', 'favorites']

    def get_favorites(self, obj):
        favorites = Favorite.objects.filter(user=obj)
        return AuctionMiniSerializer([fav.auction for fav in favorites], many=True).data

class UserPublicProfileSerializer(serializers.ModelSerializer):
    auction_count = serializers.SerializerMethodField()
    auctions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'profile_image', 'auction_count', 'auctions']

    def get_auction_count(self, obj):
        return Auction.objects.filter(owner=obj, is_active=True).count()

    def get_auctions(self, obj):
        queryset = Auction.objects.filter(owner=obj, is_active=True)
        return AuctionMiniSerializer(queryset, many=True).data
    
class UserProfileSerializer(serializers.ModelSerializer):
    profile_image_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'phone', 'profile_image_url', 'date_joined','first_name',  #
            'last_name','last_login','is_staff','is_active','balance','blocked_balance')

    def get_profile_image_url(self, obj):
        if obj.profile_image:
            return obj.profile_image.url
        return '/media/user/user_default.png'