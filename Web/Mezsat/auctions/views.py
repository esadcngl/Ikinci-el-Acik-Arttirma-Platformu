from django.shortcuts import render, get_object_or_404
from .models import Auction ,Category
from datetime import datetime, timezone
from django.utils.timezone import now
from django.contrib.auth.decorators import login_required

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
        "is_authenticated": request.user.is_authenticated,
        "current_user": request.user.username if request.user.is_authenticated else "Anonymous",
        "progress_class": f"w-{int(progress_percent)}",
    }
    return render(request, "auctions/auction-detail.html", context)

def category_detail(request, slug):
    category = get_object_or_404(Category, slug=slug)
    listings = Auction.objects.filter(category=category, is_active=True)
    auctions_data = []
    for auction in listings:
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
            'is_favorite': False,  # Sonra eklersin
            'bids': auction.bids.count(),
            'last_bid': last_bid_amount,
            'days_left': max(0, (auction.end_time - now()).days),
            'progress': progress,
        })

    return render(request, "auctions/auction-category.html", {
        'category': category,
        'listings': listings
    })

@login_required  # Kullanıcı giriş yapmamışsa login sayfasına yönlendir
def auction_create_view(request):
    return render(request, 'auctions/auction-create.html')