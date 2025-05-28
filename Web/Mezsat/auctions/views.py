from django.shortcuts import render, get_object_or_404
from .models import Auction ,Category , Favorite
from datetime import datetime, timezone
from django.utils.timezone import now
from django.db.models import Count
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator

def auction_detail_view(request, pk):
    auction = get_object_or_404(Auction, pk=pk)
    now = datetime.now(timezone.utc)
    time_left = auction.end_time - now
    total_duration = auction.end_time - auction.created_at
    progress_percent = 100 * (1 - (time_left.total_seconds() / total_duration.total_seconds()))
    progress_percent = max(0, min(progress_percent, 100))  # 0-100 arası kısıtla
    progress_percent = round(progress_percent, 2)
    
    context = {
        "auction": auction,
        "time_left": time_left.days,
        "progress_percent": progress_percent,
        "is_owner": request.user == auction.owner,
        'is_favorite': Favorite.objects.filter(user=request.user, auction=auction).exists() if request.user.is_authenticated else False,
        "is_authenticated": request.user.is_authenticated,
        "current_user": request.user.username if request.user.is_authenticated else "Anonymous",
        "progress_class": f"w-{int(progress_percent)}",
    }
    return render(request, "auctions/auction-detail.html", context)

def category_detail(request, slug):
    category = get_object_or_404(Category, slug=slug)
    auctions = Auction.objects.filter(category=category, is_active=True)

    # 🔍 Arama filtresi
    search_query = request.GET.get("search")
    if search_query:
        auctions = auctions.filter(title__icontains=search_query)

    # 💰 Fiyat aralığı
    min_price = request.GET.get("min_price")
    max_price = request.GET.get("max_price")
    if min_price:
        auctions = auctions.filter(starting_price__gte=min_price)
    if max_price:
        auctions = auctions.filter(starting_price__lte=max_price)

    # ↕️ Sıralama
    sort = request.GET.get("sort")
    if sort == "price-low":
        auctions = auctions.order_by("starting_price")
    elif sort == "price-high":
        auctions = auctions.order_by("-starting_price")
    elif sort == "ending":
        auctions = auctions.order_by("end_time")
    elif sort == "popular":
        auctions = auctions.annotate(num_bids=Count("bids")).order_by("-num_bids")
    else:  # En yeni
        auctions = auctions.order_by("-created_at")

    # 📄 Sayfalama
    paginator = Paginator(auctions, 9)
    page = request.GET.get("page")
    page_obj = paginator.get_page(page)

    # 🧮 Ek bilgiler (önceki yapıyı bozmadan)
    auctions_data = []
    for auction in page_obj.object_list:
        total_duration = (auction.end_time - auction.created_at).total_seconds()
        remaining = (auction.end_time - now()).total_seconds()
        progress = 100 * (1 - remaining / total_duration) if total_duration > 0 else 0
        progress = round(max(0, min(progress, 100)))

        last_bid = auction.bids.order_by('-amount', '-created_at').first()
        last_bid_amount = last_bid.amount if last_bid else None

        auctions_data.append({
            'id': auction.id,
            'title': auction.title,
            'price': auction.starting_price,
            'category': auction.category.name,
            'image': auction.image.url if auction.image else '',
            'is_favorite': Favorite.objects.filter(user=request.user, auction=auction).exists() if request.user.is_authenticated else False,
            'bids': auction.bids.count(),
            'last_bid': last_bid_amount,
            'days_left': max(0, (auction.end_time - now()).days),
            'progress': progress,
        })

    return render(request, "auctions/auction-category.html", {
        "category": category,
        "auctions": page_obj.object_list,
        "auctions_data": auctions_data,
        "page_obj": page_obj,
        "search_query": search_query,
        "min_price": min_price,
        "max_price": max_price,
        "sort": sort,
    })

@login_required  # Kullanıcı giriş yapmamışsa login sayfasına yönlendir
def auction_create_view(request):
    return render(request, 'auctions/auction-create.html')

