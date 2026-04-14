#!/usr/bin/env python
"""
Module 1 Test Suite: T1.1 – T1.8
Run from erp_system/ with the venv activated:

    python test_module1.py --settings=config.settings.development
"""
import os, sys, uuid

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
for arg in sys.argv[1:]:
    if arg.startswith('--settings='):
        os.environ['DJANGO_SETTINGS_MODULE'] = arg.split('=', 1)[1]

import django
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from apps.authentication.models import SystemUser, Role
from apps.master_data.models import Product, ProductCategory, RawMaterial, Supplier
from apps.core.models import AuditLog
from apps.inventory.models import InventorySummary

factory = APIRequestFactory()

# ── Bootstrap admin user ──────────────────────────────────────────────────────
role = Role.objects.filter(role_name='admin').first()
admin, _ = SystemUser.objects.get_or_create(username='test_admin_m1')
admin.set_password('Admin@1234')
admin.is_active = True
if role:
    admin.role_id = role
admin.save()

results = []

def chk(tid, desc, fn):
    try:
        msg = fn()
        results.append((tid, 'PASS', desc, str(msg or '')))
    except AssertionError as e:
        results.append((tid, 'FAIL', desc, str(e)[:200]))
    except Exception as e:
        results.append((tid, 'FAIL', desc, f'{type(e).__name__}: {str(e)[:160]}'))


# ── T1.1  Create product ──────────────────────────────────────────────────────
def t11():
    from apps.master_data.views import ProductViewSet
    cat, _ = ProductCategory.objects.get_or_create(category_name='T1 Category')
    sku = 'SKU-T1-' + uuid.uuid4().hex[:6].upper()
    bar = 'BAR' + uuid.uuid4().hex[:8].upper()
    data = {
        'sku_code': sku,
        'product_name': 'Test Nimko 200g',
        'brand': 'Nimco',
        'category_id': str(cat.id),
        'pack_size': '200g',
        'net_weight': '190.000',
        'gross_weight': '210.000',
        'barcode': bar,
        'shelf_life_days': 180,
        'standard_cost': '45.5000',
        'status': 'active',
    }
    req = factory.post('/api/master_data/products/', data, format='json')
    force_authenticate(req, user=admin)
    view = ProductViewSet.as_view({'post': 'create'})
    resp = view(req)
    assert resp.status_code == 201, f'Expected 201 got {resp.status_code}: {resp.data}'
    assert 'id' in resp.data, 'Missing id in response'
    return 'id=' + str(resp.data['id'])[:8] + '...'


chk('T1.1', 'Create product returns 201 + UUID id', t11)


# ── T1.2  Duplicate sku_code ──────────────────────────────────────────────────
def t12():
    from apps.master_data.views import ProductViewSet
    existing = Product.objects.first()
    if not existing:
        raise AssertionError('No products in DB — T1.1 may have failed')
    data = {
        'sku_code': existing.sku_code,           # duplicate!
        'product_name': 'Duplicate Product',
        'brand': 'Test',
        'pack_size': '100g',
        'net_weight': '95.000',
        'gross_weight': '100.000',
        'barcode': 'UNIQUE' + uuid.uuid4().hex[:8].upper(),
        'shelf_life_days': 90,
        'standard_cost': '30.0000',
    }
    req = factory.post('/api/master_data/products/', data, format='json')
    force_authenticate(req, user=admin)
    view = ProductViewSet.as_view({'post': 'create'})
    resp = view(req)
    assert resp.status_code == 400, f'Expected 400 got {resp.status_code}: {resp.data}'
    assert 'sku_code' in resp.data, f'Expected sku_code error key, got: {list(resp.data.keys())}'
    return f'Duplicate blocked with 400: {resp.data["sku_code"]}'


chk('T1.2', 'Duplicate sku_code returns 400', t12)


# ── T1.3  Category hierarchy ──────────────────────────────────────────────────
def t13():
    from apps.master_data.views import ProductCategoryViewSet
    view = ProductCategoryViewSet.as_view({'post': 'create'})

    # Create parent
    req = factory.post('/api/master_data/product-categories/',
                       {'category_name': 'Snacks T1', 'parent_category': None}, format='json')
    force_authenticate(req, user=admin)
    resp = view(req)
    assert resp.status_code == 201, f'Parent create failed: {resp.status_code} {resp.data}'
    parent_id = resp.data['id']

    # Create child
    req2 = factory.post('/api/master_data/product-categories/',
                        {'category_name': 'Nimko T1', 'parent_category': parent_id}, format='json')
    force_authenticate(req2, user=admin)
    resp2 = view(req2)
    assert resp2.status_code == 201, f'Child create failed: {resp2.status_code} {resp2.data}'
    assert str(resp2.data['parent_category']) == str(parent_id), \
        f'parent_category mismatch: {resp2.data["parent_category"]} != {parent_id}'

    child = ProductCategory.objects.get(pk=resp2.data['id'])
    assert child.parent_category_id is not None, 'Child FK not set in DB'
    return f'parent={str(parent_id)[:8]}... child={str(resp2.data["id"])[:8]}... FK verified'


chk('T1.3', 'Category hierarchy parent/child FK correct', t13)


# ── T1.4  Supplier rating validation ──────────────────────────────────────────
def t14():
    from apps.master_data.views import SupplierViewSet
    data = {
        'supplier_name': 'Bad Rating Supplier',
        'rating': 6,
        'currency': 'PKR',
        'lead_time_days': 7,
    }
    req = factory.post('/api/master_data/suppliers/', data, format='json')
    force_authenticate(req, user=admin)
    view = SupplierViewSet.as_view({'post': 'create'})
    resp = view(req)
    assert resp.status_code == 400, f'Expected 400, got {resp.status_code}: {resp.data}'
    assert 'rating' in resp.data, f'Expected rating error key, got: {list(resp.data.keys())}'
    return f'Validation blocked: {resp.data["rating"]}'


