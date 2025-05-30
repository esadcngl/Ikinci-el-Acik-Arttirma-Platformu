from django.urls import path
from auctions.views import category_detail
from . import views
from .api import category_list_api
urlpatterns = [
   path('kategoriler/<slug:slug>/',category_detail, name='category_detail'),
   path('categories/tree/', category_list_api, name='category-tree'),
   path('create/', views.auction_create_view, name='auction-create'),
   path('kategoriler/', views.all_categories_view, name='all-categories'),
   path("favorite/", views.favorite_auctions_view, name="favorite"),
   path("auctions/", views.my_auctions_view, name="my-auctions"),
]

