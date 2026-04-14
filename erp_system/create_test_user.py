import os
import django
from django.contrib.auth import get_user_model

User = get_user_model()
username = 'admin'
email = 'admin@example.com'
password = 'password123'
user, created = User.objects.get_or_create(username=username, defaults={'email': email})
user.set_password(password)
user.is_superuser = True
user.is_staff = True
user.save()
print(f"Testing user '{username}' ensured with password '{password}'")
