"""
STEP 5 - API->DB Round Trip Test for Master Data module.
Run with: python test_api_roundtrip.py
"""
import requests
import os
import sys
import django

BASE = 'http://localhost:8000'
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.authentication.models import SystemUser

admin = SystemUser.objects.first()
if not admin:
    print("SKIP: No users in DB.")
    sys.exit(1)
print(f"Using user: {admin.username}")

resp = requests.post(f'{BASE}/api/auth/login/', json={'username': admin.username, 'password': 'admin123'})
if resp.status_code != 200:
    print(f"Login failed ({resp.status_code}): {resp.text[:300]}")
    sys.exit(1)
token = resp.json().get('access_token') or resp.json().get('access') or resp.json().get('token')
headers = {'Authorization': f'Bearer {token}'}
print(f"Login OK\n")

results = []


def test_roundtrip(name, endpoint, create_data, update_field, update_val, soft_delete=True):
    try:
        r = requests.post(f'{BASE}{endpoint}', headers=headers, json=create_data)
        assert r.status_code == 201, f"Create failed {r.status_code}: {r.text[:200]}"
        obj_id = r.json()['id']

        # verify DB persistence
        from django.apps import apps
        # import the model dynamically via the response
        r2 = requests.patch(f'{BASE}{endpoint}{obj_id}/', headers=headers, json={update_field: update_val})
        assert r2.status_code == 200, f"Update failed {r2.status_code}: {r2.text[:200]}"

        r3 = requests.delete(f'{BASE}{endpoint}{obj_id}/', headers=headers)
        if soft_delete:
            assert r3.status_code == 200, f"Soft-delete failed {r3.status_code}"
        else:
            assert r3.status_code == 204, f"Hard-delete failed {r3.status_code}"

        results.append((name, 'PASS'))
    except Exception as e:
        results.append((name, f'FAIL: {e}'))


def verify_db_create(model_class, field, value):
    return model_class.objects.filter(**{field: value}).exists()


# Manual tests with direct DB verification
from apps.master_data.models import Supplier, Product, RawMaterial, Warehouse, ProductionLine, Machine

# Supplier
try:
    r = requests.post(f'{BASE}/api/master_data/suppliers/', headers=headers, json={
        'supplier_name': 'APIRT Supplier', 'currency': 'PKR', 'lead_time_days': 7, 'rating': 4
    })
    assert r.status_code == 201, f"Create {r.status_code}: {r.text[:200]}"
    sid = r.json()['id']
    assert Supplier.objects.filter(id=sid).exists(), "Not in DB after create"
    r2 = requests.patch(f'{BASE}/api/master_data/suppliers/{sid}/', headers=headers, json={'rating': 5})
    assert r2.status_code == 200
    assert Supplier.objects.get(id=sid).rating == 5, "Update not in DB"
    requests.delete(f'{BASE}/api/master_data/suppliers/{sid}/', headers=headers)
    assert Supplier.objects.get(id=sid).status == 'inactive', "Soft delete not in DB"
    Supplier.objects.filter(id=sid).delete()
    results.append(('Supplier API->DB', 'PASS'))
except Exception as e:
    results.append(('Supplier API->DB', f'FAIL: {e}'))

# Product
try:
    r = requests.post(f'{BASE}/api/master_data/products/', headers=headers, json={
        'sku_code': 'APIRT-001', 'product_name': 'API RT Product', 'pack_size': '100g',
        'net_weight': '95.000', 'gross_weight': '100.000', 'barcode': 'APIRT-BAR-001',
        'shelf_life_days': 90, 'standard_cost': '30.0000'
    })
    assert r.status_code == 201, f"Create {r.status_code}: {r.text[:200]}"
    pid = r.json()['id']
    assert Product.objects.filter(id=pid).exists(), "Not in DB after create"
    r2 = requests.patch(f'{BASE}/api/master_data/products/{pid}/', headers=headers, json={'selling_price': '50.0000'})
    assert r2.status_code == 200
    assert float(Product.objects.get(id=pid).selling_price) == 50.0, "Update not in DB"
    requests.delete(f'{BASE}/api/master_data/products/{pid}/', headers=headers)
    assert Product.objects.get(id=pid).status == 'inactive', "Soft delete not in DB"
    Product.objects.filter(id=pid).delete()
    results.append(('Product API->DB', 'PASS'))
except Exception as e:
    results.append(('Product API->DB', f'FAIL: {e}'))

