from rest_framework import serializers
from .models import Bid , Auction ,Comment , Favorite , Category

class BidSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    class Meta:
        model = Bid
        fields = ['id', 'auction', 'user', 'user_username','amount', 'status', 'created_at']
        read_only_fields = ['id', 'auction','status', 'created_at', 'user']

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)

class AuctionSerializer(serializers.ModelSerializer):
    category_name = serializers.SerializerMethodField()
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    class Meta:
        model = Auction
        fields = [
            'id', 'title', 'description', 'image',
            'starting_price', 'buy_now_price', 'end_time',
            'status', 'is_active', 'created_at',
            'category', 'category_name','owner_username'
        ]
        read_only_fields = ['id', 'status', 'is_active', 'created_at', 'category_name','owner_username']

    def get_category_name(self, obj):
        return obj.category.name if obj.category else None

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)
    
class CommentSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'auction', 'user', 'text', 'created_at']
        read_only_fields = ['id', 'user', 'created_at', 'auction']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        validated_data['auction'] = self.context['auction']
        return super().create(validated_data)

class AuctionMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Auction
        fields = ['id', 'title', 'image', 'starting_price', 'buy_now_price']

class FavoriteSerializer(serializers.ModelSerializer):
    auction = AuctionMiniSerializer(read_only=True)

    class Meta:
        model = Favorite
        fields = ['id', 'auction', 'created_at']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']
        read_only_fields = ['id']