"""Test new master data entities: PackagingMaterial + Customer updates."""
import os, django, requests
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

BASE = 'http://localhost:8000'
token = requests.post(f'{BASE}/api/auth/login/', json={'username': 'admin', 'password': 'admin123'}).json()['access_token']
H = {'Authorization': f'Bearer {token}'}
results = []

# ── PackagingMaterial CRUD ────────────────────────────────────────────────────
try:
    from apps.master_data.models import PackagingMaterial
    r = requests.post(f'{BASE}/api/master_data/packaging-materials/', headers=H, json={
        'material_code': 'PKG-TEST-001', 'material_name': 'Test Pouch 100g',
        'material_type': 'primary', 'unit_of_measure': 'pcs',
        'standard_cost': '2.5000', 'safety_stock': '1000', 'reorder_level': '2000'
    })
    assert r.status_code == 201, f"Create {r.status_code}: {r.text[:200]}"
    pid = r.json()['id']
    assert PackagingMaterial.objects.filter(id=pid).exists(), "Not in DB"
    data = r.json()
    assert data['material_code'] == 'PKG-TEST-001'
    assert data['material_type'] == 'primary'
    assert data['supplier_name'] is None

    r2 = requests.patch(f'{BASE}/api/master_data/packaging-materials/{pid}/', headers=H, json={'standard_cost': '3.0000'})
    assert r2.status_code == 200
    assert float(PackagingMaterial.objects.get(id=pid).standard_cost) == 3.0

    r3 = requests.delete(f'{BASE}/api/master_data/packaging-materials/{pid}/', headers=H)
    assert r3.status_code == 200
    assert PackagingMaterial.objects.get(id=pid).status == 'inactive'
    PackagingMaterial.objects.filter(id=pid).delete()
    results.append(('PackagingMaterial API CRUD', 'PASS'))
except Exception as e:
    results.append(('PackagingMaterial API CRUD', f'FAIL: {e}'))

# ── PackagingMaterial unique constraint ───────────────────────────────────────
try:
    from django.db import IntegrityError
    PackagingMaterial.objects.create(
        material_code='PKG-UNIQ-001', material_name='Uniq Bag',
        material_type='primary', unit_of_measure='pcs', standard_cost=1
    )
    try:
        PackagingMaterial.objects.create(
            material_code='PKG-UNIQ-001', material_name='Dup Bag',
            material_type='secondary', unit_of_measure='pcs', standard_cost=2
        )
        results.append(('PackagingMaterial unique material_code', 'FAIL: duplicate allowed'))
    except IntegrityError:
        results.append(('PackagingMaterial unique material_code', 'PASS'))
    finally:
        PackagingMaterial.objects.filter(material_code='PKG-UNIQ-001').delete()
except Exception as e:
    results.append(('PackagingMaterial unique material_code', f'FAIL: {e}'))

# ── PackagingMaterial with Supplier FK ───────────────────────────────────────
try:
    from apps.master_data.models import Supplier
    sup = Supplier.objects.create(supplier_name='PKG Supplier Test', currency='PKR', lead_time_days=5)
    r = requests.post(f'{BASE}/api/master_data/packaging-materials/', headers=H, json={
        'material_code': 'PKG-SUP-001', 'material_name': 'Carton Box 500g',
        'material_type': 'secondary', 'unit_of_measure': 'pcs',
        'standard_cost': '15.0000', 'supplier': str(sup.id)
    })
    assert r.status_code == 201, f"Create {r.status_code}: {r.text[:200]}"
    data = r.json()
    assert data['supplier_name'] == 'PKG Supplier Test', f"Got: {data.get('supplier_name')}"
    PackagingMaterial.objects.filter(id=data['id']).delete()
    sup.delete()
    results.append(('PackagingMaterial supplier FK', 'PASS'))
except Exception as e:
    results.append(('PackagingMaterial supplier FK', f'FAIL: {e}'))

