import requests, sys

BASE = "http://localhost:8000/api"
resp = requests.post(f"{BASE}/auth/login/", json={"username": "admin", "password": "admin123"})
if resp.status_code != 200:
    print("Login failed:", resp.text); sys.exit(1)
TOKEN = resp.json()["access_token"]
H = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}
print("[OK] Logged in")

def post(url, data):
    r = requests.post(f"{BASE}{url}", headers=H, json=data)
    if r.status_code not in (200, 201):
        print(f"  ERROR {url}: {r.status_code} -> {r.text[:400]}")
        return None
    return r.json()

def action(url):
    r = requests.post(f"{BASE}{url}", headers=H)
    if r.status_code not in (200, 201):
        print(f"  ERROR ACTION {url}: {r.status_code} -> {r.text[:400]}")
        return None
    return r.json()

print("\n-- MASTER DATA --")

pt1 = post("/procurement/payment-terms/", {"term_name": "Net 30", "days": 30, "description": "Payment within 30 days"})
pt2 = post("/procurement/payment-terms/", {"term_name": "Net 60", "days": 60, "description": "Payment within 60 days"})
PT1 = pt1["id"] if pt1 else None
print(f"[OK] Payment Terms: {pt1['term_name'] if pt1 else 'FAIL'}, {pt2['term_name'] if pt2 else 'FAIL'}")

wh1 = post("/master_data/warehouses/", {"warehouse_name": "Main Raw Material Store", "warehouse_type": "Factory", "city": "Karachi", "province": "Sindh", "country": "Pakistan", "status": "active"})
wh2 = post("/master_data/warehouses/", {"warehouse_name": "Finished Goods Store", "warehouse_type": "City", "city": "Lahore", "province": "Punjab", "country": "Pakistan", "status": "active"})
WH1 = wh1["id"] if wh1 else None
WH2 = wh2["id"] if wh2 else None
print(f"[OK] Warehouses: {wh1['warehouse_name'] if wh1 else 'FAIL'}, {wh2['warehouse_name'] if wh2 else 'FAIL'}")

sup1 = post("/master_data/suppliers/", {"supplier_name": "Alpha Oils & Fats Co.", "contact_person": "Muhammad Tariq", "phone": "+92-21-3456789", "email": "tariq@alphaoils.pk", "city": "Karachi", "address": "SITE Industrial Area, Karachi", "payment_terms": "NET30", "currency": "PKR", "lead_time_days": 7, "rating": 4, "status": "active"})
sup2 = post("/master_data/suppliers/", {"supplier_name": "Punjab Agri Suppliers", "contact_person": "Khalid Mehmood", "phone": "+92-42-7654321", "email": "khalid@punjabagri.pk", "city": "Lahore", "address": "Quaid-e-Azam Industrial Estate, Lahore", "payment_terms": "NET60", "currency": "PKR", "lead_time_days": 14, "rating": 3, "status": "active"})
SUP1 = sup1["id"] if sup1 else None
SUP2 = sup2["id"] if sup2 else None
print(f"[OK] Suppliers: {sup1['supplier_name'] if sup1 else 'FAIL'}, {sup2['supplier_name'] if sup2 else 'FAIL'}")

rm1 = post("/master_data/raw-materials/", {"material_code": "RM-001", "material_name": "Refined Palm Oil", "material_type": "Oil", "unit_of_measure": "KG", "standard_cost": 280.00, "safety_stock": 500, "reorder_level": 1000, "current_stock": 0, "shelf_life_days": 365, "status": "active"})
rm2 = post("/master_data/raw-materials/", {"material_code": "RM-002", "material_name": "Iodized Salt", "material_type": "Mineral", "unit_of_measure": "KG", "standard_cost": 45.00, "safety_stock": 200, "reorder_level": 500, "current_stock": 0, "shelf_life_days": 730, "status": "active"})
rm3 = post("/master_data/raw-materials/", {"material_code": "RM-003", "material_name": "Potato Starch", "material_type": "Starch", "unit_of_measure": "KG", "standard_cost": 120.00, "safety_stock": 300, "reorder_level": 700, "current_stock": 0, "shelf_life_days": 180, "status": "active"})
rm4 = post("/master_data/raw-materials/", {"material_code": "RM-004", "material_name": "Chilli Powder", "material_type": "Spice", "unit_of_measure": "KG", "standard_cost": 350.00, "safety_stock": 100, "reorder_level": 250, "current_stock": 0, "shelf_life_days": 365, "status": "active"})
RM1 = rm1["id"] if rm1 else None
RM2 = rm2["id"] if rm2 else None
RM3 = rm3["id"] if rm3 else None
RM4 = rm4["id"] if rm4 else None
print(f"[OK] Raw Materials: {rm1['material_name'] if rm1 else 'FAIL'}, {rm2['material_name'] if rm2 else 'FAIL'}, {rm3['material_name'] if rm3 else 'FAIL'}, {rm4['material_name'] if rm4 else 'FAIL'}")

