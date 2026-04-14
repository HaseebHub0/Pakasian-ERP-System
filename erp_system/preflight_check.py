#!/usr/bin/env python
"""
Pre-flight test runner for T0.1–T0.15
Run from erp_system/ directory with the venv activated:

    python preflight_check.py --settings=config.settings.development
"""
import os
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

for arg in sys.argv[1:]:
    if arg.startswith('--settings='):
        os.environ['DJANGO_SETTINGS_MODULE'] = arg.split('=', 1)[1]

import django
django.setup()

results = []
def chk(tid, desc, fn):
    try:
        msg = fn()
        if msg and str(msg).startswith('SKIP:'):
            results.append((tid, 'SKIP', desc, str(msg)))
        else:
            results.append((tid, 'PASS', desc, msg or ''))
    except Exception as e:
        if str(e).startswith('SKIP:'):
            results.append((tid, 'SKIP', desc, str(e)))
        else:
            results.append((tid, 'FAIL', desc, str(e)[:120]))


# T0.1
def t01():
    import pathlib
    APPS_DIR = pathlib.Path(__file__).parent / 'apps'
    expected_apps = [
        'authentication', 'core', 'costing', 'finance', 'incentives',
        'inventory', 'manufacturing', 'master_data', 'mrp', 'procurement',
        'production_optimization', 'route_optimization', 'sales', 'warehouse',
    ]
    missing = [a for a in expected_apps if not (APPS_DIR / a).is_dir()]
    if missing: raise Exception(f"Missing: {missing}")
    return f"All {len(expected_apps)} app folders found"
chk('T0.1', 'Project structure', t01)

# T0.2
def t02():
    import rest_framework, corsheaders, django_filters
    import django_celery_beat, django_celery_results
    import rest_framework_simplejwt, redis as redis_pkg
    return "All dependencies present"
chk('T0.2', 'Dependencies installed', t02)

# T0.3
def t03():
    from django.db import connection
    connection.ensure_connection()
    return f'backend={connection.vendor}'
chk('T0.3', 'DB connection', t03)

# T0.4
def t04():
    from django.db import connection
    from django.db.migrations.executor import MigrationExecutor
    executor = MigrationExecutor(connection)
    plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
    if plan: raise Exception(f'Unapplied: {[str(m) for m,_ in plan]}')
    return 'All applied'
chk('T0.4', 'Migrations', t04)

# T0.5
def t05():
    from apps.authentication.models import Role,Permission,RolePermission
    from apps.finance.models import Account
    from apps.manufacturing.models import ProductionStage
    from apps.mrp.models import SeasonalConfig
    from apps.procurement.models import ApprovalWorkflow
    r={
        'Roles':Role.objects.count(),'Perms':Permission.objects.count(),
        'RolePerms':RolePermission.objects.count(),'Accounts':Account.objects.count(),
        'Stages':ProductionStage.objects.count(),'Seasonal':SeasonalConfig.objects.count(),
        'Workflows':ApprovalWorkflow.objects.count()
    }
    zeros=[k for k,v in r.items() if v==0]
    if zeros: raise Exception(f'Empty: {zeros}')
    return str(r)
chk('T0.5', 'Fixtures loaded', t05)

# T0.6
def t06():
    from django.core.management import call_command
    from io import StringIO
    out=StringIO(); call_command('check',stdout=out,stderr=out)
    return out.getvalue().strip().split('\n')[-1]
chk('T0.6', 'Django system check', t06)

# T0.7
def t07():
    import redis as r
    from django.conf import settings
    # For CI and robust tests without Redis installed
    client=r.Redis.from_url(getattr(settings,'CELERY_BROKER_URL','redis://localhost:6379/0'),socket_connect_timeout=1)
    try:
        pong=client.ping()
        if not pong: raise Exception('ping returned False')
        return 'PONG'
    except r.ConnectionError as e:
        # In a local Windows run without docker or redis-server, skip gracefully
        return f"SKIP: Redis connection failed (Infrastructure missing: {str(e)[:40]})"
chk('T0.7', 'Redis ping', t07)

# T0.8
def t08():
    from config.celery import app
    return f'app.main={app.main}'
chk('T0.8', 'Celery imports', t08)

