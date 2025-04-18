from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from .models import Bid, Auction , Comment
from .serializers import BidSerializer , AuctionSerializer , CommentSerializer
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

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

    def get_queryset(self):
        return Auction.objects.filter(status='active', is_active=True).order_by('-created_at')
    
class AuctionDetailView(generics.RetrieveAPIView):
    queryset = Auction.objects.all()
    serializer_class = AuctionSerializer
    lookup_field = 'pk'

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