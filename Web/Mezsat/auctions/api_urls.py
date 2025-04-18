from django.urls import path
# from .api import BidCreateView
# from .api import BidListView
# from .api import AcceptBidView
# from .api import RejectBidView
# from .api import AuctionCreateView
# from .api import AuctionListView
# from .api import AuctionDetailView
# from .api import CommentCreateView
from .api import *
urlpatterns = [
    path('auctions/<int:pk>/bids/', BidCreateView.as_view(), name='bid-create'),
    path('auctions/<int:pk>/bids/list/', BidListView.as_view(), name='bid-list'),
    path('bids/<int:pk>/accept/', AcceptBidView.as_view(), name='bid-accept'), 
    path('bids/<int:pk>/reject/', RejectBidView.as_view(), name='bid-reject'),
    path('auctions/create/', AuctionCreateView.as_view(), name='auction-create'),
    path('auctions/', AuctionListView.as_view(), name='auction-list'),
    path('auctions/<int:pk>/', AuctionDetailView.as_view(), name='auction-detail'),
    path('auctions/<int:pk>/comments/', CommentCreateView.as_view(), name='comment-create'),
    path('auctions/<int:pk>/comments/list/', CommentListView.as_view(), name='comment-list'),
    path('comments/<int:pk>/delete/', CommentDeleteView.as_view(), name='comment-delete'),
    path('auctions/<int:pk>/favorite/', FavoriteToggleView.as_view(), name='favorite-toggle'),
    path('favorites/', FavoriteListView.as_view(), name='favorite-list'),
    path('my-auctions/', MyAuctionListView.as_view(), name='my-auctions'),
    path('users/<int:user_id>/auctions/', UserAuctionsView.as_view(), name='user-auctions'),
    path('auctions/<int:pk>/edit/', AuctionUpdateView.as_view(), name='auction-edit'),
    path('auctions/<int:pk>/delete/', AuctionDeleteView.as_view(), name='auction-delete'),
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('categories/create/', CategoryCreateView.as_view(), name='category-create'),
]
