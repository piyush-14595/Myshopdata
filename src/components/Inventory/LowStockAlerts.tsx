import React, { useState } from 'react';
import { Product, StoreSettings } from '../../types';
import { formatCurrency, formatDate, getDaysDiff } from '../../utils/formatters';
import { 
  AlertTriangle, AlertCircle, ShoppingCart, Printer, Share2, 
  Check, ArrowRight, ShieldAlert, Sparkles, RefreshCw, Clock
} from 'lucide-react';

interface Props {
  products: Product[];
  settings: StoreSettings;
  onAdjustStock: (productId: string, delta: number, reason: string) => void;
}

export const LowStockAlerts: React.FC<Props> = ({
  products,
  settings,
  onAdjustStock
}) => {
  const [distributorPhone, setDistributorPhone] = useState<string>('9822000000');
  const [copied, setCopied] = useState<boolean>(false);

  // Low stock products
  const lowStockItems = products.filter(p => p.currentStock <= p.minStockAlert);
  const outOfStockItems = lowStockItems.filter(p => p.currentStock <= 0);

  // Expiring soon products (within 90 days)
  const expiringSoonItems = products.filter(p => {
    if (!p.expiryDate) return false;
    const daysUntilExpiry = -getDaysDiff(p.expiryDate); // negative of diff from now
    return daysUntilExpiry > 0 && daysUntilExpiry <= 90;
  });

  // Calculate recommended reorder quantities
  const reorderList = lowStockItems.map(p => {
    const recommendedQty = Math.max(p.minStockAlert * 3 - p.currentStock, 10);
    const estimatedCost = recommendedQty * p.costPrice;
    return {
      product: p,
      recommendedQty,
      estimatedCost
    };
  });

  const totalEstimatedCost = reorderList.reduce((sum, item) => sum + item.estimatedCost, 0);

  const handlePrintRestockSheet = () => {
    window.print();
  };

  const handleSendWhatsAppOrder = () => {
    let orderText = `*RESTOCK PURCHASE ORDER*\nFrom: ${settings.storeName}\nDate: ${new Date().toLocaleDateString('en-IN')}\n\nDear Distributor/Wholesaler,\nPlease supply the following urgent agricultural items for Krushi Sewa Kendra:\n\n`;

    reorderList.forEach((item, idx) => {
      orderText += `${idx + 1}. *${item.product.name}* (${item.product.brand})\n   Order Qty: *${item.recommendedQty} ${item.product.unit}* | Current: ${item.product.currentStock}\n`;
    });

    orderText += `\nTotal Items: ${reorderList.length}\nDelivery Address: ${settings.address}, ${settings.villageTown}\nContact: ${settings.phone}\nThank you!`;

    const clean = distributorPhone.replace(/\D/g, '');
    const phoneWithCountry = clean.startsWith('91') ? clean : `91${clean}`;
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(orderText)}`;
    window.open(url, '_blank');
  };

  const handleCopyText = () => {
    let orderText = `RESTOCK PURCHASE ORDER - ${settings.storeName}\n`;
    reorderList.forEach((item, idx) => {
      orderText += `${idx + 1}. ${item.product.name} (${item.product.brand}) - Qty: ${item.recommendedQty} ${item.product.unit}\n`;
    });
    navigator.clipboard.writeText(orderText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-[calc(100vh-80px)] text-slate-800">
      
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl shadow-xs border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Low-Stock & Expiry Alert Radar (कमी साठा व मुदत संपणारा माल)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automatic inventory alerts, batch shelf-life warnings, and 1-click supplier purchase order generator.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrintRestockSheet}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition shadow-xs"
          >
            <Printer className="w-4 h-4" />
            Print Restock Indent
          </button>
        </div>
      </div>

      {/* Critical Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Low-Stock Items</span>
              <span className="text-2xl font-bold text-amber-900 font-mono mt-1 block">{lowStockItems.length} Products</span>
            </div>
            <div className="p-2 rounded-lg bg-amber-200/60 text-amber-900">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-amber-700 mt-2">At or below reorder threshold</p>
        </div>

        <div className="bg-rose-50 p-4 rounded-xl border border-rose-200">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">Completely Out of Stock</span>
              <span className="text-2xl font-bold text-rose-900 font-mono mt-1 block">{outOfStockItems.length} Products</span>
            </div>
            <div className="p-2 rounded-lg bg-rose-200/60 text-rose-900">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-rose-700 mt-2">Zero stock - urgent reorder needed</p>
        </div>

        <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block">Expiring within 90 Days</span>
              <span className="text-2xl font-bold text-purple-900 font-mono mt-1 block">{expiringSoonItems.length} Batches</span>
            </div>
            <div className="p-2 rounded-lg bg-purple-200/60 text-purple-900">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-purple-700 mt-2">Pesticides or seeds nearing expiry</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Side: Restock Table & Quick Restock (8 cols) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                Items Requiring Urgent Reorder ({lowStockItems.length})
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                Est. Restock Cost: <strong className="text-slate-800">{formatCurrency(totalEstimatedCost)}</strong>
              </span>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Check className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h3 className="font-bold text-sm text-slate-800">Healthy Stock Levels!</h3>
                <p className="text-xs text-slate-500 mt-1">All items in your Krushi Sewa Kendra have sufficient buffer stock.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <th className="p-3">Product & Brand</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-right">Current Stock</th>
                      <th className="p-3 text-right">Alert Threshold</th>
                      <th className="p-3 text-right">Recommended Order</th>
                      <th className="p-3 text-right">Est. Cost</th>
                      <th className="p-3 text-center">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {reorderList.map(({ product, recommendedQty, estimatedCost }) => {
                      const isZero = product.currentStock <= 0;
                      return (
                        <tr key={product.id} className="hover:bg-slate-50/80">
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{product.name}</div>
                            <div className="text-[10px] text-slate-500">{product.brand} • SKU: {product.sku}</div>
                          </td>

                          <td className="p-3">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-medium text-slate-700">
                              {product.category}
                            </span>
                          </td>

                          <td className="p-3 text-right font-mono font-bold">
                            <span className={isZero ? 'text-rose-700' : 'text-amber-700'}>
                              {product.currentStock} {product.unit}
                            </span>
                          </td>

                          <td className="p-3 text-right font-mono text-slate-500">
                            {product.minStockAlert} {product.unit}
                          </td>

                          <td className="p-3 text-right font-mono font-bold text-emerald-700">
                            +{recommendedQty} {product.unit}
                          </td>

                          <td className="p-3 text-right font-mono text-slate-700">
                            {formatCurrency(estimatedCost)}
                          </td>

                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                const addAmount = prompt(`How many ${product.unit} received from distributor?`, String(recommendedQty));
                                if (addAmount && !isNaN(Number(addAmount))) {
                                  onAdjustStock(product.id, Number(addAmount), 'Distributor Delivery Restock');
                                }
                              }}
                              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 hover:bg-emerald-100 transition"
                            >
                              + Receive Stock
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Expiring Batches Table */}
          {expiringSoonItems.length > 0 && (
            <div className="bg-white rounded-xl shadow-xs border border-purple-200 overflow-hidden">
              <div className="p-3 bg-purple-50 border-b border-purple-200 flex justify-between items-center text-xs">
                <span className="font-bold text-purple-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-700" />
                  Upcoming Batch Expiry Warning ({expiringSoonItems.length})
                </span>
                <span className="text-[11px] text-purple-700">Prioritize selling or return to company</span>
              </div>
              <div className="divide-y divide-purple-100 text-xs">
                {expiringSoonItems.map(item => (
                  <div key={item.id} className="p-3 flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-slate-900">{item.name}</span>
                      <div className="text-[10px] text-slate-500">Batch: {item.batchNo || 'N/A'} • Current: {item.currentStock} {item.unit}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-purple-800 text-xs">Expires: {formatDate(item.expiryDate!)}</span>
                      <div className="text-[10px] text-rose-600 font-medium">In ~{-getDaysDiff(item.expiryDate!)} days</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Distributor WhatsApp Reorder Card (4 cols) */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-600" />
                1-Click Distributor Order
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dispatch restock list instantly to fertilizer & chemical wholesaler via WhatsApp.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Wholesaler / Distributor Mobile No.
              </label>
              <input
                type="tel"
                value={distributorPhone}
                onChange={(e) => setDistributorPhone(e.target.value)}
                placeholder="e.g. 9822114455"
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            {/* Preview of order items */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5 max-h-52 overflow-y-auto font-mono text-[11px]">
              <div className="font-bold text-slate-700 border-b pb-1">Order Summary:</div>
              {reorderList.map((item, i) => (
                <div key={item.product.id} className="flex justify-between text-slate-600">
                  <span className="truncate pr-1">{i + 1}. {item.product.name}</span>
                  <span className="font-bold whitespace-nowrap text-slate-900">x{item.recommendedQty}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleSendWhatsAppOrder}
                disabled={reorderList.length === 0}
                className={`w-full py-2.5 rounded-lg text-xs font-bold text-white shadow-xs flex items-center justify-center gap-2 transition ${
                  reorderList.length > 0 ? 'bg-emerald-600 hover:bg-emerald-500 cursor-pointer' : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                <Share2 className="w-4 h-4" />
                Send Order on WhatsApp
              </button>

              <button
                type="button"
                onClick={handleCopyText}
                className="w-full py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : null}
                {copied ? 'Order Copied to Clipboard!' : 'Copy Order Text'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
