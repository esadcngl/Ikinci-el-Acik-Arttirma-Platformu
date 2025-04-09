from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser
from django.utils.html import format_html
from .forms import CustomUserCreationForm


class CustomUserAdmin(UserAdmin):
    add_form = CustomUserCreationForm
    model = CustomUser
    list_display = ['username', 'email', 'phone', 'is_staff', 'profile_image_tag']

    def profile_image_tag(self, obj):
        if obj.profile_image:
            return format_html(f'<img src="{obj.profile_image.url}" style="height:40px;border-radius:50%;" />')
        return "-"
    profile_image_tag.short_description = 'Profil Resmi'

admin.site.register(CustomUser, CustomUserAdmin)    