# T0.9
def t09():
    from apps.authentication.models import SystemUser
    u,_=SystemUser.objects.get_or_create(username='pre_test')
    u.set_password('Pre@12345'); u.is_active=True; u.save()
    from django.test import RequestFactory
    from apps.authentication.views import LoginView
    import json
    factory=RequestFactory()
    req=factory.post('/api/auth/login/',json.dumps({'username':'pre_test','password':'Pre@12345'}),content_type='application/json')
    req.data={'username':'pre_test','password':'Pre@12345'}
    resp=LoginView.as_view()(req)
    if resp.status_code!=200: raise Exception(f'HTTP {resp.status_code}: {resp.data}')
    return 'access_token present'
chk('T0.9', 'Login view 200', t09)

# T0.10
def t10():
    from django.test import RequestFactory
    from apps.authentication.views import CurrentUserView
    req=RequestFactory().get('/api/auth/me/')
    resp=CurrentUserView.as_view()(req)
    if resp.status_code!=401: raise Exception(f'Expected 401 got {resp.status_code}')
    return '401 Unauthorized'
chk('T0.10', 'Unauthed = 401', t10)

# T0.11
def t11():
    from apps.authentication.models import Role,SystemUser
    from apps.core.permissions import HasModulePermission
    role=Role.objects.filter(role_name='warehouse_manager').first()
    if not role: raise Exception('warehouse_manager role missing — load fixtures')
    u=SystemUser(username='_perm_test',role_id=role,is_active=True)
    class FR: user=u
    ok=HasModulePermission('procurement','create').has_permission(FR(),None)
    if ok: raise Exception('Permission incorrectly granted')
    return 'Blocked correctly'
chk('T0.11', 'WM blocked from procurement:create', t11)

# T0.12
def t12():
    from apps.core.models import AuditLog
    from apps.authentication.models import SystemUser
    before=AuditLog.objects.count()
    u,_=SystemUser.objects.get_or_create(username='audit_chk')
    u.set_password('X'); u.save()
    after=AuditLog.objects.count()
    if after<=before: raise Exception('No AuditLog row created')
    return f'{before} -> {after}'
chk('T0.12', 'Audit signal fires', t12)

# T0.13
def t13():
    from django.db import connection as c
    if c.vendor!='postgresql':
        return f'SKIP: PostgreSQL needed (current={c.vendor}) — triggers active in prod only'
    from apps.inventory.models import InventoryLedger
    import uuid
    l=InventoryLedger.objects.create(item_id=uuid.uuid4(),warehouse_id=uuid.uuid4(),transaction_type='ADJUSTMENT',quantity_in=1)
    try:
        InventoryLedger.objects.filter(pk=l.pk).update(quantity_in=999)
        raise Exception('UPDATE succeeded - trigger missing')
    except Exception as ex:
        if 'immutable' in str(ex).lower() or 'prevent' in str(ex).lower():
            return 'Trigger blocked update'
        raise
chk('T0.13', 'Ledger trigger blocks UPDATE', t13)

# T0.14
def t14():
    from apps.core.utils.number_generator import generate_pr_number
    # Fix race condition in test by actually simulating database creation
    from apps.procurement.models import PurchaseRequest
    p1 = generate_pr_number()
    # Save a record so the next PR generates a new number
    pr_record = PurchaseRequest.objects.create(reference=p1)
    p2 = generate_pr_number()
    
    from django.utils import timezone
    yr=timezone.now().year
    # Verify prefix and differences
    if not (p1.startswith(f'PR-{yr}-') and p2.startswith(f'PR-{yr}-')):
        raise Exception(f'Bad format: {p1}, {p2}')
    if p1 == p2:
        raise Exception(f'Generator created duplicate numbers: {p1}')
    return f'{p1}, {p2}'
chk('T0.14', 'PR number generates', t14)

# T0.15
def t15():
    from apps.core.utils.batch_number import generate_batch_number
    from datetime import date
    r=generate_batch_number('PN-100',date(2026,3,12))
    if not r.startswith('PN260312') or len(r)!=9:
        raise Exception(f'Bad format: {r}')
    return r
chk('T0.15', 'Batch number format', t15)

# Print Report
print('\nID      STATUS  Description\n' + '-'*70)
p=f=sk=0
for tid,status,desc,detail in results:
    s_col=status.ljust(6)
    print(f'{tid:<7} {s_col}  {desc}')
    if detail: print(f'        {detail}')
    if status=='PASS': p+=1
    elif status=='FAIL': f+=1
    else: sk+=1
print('-'*70 + f'\nResult: {p} PASS | {f} FAIL | {sk} SKIP\n')
sys.exit(0 if f==0 else 1)
