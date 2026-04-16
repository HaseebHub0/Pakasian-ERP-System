from django.contrib.auth import get_user_model

User = get_user_model()
user_exists = User.objects.filter(username='demo').exists()
if not user_exists:
    User.objects.create_superuser('demo', 'demo@pakasian.test', 'demo123')
    print("Demo user 'demo' with password 'demo123' created successfully.")
else:
    u = User.objects.get(username='demo')
    u.set_password('demo123')
    u.is_superuser = True
    u.is_staff = True
    u.save()
    print("Demo user 'demo' password reset to 'demo123'.")
