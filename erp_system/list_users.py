import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()
print("List of users:")
for u in User.objects.all():
    role_name = "No Role"
    if hasattr(u, 'role') and u.role:
        role_name = u.role.role_name
    print(f"Username: {u.username}, Role: {role_name}")
