from django.shortcuts import render, get_object_or_404
from .models import Auction
from datetime import datetime, timezone


def auction_detail_view(request, pk):
    auction = get_object_or_404(Auction, pk=pk)
    now = datetime.now(timezone.utc)
    time_left = auction.end_time - now
    total_duration = auction.end_time - auction.created_at
    progress_percent = 100 * (1 - (time_left.total_seconds() / total_duration.total_seconds()))
    progress_percent = max(0, min(progress_percent, 100))  # 0-100 arası kısıtla

    context = {
        "auction": auction,
        "time_left": time_left.days,
        "progress_percent": progress_percent,
    }
    return render(request, "auctions/auction-detail.html", context)