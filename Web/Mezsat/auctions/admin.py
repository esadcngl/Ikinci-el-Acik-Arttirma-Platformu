from django.contrib import admin
from .models import Auction, Bid , Comment , Category

admin.site.register(Auction)
admin.site.register(Bid)
admin.site.register(Comment)
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']