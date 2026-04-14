import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Auth
import LoginPage from './pages/auth/LoginPage';

// Dashboard
import DashboardPage from './pages/dashboard/DashboardPage';

// Master Data
import ProductsPage from './pages/master-data/ProductsPage';
import SuppliersPage from './pages/master-data/SuppliersPage';
import WarehousesPage from './pages/master-data/WarehousesPage';
import RawMaterialsPage from './pages/master-data/RawMaterialsPage';

// Procurement
import RequisitionsPage from './pages/procurement/RequisitionsPage';
import PurchaseOrdersPage from './pages/procurement/PurchaseOrdersPage';
import GRNPage from './pages/procurement/GRNPage';
import QCInspectionPage from './pages/procurement/QCInspectionPage';

// Inventory
import LedgerPage from './pages/inventory/LedgerPage';
import StockSummaryPage from './pages/inventory/StockSummaryPage';
import BatchesPage from './pages/inventory/BatchesPage';

// Manufacturing
import ProductionOrdersPage from './pages/manufacturing/ProductionOrdersPage';
import BatchExecutionPage from './pages/manufacturing/BatchExecutionPage';
import BatchTracePage from './pages/manufacturing/BatchTracePage';

// Costing
import BatchCostPage from './pages/costing/BatchCostPage';
import SKUProfitabilityPage from './pages/costing/SKUProfitabilityPage';

// Sales
import SalesOrdersPage from './pages/sales/SalesOrdersPage';
import DispatchPage from './pages/sales/DispatchPage';
import ReturnsPage from './pages/sales/ReturnsPage';

// Finance
import JournalEntriesPage from './pages/finance/JournalEntriesPage';
import PLReportPage from './pages/finance/PLReportPage';
import BalanceSheetPage from './pages/finance/BalanceSheetPage';

// MRP
import ForecastPage from './pages/mrp/ForecastPage';
import MRPPlansPage from './pages/mrp/MRPPlansPage';

// Sensors
import FryerMonitorPage from './pages/sensors/FryerMonitorPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Base redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Protected Routes Wrapper */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="dashboard" element={<DashboardPage />} />
            
            <Route path="master-data">
              <Route path="products" element={<ProductsPage />} />
              <Route path="suppliers" element={<SuppliersPage />} />
              <Route path="warehouses" element={<WarehousesPage />} />
              <Route path="raw-materials" element={<RawMaterialsPage />} />
            </Route>
            
            <Route path="procurement">
              <Route path="requisitions" element={<RequisitionsPage />} />
              <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
              <Route path="grn" element={<GRNPage />} />
              <Route path="qc" element={<QCInspectionPage />} />
            </Route>

            <Route path="inventory">
              <Route path="ledger" element={<LedgerPage />} />
              <Route path="stock" element={<StockSummaryPage />} />
              <Route path="batches" element={<BatchesPage />} />
            </Route>

            <Route path="manufacturing">
              <Route path="orders" element={<ProductionOrdersPage />} />
              <Route path="execution" element={<BatchExecutionPage />} />
              <Route path="trace" element={<BatchTracePage />} />
            </Route>

            <Route path="costing">
              <Route path="batch" element={<BatchCostPage />} />
              <Route path="profitability" element={<SKUProfitabilityPage />} />
            </Route>

            <Route path="sales">
              <Route path="orders" element={<SalesOrdersPage />} />
              <Route path="dispatch" element={<DispatchPage />} />
              <Route path="returns" element={<ReturnsPage />} />
            </Route>

            <Route path="finance">
              <Route path="journals" element={<JournalEntriesPage />} />
              <Route path="pl" element={<PLReportPage />} />
              <Route path="balance-sheet" element={<BalanceSheetPage />} />
            </Route>

            <Route path="mrp">
              <Route path="forecast" element={<ForecastPage />} />
              <Route path="plans" element={<MRPPlansPage />} />
            </Route>

            <Route path="sensors">
              <Route path="fryers" element={<FryerMonitorPage />} />
            </Route>
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
