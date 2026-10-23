import React, { useState } from 'react';
import { Product, ProductCategory, UnitType } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { 
  Package, Search, Plus, AlertTriangle, ArrowUpDown, Edit, 
  Trash2, Filter, Layers, CheckCircle2, ShieldAlert, Sparkles, RefreshCw
} from 'lucide-react';

interface Props {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onAdjustStock: (productId: string, quantityDelta: number, reason: string) => void;
  filterLowStockInitial?: boolean;
}

export const InventoryManager: React.FC<Props> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAdjustStock,
  filterLowStockInitial = false
}) => {
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showLowStockOnly, setShowLowStockOnly] = useState<boolean>(filterLowStockInitial);

  // Add/Edit Product Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Quick Stock Adjustment Modal State
  const [adjustModalProduct, setAdjustModalProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('Supplier Delivery / Restock');

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formCategory, setFormCategory] = useState<ProductCategory>('Fertilizer');
  const [formSku, setFormSku] = useState('');
  const [formHsn, setFormHsn] = useState('31021000');
  const [formUnit, setFormUnit] = useState<UnitType>('Bag');
  const [formCostPrice, setFormCostPrice] = useState(0);
  const [formSellingPrice, setFormSellingPrice] = useState(0);
  const [formMrp, setFormMrp] = useState(0);
  const [formTaxRate, setFormTaxRate] = useState(5);
  const [formStock, setFormStock] = useState(0);
  const [formMinAlert, setFormMinAlert] = useState(10);
  const [formBatchNo, setFormBatchNo] = useState('');
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formMfgDate, setFormMfgDate] = useState('');
  const [formComposition, setFormComposition] = useState('');
  const [formDesc, setFormDesc] = useState('');

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormBrand('');
    setFormCategory('Fertilizer');
    setFormSku('SKU-' + Math.floor(1000 + Math.random() * 9000));
    setFormHsn('31021000');
    setFormUnit('Bag');
    setFormCostPrice(0);
    setFormSellingPrice(0);
    setFormMrp(0);
    setFormTaxRate(5);
    setFormStock(20);
    setFormMinAlert(10);
    setFormBatchNo('');
    setFormExpiryDate('');
    setFormMfgDate('');
    setFormComposition('');
    setFormDesc('');
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormBrand(product.brand);
    setFormCategory(product.category);
    setFormSku(product.sku);
    setFormHsn(product.hsnCode);
    setFormUnit(product.unit);
    setFormCostPrice(product.costPrice);
    setFormSellingPrice(product.sellingPrice);
    setFormMrp(product.mrp);
    setFormTaxRate(product.taxRate);
    setFormStock(product.currentStock);
    setFormMinAlert(product.minStockAlert);
    setFormBatchNo(product.batchNo || '');
    setFormExpiryDate(product.expiryDate || '');
    setFormMfgDate(product.mfgDate || '');
    setFormComposition(product.composition || '');
    setFormDesc(product.description || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Product Name is required.');
      return;
    }

    const payload: Product = {
      id: editingProduct ? editingProduct.id : 'prod-' + Date.now(),
      name: formName.trim(),
      brand: formBrand.trim() || 'General',
      category: formCategory,
      sku: formSku.trim() || 'SKU-' + Date.now(),
      hsnCode: formHsn.trim() || '000000',
      unit: formUnit,
      costPrice: Number(formCostPrice) || 0,
      sellingPrice: Number(formSellingPrice) || 0,
      mrp: Number(formMrp) || Number(formSellingPrice) || 0,
      taxRate: Number(formTaxRate) || 0,
      currentStock: Number(formStock) || 0,
      minStockAlert: Number(formMinAlert) || 5,
      batchNo: formBatchNo.trim() || undefined,
      expiryDate: formExpiryDate || undefined,
      mfgDate: formMfgDate || undefined,
      composition: formComposition.trim() || undefined,
      description: formDesc.trim() || undefined
    };

    if (editingProduct) {
      onUpdateProduct(payload);
    } else {
      onAddProduct(payload);
    }
    setIsModalOpen(false);
  };

  const handleStockAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalProduct || adjustQty === 0) return;
    onAdjustStock(adjustModalProduct.id, adjustQty, adjustReason);
    setAdjustModalProduct(null);
    setAdjustQty(0);
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.batchNo && p.batchNo.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesLowStock = !showLowStockOnly || (p.currentStock <= p.minStockAlert);

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const lowStockCount = products.filter(p => p.currentStock <= p.minStockAlert).length;
  const outOfStockCount = products.filter(p => p.currentStock <= 0).length;

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-[calc(100vh-80px)] text-slate-800">
      
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl shadow-xs border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            Inventory & Stock Control (कृषि साठा व्यवस्थापन)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Fertilizers, seeds, pesticides, equipment, batch tracking, and low-stock radar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add New Product (नवीन उत्पादन)
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider block">Total SKUs</span>
          <span className="text-2xl font-bold text-slate-900">{products.length} Products</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider block">Total Inventory Value</span>
          <span className="text-2xl font-bold font-mono text-emerald-700">
            {formatCurrency(products.reduce((sum, p) => sum + (p.currentStock * p.sellingPrice), 0))}
          </span>
        </div>

        <button
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
          className={`p-3.5 rounded-xl border text-left transition shadow-xs ${
            showLowStockOnly ? 'bg-amber-100 border-amber-300 ring-2 ring-amber-400' : 'bg-white border-amber-200 hover:bg-amber-50/50'
          }`}
        >
          <span className="text-[11px] text-amber-800 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Low Stock Alert</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          </span>
          <span className="text-2xl font-bold text-amber-900">{lowStockCount} Items</span>
        </button>

        <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-xs">
          <span className="text-[11px] text-rose-700 font-bold uppercase tracking-wider block">Out of Stock</span>
          <span className="text-2xl font-bold text-rose-900">{outOfStockCount} Items</span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product name, brand, SKU, batch number..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-slate-50 font-medium"
            >
              <option value="All">All Categories ({products.length})</option>
              <option value="Fertilizer">Fertilizers</option>
              <option value="Seeds">Seeds</option>
              <option value="Pesticide & Fungicide">Pesticides & Crop Protection</option>
              <option value="Sprayer & Equipment">Sprayers & Tools</option>
              <option value="Irrigation & Pipes">Irrigation & Pipes</option>
              <option value="Cattle & Poultry Feed">Cattle & Animal Feed</option>
            </select>
          </div>

          <div className="sm:col-span-3 flex items-center gap-2">
            <button
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              className={`w-full py-2 px-3 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 transition ${
                showLowStockOnly 
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs' 
                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {showLowStockOnly ? 'Showing Low Stock Only' : 'Filter Low Stock'}
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="p-3">Product Name & Category</th>
                <th className="p-3">Brand</th>
                <th className="p-3">Batch & Expiry</th>
                <th className="p-3 text-right">Cost Price</th>
                <th className="p-3 text-right">Sell Price (MRP)</th>
                <th className="p-3 text-right">GST %</th>
                <th className="p-3 text-right">Stock Level</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredProducts.map(product => {
                const isOutOfStock = product.currentStock <= 0;
                const isLowStock = product.currentStock <= product.minStockAlert;

                return (
                  <tr key={product.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3">
                      <div className="font-bold text-slate-900 text-xs">{product.name}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{product.category}</span>
                        <span>HSN: {product.hsnCode}</span>
                        <span>SKU: {product.sku}</span>
                      </div>
                    </td>

                    <td className="p-3 text-slate-700 font-medium">
                      {product.brand}
                    </td>

                    <td className="p-3 text-slate-600 text-[11px] font-mono">
                      {product.batchNo ? <div>B: {product.batchNo}</div> : <span className="text-slate-400">—</span>}
                      {product.expiryDate && (
                        <div className="text-[10px] text-slate-500">Exp: {formatDate(product.expiryDate)}</div>
                      )}
                    </td>

                    <td className="p-3 text-right font-mono text-slate-600">
                      {formatCurrency(product.costPrice)}
                    </td>

                    <td className="p-3 text-right font-mono">
                      <div className="font-bold text-emerald-800">{formatCurrency(product.sellingPrice)}</div>
                      <div className="text-[10px] text-slate-400 line-through">{formatCurrency(product.mrp)}</div>
                    </td>

                    <td className="p-3 text-right font-medium text-slate-700">
                      {product.taxRate}%
                    </td>

                    <td className="p-3 text-right font-mono font-bold">
                      <div className={`text-sm ${isOutOfStock ? 'text-rose-700' : isLowStock ? 'text-amber-700' : 'text-slate-900'}`}>
                        {product.currentStock} {product.unit}
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">Min: {product.minStockAlert}</div>
                    </td>

                    <td className="p-3 text-center">
                      {isOutOfStock ? (
                        <span className="inline-block bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded text-[10px] font-bold">
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-block bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-medium">
                          In Stock
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setAdjustModalProduct(product);
                            setAdjustQty(0);
                          }}
                          className="p-1 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition"
                          title="Quick +/- Stock Adjustment"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-1 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded transition"
                          title="Edit Product"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
                              onDeleteProduct(product.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold text-sm">
                {editingProduct ? 'Edit Agricultural Product' : 'Add New Agri Product to Inventory'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Product Title *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Neem Coated Urea (45 kg) or Coragen 60ml"
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Brand / Manufacturer *</label>
                  <input
                    type="text"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="e.g. IFFCO, Bayer, Syngenta, Mahyco"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e: any) => setFormCategory(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 text-xs"
                  >
                    <option value="Fertilizer">Fertilizer (खत)</option>
                    <option value="Seeds">Seeds (बियाणे)</option>
                    <option value="Pesticide & Fungicide">Pesticide & Fungicide (औषधे)</option>
                    <option value="Sprayer & Equipment">Sprayer & Equipment</option>
                    <option value="Irrigation & Pipes">Irrigation & Pipes</option>
                    <option value="Cattle & Poultry Feed">Cattle & Animal Feed</option>
                    <option value="General Agri Supplies">General Agri Supplies</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">SKU / Item Code</label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">HSN / SAC Code</label>
                  <input
                    type="text"
                    value={formHsn}
                    onChange={(e) => setFormHsn(e.target.value)}
                    placeholder="e.g. 31021000"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Unit of Measure</label>
                  <select
                    value={formUnit}
                    onChange={(e: any) => setFormUnit(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 text-xs"
                  >
                    <option value="Bag">Bag (गोणी)</option>
                    <option value="Kg">Kg (किलो)</option>
                    <option value="Litre">Litre (लिटर)</option>
                    <option value="Packet">Packet (पाकीट)</option>
                    <option value="Bottle">Bottle (बाटली)</option>
                    <option value="Piece">Piece (नग)</option>
                    <option value="Quintal">Quintal (क्विंटल)</option>
                    <option value="Meter">Meter (मीटर)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">GST Tax Rate (%)</label>
                  <select
                    value={formTaxRate}
                    onChange={(e) => setFormTaxRate(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 text-xs"
                  >
                    <option value={0}>0% (Tax Exempt Seeds/Manure)</option>
                    <option value={5}>5% (Fertilizers & Organic inputs)</option>
                    <option value={12}>12% (Sprayers & Drip Pipes)</option>
                    <option value={18}>18% (Pesticides, Fungicides, Chemicals)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Cost / Purchase Price (₹)</label>
                  <input
                    type="number"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-bold text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">MRP Printed (₹)</label>
                  <input
                    type="number"
                    value={formMrp}
                    onChange={(e) => setFormMrp(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Current Stock Level *</label>
                  <input
                    type="number"
                    value={formStock}
                    onChange={(e) => setFormStock(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-bold text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Low-Stock Alert Threshold *</label>
                  <input
                    type="number"
                    value={formMinAlert}
                    onChange={(e) => setFormMinAlert(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-amber-300 rounded-lg text-xs bg-amber-50/40"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Batch / Lot Number</label>
                  <input
                    type="text"
                    value={formBatchNo}
                    onChange={(e) => setFormBatchNo(e.target.value)}
                    placeholder="e.g. B-2026-99"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Expiry Date (Exp)</label>
                  <input
                    type="date"
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Chemical Composition / Technical Name</label>
                  <input
                    type="text"
                    value={formComposition}
                    onChange={(e) => setFormComposition(e.target.value)}
                    placeholder="e.g. Chlorantraniliprole 18.5% SC or Azoxystrobin + Difenoconazole"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-xs"
                >
                  {editingProduct ? 'Save Changes' : 'Add to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Stock Adjustment (+/-) Modal */}
      {adjustModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Quick Stock Adjustment</h3>
                <p className="text-xs text-slate-400">{adjustModalProduct.name}</p>
              </div>
              <button onClick={() => setAdjustModalProduct(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleStockAdjustmentSubmit} className="p-4 space-y-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600">Current Stock:</span>
                <span className="font-bold font-mono text-sm">{adjustModalProduct.currentStock} {adjustModalProduct.unit}</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Quantity Adjustment (+ Add, - Deduct)
                </label>
                <input
                  type="number"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. +25 for delivery, -2 for damaged"
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm font-bold font-mono text-center"
                  required
                />
                <div className="text-[11px] text-slate-500 mt-1">
                  New Stock will be: <strong>{Math.max(0, adjustModalProduct.currentStock + adjustQty)} {adjustModalProduct.unit}</strong>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Reason / Note</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50"
                >
                  <option value="Distributor Delivery / Restock">Distributor Delivery / Restock</option>
                  <option value="Damaged / Leaked Bag">Damaged / Leaked Bag</option>
                  <option value="Inventory Audit Correction">Inventory Audit Correction</option>
                  <option value="Demo / Promotional Sample">Demo / Promotional Sample</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalProduct(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustQty === 0}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-xs"
                >
                  Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