# ── Customer new fields ───────────────────────────────────────────────────────
try:
    from apps.sales.models import Customer
    r = requests.post(f'{BASE}/api/master_data/customers/', headers=H, json={
        'customer_name': 'Ahmad Traders', 'customer_type': 'retailer',
        'contact_person': 'Ahmad Ali', 'phone': '03001234567',
        'email': 'ahmad@example.com', 'address': 'Shop 5, Main Bazaar',
        'region': 'Punjab', 'city': 'Lahore',
        'payment_terms': 'NET30', 'credit_limit': '50000.0000'
    })
    assert r.status_code == 201, f"Create {r.status_code}: {r.text[:200]}"
    cid = r.json()['id']
    data = r.json()
    assert data['contact_person'] == 'Ahmad Ali'
    assert data['phone'] == '03001234567'
    assert data['email'] == 'ahmad@example.com'
    assert data['customer_type'] == 'retailer'
    c = Customer.objects.get(id=cid)
    assert c.contact_person == 'Ahmad Ali'
    c.delete()
    results.append(('Customer new contact fields API->DB', 'PASS'))
except Exception as e:
    results.append(('Customer new contact fields API->DB', f'FAIL: {e}'))

# ── Customer accessible at both URLs ─────────────────────────────────────────
try:
    r1 = requests.get(f'{BASE}/api/master_data/customers/', headers=H)
    assert r1.status_code == 200, f"master_data URL {r1.status_code}"
    r2 = requests.get(f'{BASE}/api/sales/customers/', headers=H)
    assert r2.status_code == 200, f"sales URL {r2.status_code}"
    results.append(('Customer at /master_data/ and /sales/', 'PASS'))
except Exception as e:
    results.append(('Customer at /master_data/ and /sales/', f'FAIL: {e}'))

# ── Filter PackagingMaterial by type ─────────────────────────────────────────
try:
    PackagingMaterial.objects.create(
        material_code='PKG-F-001', material_name='Filter Primary',
        material_type='primary', unit_of_measure='pcs', standard_cost=1
    )
    PackagingMaterial.objects.create(
        material_code='PKG-F-002', material_name='Filter Secondary',
        material_type='secondary', unit_of_measure='pcs', standard_cost=2
    )
    r = requests.get(f'{BASE}/api/master_data/packaging-materials/?material_type=primary', headers=H)
    assert r.status_code == 200
    items = r.json().get('results', r.json())
    codes = [i['material_code'] for i in items]
    assert 'PKG-F-001' in codes, f"primary missing, got: {codes}"
    assert 'PKG-F-002' not in codes, f"secondary leaked into filter"
    PackagingMaterial.objects.filter(material_code__startswith='PKG-F-').delete()
    results.append(('PackagingMaterial filter by material_type', 'PASS'))
except Exception as e:
    results.append(('PackagingMaterial filter by material_type', f'FAIL: {e}'))

# ── Customer filter by customer_type ─────────────────────────────────────────
try:
    from apps.sales.models import Customer
    c1 = Customer.objects.create(customer_name='Filter Retailer', customer_type='retailer', region='Punjab', city='Lahore')
    c2 = Customer.objects.create(customer_name='Filter Distributor', customer_type='distributor', region='Sindh', city='Karachi')
    r = requests.get(f'{BASE}/api/master_data/customers/?customer_type=retailer', headers=H)
    assert r.status_code == 200
    items = r.json().get('results', r.json())
    names = [i['customer_name'] for i in items]
    assert 'Filter Retailer' in names
    assert 'Filter Distributor' not in names
    c1.delete(); c2.delete()
    results.append(('Customer filter by customer_type', 'PASS'))
except Exception as e:
    results.append(('Customer filter by customer_type', f'FAIL: {e}'))

print()
print("=" * 65)
print("NEW ENTITIES TEST RESULTS")
print("=" * 65)
passes = 0
for name, result in results:
    icon = "PASS" if result == "PASS" else "FAIL"
    print(f"  [{icon}]  {name:<45} {result}")
    if result == "PASS":
        passes += 1
print("=" * 65)
print(f"  Result: {passes} PASS | {len(results) - passes} FAIL")
