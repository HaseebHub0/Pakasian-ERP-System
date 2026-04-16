import client from './client';

export const masterDataAPI = {
  // Products
  getProducts: async () => {
    const response = await client.get('/api/master_data/products/');
    return response.data.results !== undefined ? response.data.results : response.data;
  },
  createProduct: async (data: any) => {
    const response = await client.post('/api/master_data/products/', data);
    return response.data;
  },
  updateProduct: async (id: number | string, data: any) => {
    const response = await client.patch(`/api/master_data/products/${id}/`, data);
    return response.data;
  },
  deleteProduct: async (id: number | string) => {
    const response = await client.delete(`/api/master_data/products/${id}/`);
    return response.data;
  },

  // Raw Materials
  getRawMaterials: async () => {
    const response = await client.get('/api/master_data/raw-materials/');
    return response.data.results !== undefined ? response.data.results : response.data;
  },
  createRawMaterial: async (data: any) => {
    const response = await client.post('/api/master_data/raw-materials/', data);
    return response.data;
  },
  updateRawMaterial: async (id: number | string, data: any) => {
    const response = await client.patch(`/api/master_data/raw-materials/${id}/`, data);
    return response.data;
  },
  deleteRawMaterial: async (id: number | string) => {
    const response = await client.delete(`/api/master_data/raw-materials/${id}/`);
    return response.data;
  },

  // Suppliers
  getSuppliers: async () => {
    const response = await client.get('/api/master_data/suppliers/');
    return response.data.results !== undefined ? response.data.results : response.data;
  },
  createSupplier: async (data: any) => {
    const response = await client.post('/api/master_data/suppliers/', data);
    return response.data;
  },
  updateSupplier: async (id: number | string, data: any) => {
    const response = await client.patch(`/api/master_data/suppliers/${id}/`, data);
    return response.data;
  },
  deleteSupplier: async (id: number | string) => {
    const response = await client.delete(`/api/master_data/suppliers/${id}/`);
    return response.data;
  },
  
  // Warehouses
  getWarehouses: async () => {
    const response = await client.get('/api/master_data/warehouses/');
    return response.data.results !== undefined ? response.data.results : response.data;
  },
  createWarehouse: async (data: any) => {
    const response = await client.post('/api/master_data/warehouses/', data);
    return response.data;
  },
  updateWarehouse: async (id: number | string, data: any) => {
    const response = await client.patch(`/api/master_data/warehouses/${id}/`, data);
    return response.data;
  },
  deleteWarehouse: async (id: number | string) => {
    const response = await client.delete(`/api/master_data/warehouses/${id}/`);
    return response.data;
  },

  // Machines
  getMachines: async () => {
    const response = await client.get('/api/master_data/machines/');
    return response.data.results !== undefined ? response.data.results : response.data;
  },
  createMachine: async (data: any) => {
    const response = await client.post('/api/master_data/machines/', data);
    return response.data;
  },
  updateMachine: async (id: number | string, data: any) => {
    const response = await client.patch(`/api/master_data/machines/${id}/`, data);
    return response.data;
  },
  deleteMachine: async (id: number | string) => {
    const response = await client.delete(`/api/master_data/machines/${id}/`);
    return response.data;
  },
  
  // Product Categories
  getProductCategories: async () => {
    const response = await client.get('/api/master_data/product-categories/');
    return response.data.results !== undefined ? response.data.results : response.data;
  },
  createProductCategory: async (data: any) => {
    const response = await client.post('/api/master_data/product-categories/', data);
    return response.data;
  },

  // Production Lines
  getProductionLines: async () => {
    const response = await client.get('/api/master_data/production-lines/');
    return response.data.results !== undefined ? response.data.results : response.data;
  },
  createProductionLine: async (data: any) => {
    const response = await client.post('/api/master_data/production-lines/', data);
    return response.data;
  },
  updateProductionLine: async (id: number | string, data: any) => {
    const response = await client.patch(`/api/master_data/production-lines/${id}/`, data);
    return response.data;
  },
  deleteProductionLine: async (id: number | string) => {
    const response = await client.delete(`/api/master_data/production-lines/${id}/`);
    return response.data;
  }
};
