import os

ROOT_DIR = "erp_system"

DIRECTORIES = [
    f"{ROOT_DIR}/erp_system",
    f"{ROOT_DIR}/erp_system/settings",
    f"{ROOT_DIR}/apps",
    f"{ROOT_DIR}/apps/core",
    f"{ROOT_DIR}/apps/core/utils",
    f"{ROOT_DIR}/apps/authentication",
    f"{ROOT_DIR}/apps/master_data",
    f"{ROOT_DIR}/apps/procurement",
    f"{ROOT_DIR}/apps/inventory",
    f"{ROOT_DIR}/apps/manufacturing",
    f"{ROOT_DIR}/apps/costing",
    f"{ROOT_DIR}/apps/sales",
    f"{ROOT_DIR}/apps/finance",
    f"{ROOT_DIR}/apps/mrp",
    f"{ROOT_DIR}/apps/warehouse",
    f"{ROOT_DIR}/apps/production_optimization",
    f"{ROOT_DIR}/apps/incentives",
    f"{ROOT_DIR}/apps/route_optimization",
    f"{ROOT_DIR}/requirements",
    f"{ROOT_DIR}/fixtures",
    f"{ROOT_DIR}/tests",
]

FILES = {
    f"{ROOT_DIR}/erp_system/__init__.py": "",
    f"{ROOT_DIR}/erp_system/urls.py": "from django.contrib import admin\nfrom django.urls import path, include\n\nurlpatterns = [\n    path('admin/', admin.site.urls),\n]\n",
    f"{ROOT_DIR}/erp_system/celery.py": "import os\nfrom celery import Celery\n\nos.environ.setdefault('DJANGO_SETTINGS_MODULE', 'erp_system.settings.development')\napp = Celery('erp_system')\napp.config_from_object('django.conf:settings', namespace='CELERY')\napp.autodiscover_tasks()\n",
    f"{ROOT_DIR}/erp_system/wsgi.py": "import os\nfrom django.core.wsgi import get_wsgi_application\n\nos.environ.setdefault('DJANGO_SETTINGS_MODULE', 'erp_system.settings.production')\napplication = get_wsgi_application()\n",
    f"{ROOT_DIR}/erp_system/settings/__init__.py": "",
    
    # Requirements
    f"{ROOT_DIR}/requirements/base.txt": "Django>=4.2\ndjangorestframework\ncelery\nredis\npsycopg2-binary\npython-dotenv\n",
    f"{ROOT_DIR}/requirements/development.txt": "-r base.txt\ndjango-debug-toolbar\n",
    f"{ROOT_DIR}/requirements/production.txt": "-r base.txt\ngunicorn\n",

    # Settings
    f"{ROOT_DIR}/erp_system/settings/base.py": '''import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = os.environ.get('SECRET_KEY', 'default-secret-key')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party
    'rest_framework',
    
    # Local Apps
    'apps.core',
    'apps.authentication',
    'apps.master_data',
    'apps.procurement',
    'apps.inventory',
    'apps.manufacturing',
    'apps.costing',
    'apps.sales',
    'apps.finance',
    'apps.mrp',
    'apps.warehouse',
    'apps.production_optimization',
    'apps.incentives',
    'apps.route_optimization',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'erp_system.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'erp_system.wsgi.application'

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
''',
    f"{ROOT_DIR}/erp_system/settings/development.py": "from .base import *\n\nDEBUG = True\nALLOWED_HOSTS = ['*']\n\nDATABASES = {\n    'default': {\n        'ENGINE': 'django.db.backends.sqlite3',\n        'NAME': BASE_DIR / 'db.sqlite3',\n    }\n}\n",
    f"{ROOT_DIR}/erp_system/settings/production.py": "from .base import *\n\nDEBUG = False\nALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')\n",

    f"{ROOT_DIR}/manage.py": '''#!/usr/bin/env python
import os
import sys

def main():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'erp_system.settings.development')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()
''',
    f"{ROOT_DIR}/.env.example": "SECRET_KEY=your-secret-key-here\nDEBUG=True\nDATABASE_URL=postgres://user:password@localhost:5432/erp_db\nREDIS_URL=redis://localhost:6379/1\n",
    f"{ROOT_DIR}/docker-compose.yml": '''version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: erp_user
      POSTGRES_PASSWORD: erp_password
      POSTGRES_DB: erp_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
''',
}

# Add apps files
apps = [
    'core', 'authentication', 'master_data', 'procurement', 'inventory', 
    'manufacturing', 'costing', 'sales', 'finance', 'mrp', 'warehouse', 
    'production_optimization', 'incentives', 'route_optimization'
]

for app in apps:
    FILES[f"{ROOT_DIR}/apps/{app}/__init__.py"] = ""
    app_camel = ''.join(word.capitalize() for word in app.split('_'))
    FILES[f"{ROOT_DIR}/apps/{app}/apps.py"] = f"from django.apps import AppConfig\n\nclass {app_camel}Config(AppConfig):\n    default_auto_field = 'django.db.models.BigAutoField'\n    name = 'apps.{app}'\n"

# Core custom files
core_files = [
    'models.py', 'permissions.py', 'pagination.py', 'signals.py',
    'utils/__init__.py', 'utils/number_generator.py', 'utils/batch_number.py', 'utils/date_helpers.py'
]
for f in core_files:
    FILES[f"{ROOT_DIR}/apps/core/{f}"] = "# Core file\n"

# Auth custom files
auth_files = ['models.py', 'serializers.py', 'views.py', 'urls.py']
for f in auth_files:
    FILES[f"{ROOT_DIR}/apps/authentication/{f}"] = "# Auth file\n"

# Fixtures
fixtures = [
    '01_roles.json', '02_permissions.json', '03_chart_of_accounts.json',
    '04_production_stages.json', '05_seasonal_factors.json', '06_approval_workflows.json'
]
for f in fixtures:
    FILES[f"{ROOT_DIR}/fixtures/{f}"] = "[\n]\n"

# Tests
tests = [
    'test_master_data.py', 'test_procurement.py', 'test_inventory.py',
    'test_manufacturing.py', 'test_costing.py', 'test_sales.py',
    'test_finance.py', 'test_integration.py'
]
for f in tests:
    FILES[f"{ROOT_DIR}/tests/{f}"] = "import pytest\n"

def main():
    for d in DIRECTORIES:
        os.makedirs(d, exist_ok=True)
        # Create an __init__.py in all packages within apps, just to be safe (except the root apps folder)
        if d.startswith(f"{ROOT_DIR}/apps/") and not d.endswith("utils"):
            open(f"{d}/__init__.py", "w").close()

    for f_path, content in FILES.items():
        pass
        with open(f_path, "w") as f:
            f.write(content)

    print("Project successfully scaffolded.")

if __name__ == "__main__":
    main()
