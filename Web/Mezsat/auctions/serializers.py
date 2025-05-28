from rest_framework import serializers
from .models import Bid , Auction ,Comment , Favorite , Category , Notification

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
    is_favorited = serializers.SerializerMethodField()
    bid_count = serializers.SerializerMethodField()
    last_bid = serializers.SerializerMethodField()
    class Meta:
        model = Auction
        fields = [
            'id', 'title', 'description', 'image',
            'starting_price', 'buy_now_price', 'end_time',
            'status', 'is_active', 'created_at',    
            'category', 'category_name','owner_username','is_favorited','bid_count','last_bid'
        ]
        read_only_fields = ['id', 'status', 'is_active', 'created_at', 'category_name','owner_username']

    def get_category_name(self, obj):
        return obj.category.name if obj.category else None
    
    def get_bid_count(self, obj):
        return obj.bids.count()
    def get_current_bid(self, obj):
        last_bid = obj.bids.order_by('-amount', '-created_at').first()
        return last_bid.amount if last_bid else None
    def get_last_bid(self, obj):
        last = obj.bids.order_by('-amount').first()
        return last.amount if last else None
    def get_is_favorited(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Favorite.objects.filter(user=request.user, auction=obj).exists()
        return False
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
    auction = AuctionSerializer(read_only=True)

    class Meta:
        model = Favorite
        fields = ['id', 'auction', 'created_at']

class SubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'icon')

class CategorySerializer(serializers.ModelSerializer):
    subcategories = SubCategorySerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'icon', 'subcategories')
    
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'message', 'link', 'is_read', 'created_at']

class BalanceAddSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Tutar pozitif olmalıdır.")
        return value