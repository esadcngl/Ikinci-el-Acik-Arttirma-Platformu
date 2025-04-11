from django.urls import path
from .api import BidCreateView
from .api import BidListView
from .api import AcceptBidView
from .api import RejectBidView

urlpatterns = [
    path('auctions/<int:pk>/bids/', BidCreateView.as_view(), name='bid-create'),
    path('auctions/<int:pk>/bids/list/', BidListView.as_view(), name='bid-list'),
    path('bids/<int:pk>/accept/', AcceptBidView.as_view(), name='bid-accept'), 
    path('bids/<int:pk>/reject/', RejectBidView.as_view(), name='bid-reject'),
]
