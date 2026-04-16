import client from './client';

export const procurementAPI = {
  // Requisitions
  getRequisitions: async () => {
    const response = await client.get('/api/procurement/purchase-requests/');
    return response.data;
  },
  createRequisition: async (data: any) => {
    const response = await client.post('/api/procurement/purchase-requests/', data);
    return response.data;
  },
  updateRequisition: async (id: number | string, data: any) => {
    const response = await client.patch(`/api/procurement/purchase-requests/${id}/`, data);
    return response.data;
  },
  
  // Purchase Orders
  getPurchaseOrders: async () => {
    const response = await client.get('/api/procurement/purchase-orders/');
    return response.data;
  },
  createPurchaseOrder: async (data: any) => {
    const response = await client.post('/api/procurement/purchase-orders/', data);
    return response.data;
  },
  updatePurchaseOrder: async (id: number | string, data: any) => {
    const response = await client.patch(`/api/procurement/purchase-orders/${id}/`, data);
    return response.data;
  },

  // GRN
  getGRNs: async () => {
    const response = await client.get('/api/procurement/grns/');
    return response.data;
  },
  createGRN: async (data: any) => {
    const response = await client.post('/api/procurement/grns/', data);
    return response.data;
  },
  updateGRN: async (id: number | string, data: any) => {
    const response = await client.patch(`/api/procurement/grns/${id}/`, data);
    return response.data;
  },

  // QC Inspections
  getQCInspections: async () => {
    const response = await client.get('/api/procurement/qc-inspections/');
    return response.data;
  },
  createQCInspection: async (data: any) => {
    const response = await client.post('/api/procurement/qc-inspections/', data);
    return response.data;
  },
  updateQCInspection: async (id: number | string, data: any) => {
    const response = await client.patch(`/api/procurement/qc-inspections/${id}/`, data);
    return response.data;
  }
};
