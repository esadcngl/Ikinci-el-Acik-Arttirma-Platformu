from rest_framework import serializers
from .models import Bid , Auction

class BidSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bid
        fields = ['id', 'auction', 'user', 'amount', 'status', 'created_at']
        read_only_fields = ['id', 'auction','status', 'created_at', 'user']

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)

class AuctionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Auction
        fields = [
            'id',
            'title',
            'description',
            'image',
            'starting_price',
            'buy_now_price',
            'end_time',
            'status',
            'is_active',
            'created_at',
        ]
        read_only_fields = ['id', 'status', 'is_active', 'created_at']

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)
    
