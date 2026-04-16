import client from "./client";

// ─── Products ────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  sku_code: string;
  product_name: string;
  brand: string | null;
  category_id: string | null;
  category_name?: string | null;
  pack_size: string | null;
  net_weight: number | null;
  gross_weight: number | null;
  barcode: string | null;
  shelf_life_days: number | null;
  standard_cost: number;
  selling_price?: number;
  /** Backend stores and returns lowercase: "active" | "inactive" */
  status: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
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

/** Uses PATCH for partial updates (e.g. status toggle without sending all fields). */
export async function updateProduct(id: string, product: Partial<Product>): Promise<Product> {
  const { data } = await client.patch(`/api/master_data/products/${id}/`, product);
  return data;
}

export async function searchProducts(q: string): Promise<Product[]> {
  const { data } = await client.get("/api/master_data/products/", { params: { search: q } });
  return data.results || data;
}

// ─── Product Categories ───────────────────────────────────────────────────────

export interface Category {
  id: string;
  /** Backend field: category_name */
  category_name: string;
  parent_category: string | null;
  parent_name?: string | null;
  subcategory_count?: number;
}

export async function getCategories(): Promise<{ results: Category[]; count: number }> {
  try {
    const { data } = await client.get("/api/master_data/product-categories/");
    return data;
  } catch {
    return { results: [], count: 0 };
  }
}

// ─── Suppliers ────────────────────────────────────────────────────────────────

export interface Supplier {
  id: string;
  supplier_name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  payment_terms: "NET30" | "NET60" | "COD" | "ADVANCE" | string;
  currency: string;
  lead_time_days: number | null;
  rating: number | null;
  /**
   * Note: the backend Supplier model does not have a status column.
   * The field is kept here for forward-compatibility; updates are accepted
   * by the API (PATCH is permissive) but will not be persisted until the
   * backend model is extended.
   */
  status?: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
}

export interface SupplierParams {
  search?: string;
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

/** Uses PATCH for partial updates. */
export async function updateSupplier(id: string, supplier: Partial<Supplier>): Promise<Supplier> {
  const { data } = await client.patch(`/api/master_data/suppliers/${id}/`, supplier);
  return data;
}

// ─── Raw Materials ────────────────────────────────────────────────────────────

export interface RawMaterial {
  id: string;
  material_code: string;
  material_name: string;
  material_type: "ingredient" | "oil" | "spice" | "packaging" | "additive" | string;
  unit_of_measure: string;
  density: number | null;
  standard_cost: number | null;
  safety_stock: number | null;
  reorder_level: number | null;
  shelf_life_days: number | null;
  /**
   * Note: the backend RawMaterial model does not have a status column.
   * Field kept for UI compatibility; updates are accepted by PATCH but not persisted.
   */
  status?: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
}

export interface RawMaterialParams {
  search?: string;
  material_type?: string;
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

/** Uses PATCH for partial updates. */
export async function updateRawMaterial(id: string, material: Partial<RawMaterial>): Promise<RawMaterial> {
  const { data } = await client.patch(`/api/master_data/raw-materials/${id}/`, material);
  return data;
}

// ─── Warehouses ───────────────────────────────────────────────────────────────

export interface Warehouse {
  id: string;
  warehouse_name: string;
  warehouse_type: "Factory" | "Regional" | "City" | "Retail" | string;
  city: string;
  province: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  /** Backend stores and returns lowercase: "active" | "inactive" */
  status: "active" | "inactive";
  bin_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface WarehouseParams {
  search?: string;
  status?: string;
  warehouse_type?: string;
  city?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedWarehouses {
  count: number;
  next: string | null;
  previous: string | null;
  results: Warehouse[];
}

export async function getWarehouses(params?: WarehouseParams): Promise<PaginatedWarehouses> {
  const { data } = await client.get("/api/master_data/warehouses/", { params });
  return data;
}

export async function createWarehouse(warehouse: Omit<Warehouse, "id" | "bin_count">): Promise<Warehouse> {
  const { data } = await client.post("/api/master_data/warehouses/", warehouse);
  return data;
}

/** Uses PATCH for partial updates (e.g. status toggle). */
export async function updateWarehouse(id: string, warehouse: Partial<Warehouse>): Promise<Warehouse> {
  const { data } = await client.patch(`/api/master_data/warehouses/${id}/`, warehouse);
  return data;
}