cat1 = post("/master_data/product-categories/", {"category_name": "Snacks", "description": "Fried and baked snack products"})
CAT1 = cat1["id"] if cat1 else None
print(f"[OK] Category: {cat1['category_name'] if cat1 else 'FAIL'}")

prod1 = post("/master_data/products/", {"sku_code": "PKS-001", "product_name": "Pakasian Nimko 200g", "brand": "Pakasian", "category_id": CAT1, "pack_size": "200g", "net_weight": 200, "gross_weight": 220, "barcode": "6901234567890", "shelf_life_days": 90, "standard_cost": 85.00, "selling_price": 120.00, "status": "active"})
prod2 = post("/master_data/products/", {"sku_code": "PKS-002", "product_name": "Pakasian Chips 150g", "brand": "Pakasian", "category_id": CAT1, "pack_size": "150g", "net_weight": 150, "gross_weight": 165, "barcode": "6901234567891", "shelf_life_days": 90, "standard_cost": 65.00, "selling_price": 95.00, "status": "active"})
print(f"[OK] Products: {prod1['product_name'] if prod1 else 'FAIL'}, {prod2['product_name'] if prod2 else 'FAIL'}")

mac1 = post("/master_data/machines/", {"machine_name": "Industrial Fryer Line 1", "machine_type": "Fryer", "model_number": "FRY-2000", "status": "active"})
print(f"[OK] Machine: {mac1['machine_name'] if mac1 else 'FAIL'}")

cust1 = post("/master_data/customers/", {"customer_name": "Metro Karachi", "customer_type": "modern_trade", "contact_person": "Iqbal Ahmed", "phone": "+92-21-9988776", "email": "iqbal@metrokhi.pk", "city": "Karachi", "region": "Sindh", "delivery_priority": "high", "credit_limit": 500000, "payment_terms": "NET30", "status": "active"})
cust2 = post("/master_data/customers/", {"customer_name": "Lahore Wholesale Market", "customer_type": "wholesaler", "contact_person": "Asif Rana", "phone": "+92-42-1122334", "email": "asif@lwm.pk", "city": "Lahore", "region": "Punjab", "delivery_priority": "normal", "credit_limit": 300000, "payment_terms": "COD", "status": "active"})
print(f"[OK] Customers: {cust1['customer_name'] if cust1 else 'FAIL'}, {cust2['customer_name'] if cust2 else 'FAIL'}")

print("\n-- PROCUREMENT SETUP --")

sm1 = post("/procurement/supplier-materials/", {"supplier_id": SUP1, "material_id": RM1, "standard_price": 275.00, "lead_time_days": 5, "minimum_order_qty": 500, "preferred_supplier": True, "status": "active"})
sm2 = post("/procurement/supplier-materials/", {"supplier_id": SUP1, "material_id": RM2, "standard_price": 42.00, "lead_time_days": 3, "minimum_order_qty": 200, "preferred_supplier": False, "status": "active"})
sm3 = post("/procurement/supplier-materials/", {"supplier_id": SUP2, "material_id": RM3, "standard_price": 115.00, "lead_time_days": 10, "minimum_order_qty": 300, "preferred_supplier": True, "status": "active"})
sm4 = post("/procurement/supplier-materials/", {"supplier_id": SUP2, "material_id": RM4, "standard_price": 340.00, "lead_time_days": 7, "minimum_order_qty": 50, "preferred_supplier": True, "status": "active"})
print(f"[OK] Supplier Materials: {sm1['id'] if sm1 else 'FAIL'}, {sm2['id'] if sm2 else 'FAIL'}, {sm3['id'] if sm3 else 'FAIL'}, {sm4['id'] if sm4 else 'FAIL'}")

rr1 = post("/procurement/reorder-rules/", {"material_id": RM1, "warehouse_id": WH1, "minimum_stock": 500, "maximum_stock": 5000, "reorder_quantity": 2000})
rr2 = post("/procurement/reorder-rules/", {"material_id": RM3, "warehouse_id": WH1, "minimum_stock": 300, "maximum_stock": 3000, "reorder_quantity": 1000})
print(f"[OK] Reorder Rules: {rr1['id'] if rr1 else 'FAIL'}, {rr2['id'] if rr2 else 'FAIL'}")

print("\n-- PROCUREMENT WORKFLOW --")

