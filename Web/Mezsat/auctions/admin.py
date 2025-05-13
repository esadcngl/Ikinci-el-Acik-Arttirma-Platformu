from django.contrib import admin
from .models import Auction, Bid , Comment , Category

admin.site.register(Auction)
admin.site.register(Bid)
admin.site.register(Comment)


class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent', 'slug')
    search_fields = ('name',)
    prepopulated_fields = {"slug": ("name",)}  # slug otomatik dolsun

admin.site.register(Category, CategoryAdmin)