def all_categories_view(request):
    listings = Auction.objects.filter(is_active=True)

    # 🔍 Arama filtresi
    search_query = request.GET.get("search")
    if search_query:
        listings = listings.filter(title__icontains=search_query)

    # 💰 Fiyat aralığı
    min_price = request.GET.get("min_price")
    max_price = request.GET.get("max_price")
    if min_price:
        listings = listings.filter(starting_price__gte=min_price)
    if max_price:
        listings = listings.filter(starting_price__lte=max_price)

    # ↕️ Sıralama
    sort = request.GET.get("sort")
    if sort == "price-low":
        listings = listings.order_by("starting_price")
    elif sort == "price-high":
        listings = listings.order_by("-starting_price")
    elif sort == "ending":
        listings = listings.order_by("end_time")
    elif sort == "popular":
        listings = listings.annotate(num_bids=Count("bids")).order_by("-num_bids")
    else:
        listings = listings.order_by("-created_at")  # default: newest

    paginator = Paginator(listings, 9)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    auctions_data = []
    for auction in page_obj.object_list:
        total_duration = (auction.end_time - auction.created_at).total_seconds()
        remaining = (auction.end_time - now()).total_seconds()
        progress = 100 * (1 - remaining / total_duration) if total_duration > 0 else 0
        progress = round(max(0, min(progress, 100)))

        last_bid = auction.bids.order_by('-amount', '-created_at').first()
        last_bid_amount = last_bid.amount if last_bid else None

        auctions_data.append({
            'id': auction.id,
            'title': auction.title,
            'price': auction.starting_price,
            'category': auction.category.name,
            'image': auction.image.url if auction.image else '',
            'is_favorite': Favorite.objects.filter(user=request.user, auction=auction).exists() if request.user.is_authenticated else False,
            'bids': auction.bids.count(),
            'last_bid': last_bid_amount,
            'days_left': max(0, (auction.end_time - now()).days),
            'progress': progress,
        })

    return render(request, "auctions/auction-category.html", {
        'title': "Tüm İlanlar",
        'auctions': page_obj.object_list,
        'page_obj': page_obj,
        'auctions_data': auctions_data,
        'search_query': search_query,
        'min_price': min_price,
        'max_price': max_price,
        'sort': sort,
    })
@login_required
def favorite_auctions_view(request):
    favorites = Favorite.objects.filter(user=request.user).select_related('auction')
    favorite_auctions = [fav.auction for fav in favorites]

    paginator = Paginator(favorite_auctions, 9)
    page = request.GET.get("page")
    page_obj = paginator.get_page(page)

    auctions_data = []
    for auction in page_obj.object_list:
        # ... aynı yapı, last_bid, progress vs. hesapla
        auctions_data.append({
            'id': auction.id,
            'title': auction.title,
            'price': auction.starting_price,
            'category': auction.category.name,
            'image': auction.image.url if auction.image else '',
            'is_favorite': Favorite.objects.filter(user=request.user, auction=auction).exists() if request.user.is_authenticated else False,
            'bids': auction.bids.count(),
            'last_bid': auction.bids.order_by('-amount').first().amount if auction.bids.exists() else None,
            'days_left': max(0, (auction.end_time - now()).days),
            'progress': round(100 * (1 - (auction.end_time - now()).total_seconds() / (auction.end_time - auction.created_at).total_seconds()), 0)
        })

    return render(request, "auctions/auction-category.html", {
        "title": "Favorilerim",
        "auctions": page_obj.object_list,
        "page_obj": page_obj,
        "auctions_data": auctions_data,
    })

@login_required
def my_auctions_view(request):
    user_auctions = Auction.objects.filter(owner=request.user, is_active=True).order_by("-created_at")

    paginator = Paginator(user_auctions, 9)
    page = request.GET.get("page")
    page_obj = paginator.get_page(page)

    auctions_data = []
    for auction in page_obj.object_list:
        total_duration = (auction.end_time - auction.created_at).total_seconds()
        remaining = (auction.end_time - now()).total_seconds()
        progress = 100 * (1 - remaining / total_duration) if total_duration > 0 else 0
        progress = round(max(0, min(progress, 100)))

        last_bid = auction.bids.order_by('-amount', '-created_at').first()
        last_bid_amount = last_bid.amount if last_bid else None

        auctions_data.append({
            'id': auction.id,
            'title': auction.title,
            'price': auction.starting_price,
            'category': auction.category.name,
            'image': auction.image.url if auction.image else '',
            'is_favorite': Favorite.objects.filter(user=request.user, auction=auction).exists() if request.user.is_authenticated else False,
            'bids': auction.bids.count(),
            'last_bid': last_bid_amount,
            'days_left': max(0, (auction.end_time - now()).days),
            'progress': progress,
        })

    return render(request, "auctions/auction-category.html", {
        "title": "İlanlarım",
        "auctions": page_obj.object_list,
        "page_obj": page_obj,
        "auctions_data": auctions_data,
    })
