from django.db import IntegrityError
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from .models import Bid, Auction , Comment , Favorite , Category
from .serializers import BidSerializer , AuctionSerializer , CommentSerializer , FavoriteSerializer ,CategorySerializer
from rest_framework.permissions import IsAdminUser
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

class BidCreateView(generics.CreateAPIView):
    serializer_class = BidSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        auction_id = self.kwargs.get('pk')
        auction = Auction.objects.get(pk=auction_id)

        if not auction.is_active:
            raise ValidationError("Bu ilan artık aktif değil. Teklif verilemez.")

        amount = self.request.data.get('amount')
        if auction.buy_now_price and float(amount) >= float(auction.buy_now_price):
            auction.status = 'pending_payment'
            auction.save()

        serializer.save(auction=auction)

class BidListView(generics.ListAPIView):
    serializer_class = BidSerializer

    def get_queryset(self):
        auction_id = self.kwargs.get('pk')
        return Bid.objects.filter(auction_id=auction_id).order_by('-amount', '-created_at')
    
class AcceptBidView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        bid = Bid.objects.get(pk=pk)

        # Sadece ilan sahibi teklifi kabul edebilir
        if bid.auction.owner != request.user:
            return Response({"detail": "Bu işlemi yapmaya yetkiniz yok."}, status=403)

        bid.status = "accepted"
        bid.save()

        # İlanı da güncelle: ödeme bekleniyor moduna geçir
        bid.auction.status = "pending_payment"
        bid.auction.save()

        return Response({"detail": "Teklif kabul edildi."}, status=200)


class RejectBidView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        bid = Bid.objects.get(pk=pk)

        if bid.auction.owner != request.user:
            return Response({"detail": "Bu işlemi yapmaya yetkiniz yok."}, status=403)

        bid.status = "rejected"
        bid.save()
        return Response({"detail": "Teklif reddedildi."}, status=200)
    

class AuctionCreateView(generics.CreateAPIView):
    queryset = Auction.objects.all()
    serializer_class = AuctionSerializer
    permission_classes = [permissions.IsAuthenticated]


class AuctionListView(generics.ListAPIView):
    serializer_class = AuctionSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'starting_price', 'end_time']
    filterset_fields = {
        'starting_price': ['gte', 'lte'],
        'buy_now_price': ['gte', 'lte'],
        'status': ['exact'],
        'category': ['exact'],
    }

    def get_queryset(self):
        return Auction.objects.filter(status='active', is_active=True)
    
class AuctionDetailView(generics.RetrieveAPIView):
    queryset = Auction.objects.all()
    serializer_class = AuctionSerializer
    lookup_field = 'pk'

class AuctionUpdateView(generics.RetrieveUpdateAPIView):
    queryset = Auction.objects.all()
    serializer_class = AuctionSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        auction = self.get_object()
        if auction.owner != self.request.user and not self.request.user.is_staff:
            raise PermissionDenied("Bu ilanı düzenleme yetkiniz yok.")
        serializer.save()

class AuctionDeleteView(generics.DestroyAPIView):
    queryset = Auction.objects.all()
    serializer_class = AuctionSerializer
    permission_classes = [IsAuthenticated]

    def perform_destroy(self, instance):
        user = self.request.user
        if instance.owner != user and not user.is_staff:
            raise PermissionDenied("Bu ilanı silmeye yetkiniz yok.")
        instance.delete()
        
class CommentCreateView(generics.CreateAPIView):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        auction = Auction.objects.get(pk=self.kwargs['pk'])
        context['auction'] = auction
        return context
    
class CommentListView(generics.ListAPIView):
    serializer_class = CommentSerializer

    def get_queryset(self):
        auction_id = self.kwargs.get('pk')
        return Comment.objects.filter(auction_id=auction_id).order_by('-created_at')
    
class CommentDeleteView(generics.DestroyAPIView):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_destroy(self, instance):
        user = self.request.user
        is_comment_owner = instance.user == user
        is_auction_owner = instance.auction.owner == user

        if is_comment_owner or is_auction_owner or user.is_staff:
            instance.delete()
        else:
            raise PermissionDenied("Bu yorumu silmeye yetkiniz yok.")

# class AddFavoriteView(generics.CreateAPIView):
#     serializer_class = FavoriteSerializer
#     permission_classes = [permissions.IsAuthenticated]
#     queryset = Favorite.objects.all()

class FavoriteToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        user = request.user
        try:
            auction = Auction.objects.get(pk=pk)
        except Auction.DoesNotExist:
            return Response({'detail': 'İlan bulunamadı.'}, status=status.HTTP_404_NOT_FOUND)

        # Toggle işlemi: varsa sil, yoksa ekle
        favorite, created = Favorite.objects.get_or_create(user=user, auction=auction)

        if not created:
            favorite.delete()
            return Response({'favorited': False, 'message': 'Favoriden kaldırıldı.'}, status=status.HTTP_200_OK)

        return Response({'favorited': True, 'message': 'Favorilere eklendi.'}, status=status.HTTP_201_CREATED)
    
class FavoriteListView(generics.ListAPIView):
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user).order_by('-created_at')

class MyAuctionListView(generics.ListAPIView):
    serializer_class = AuctionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Auction.objects.filter(owner=self.request.user).order_by('-created_at')
    
class UserAuctionsView(generics.ListAPIView):
    serializer_class = AuctionSerializer

    def get_queryset(self):
        user_id = self.kwargs.get('user_id')
        return Auction.objects.filter(owner_id=user_id, is_active=True).order_by('-created_at')

class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer

class CategoryCreateView(generics.CreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminUser]  # ⛔️ Sadece admin kullanıcılar kategori oluşturabilir