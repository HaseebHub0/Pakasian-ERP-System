import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.authentication.models import SystemUser, Role

def ensure_user():
    role, _ = Role.objects.get_or_create(role_name='Admin')
    user = SystemUser.objects.filter(username='admin').first()
    if not user:
        user = SystemUser(username='admin')
        print("Creating new admin user")
    else:
        print("Updating existing admin user")
    
    user.role_id = role
    user.set_password('admin')
    user.is_active = True
    user.save()
    print("User 'admin' with password 'admin' is ready.")

if __name__ == '__main__':
    ensure_user()
