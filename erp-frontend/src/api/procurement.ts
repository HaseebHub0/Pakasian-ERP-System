import client from './client';

const unwrap = (res: any) => (res.data.results !== undefined ? res.data.results : res.data);

export const procurementAPI = {
  // ── Payment Terms ──────────────────────────────────────────────
  getPaymentTerms: async () => unwrap(await client.get('/api/procurement/payment-terms/')),
  createPaymentTerm: async (data: any) => (await client.post('/api/procurement/payment-terms/', data)).data,
  updatePaymentTerm: async (id: any, data: any) => (await client.patch(`/api/procurement/payment-terms/${id}/`, data)).data,
  deletePaymentTerm: async (id: any) => (await client.delete(`/api/procurement/payment-terms/${id}/`)).data,

  // ── Approval Workflows ────────────────────────────────────────
  getApprovalWorkflows: async () => unwrap(await client.get('/api/procurement/approval-workflows/')),
  createApprovalWorkflow: async (data: any) => (await client.post('/api/procurement/approval-workflows/', data)).data,

  // ── Supplier Materials ────────────────────────────────────────
  getSupplierMaterials: async () => unwrap(await client.get('/api/procurement/supplier-materials/')),
  createSupplierMaterial: async (data: any) => (await client.post('/api/procurement/supplier-materials/', data)).data,
  updateSupplierMaterial: async (id: any, data: any) => (await client.patch(`/api/procurement/supplier-materials/${id}/`, data)).data,
  deleteSupplierMaterial: async (id: any) => (await client.delete(`/api/procurement/supplier-materials/${id}/`)).data,

  // ── Supplier Price History ────────────────────────────────────
  getSupplierPriceHistory: async (params?: any) =>
    unwrap(await client.get('/api/procurement/supplier-price-history/', { params })),

  // ── Purchase Requisitions ─────────────────────────────────────
  getRequisitions: async () => unwrap(await client.get('/api/procurement/purchase-requisitions/')),
  getRequisition: async (id: any) => (await client.get(`/api/procurement/purchase-requisitions/${id}/`)).data,
  createRequisition: async (data: any) => (await client.post('/api/procurement/purchase-requisitions/', data)).data,
  updateRequisition: async (id: any, data: any) => (await client.patch(`/api/procurement/purchase-requisitions/${id}/`, data)).data,
  deleteRequisition: async (id: any) => (await client.delete(`/api/procurement/purchase-requisitions/${id}/`)).data,
  submitRequisition: async (id: any) => (await client.post(`/api/procurement/purchase-requisitions/${id}/submit/`)).data,
  approveRequisition: async (id: any) => (await client.post(`/api/procurement/purchase-requisitions/${id}/approve/`)).data,
  rejectRequisition: async (id: any) => (await client.post(`/api/procurement/purchase-requisitions/${id}/reject/`)).data,
  addRequisitionItem: async (id: any, data: any) =>
    (await client.post(`/api/procurement/purchase-requisitions/${id}/items/`, data)).data,
  convertRequisitionToPO: async (id: any, data: any) =>
    (await client.post(`/api/procurement/purchase-requisitions/${id}/convert-to-po/`, data)).data,

  // ── RFQs & Quotations ─────────────────────────────────────────
  getRFQs: async () => unwrap(await client.get('/api/procurement/rfqs/')),
  createRFQ: async (data: any) => (await client.post('/api/procurement/rfqs/', data)).data,
  getQuotations: async (params?: any) =>
    unwrap(await client.get('/api/procurement/quotations/', { params })),
  createQuotation: async (data: any) => (await client.post('/api/procurement/quotations/', data)).data,

  // ── Purchase Orders ───────────────────────────────────────────
  getPurchaseOrders: async () => unwrap(await client.get('/api/procurement/purchase-orders/')),
  getPurchaseOrder: async (id: any) => (await client.get(`/api/procurement/purchase-orders/${id}/`)).data,
  createPurchaseOrder: async (data: any) => (await client.post('/api/procurement/purchase-orders/', data)).data,
  updatePurchaseOrder: async (id: any, data: any) => (await client.patch(`/api/procurement/purchase-orders/${id}/`, data)).data,
  deletePurchaseOrder: async (id: any) => (await client.delete(`/api/procurement/purchase-orders/${id}/`)).data,
  approvePO: async (id: any) => (await client.post(`/api/procurement/purchase-orders/${id}/approve/`)).data,
  sendPOToSupplier: async (id: any) => (await client.post(`/api/procurement/purchase-orders/${id}/send_to_supplier/`)).data,

  // ── Goods Receipts (GRN) ──────────────────────────────────────
  getGRNs: async () => unwrap(await client.get('/api/procurement/goods-receipts/')),
  getGRN: async (id: any) => (await client.get(`/api/procurement/goods-receipts/${id}/`)).data,
  createGRN: async (data: any) => (await client.post('/api/procurement/goods-receipts/', data)).data,
  updateGRN: async (id: any, data: any) => (await client.patch(`/api/procurement/goods-receipts/${id}/`, data)).data,
  confirmGRN: async (id: any) => (await client.post(`/api/procurement/goods-receipts/${id}/confirm/`)).data,

  // ── Raw Material Batches ──────────────────────────────────────
  getRawMaterialBatches: async () => unwrap(await client.get('/api/procurement/raw-material-batches/')),
  createRawMaterialBatch: async (data: any) => (await client.post('/api/procurement/raw-material-batches/', data)).data,

  // ── QC Inspections ────────────────────────────────────────────
  getQCInspections: async () => unwrap(await client.get('/api/procurement/qc-inspections/')),
  createQCInspection: async (data: any) => (await client.post('/api/procurement/qc-inspections/', data)).data,
  updateQCInspection: async (id: any, data: any) => (await client.patch(`/api/procurement/qc-inspections/${id}/`, data)).data,

  // ── Purchase Returns ──────────────────────────────────────────
  getPurchaseReturns: async () => unwrap(await client.get('/api/procurement/purchase-returns/')),
  createPurchaseReturn: async (data: any) => (await client.post('/api/procurement/purchase-returns/', data)).data,

  // ── Accounts Payable ──────────────────────────────────────────
  getAccountsPayable: async () => unwrap(await client.get('/api/procurement/accounts-payable/')),
  createAccountsPayable: async (data: any) => (await client.post('/api/procurement/accounts-payable/', data)).data,
  markAPPaid: async (id: any) => (await client.post(`/api/procurement/accounts-payable/${id}/mark_paid/`)).data,

  // ── Reorder Rules ─────────────────────────────────────────────
  getReorderRules: async () => unwrap(await client.get('/api/procurement/reorder-rules/')),
  createReorderRule: async (data: any) => (await client.post('/api/procurement/reorder-rules/', data)).data,
  updateReorderRule: async (id: any, data: any) => (await client.patch(`/api/procurement/reorder-rules/${id}/`, data)).data,
  deleteReorderRule: async (id: any) => (await client.delete(`/api/procurement/reorder-rules/${id}/`)).data,
  checkReorder: async (id: any) => (await client.post(`/api/procurement/reorder-rules/${id}/check_reorder/`)).data,

  // ── Procurement Analytics ─────────────────────────────────────
  getProcurementAnalytics: async () => (await client.get('/api/procurement/analytics/')).data,
};