pr = post("/procurement/purchase-requisitions/", {"department": "production", "status": "Draft", "items": [{"material_id": RM1, "requested_quantity": 2000, "required_date": "2026-05-01", "warehouse_id": WH1, "remarks": "Monthly replenishment"}, {"material_id": RM2, "requested_quantity": 500, "required_date": "2026-05-01", "warehouse_id": WH1, "remarks": "Running low"}, {"material_id": RM3, "requested_quantity": 1000, "required_date": "2026-05-05", "warehouse_id": WH1, "remarks": "For production batch"}]})
PR_ID = pr["id"] if pr else None
print(f"[OK] PR: {pr['requisition_number'] if pr else 'FAIL'}")
if PR_ID:
    sub = action(f"/procurement/purchase-requisitions/{PR_ID}/submit/")
    print(f"  Submit: {sub.get('message','ok') if sub else 'FAIL'}")
    apv = action(f"/procurement/purchase-requisitions/{PR_ID}/approve/")
    print(f"  Approve: {apv.get('message','ok') if apv else 'FAIL'}")

rfq1 = post("/procurement/rfqs/", {"supplier_id": SUP1, "material_id": RM1, "quantity": 2000, "required_date": "2026-05-01", "notes": "Please quote for 2000 KG refined palm oil"})
rfq2 = post("/procurement/rfqs/", {"supplier_id": SUP2, "material_id": RM3, "quantity": 1000, "required_date": "2026-05-05", "notes": "Require 1000 KG potato starch, food grade"})
RFQ1_ID = rfq1["id"] if rfq1 else None
RFQ2_ID = rfq2["id"] if rfq2 else None
print(f"[OK] RFQs: {rfq1.get('rfq_number','?') if rfq1 else 'FAIL'}, {rfq2.get('rfq_number','?') if rfq2 else 'FAIL'}")

if RFQ1_ID:
    qt1 = post("/procurement/quotations/", {"rfq_id": RFQ1_ID, "supplier_id": SUP1, "material_id": RM1, "quoted_price": 272.00, "delivery_days": 5, "valid_until": "2026-04-30", "currency": "PKR"})
    print(f"  Quotation 1: {qt1['id'] if qt1 else 'FAIL'}")
if RFQ2_ID:
    qt2 = post("/procurement/quotations/", {"rfq_id": RFQ2_ID, "supplier_id": SUP2, "material_id": RM3, "quoted_price": 112.00, "delivery_days": 8, "valid_until": "2026-04-30", "currency": "PKR"})
    print(f"  Quotation 2: {qt2['id'] if qt2 else 'FAIL'}")

PO1_ID = None
if PR_ID:
    conv = post(f"/procurement/purchase-requisitions/{PR_ID}/convert-to-po/", {"supplier_id": SUP1})
    if conv:
        PO1_ID = conv.get("po_id") or conv.get("id")
        print(f"[OK] PR->PO: po_id={PO1_ID}")
    else:
        print("  PR->PO FAILED")

po2 = post("/procurement/purchase-orders/", {"supplier_id": SUP2, "warehouse_id": WH1, "payment_terms": PT1, "expected_delivery": "2026-05-10", "currency": "PKR", "status": "Draft", "items": [{"material_id": RM3, "ordered_quantity": 1000, "unit_price": 112.00, "tax_rate": 17, "discount": 0}, {"material_id": RM4, "ordered_quantity": 200, "unit_price": 340.00, "tax_rate": 17, "discount": 2}]})
PO2_ID = po2["id"] if po2 else None
print(f"[OK] PO2: {po2.get('po_number','?') if po2 else 'FAIL'}")
if PO2_ID:
    action(f"/procurement/purchase-orders/{PO2_ID}/approve/")
    action(f"/procurement/purchase-orders/{PO2_ID}/send_to_supplier/")
    print(f"  PO2 approved & sent")

grn1 = post("/procurement/goods-receipts/", {"po_id": PO2_ID, "supplier_id": SUP2, "warehouse_id": WH1, "received_date": "2026-05-12", "status": "Draft", "items": [{"material_id": RM3, "ordered_qty": 1000, "received_qty": 980, "accepted_qty": 960, "rejected_qty": 20, "batch_number": "BATCH-RM3-001"}, {"material_id": RM4, "ordered_qty": 200, "received_qty": 200, "accepted_qty": 198, "rejected_qty": 2, "batch_number": "BATCH-RM4-001"}]})
GRN1_ID = grn1["id"] if grn1 else None
print(f"[OK] GRN1: {grn1.get('grn_number','?') if grn1 else 'FAIL'}")

