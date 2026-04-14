import client from "./client";

export interface Product {
  id: number;
  sku_code: string;
  product_name: string;
  brand: string | null;
  category_id: number | null;
  pack_size: string | null;
  net_weight: number | null;
  gross_weight: number | null;
  barcode: string | null;
  shelf_life_days: number | null;
  standard_cost: number;
  status: "Active" | "Inactive";
}

export interface ProductParams {
  search?: string;
  sku_code?: string;
  barcode?: string;
  status?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedProducts {
  count: number;
  next: string | null;
  previous: string | null;
  results: Product[];
}

export async function getProducts(params?: ProductParams): Promise<PaginatedProducts> {
  const { data } = await client.get("/api/master_data/products/", { params });
  return data;
}

export async function createProduct(product: Omit<Product, "id">): Promise<Product> {
  const { data } = await client.post("/api/master_data/products/", product);
  return data;
}

export async function updateProduct(id: number, product: Partial<Product>): Promise<Product> {
  const { data } = await client.put(`/api/master_data/products/${id}/`, product);
  return data;
}

export async function searchProducts(q: string): Promise<Product[]> {
  const { data } = await client.get("/api/master_data/products/", { params: { search: q } });
  return data.results || data;
}

export interface Category {
  id: number;
  name: string;
}

// Ensure error fallback
export async function getCategories(): Promise<{ results: Category[] }> {
  try {
    const { data } = await client.get("/api/master_data/product-categories/");
    return data;
  } catch (error) {
    return { results: [] };
  }
}

export interface Supplier {
  id: number;
  supplier_name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  payment_terms: "Cash" | "Net30" | "Net45" | "Net60" | string;
  currency: string;
  lead_time_days: number | null;
  rating: number;
  status: "Active" | "Inactive";
}

export interface SupplierParams {
  search?: string;
  status?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedSuppliers {
  count: number;
  next: string | null;
  previous: string | null;
  results: Supplier[];
}

export async function getSuppliers(params?: SupplierParams): Promise<PaginatedSuppliers> {
  const { data } = await client.get("/api/master_data/suppliers/", { params });
  return data;
}

export async function createSupplier(supplier: Omit<Supplier, "id">): Promise<Supplier> {
  const { data } = await client.post("/api/master_data/suppliers/", supplier);
  return data;
}

export async function updateSupplier(id: number, supplier: Partial<Supplier>): Promise<Supplier> {
  const { data } = await client.put(`/api/master_data/suppliers/${id}/`, supplier);
  return data;
}

export interface RawMaterial {
  id: number;
  material_code: string;
  material_name: string;
  material_type: "ingredient" | "oil" | "spice" | "packaging" | "additive" | string;
  unit_of_measure: string;
  density: number | null;
  standard_cost: number | null;
  safety_stock: number | null;
  reorder_level: number | null;
  shelf_life_days: number | null;
  status: "Active" | "Inactive";
}

export interface RawMaterialParams {
  search?: string;
  material_type?: string;
  status?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedRawMaterials {
  count: number;
  next: string | null;
  previous: string | null;
  results: RawMaterial[];
}

export async function getRawMaterials(params?: RawMaterialParams): Promise<PaginatedRawMaterials> {
  const { data } = await client.get("/api/master_data/raw-materials/", { params });
  return data;
}

export async function createRawMaterial(material: Omit<RawMaterial, "id">): Promise<RawMaterial> {
  const { data } = await client.post("/api/master_data/raw-materials/", material);
  return data;
}

export async function updateRawMaterial(id: number, material: Partial<RawMaterial>): Promise<RawMaterial> {
  const { data } = await client.put(`/api/master_data/raw-materials/${id}/`, material);
  return data;
}
