import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ProductsPage } from './pages/master-data/Products';
import { RawMaterialsPage } from './pages/master-data/RawMaterials';
import { SuppliersPage } from './pages/master-data/Suppliers';
import { WarehousesPage } from './pages/master-data/Warehouses';
import { MachinesPage } from './pages/master-data/Machines';
import { PackagingMaterialsPage } from './pages/master-data/PackagingMaterials';
import { CustomersPage } from './pages/master-data/Customers';
import { RequisitionsPage } from './pages/procurement/Requisitions';
import { ReorderRulesPage } from './pages/procurement/ReorderRules';
import { PurchaseOrdersPage } from './pages/procurement/PurchaseOrders';
import { GRNPage } from './pages/procurement/GRN';
import { QCInspectionPage } from './pages/procurement/QC';
import { AccountsPayablePage as ProcurementAPPage } from './pages/procurement/AccountsPayable';
import { RFQPage } from './pages/procurement/RFQ';
import { PurchaseReturnsPage } from './pages/procurement/PurchaseReturns';
import { RawMaterialBatchesPage } from './pages/procurement/RawMaterialBatches';
import { SupplierMaterialsPage } from './pages/procurement/SupplierMaterials';
import { ProcurementAnalyticsPage } from './pages/procurement/ProcurementAnalytics';
import { StockSummaryPage } from './pages/inventory/StockSummary';
import { InventoryLedgerPage } from './pages/inventory/InventoryLedger';
import { PickingListsPage } from './pages/warehouse/PickingLists';
import { DispatchOrdersPage } from './pages/warehouse/DispatchOrders';
import { StockTransfersPage } from './pages/warehouse/StockTransfers';
import { RouteOptimizationPage } from './pages/warehouse/RouteOptimization';
import { ProductionOrdersPage } from './pages/manufacturing/ProductionOrders';
import { BatchExecutionPage } from './pages/manufacturing/BatchExecution';
import { BatchTracePage } from './pages/manufacturing/BatchTrace';
import { ProductionOptimizationPage } from './pages/manufacturing/ProductionOptimization';
import { BatchCostPage } from './pages/costing/BatchCost';
import { SKUProfitabilityPage } from './pages/costing/SKUProfitability';
import { SalesOrdersPage } from './pages/sales/SalesOrders';
import { DispatchPage } from './pages/sales/Dispatch';
import { ReturnsPage } from './pages/sales/Returns';
import { IncentivesPage } from './pages/sales/Incentives';
import { JournalsPage } from './pages/finance/Journals';
import { ChartOfAccountsPage } from './pages/finance/ChartOfAccounts';
import { AccountsPayablePage } from './pages/finance/AccountsPayable';
import { AccountsReceivablePage } from './pages/finance/AccountsReceivable';
import { ProcessCostingPage } from './pages/finance/ProcessCosting';
import { PLReportPage } from './pages/finance/PLReport';
import { BalanceSheetPage } from './pages/finance/BalanceSheet';
import { MRPPage } from './pages/MRP';
import { FryerMonitorPage } from './pages/FryerMonitor';
import { ApprovalsPage } from './pages/Approvals';
import { AuditLogsPage } from './pages/AuditLogs';
import { AppLayout } from './components/layout/AppLayout';
import { useAuthStore } from './store/useAuthStore';
import { hasPermission, Role } from './types/rbac';
import { UnauthorizedPage } from './pages/Unauthorized';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const ProtectedRoute = ({ children, permission }: { children: React.ReactNode, permission?: string }) => {
  const { token, user } = useAuthStore();
  
  if (!token) return <Navigate to="/login" replace />;
  
  if (permission && !hasPermission((user?.role || 'admin') as Role, permission)) {
    return <UnauthorizedPage />;
  }
  
  return <AppLayout>{children}</AppLayout>;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute permission="dashboard">
              <DashboardPage />
            </ProtectedRoute>
          } />

          <Route path="/master-data/products" element={
            <ProtectedRoute permission="master-data:products">
              <ProductsPage />
            </ProtectedRoute>
          } />

          <Route path="/master-data/raw-materials" element={
            <ProtectedRoute permission="master-data:raw-materials">
              <RawMaterialsPage />
            </ProtectedRoute>
          } />

          <Route path="/master-data/suppliers" element={
            <ProtectedRoute permission="master-data:suppliers">
              <SuppliersPage />
            </ProtectedRoute>
          } />

          <Route path="/master-data/warehouses" element={
            <ProtectedRoute permission="master-data:warehouses">
              <WarehousesPage />
            </ProtectedRoute>
          } />

          <Route path="/master-data/machines" element={
            <ProtectedRoute permission="master-data:machines">
              <MachinesPage />
            </ProtectedRoute>
          } />

          <Route path="/master-data/packaging-materials" element={
            <ProtectedRoute permission="master-data:packaging-materials">
              <PackagingMaterialsPage />
            </ProtectedRoute>
          } />

          <Route path="/master-data/customers" element={
            <ProtectedRoute permission="master-data:customers">
              <CustomersPage />
            </ProtectedRoute>
          } />

          <Route path="/procurement/requisitions" element={
            <ProtectedRoute permission="procurement:requisitions">
              <RequisitionsPage />
            </ProtectedRoute>
          } />

          <Route path="/procurement/reorder-rules" element={
            <ProtectedRoute permission="procurement:reorder-rules">
              <ReorderRulesPage />
            </ProtectedRoute>
          } />

          <Route path="/procurement/rfqs" element={
            <ProtectedRoute permission="procurement:rfqs">
              <RFQPage />
            </ProtectedRoute>
          } />

          <Route path="/procurement/purchase-orders" element={
            <ProtectedRoute permission="procurement:purchase-orders">
              <PurchaseOrdersPage />
            </ProtectedRoute>
          } />

          <Route path="/procurement/grn" element={
            <ProtectedRoute permission="procurement:grn">
              <GRNPage />
            </ProtectedRoute>
          } />

          <Route path="/procurement/qc" element={
            <ProtectedRoute permission="procurement:qc">
              <QCInspectionPage />
            </ProtectedRoute>
          } />

          <Route path="/procurement/accounts-payable" element={
            <ProtectedRoute permission="procurement:*">
              <ProcurementAPPage />
            </ProtectedRoute>
          } />

          <Route path="/procurement/purchase-returns" element={
            <ProtectedRoute permission="procurement:*">
              <PurchaseReturnsPage />
            </ProtectedRoute>
          } />

          <Route path="/procurement/raw-material-batches" element={
            <ProtectedRoute permission="procurement:*">
              <RawMaterialBatchesPage />
            </ProtectedRoute>
          } />

          <Route path="/procurement/supplier-materials" element={
            <ProtectedRoute permission="procurement:*">
              <SupplierMaterialsPage />
            </ProtectedRoute>
          } />

          <Route path="/procurement/analytics" element={
            <ProtectedRoute permission="procurement:*">
              <ProcurementAnalyticsPage />
            </ProtectedRoute>
          } />

          <Route path="/inventory/stock" element={
            <ProtectedRoute permission="inventory:stock">
              <StockSummaryPage />
            </ProtectedRoute>
          } />

          <Route path="/inventory/ledger" element={
            <ProtectedRoute permission="inventory:ledger">
              <InventoryLedgerPage />
            </ProtectedRoute>
          } />

          <Route path="/warehouse/picking" element={
            <ProtectedRoute permission="warehouse:picking">
              <PickingListsPage />
            </ProtectedRoute>
          } />

          <Route path="/warehouse/dispatch" element={
            <ProtectedRoute permission="warehouse:dispatch">
              <DispatchOrdersPage />
            </ProtectedRoute>
          } />

          <Route path="/warehouse/transfers" element={
            <ProtectedRoute permission="warehouse:transfers">
              <StockTransfersPage />
            </ProtectedRoute>
          } />

          <Route path="/warehouse/route-optimization" element={
            <ProtectedRoute permission="warehouse:route-optimization">
              <RouteOptimizationPage />
            </ProtectedRoute>
          } />

          <Route path="/manufacturing/orders" element={
            <ProtectedRoute permission="manufacturing:orders">
              <ProductionOrdersPage />
            </ProtectedRoute>
          } />

          <Route path="/manufacturing/batches" element={
            <ProtectedRoute permission="manufacturing:batches">
              <BatchExecutionPage />
            </ProtectedRoute>
          } />

          <Route path="/manufacturing/trace" element={
            <ProtectedRoute permission="manufacturing:trace">
              <BatchTracePage />
            </ProtectedRoute>
          } />

          <Route path="/manufacturing/optimization" element={
            <ProtectedRoute permission="manufacturing:optimization">
              <ProductionOptimizationPage />
            </ProtectedRoute>
          } />

          <Route path="/costing/batch-cost" element={
            <ProtectedRoute permission="costing:batch-cost">
              <BatchCostPage />
            </ProtectedRoute>
          } />

          <Route path="/costing/profitability" element={
            <ProtectedRoute permission="costing:profitability">
              <SKUProfitabilityPage />
            </ProtectedRoute>
          } />

          <Route path="/sales/orders" element={
            <ProtectedRoute permission="sales:orders">
              <SalesOrdersPage />
            </ProtectedRoute>
          } />

          <Route path="/sales/dispatch" element={
            <ProtectedRoute permission="sales:dispatch">
              <DispatchPage />
            </ProtectedRoute>
          } />

          <Route path="/sales/incentives" element={
            <ProtectedRoute permission="sales:incentives">
              <IncentivesPage />
            </ProtectedRoute>
          } />

          <Route path="/sales/returns" element={
            <ProtectedRoute permission="sales:returns">
              <ReturnsPage />
            </ProtectedRoute>
          } />

          <Route path="/finance/journals" element={
            <ProtectedRoute permission="finance:journals">
              <JournalsPage />
            </ProtectedRoute>
          } />

          <Route path="/finance/coa" element={
            <ProtectedRoute permission="finance:coa">
              <ChartOfAccountsPage />
            </ProtectedRoute>
          } />

          <Route path="/finance/payables" element={
            <ProtectedRoute permission="finance:payables">
              <AccountsPayablePage />
            </ProtectedRoute>
          } />

          <Route path="/finance/receivables" element={
            <ProtectedRoute permission="finance:receivables">
              <AccountsReceivablePage />
            </ProtectedRoute>
          } />

          <Route path="/finance/costing" element={
            <ProtectedRoute permission="finance:costing">
              <ProcessCostingPage />
            </ProtectedRoute>
          } />

          <Route path="/finance/pl-report" element={
            <ProtectedRoute permission="finance:pl-report">
              <PLReportPage />
            </ProtectedRoute>
          } />

          <Route path="/finance/balance-sheet" element={
            <ProtectedRoute permission="finance:balance-sheet">
              <BalanceSheetPage />
            </ProtectedRoute>
          } />

          <Route path="/mrp" element={
            <ProtectedRoute permission="mrp">
              <MRPPage />
            </ProtectedRoute>
          } />

          <Route path="/sensors/fryer-monitor" element={
            <ProtectedRoute permission="sensors:fryer-monitor">
              <FryerMonitorPage />
            </ProtectedRoute>
          } />

          <Route path="/approvals" element={
            <ProtectedRoute>
              <ApprovalsPage />
            </ProtectedRoute>
          } />

          <Route path="/audit-logs" element={
            <ProtectedRoute permission="admin">
              <AuditLogsPage />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<div className="p-8 text-center">Page Not Found</div>} />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