# RawMaterial
try:
    r = requests.post(f'{BASE}/api/master_data/raw-materials/', headers=headers, json={
        'material_code': 'APIRT-RM-001', 'material_name': 'API RT Material',
        'material_type': 'ingredient', 'unit_of_measure': 'kg', 'standard_cost': '10.0000'
    })
    assert r.status_code == 201, f"Create {r.status_code}: {r.text[:200]}"
    rid = r.json()['id']
    assert RawMaterial.objects.filter(id=rid).exists()
    r2 = requests.patch(f'{BASE}/api/master_data/raw-materials/{rid}/', headers=headers, json={'standard_cost': '15.0000'})
    assert r2.status_code == 200
    assert float(RawMaterial.objects.get(id=rid).standard_cost) == 15.0
    requests.delete(f'{BASE}/api/master_data/raw-materials/{rid}/', headers=headers)
    assert RawMaterial.objects.get(id=rid).status == 'inactive'
    RawMaterial.objects.filter(id=rid).delete()
    results.append(('RawMaterial API->DB', 'PASS'))
except Exception as e:
    results.append(('RawMaterial API->DB', f'FAIL: {e}'))

# Warehouse
try:
    r = requests.post(f'{BASE}/api/master_data/warehouses/', headers=headers, json={
        'warehouse_name': 'APIRT Warehouse', 'warehouse_type': 'Factory',
        'city': 'Lahore', 'province': 'Punjab'
    })
    assert r.status_code == 201, f"Create {r.status_code}: {r.text[:200]}"
    wid = r.json()['id']
    assert Warehouse.objects.filter(id=wid).exists()
    r2 = requests.patch(f'{BASE}/api/master_data/warehouses/{wid}/', headers=headers, json={'city': 'Islamabad'})
    assert r2.status_code == 200
    assert Warehouse.objects.get(id=wid).city == 'Islamabad'
    requests.delete(f'{BASE}/api/master_data/warehouses/{wid}/', headers=headers)
    assert Warehouse.objects.get(id=wid).status == 'inactive'
    Warehouse.objects.filter(id=wid).delete()
    results.append(('Warehouse API->DB', 'PASS'))
except Exception as e:
    results.append(('Warehouse API->DB', f'FAIL: {e}'))

# ProductionLine
try:
    r = requests.post(f'{BASE}/api/master_data/production-lines/', headers=headers, json={
        'line_name': 'APIRT Line', 'line_type': 'Frying', 'capacity_per_hour': '1000.000'
    })
    assert r.status_code == 201, f"Create {r.status_code}: {r.text[:200]}"
    lid = r.json()['id']
    assert ProductionLine.objects.filter(id=lid).exists()
    r2 = requests.patch(f'{BASE}/api/master_data/production-lines/{lid}/', headers=headers, json={'capacity_per_hour': '1500.000'})
    assert r2.status_code == 200
    assert float(ProductionLine.objects.get(id=lid).capacity_per_hour) == 1500.0
    requests.delete(f'{BASE}/api/master_data/production-lines/{lid}/', headers=headers)
    assert ProductionLine.objects.get(id=lid).status == 'inactive'
    ProductionLine.objects.filter(id=lid).delete()
    results.append(('ProductionLine API->DB', 'PASS'))
except Exception as e:
    results.append(('ProductionLine API->DB', f'FAIL: {e}'))

# Machine
try:
    r = requests.post(f'{BASE}/api/master_data/machines/', headers=headers, json={
        'machine_name': 'APIRT Fryer', 'machine_type': 'Fryer',
        'capacity_per_hour': '500.000', 'cost_per_hour': '200.00'
    })
    assert r.status_code == 201, f"Create {r.status_code}: {r.text[:200]}"
    mid = r.json()['id']
    assert Machine.objects.filter(id=mid).exists()
    r2 = requests.patch(f'{BASE}/api/master_data/machines/{mid}/', headers=headers, json={'cost_per_hour': '250.00'})
    assert r2.status_code == 200
    assert float(Machine.objects.get(id=mid).cost_per_hour) == 250.0
    requests.delete(f'{BASE}/api/master_data/machines/{mid}/', headers=headers)
    assert Machine.objects.get(id=mid).status == 'inactive'
    Machine.objects.filter(id=mid).delete()
    results.append(('Machine API->DB', 'PASS'))
except Exception as e:
    results.append(('Machine API->DB', f'FAIL: {e}'))

print("=" * 60)
print("STEP 5 -- API->DB ROUND TRIP TEST")
print("=" * 60)
passes = 0
for name, result in results:
    icon = "PASS" if result == "PASS" else "FAIL"
    print(f"  [{icon}]  {name:<30} {result}")
    if result == "PASS":
        passes += 1
print("=" * 60)
print(f"  Result: {passes} PASS | {len(results) - passes} FAIL")
