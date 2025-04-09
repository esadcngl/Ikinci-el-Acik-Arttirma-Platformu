from django.contrib.auth.models import AbstractUser
from django.db import models

def user_profile_path(instance, filename):
    return f'profile_images/user_{instance.id}/{filename}'

class CustomUser(AbstractUser):
    phone = models.CharField(max_length=15, blank=True, null=True)  # Tel
    profile_image = models.ImageField(upload_to=user_profile_path, blank=True, null=True) # İmage
    def __str__(self):
        return self.username
