import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { 
  LayoutDashboard, Database, ShoppingCart, Package, Factory, 
  DollarSign, TrendingUp, BookOpen, Clock, Activity 
} from 'lucide-react';

interface NavSection {
  title: string;
  icon: React.ReactNode;
  moduleKey: string;
  links: { name: string; path: string; action?: string }[];
}

const navConfig: NavSection[] = [
  {
    title: 'Dashboard',
    icon: <LayoutDashboard size={20} />,
    moduleKey: 'dashboard',
    links: [{ name: 'Overview', path: '/dashboard' }]
  },
  {
    title: 'Master Data',
    icon: <Database size={20} />,
    moduleKey: 'master_data',
    links: [
      { name: 'Products', path: '/master-data/products' },
      { name: 'Suppliers', path: '/master-data/suppliers' },
      { name: 'Warehouses', path: '/master-data/warehouses' },
      { name: 'Raw Materials', path: '/master-data/raw-materials' }
    ]
  },
  {
    title: 'Procurement',
    icon: <ShoppingCart size={20} />,
    moduleKey: 'procurement',
    links: [
      { name: 'Requisitions', path: '/procurement/requisitions' },
      { name: 'Purchase Orders', path: '/procurement/purchase-orders' },
      { name: 'GRN', path: '/procurement/grn' },
      { name: 'QC Inspection', path: '/procurement/qc' }
    ]
  },
  {
    title: 'Inventory',
    icon: <Package size={20} />,
    moduleKey: 'inventory',
    links: [
      { name: 'Ledger', path: '/inventory/ledger' },
      { name: 'Stock Summary', path: '/inventory/stock' },
      { name: 'Batches', path: '/inventory/batches' }
    ]
  },
  {
    title: 'Manufacturing',
    icon: <Factory size={20} />,
    moduleKey: 'manufacturing',
    links: [
      { name: 'Production Orders', path: '/manufacturing/orders' },
      { name: 'Batch Execution', path: '/manufacturing/execution' },
      { name: 'Batch Traceability', path: '/manufacturing/trace' }
    ]
  },
  {
    title: 'Costing',
    icon: <DollarSign size={20} />,
    moduleKey: 'costing',
    links: [
      { name: 'Batch Cost', path: '/costing/batch' },
      { name: 'SKU Profitability', path: '/costing/profitability' }
    ]
  },
  {
    title: 'Sales',
    icon: <TrendingUp size={20} />,
    moduleKey: 'sales',
    links: [
      { name: 'Sales Orders', path: '/sales/orders' },
      { name: 'Dispatch', path: '/sales/dispatch' },
      { name: 'Returns', path: '/sales/returns' }
    ]
  },
  {
    title: 'Finance',
    icon: <BookOpen size={20} />,
    moduleKey: 'finance',
    links: [
      { name: 'Journal Entries', path: '/finance/journals' },
      { name: 'P&L Report', path: '/finance/pl' },
      { name: 'Balance Sheet', path: '/finance/balance-sheet' }
    ]
  },
  {
    title: 'MRP',
    icon: <Clock size={20} />,
    moduleKey: 'mrp',
    links: [
      { name: 'Forecast', path: '/mrp/forecast' },
      { name: 'MRP Plans', path: '/mrp/plans' }
    ]
  },
  {
    title: 'Sensors',
    icon: <Activity size={20} />,
    moduleKey: 'sensors',
    links: [
      { name: 'Fryer Monitor', path: '/sensors/fryers' }
    ]
  }
];

export default function Sidebar() {
  const { hasPermission } = useAuthStore();

  return (
    <aside className="w-[240px] bg-white border-r h-full flex flex-col shadow-sm shrink-0">
      <div className="p-5 border-b h-16 flex items-center shrink-0">
        <div className="w-8 h-8 bg-indigo-600 rounded mr-3 flex items-center justify-center text-white font-bold">P</div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Pakasian <span className="text-indigo-600 font-medium">ERP</span></h1>
      </div>
      
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navConfig.map((section) => {
          // Temporarily bypass permission check for dashboard
          if (section.moduleKey !== 'dashboard' && !hasPermission(section.moduleKey)) return null;

          return (
            <div key={section.title} className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-2">
                {section.icon}
                {section.title}
              </h3>
              
              <div className="space-y-1">
                {section.links.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) =>
                      `block px-3 py-2 pl-9 text-sm rounded-md transition-colors duration-150 ${
                        isActive 
                        ? 'bg-indigo-50 text-indigo-700 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`
                    }
                  >
                    {link.name}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