chk('T1.4', 'rating=6 rejected with 400 validation error', t14)


# ── T1.5  Soft delete ─────────────────────────────────────────────────────────
def t15():
    from apps.master_data.views import ProductViewSet
    product = Product.objects.filter(status='active').first()
    if not product:
        raise AssertionError('No active products to soft-delete')
    pid = product.id
    req = factory.delete(f'/api/master_data/products/{pid}/')
    force_authenticate(req, user=admin)
    view = ProductViewSet.as_view({'delete': 'destroy'})
    resp = view(req, pk=str(pid))
    assert resp.status_code == 200, f'Expected 200, got {resp.status_code}: {resp.data}'
    product.refresh_from_db()
    assert product.status == 'inactive', f'Expected inactive, got {product.status}'
    assert Product.objects.filter(pk=pid).exists(), 'Product was HARD deleted!'
    return f'Product {str(pid)[:8]}... status=inactive, still in DB'


chk('T1.5', 'Soft delete sets status=inactive, row preserved', t15)


# ── T1.6  Search endpoint ─────────────────────────────────────────────────────
def t16():
    from apps.master_data.views import ProductViewSet

    # Ensure a searchable product exists
    Product.objects.get_or_create(
        sku_code='SKU-NIMKO-SRCH',
        defaults={
            'product_name': 'Nimko Classic 100g',
            'pack_size': '100g',
            'net_weight': '95.000',
            'gross_weight': '105.000',
            'barcode': 'NIMKOSRCH001',
            'shelf_life_days': 180,
            'standard_cost': '40.0000',
            'status': 'active',
        }
    )

    req = factory.get('/api/master_data/products/search/', {'q': 'nimko'})
    force_authenticate(req, user=admin)
    view = ProductViewSet.as_view({'get': 'search'})
    resp = view(req)
    assert resp.status_code == 200, f'Expected 200, got {resp.status_code}'
    data = resp.data.get('results', resp.data)  # handle paginated or plain list
    assert len(data) >= 1, f'Expected >= 1 result, got {len(data)}'
    names = [r['product_name'].lower() for r in data]
    assert any('nimko' in n for n in names), f'nimko not found in results: {names}'
    return f'{len(data)} result(s) for q=nimko'


chk('T1.6', 'Search returns matching products by name', t16)


# ── T1.7  Low stock endpoint ──────────────────────────────────────────────────
def t17():
    from apps.master_data.views import RawMaterialViewSet

    mat, _ = RawMaterial.objects.get_or_create(
        material_code='RM-LOWSTK-001',
        defaults={
            'material_name': 'Test Oil Low Stock',
            'material_type': 'oil',
            'unit_of_measure': 'kg',
            'standard_cost': '200.0000',
            'safety_stock': 100,
            'reorder_level': 1000,
        }
    )
    # Remove any inventory summary so available=0 < reorder_level=1000
    InventorySummary.objects.filter(product_id=mat.id).delete()

    req = factory.get('/api/master_data/raw-materials/low_stock/')
    force_authenticate(req, user=admin)
    view = RawMaterialViewSet.as_view({'get': 'low_stock'})
    resp = view(req)
    assert resp.status_code == 200, f'Expected 200, got {resp.status_code}: {resp.data}'
    data = resp.data.get('results', resp.data)
    codes = [r['material_code'] for r in data]
    assert 'RM-LOWSTK-001' in codes, f'Low stock material missing. Got codes: {codes}'
    return f'{len(data)} low-stock material(s) including RM-LOWSTK-001'


chk('T1.7', 'Low stock endpoint returns materials below reorder_level', t17)


# ── T1.8  Audit log fires ─────────────────────────────────────────────────────
def t18():
    from apps.master_data.views import ProductViewSet
    before = AuditLog.objects.count()
    sku = 'SKU-AUDIT-' + uuid.uuid4().hex[:6].upper()
    bar = 'AUDITBAR' + uuid.uuid4().hex[:6].upper()
    data = {
        'sku_code': sku,
        'product_name': 'Audit Test Product',
        'pack_size': '50g',
        'net_weight': '45.000',
        'gross_weight': '50.000',
        'barcode': bar,
        'shelf_life_days': 90,
        'standard_cost': '25.0000',
    }
    req = factory.post('/api/master_data/products/', data, format='json')
    force_authenticate(req, user=admin)
    view = ProductViewSet.as_view({'post': 'create'})
    resp = view(req)
    assert resp.status_code == 201, f'Product create failed: {resp.status_code}: {resp.data}'
    after = AuditLog.objects.count()
    assert after > before, f'No AuditLog created. Before={before} After={after}'
    log = AuditLog.objects.order_by('-timestamp').first()
    assert log.action == 'INSERT', f'Expected INSERT, got {log.action}'
    assert log.entity_type == 'products', f'Expected entity_type=products, got {log.entity_type}'
    return f'AuditLog action={log.action}, entity_type={log.entity_type}, entity_id={log.entity_id}'


chk('T1.8', 'Audit log fires on product INSERT', t18)


# ── Print report ──────────────────────────────────────────────────────────────
print('\nID      STATUS  Description')
print('-' * 75)
passed = failed = 0
for tid, status_val, desc, detail in results:
    print(f'{tid:<7} {status_val:<6}  {desc}')
    if detail:
        print(f'        {detail}')
    if status_val == 'PASS':
        passed += 1
    else:
        failed += 1
print('-' * 75)
print(f'Result: {passed} PASS | {failed} FAIL')
sys.exit(0 if failed == 0 else 1)
