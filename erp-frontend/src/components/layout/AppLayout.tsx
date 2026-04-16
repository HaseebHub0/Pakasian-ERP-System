import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Database, 
  ShoppingCart, 
  Package, 
  Factory, 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Cpu, 
  Activity,
  LogOut,
  Menu,
  X,
  ChevronRight,
  User,
  Bell,
  Search,
  ShieldCheck,
  History
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/utils/cn';
import { motion, AnimatePresence } from 'motion/react';
import { hasPermission, Role } from '@/types/rbac';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', permission: 'dashboard' },
  { 
    label: 'Master Data', 
    icon: Database, 
    permission: 'master-data:*',
    children: [
      { label: 'Products', path: '/master-data/products', permission: 'master-data:products' },
      { label: 'Raw Materials', path: '/master-data/raw-materials', permission: 'master-data:raw-materials' },
      { label: 'Suppliers', path: '/master-data/suppliers', permission: 'master-data:suppliers' },
      { label: 'Warehouses', path: '/master-data/warehouses', permission: 'master-data:warehouses' },
      { label: 'Machines', path: '/master-data/machines', permission: 'master-data:machines' },
      { label: 'Customers', path: '/master-data/customers', permission: 'master-data:customers' },
    ]
  },
  { 
    label: 'Supply Chain', 
    icon: ShoppingCart,
    permission: 'procurement:*',
    children: [
      { label: 'Requisitions', path: '/procurement/requisitions', permission: 'procurement:requisitions' },
      { label: 'Purchase Orders', path: '/procurement/purchase-orders', permission: 'procurement:purchase-orders' },
      { label: 'GRN & QC', path: '/procurement/grn', permission: 'procurement:grn' },
      { label: 'Stock Summary', path: '/inventory/stock', permission: 'inventory:stock' },
      { label: 'Inventory Ledger', path: '/inventory/ledger', permission: 'inventory:ledger' },
      { label: 'Picking & Dispatch', path: '/warehouse/picking', permission: 'warehouse:picking' },
      { label: 'Route Optimization', path: '/warehouse/route-optimization', permission: 'warehouse:route-optimization' },
    ]
  },
  { 
    label: 'Manufacturing', 
    icon: Factory,
    permission: 'manufacturing:*',
    children: [
      { label: 'Production Orders', path: '/manufacturing/orders', permission: 'manufacturing:orders' },
      { label: 'Batch Execution', path: '/manufacturing/batches', permission: 'manufacturing:batches' },
      { label: 'Batch Trace', path: '/manufacturing/trace', permission: 'manufacturing:trace' },
      { label: 'Production Optimization', path: '/manufacturing/optimization', permission: 'manufacturing:optimization' },
      { label: 'MRP & Forecasting', path: '/mrp', permission: 'mrp' },
    ]
  },
  { 
    label: 'Sales & Marketing', 
    icon: TrendingUp,
    permission: 'sales:*',
    children: [
      { label: 'Sales Orders', path: '/sales/orders', permission: 'sales:orders' },
      { label: 'Delivery Dispatch', path: '/sales/dispatch', permission: 'sales:dispatch' },
      { label: 'Sales Returns', path: '/sales/returns', permission: 'sales:returns' },
      { label: 'Incentives & Promotions', path: '/sales/incentives', permission: 'sales:incentives' },
    ]
  },
  { 
    label: 'Finance', 
    icon: DollarSign,
    permission: 'finance:*',
    children: [
      { label: 'General Ledger', path: '/finance/journals', permission: 'finance:journals' },
      { label: 'Chart of Accounts', path: '/finance/coa', permission: 'finance:coa' },
      { label: 'Accounts Payable', path: '/finance/payables', permission: 'finance:payables' },
      { label: 'Accounts Receivable', path: '/finance/receivables', permission: 'finance:receivables' },
      { label: 'Batch Costing', path: '/costing/batch-cost', permission: 'costing:batch-cost' },
      { label: 'SKU Profitability', path: '/costing/profitability', permission: 'costing:profitability' },
      { label: 'Financial Reports', path: '/finance/pl-report', permission: 'finance:pl-report' },
    ]
  },
  { label: 'IoT Fryer Monitor', icon: Activity, path: '/sensors/fryer-monitor', permission: 'sensors:fryer-monitor' },
  { label: 'Approvals', icon: ShieldCheck, path: '/approvals', permission: 'dashboard' },
  { label: 'Audit Logs', icon: History, path: '/audit-logs', permission: 'admin' },
];

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({});
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const userRole = (user?.role || 'admin') as Role;

  const filteredNavItems = navItems.filter(item => {
    if (item.children) {
      const hasVisibleChildren = item.children.some(child => hasPermission(userRole, child.permission));
      return hasVisibleChildren;
    }
    return hasPermission(userRole, item.permission);
  });

  const toggleSection = (label: string) => {
    setOpenSections(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {!isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(true)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transition-all duration-300 ease-in-out border-r border-slate-800 shadow-2xl lg:shadow-none",
        !isSidebarOpen && "-translate-x-full lg:translate-x-0 lg:w-20"
      )}>
        <div className="h-20 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
              <Factory size={22} className="text-white" />
            </div>
            {isSidebarOpen && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-lg font-bold tracking-tight whitespace-nowrap"
              >
                Pakistani Foods
              </motion.span>
            )}
          </div>
        </div>
        
        <nav className="p-4 space-y-1.5 overflow-y-auto h-[calc(100vh-5rem)] scrollbar-hide">
          {filteredNavItems.map((item, idx) => (
            <div key={idx} className="space-y-1">
              {item.children ? (
                <div className="py-1">
                  <button 
                    onClick={() => toggleSection(item.label)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                      openSections[item.label] ? "bg-white/5 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <div className="flex items-center">
                      <item.icon size={20} className={cn("mr-3 shrink-0", openSections[item.label] ? "text-blue-400" : "text-slate-500")} />
                      {isSidebarOpen && <span>{item.label}</span>}
                    </div>
                    {isSidebarOpen && (
                      <ChevronRight 
                        size={16} 
                        className={cn("transition-transform duration-200 text-slate-600", openSections[item.label] && "rotate-90 text-blue-400")} 
                      />
                    )}
                  </button>
                  <AnimatePresence>
                    {openSections[item.label] && isSidebarOpen && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="ml-11 mt-1 space-y-1 overflow-hidden"
                      >
                        {item.children
                          .filter(child => hasPermission(userRole, child.permission))
                          .map((child, cIdx) => (
                          <NavLink
                            key={cIdx}
                            to={child.path}
                            className={({ isActive }) => cn(
                              "flex items-center px-4 py-2 text-xs font-medium rounded-lg transition-all duration-200",
                              isActive ? "bg-blue-600/10 text-blue-400" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                            )}
                          >
                            {child.label}
                          </NavLink>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <NavLink
                  to={item.path!}
                  className={({ isActive }) => cn(
                    "flex items-center px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                    isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={20} className={cn("mr-3 shrink-0", isActive ? "text-white" : "text-slate-500")} />
                      {isSidebarOpen && <span>{item.label}</span>}
                    </>
                  )}
                </NavLink>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        isSidebarOpen ? "lg:ml-72" : "lg:ml-20"
      )}>
        {/* Topbar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-500 transition-all active:scale-95"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            <div className="hidden md:flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200/60 w-80 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/40 transition-all">
              <Search size={18} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="bg-transparent border-none outline-none text-sm w-full text-slate-600 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl relative transition-all active:scale-95">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-white" />
            </button>

            <div className="flex items-center gap-4 pl-6 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">{user?.name || 'Muhammad Haseeb'}</p>
                <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">{user?.role || 'Administrator'}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm">
                <User size={22} />
              </div>
              <button 
                onClick={handleLogout}
                className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-95"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        <main className="p-8 max-w-[1600px] mx-auto w-full">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
