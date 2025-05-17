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
from rest_framework import status , serializers
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from decimal import Decimal
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
import random
class BidCreateView(generics.CreateAPIView):
    serializer_class = BidSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        auction_id = self.kwargs.get('pk')
        auction = Auction.objects.get(pk=auction_id)

        if auction.status == 'sold':
            raise ValidationError("Bu ilana teklif verilemez. İlan zaten satıldı.")

        if not auction.is_active:
            raise ValidationError("Bu ilan artık aktif değil. Teklif verilemez.")

        amount = Decimal(self.request.data.get('amount'))  # ❗️Decimal'e çevirdik

        user = self.request.user

        if user.balance < amount:
            raise ValidationError("Yetersiz bakiye. Teklif verilemiyor.")

        user.balance -= amount
        user.blocked_balance += amount
        user.save()

        if auction.buy_now_price and amount >= auction.buy_now_price:
            auction.status = 'pending_payment'
            auction.save()

        serializer.save(auction=auction, user=user)

class BidListView(generics.ListAPIView):
    serializer_class = BidSerializer

    def get_queryset(self):
        auction_id = self.kwargs.get('pk')
        return Bid.objects.filter(auction_id=auction_id).order_by('-amount', '-created_at')
    
class AcceptBidView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        bid = Bid.objects.select_related('user', 'auction', 'auction__owner').get(pk=pk)

        # Sadece ilan sahibi teklifi kabul edebilir
        if bid.auction.owner != request.user:
            return Response({"detail": "Bu işlemi yapmaya yetkiniz yok."}, status=403)

        if bid.status != "pending":
            return Response({"detail": "Bu teklif zaten işleme alınmış."}, status=400)

        bid.status = "accepted"
        bid.save()

        # İlanı güncelle: artık satış aşamasında değil, doğrudan satıldı
        auction = bid.auction
        auction.status = "sold"
        auction.is_active = False
        auction.save()

        # Kullanıcının blocked_balance'ından düş ve ilan sahibinin balance'ına ekle
        buyer = bid.user
        seller = auction.owner

        buyer.blocked_balance -= bid.amount
        buyer.save()

        seller.balance += bid.amount
        seller.save()

        return Response({"detail": "Teklif kabul edildi ve ödeme başarıyla gerçekleşti."}, status=200)

class RejectBidView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        bid = Bid.objects.select_related('user', 'auction', 'auction__owner').get(pk=pk)

        if bid.auction.owner != request.user:
            return Response({"detail": "Bu işlemi yapmaya yetkiniz yok."}, status=403)

        if bid.status != "pending":
            return Response({"detail": "Bu teklif zaten işleme alınmış."}, status=400)

        bid.status = "rejected"
        bid.save()

        # Teklif reddedildiği için blocked_balance'ı geri iade et
        user = bid.user
        user.blocked_balance -= bid.amount
        user.balance += bid.amount
        user.save()

        return Response({"detail": "Teklif reddedildi ve bakiye iade edildi."}, status=200)
    
class CancelBidView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            bid = Bid.objects.select_related('user').get(pk=pk)
        except Bid.DoesNotExist:
            return Response({"detail": "Teklif bulunamadı."}, status=status.HTTP_404_NOT_FOUND)

        # Sadece teklif sahibi iptal edebilir
        if bid.user != request.user:
            return Response({"detail": "Bu teklifi iptal etmeye yetkiniz yok."}, status=status.HTTP_403_FORBIDDEN)

        if bid.status != "pending":
            return Response({"detail": "Bu teklif zaten işleme alınmış."}, status=status.HTTP_400_BAD_REQUEST)

        # Teklifi iptal ediyoruz
        bid.status = "cancelled"
        bid.save()

        # Kullanıcının blocked_balance'ı çözülüyor
        user = bid.user
        user.blocked_balance -= bid.amount
        user.balance += bid.amount
        user.save()

        return Response({"detail": "Teklif iptal edildi ve bakiye geri yüklendi."}, status=status.HTTP_200_OK)
class AuctionCreateView(generics.CreateAPIView):
    queryset = Auction.objects.all()
    serializer_class = AuctionSerializer
    permission_classes = [permissions.IsAuthenticated]


class AuctionListView(generics.ListAPIView):
    serializer_class = AuctionSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description','category__name']
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

    def perform_create(self, serializer):
        auction = Auction.objects.get(pk=self.kwargs['pk'])

        if auction.status == 'sold':
            raise serializers.ValidationError("Bu ilana yorum yapılamaz. İlan satıldı.")

        serializer.save(user=self.request.user, auction=auction)
    
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

class BuyNowView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, auction_id):
        try:
            auction = Auction.objects.get(id=auction_id)
        except Auction.DoesNotExist:
            return Response({"detail": "İlan bulunamadı."}, status=status.HTTP_404_NOT_FOUND)

        if auction.status != 'active' or not auction.is_active:
            return Response({"detail": "İlan şu anda satın alınamaz."}, status=status.HTTP_400_BAD_REQUEST)

        if not auction.buy_now_price:
            return Response({"detail": "Bu ilanın 'buy now' fiyatı yok."}, status=status.HTTP_400_BAD_REQUEST)

        # Ödemeyi başarıyla geçtiğimizi varsayalım
        auction.status = 'pending_payment'
        auction.save()

        return Response({
            "detail": "Satın alma işlemi başlatıldı. Ödeme bekleniyor.",
            "auction_id": auction.id,
            "buy_now_price": auction.buy_now_price
        }, status=status.HTTP_200_OK)
    
class CompletePaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, auction_id):
        try:
            auction = Auction.objects.get(id=auction_id)
        except Auction.DoesNotExist:
            return Response({"detail": "İlan bulunamadı."}, status=404)

        if auction.status != 'pending_payment':
            return Response({"detail": "Bu ilanın ödeme süreci aktif değil."}, status=400)

        # Ödeme tamamlandı simülasyonu
        auction.status = 'sold'
        auction.is_active = False
        auction.save()

        return Response({"detail": "Satın alma tamamlandı. İlan kapatıldı."})
    
@api_view(['GET'])
def category_list_api(request):
    # Ana kategoriler (parent'ı olmayanlar)
    categories = Category.objects.filter(parent__isnull=True).order_by('name')
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def predict_view(request):
    image = request.FILES.get('image')
    title = request.data.get('title', '')
    description = request.data.get('description', '')

    if not image or not title or not description:
        return Response({"detail": "Görsel, başlık ve açıklama zorunludur."}, status=400)

    # Örnek tahminler (gerçek AI entegre edilene kadar)
    categories = [
        "Elektronik > Bilgisayar > Dizüstü",
        "Moda > Kadın > Çanta",
        "Ev & Yaşam > Mobilya > Masa",
        "Spor & Outdoor > Kamp > Çadır"
    ]
    price_ranges = [
        "15000-18000",
        "500-700",
        "1200-1600",
        "800-1200"
    ]
    idx = random.randint(0, len(categories) - 1)

    return Response({
        "predicted_category": categories[idx],
        "predicted_price": price_ranges[idx]
    })