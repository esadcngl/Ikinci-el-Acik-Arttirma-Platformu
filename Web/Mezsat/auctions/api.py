from rest_framework import generics, permissions
from .models import Bid, Auction
from .serializers import BidSerializer
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