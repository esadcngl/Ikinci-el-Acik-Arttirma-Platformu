from django.urls import path
from .api import BidCreateView
from .api import BidListView
from .api import AcceptBidView
from .api import RejectBidView
from .api import AuctionCreateView
from .api import AuctionListView
from .api import AuctionDetailView

urlpatterns = [
    path('auctions/<int:pk>/bids/', BidCreateView.as_view(), name='bid-create'),
    path('auctions/<int:pk>/bids/list/', BidListView.as_view(), name='bid-list'),
    path('bids/<int:pk>/accept/', AcceptBidView.as_view(), name='bid-accept'), 
    path('bids/<int:pk>/reject/', RejectBidView.as_view(), name='bid-reject'),
    path('auctions/create/', AuctionCreateView.as_view(), name='auction-create'),
    path('auctions/', AuctionListView.as_view(), name='auction-list'),
      path('auctions/<int:pk>/', AuctionDetailView.as_view(), name='auction-detail'),
]
