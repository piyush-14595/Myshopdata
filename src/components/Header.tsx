import React from 'react';
import { StoreSettings } from '../types';
import { 
  Sprout, ShoppingCart, Users, Receipt, AlertTriangle, 
  BellRing, Package, Settings, LayoutDashboard, Menu, X
} from 'lucide-react';

interface Props {
  activeView: 'dashboard' | 'billing' | 'invoices' | 'farmers' | 'notifications' | 'inventory' | 'lowstock';
  onNavigate: (view: 'dashboard' | 'billing' | 'invoices' | 'farmers' | 'notifications' | 'inventory' | 'lowstock') => void;
  settings: StoreSettings;
  onOpenSettings: () => void;
  overdueCount: number;
  lowStockCount: number;
}

export const Header: React.FC<Props> = ({
  activeView,
  onNavigate,
  settings,
  onOpenSettings,
  overdueCount,
  lowStockCount
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'billing', label: 'Fast Billing', icon: ShoppingCart, highlight: true },
    { id: 'invoices', label: 'Invoices', icon: Receipt },
    { id: 'farmers', label: 'Farmer Khata', icon: Users },
    { 
      id: 'notifications', 
      label: 'Payment Reminders', 
      icon: BellRing, 
      badge: overdueCount > 0 ? overdueCount : undefined, 
      badgeColor: 'bg-rose-600 text-white' 
    },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { 
      id: 'lowstock', 
      label: 'Low Stock Radar', 
      icon: AlertTriangle, 
      badge: lowStockCount > 0 ? lowStockCount : undefined, 
      badgeColor: 'bg-amber-600 text-white' 
    },
  ];

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Store Branding */}
          <div 
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm group-hover:bg-emerald-500 transition">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-2">
                <span>{settings.storeName}</span>
              </div>
              <p className="text-[10px] text-emerald-400 font-medium hidden sm:block">
                {settings.storeHindiName ? `${settings.storeHindiName} • ` : ''}Krushi Sewa Kendra Suite
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition relative ${
                    isActive 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : item.highlight 
                      ? 'bg-emerald-950/80 text-emerald-300 hover:bg-emerald-900 border border-emerald-600/40' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
              title="Store Settings & Customize Invoices"
            >
              <Settings className="w-4 h-4 text-slate-300" />
              <span className="hidden sm:inline text-xs font-medium">Settings</span>
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950 border-b border-slate-800 px-4 py-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id as any);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold ${
                  isActive ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