grn2 = post("/procurement/goods-receipts/", {"po_id": PO1_ID, "supplier_id": SUP1, "warehouse_id": WH1, "received_date": "2026-05-06", "status": "Draft", "items": [{"material_id": RM1, "ordered_qty": 2000, "received_qty": 2000, "accepted_qty": 1950, "rejected_qty": 50, "batch_number": "BATCH-RM1-001"}, {"material_id": RM2, "ordered_qty": 500, "received_qty": 500, "accepted_qty": 500, "rejected_qty": 0, "batch_number": "BATCH-RM2-001"}]})
GRN2_ID = grn2["id"] if grn2 else None
print(f"[OK] GRN2: {grn2.get('grn_number','?') if grn2 else 'FAIL'}")

if GRN1_ID:
    action(f"/procurement/goods-receipts/{GRN1_ID}/confirm/")
    print("  GRN1 confirmed")
if GRN2_ID:
    action(f"/procurement/goods-receipts/{GRN2_ID}/confirm/")
    print("  GRN2 confirmed")

batch1 = post("/procurement/raw-material-batches/", {"material_id": RM1, "supplier_id": SUP1, "warehouse_id": WH1, "batch_number": "BATCH-RM1-001", "supplier_batch": "ALPHA-PO-2026-001", "quantity": 1950, "manufacture_date": "2026-04-15", "expiry_date": "2027-04-15", "status": "Hold"})
batch2 = post("/procurement/raw-material-batches/", {"material_id": RM3, "supplier_id": SUP2, "warehouse_id": WH1, "batch_number": "BATCH-RM3-001", "supplier_batch": "PAS-2026-RM3-88", "quantity": 960, "manufacture_date": "2026-04-20", "expiry_date": "2026-10-20", "status": "Hold"})
batch3 = post("/procurement/raw-material-batches/", {"material_id": RM4, "supplier_id": SUP2, "warehouse_id": WH1, "batch_number": "BATCH-RM4-001", "supplier_batch": "PAS-2026-RM4-22", "quantity": 198, "manufacture_date": "2026-03-01", "expiry_date": "2027-03-01", "status": "Hold"})
B1_ID = batch1["id"] if batch1 else None
B2_ID = batch2["id"] if batch2 else None
B3_ID = batch3["id"] if batch3 else None
print(f"[OK] Batches: {batch1.get('batch_number','?') if batch1 else 'FAIL'}, {batch2.get('batch_number','?') if batch2 else 'FAIL'}, {batch3.get('batch_number','?') if batch3 else 'FAIL'}")

qc1 = post("/procurement/qc-inspections/", {"material_id": RM1, "grn_id": GRN2_ID, "batch_id": B1_ID, "inspection_date": "2026-05-07", "result": "Approved", "remarks": "Acid value 0.08%. Moisture 0.07%. All parameters within spec. Approved."})
qc2 = post("/procurement/qc-inspections/", {"material_id": RM3, "grn_id": GRN1_ID, "batch_id": B2_ID, "inspection_date": "2026-05-13", "result": "Approved", "remarks": "Starch purity 98.5%. No contamination. Approved."})
qc3 = post("/procurement/qc-inspections/", {"material_id": RM4, "grn_id": GRN1_ID, "batch_id": B3_ID, "inspection_date": "2026-05-13", "result": "Conditional", "remarks": "Moisture 12.1% vs 11% limit. Use within 30 days, store dry."})
print(f"[OK] QC: {qc1['id'] if qc1 else 'FAIL'}, {qc2['id'] if qc2 else 'FAIL'}, {qc3['id'] if qc3 else 'FAIL'}")

ret1 = post("/procurement/purchase-returns/", {"grn_id": GRN2_ID, "material_id": RM1, "quantity": 50, "reason": "QC rejected: rancid smell in 50 KG Palm Oil batch", "return_date": "2026-05-08", "status": "Pending"})
print(f"[OK] Purchase Return: {ret1['id'] if ret1 else 'FAIL'}")

ap1 = post("/procurement/accounts-payable/", {"supplier_id": SUP1, "po_id": PO1_ID, "invoice_number": "INV-ALPHA-2026-001", "amount": 544000.00, "due_date": "2026-06-05", "status": "Pending"})
ap2 = post("/procurement/accounts-payable/", {"supplier_id": SUP2, "po_id": PO2_ID, "invoice_number": "INV-PAS-2026-088", "amount": 179640.00, "due_date": "2026-06-12", "status": "Pending"})
print(f"[OK] AP: {ap1['id'] if ap1 else 'FAIL'}, {ap2['id'] if ap2 else 'FAIL'}")

if ap1:
    paid = action(f"/procurement/accounts-payable/{ap1['id']}/mark_paid/")
    print(f"  AP1 paid: {paid.get('message','ok') if paid else 'FAIL'}")

print("\n=== SEEDING COMPLETE ===")
