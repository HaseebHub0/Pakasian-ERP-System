import client from "./client";

export async function getSupplierMaterials(supplierId: number) {
  const { data } = await client.get("/api/procurement/supplier-materials/", { params: { supplier_id: supplierId } });
  return data.results || data;
}

export async function getPurchaseOrders(params: { supplier_id: number }) {
  const { data } = await client.get("/api/procurement/purchase-orders/", { params });
  return data.results || data;
}
