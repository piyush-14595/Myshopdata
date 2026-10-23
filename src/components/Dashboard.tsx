import React from 'react';
import { Product, Farmer, Invoice, StoreSettings } from '../types';
import { formatCurrency, formatDate, getDaysDiff } from '../utils/formatters';
import { 
  ShoppingCart, AlertTriangle, Users, Receipt, ArrowUpRight, 
  Clock, IndianRupee, BellRing, Package, Sparkles, Plus, Eye, Share2, CheckCircle2
} from 'lucide-react';

interface Props {
  products: Product[];
  farmers: Farmer[];
  invoices: Invoice[];
  settings: StoreSettings;
  onNavigate: (view: 'dashboard' | 'billing' | 'invoices' | 'farmers' | 'notifications' | 'inventory' | 'lowstock') => void;
  onViewInvoice: (invoice: Invoice) => void;
  onRecordPaymentClick: (invoice: Invoice) => void;
}

export const Dashboard: React.FC<Props> = ({
  products,
  farmers,
  invoices,
  settings,
  onNavigate,
  onViewInvoice,
  onRecordPaymentClick
}) => {
  // Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todayInvoices = invoices.filter(i => i.invoiceDate === todayStr);
  const todaySales = todayInvoices.reduce((sum, i) => sum + i.grandTotal, 0);

  const totalOutstanding = farmers.reduce((sum, f) => sum + f.outstandingBalance, 0);
  const overdueInvoices = invoices.filter(i => i.balanceDue > 0 && getDaysDiff(i.dueDate) > 0);
  const totalOverdueAmount = overdueInvoices.reduce((sum, i) => sum + i.balanceDue, 0);

  const lowStockItems = products.filter(p => p.currentStock <= p.minStockAlert);
  const outOfStockItems = lowStockItems.filter(p => p.currentStock <= 0);

  // Recent 5 invoices
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime())
    .slice(0, 5);

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-[calc(100vh-80px)] text-slate-800 space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
          <Package className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-emerald-900/50 backdrop-blur-xs border border-emerald-500/30 text-emerald-200 text-xs px-2.5 py-1 rounded-full mb-3 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            Krushi Sewa Kendra Billing & Smart Khata System
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {settings.storeHindiName ? `${settings.storeHindiName} (${settings.storeName})` : settings.storeName}
          </h1>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1">
            {settings.tagline} • Prop: {settings.ownerName} ({settings.phone})
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate('billing')}
              className="flex items-center gap-2 bg-white text-emerald-900 hover:bg-emerald-50 px-4 py-2.5 rounded-xl font-bold text-xs transition shadow-sm cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4 text-emerald-700" />
              New Fast Bill (नवीन बिल बनवा)
            </button>

            <button
              onClick={() => onNavigate('farmers')}
              className="flex items-center gap-2 bg-emerald-900/70 hover:bg-emerald-900 text-white border border-emerald-600/50 px-4 py-2.5 rounded-xl font-semibold text-xs transition"
            >
              <Users className="w-4 h-4 text-emerald-300" />
              Farmer Khata Ledger (खातेवही)
            </button>

            {overdueInvoices.length > 0 && (
              <button
                onClick={() => onNavigate('notifications')}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-sm animate-pulse"
              >
                <BellRing className="w-4 h-4" />
                {overdueInvoices.length} Overdue Reminders (उधारी स्मरण)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div 
          onClick={() => onNavigate('invoices')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-500 transition cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Today's Sales</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">{formatCurrency(todaySales)}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>{todayInvoices.length} bills today</span>
            <span>•</span>
            <span className="text-emerald-700 font-medium">Click to view all</span>
          </div>
        </div>

        {/* Total Outstanding Udhaar */}
        <div 
          onClick={() => onNavigate('farmers')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-500 transition cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Outstanding (उधारी)</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-900 mt-2">{formatCurrency(totalOutstanding)}</div>
          <div className="text-[11px] text-amber-700 mt-1 flex items-center gap-1">
            <span>Across {farmers.filter(f => f.outstandingBalance > 0).length} farmers</span>
            <span>•</span>
            <span className="font-semibold underline">Farmer Khata</span>
          </div>
        </div>

        {/* Overdue Debt */}
        <div 
          onClick={() => onNavigate('notifications')}
          className={`p-4 rounded-xl border shadow-xs transition cursor-pointer ${
            overdueInvoices.length > 0 
              ? 'bg-rose-50/70 border-rose-300 hover:bg-rose-50' 
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Past Due Invoices</span>
            <div className="p-2 rounded-lg bg-rose-100 text-rose-800">
              <BellRing className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-900 mt-2">{formatCurrency(totalOverdueAmount)}</div>
          <div className="text-[11px] text-rose-700 mt-1 flex items-center justify-between">
            <span>{overdueInvoices.length} Bills Overdue</span>
            <span className="font-bold underline">Send Reminders →</span>
          </div>
        </div>

        {/* Low-Stock Alert Radar */}
        <div 
          onClick={() => onNavigate('lowstock')}
          className={`p-4 rounded-xl border shadow-xs transition cursor-pointer ${
            lowStockItems.length > 0 
              ? 'bg-amber-50/70 border-amber-300 hover:bg-amber-50' 
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Low Stock Radar</span>
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-900 mt-2">{lowStockItems.length} Products</div>
          <div className="text-[11px] text-amber-700 mt-1 flex items-center justify-between">
            <span>{outOfStockItems.length} Zero Stock</span>
            <span className="font-bold underline">Reorder Sheet →</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Invoices & Low Stock Radar */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left: Recent Invoices (7 cols) */}
        <div className="col-span-12 lg:col-span-7 bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              Recent Invoices (नुकतीच झालेली बिले)
            </h2>
            <button
              onClick={() => onNavigate('invoices')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold underline"
            >
              View All ({invoices.length})
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {recentInvoices.map(inv => (
              <div key={inv.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-slate-900">{inv.invoiceNumber}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                      inv.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {inv.paymentStatus}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    <strong>{inv.farmerName}</strong> ({inv.farmerVillage}) • {formatDate(inv.invoiceDate)}
                  </div>
                </div>

                <div className="text-right flex items-center gap-3">
                  <div>
                    <div className="font-mono font-bold text-slate-900">{formatCurrency(inv.grandTotal)}</div>
                    {inv.balanceDue > 0 && (
                      <div className="text-[10px] text-amber-800 font-semibold">
                        Due: {formatCurrency(inv.balanceDue)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onViewInvoice(inv)}
                      className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition"
                      title="View / Print Bill"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Urgent Low Stock Alert Items (5 cols) */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Low Stock Warnings (कमी साठा इशारा)
            </h2>
            <button
              onClick={() => onNavigate('lowstock')}
              className="text-xs text-amber-800 hover:text-amber-900 font-semibold underline"
            >
              Order List ({lowStockItems.length})
            </button>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              All inventory levels are currently sufficient.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {lowStockItems.slice(0, 5).map(prod => {
                const isZero = prod.currentStock <= 0;
                return (
                  <div key={prod.id} className="p-3 flex justify-between items-center hover:bg-slate-50 transition">
                    <div>
                      <div className="font-bold text-slate-900">{prod.name}</div>
                      <div className="text-[10px] text-slate-500">{prod.brand} • {prod.category}</div>
                    </div>

                    <div className="text-right">
                      <div className={`font-mono font-bold ${isZero ? 'text-rose-700' : 'text-amber-800'}`}>
                        {prod.currentStock} {prod.unit}
                      </div>
                      <div className="text-[10px] text-slate-400">Min Alert: {prod.minStockAlert}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
            <button
              onClick={() => onNavigate('lowstock')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline"
            >
              Generate Complete Restock Purchase Order →
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
