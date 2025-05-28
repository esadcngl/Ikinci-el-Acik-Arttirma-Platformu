from django.db import models
from django.conf import settings
from django.utils import timezone
from django.utils.text import slugify
class Auction(models.Model):
    STATUS_CHOICES = [
        ('active', 'Aktif'),
        ('pending_payment', 'Beklemede (Ödeme)'),
        ('sold', 'Satıldı'),
        ('cancelled', 'İptal Edildi'),
    ]

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='auctions')
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.ForeignKey(
    'Category', 
    on_delete=models.SET_NULL, 
    null=True, 
    blank=True, 
    related_name='auctions'
)
    image = models.ImageField(upload_to='auction_images/', null=True, blank=True)
    starting_price = models.DecimalField(max_digits=10, decimal_places=2)
    buy_now_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    current_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    views = models.PositiveIntegerField(default=0)
    end_time = models.DateTimeField(default=timezone.now() + timezone.timedelta(days=3))
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def current_bid(self):
        return self.bids.order_by('-amount', '-created_at').first()
    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']


class Bid(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Beklemede'),
        ('accepted', 'Kabul Edildi'),
        ('rejected', 'Reddedildi'),
        ('cancelled', 'İptal Edildi'),
    ]

    auction = models.ForeignKey(Auction, on_delete=models.CASCADE, related_name='bids')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.amount} TL"
    

class Comment(models.Model):
    auction = models.ForeignKey("Auction", on_delete=models.CASCADE, related_name="comments")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.auction.title[:20]}"

class Favorite(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites')
    auction = models.ForeignKey(Auction, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'auction')

    def __str__(self):
        return f"{self.user.username} favorited {self.auction.title}"   

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, blank=True)
    icon = models.CharField(max_length=100, blank=True,null=True)
    parent = models.ForeignKey('self', null=True, blank=True, related_name='subcategories', on_delete=models.CASCADE)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
    
class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    link = models.CharField(max_length=255, blank=True, null=True)  # Örn: /auctions/15
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Bildirim ({self.user.username}): {self.message[:40]}"