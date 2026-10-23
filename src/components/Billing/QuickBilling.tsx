import React, { useState, useId } from 'react';
import { Product, Farmer, Invoice, InvoiceItem, StoreSettings, PaymentMode } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { 
  Plus, Trash2, ShoppingCart, Search, UserCheck, AlertCircle, 
  Calendar, Check, IndianRupee, QrCode, Sparkles, AlertTriangle, ArrowRight
} from 'lucide-react';

interface Props {
  products: Product[];
  farmers: Farmer[];
  settings: StoreSettings;
  onSaveInvoice: (invoice: Invoice, updatedProducts: Product[], updatedFarmer: Farmer) => void;
  onCancel: () => void;
}

export const QuickBilling: React.FC<Props> = ({
  products,
  farmers,
  settings,
  onSaveInvoice,
  onCancel
}) => {
  // Farmer Selection State
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>(farmers[0]?.id || '');
  const [isNewFarmer, setIsNewFarmer] = useState<boolean>(false);
  const [newFarmerName, setNewFarmerName] = useState<string>('');
  const [newFarmerPhone, setNewFarmerPhone] = useState<string>('');
  const [newFarmerVillage, setNewFarmerVillage] = useState<string>('');

  // Invoice Meta
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 21); // 21 days credit default
  const [dueDate, setDueDate] = useState<string>(defaultDueDate.toISOString().split('T')[0]);
  const [seasonTag, setSeasonTag] = useState<'Kharif' | 'Rabi' | 'Zaid' | 'General'>('Rabi');
  const [invoiceNotes, setInvoiceNotes] = useState<string>('');

  // Items State
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [productSearch, setProductSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Payment State
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Credit');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [billDiscount, setBillDiscount] = useState<number>(0);
  const [upiRef, setUpiRef] = useState<string>('');

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice) - ((item.quantity * item.unitPrice * item.discountPercent) / 100), 0);
  const taxTotal = items.reduce((sum, item) => {
    const itemSub = (item.quantity * item.unitPrice) - ((item.quantity * item.unitPrice * item.discountPercent) / 100);
    return sum + (itemSub * (item.taxRate / 100));
  }, 0);

  const rawGrandTotal = Math.max(0, subtotal + taxTotal - billDiscount);
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = Number((grandTotal - rawGrandTotal).toFixed(2));
  
  // Calculate balance due based on paid amount
  const effectivePaid = Math.min(paidAmount, grandTotal);
  const balanceDue = Math.max(0, grandTotal - effectivePaid);

  // Filter products for quick add
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.batchNo && p.batchNo.toLowerCase().includes(productSearch.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddProduct = (product: Product) => {
    // Check if already in bill
    const existingIndex = items.findIndex(i => i.productId === product.id);
    if (existingIndex >= 0) {
      const currentQty = items[existingIndex].quantity;
      if (currentQty + 1 > product.currentStock) {
        alert(`Cannot add more than available stock (${product.currentStock} ${product.unit}) for ${product.name}`);
        return;
      }
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      const base = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      const disc = (base * updated[existingIndex].discountPercent) / 100;
      const itemTax = (base - disc) * (updated[existingIndex].taxRate / 100);
      updated[existingIndex].taxAmount = itemTax;
      updated[existingIndex].totalAmount = (base - disc) + itemTax;
      setItems(updated);
    } else {
      if (product.currentStock <= 0) {
        alert(`Product "${product.name}" is OUT OF STOCK! Please restock before billing.`);
        return;
      }
      const base = 1 * product.sellingPrice;
      const itemTax = base * (product.taxRate / 100);
      const newItem: InvoiceItem = {
        id: 'item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        productId: product.id,
        productName: product.name,
        brand: product.brand,
        category: product.category,
        batchNo: product.batchNo,
        expiryDate: product.expiryDate,
        hsnCode: product.hsnCode,
        unit: product.unit,
        quantity: 1,
        unitPrice: product.sellingPrice,
        mrp: product.mrp,
        taxRate: product.taxRate,
        discountPercent: 0,
        taxAmount: itemTax,
        totalAmount: base + itemTax
      };
      setItems([...items, newItem]);
    }
  };

  const handleUpdateItemQty = (index: number, newQty: number) => {
    const item = items[index];
    const product = products.find(p => p.id === item.productId);
    if (product && newQty > product.currentStock) {
      alert(`Max available stock for this item is ${product.currentStock} ${product.unit}`);
      newQty = product.currentStock;
    }
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }

    const updated = [...items];
    updated[index].quantity = newQty;
    const base = newQty * updated[index].unitPrice;
    const disc = (base * updated[index].discountPercent) / 100;
    const itemTax = (base - disc) * (updated[index].taxRate / 100);
    updated[index].taxAmount = itemTax;
    updated[index].totalAmount = (base - disc) + itemTax;
    setItems(updated);
  };

  const handleUpdateItemPrice = (index: number, newPrice: number) => {
    const updated = [...items];
    updated[index].unitPrice = Math.max(0, newPrice);
    const base = updated[index].quantity * updated[index].unitPrice;
    const disc = (base * updated[index].discountPercent) / 100;
    const itemTax = (base - disc) * (updated[index].taxRate / 100);
    updated[index].taxAmount = itemTax;
    updated[index].totalAmount = (base - disc) + itemTax;
    setItems(updated);
  };

  const handleUpdateItemDiscount = (index: number, discountPct: number) => {
    const updated = [...items];
    updated[index].discountPercent = Math.min(100, Math.max(0, discountPct));
    const base = updated[index].quantity * updated[index].unitPrice;
    const disc = (base * updated[index].discountPercent) / 100;
    const itemTax = (base - disc) * (updated[index].taxRate / 100);
    updated[index].taxAmount = itemTax;
    updated[index].totalAmount = (base - disc) + itemTax;
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSetQuickPayment = (mode: PaymentMode) => {
    setPaymentMode(mode);
    if (mode === 'Cash' || mode === 'UPI' || mode === 'Bank Transfer') {
      setPaidAmount(grandTotal);
    } else if (mode === 'Credit') {
      setPaidAmount(0);
    }
  };

  const handleCompleteInvoice = () => {
    if (items.length === 0) {
      alert('Please add at least one product to the invoice.');
      return;
    }

    let farmer: Farmer;
    if (isNewFarmer) {
      if (!newFarmerName.trim()) {
        alert('Please enter Farmer / Customer Name.');
        return;
      }
      farmer = {
        id: 'farmer-' + Date.now(),
        name: newFarmerName.trim(),
        phone: newFarmerPhone.trim() || '9999999999',
        village: newFarmerVillage.trim() || 'Local Area',
        totalPurchases: 0,
        totalPaid: 0,
        outstandingBalance: 0,
        createdAt: invoiceDate
      };
    } else {
      const found = farmers.find(f => f.id === selectedFarmerId);
      if (!found) {
        alert('Please select a farmer or create a new farmer profile.');
        return;
      }
      farmer = found;
    }

    // Generate Invoice Number
    const invNumber = `${settings.invoicePrefix}${String(settings.nextInvoiceSequence).padStart(3, '0')}`;
    
    // Status
    let status: 'Paid' | 'Partial' | 'Pending' | 'Overdue' = 'Pending';
    if (balanceDue === 0) {
      status = 'Paid';
    } else if (effectivePaid > 0) {
      status = 'Partial';
    } else {
      status = 'Pending';
    }

    const newInvoice: Invoice = {
      id: 'inv-' + Date.now(),
      invoiceNumber: invNumber,
      farmerId: farmer.id,
      farmerName: farmer.name,
      farmerPhone: farmer.phone,
      farmerVillage: farmer.village,
      invoiceDate,
      dueDate,
      seasonTag,
      items,
      subtotal,
      taxTotal,
      discountTotal: billDiscount,
      roundOff,
      grandTotal,
      paidAmount: effectivePaid,
      balanceDue,
      paymentStatus: status,
      paymentMode,
      upiRef: paymentMode === 'UPI' ? upiRef : undefined,
      notes: invoiceNotes.trim()
    };

    // Deduct stock from products
    const updatedProducts = products.map(prod => {
      const billedItem = items.find(i => i.productId === prod.id);
      if (billedItem) {
        return {
          ...prod,
          currentStock: Math.max(0, prod.currentStock - billedItem.quantity)
        };
      }
      return prod;
    });

    // Update farmer ledger metrics
    const updatedFarmer: Farmer = {
      ...farmer,
      totalPurchases: farmer.totalPurchases + grandTotal,
      totalPaid: farmer.totalPaid + effectivePaid,
      outstandingBalance: farmer.outstandingBalance + balanceDue
    };

    onSaveInvoice(newInvoice, updatedProducts, updatedFarmer);
  };

  const selectedFarmer = farmers.find(f => f.id === selectedFarmerId);

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-80px)] p-4 sm:p-6 text-slate-800">
      {/* Top action header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl shadow-xs border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
              <ShoppingCart className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">New Krushi Kendra Invoice (बिल तयार करा)</h1>
              <p className="text-xs text-slate-500">Auto-number: <span className="font-mono font-bold text-slate-800">{settings.invoicePrefix}{String(settings.nextInvoiceSequence).padStart(3, '0')}</span></p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCompleteInvoice}
            disabled={items.length === 0}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold text-white shadow-sm transition ${
              items.length > 0 ? 'bg-emerald-600 hover:bg-emerald-500 cursor-pointer' : 'bg-slate-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            Generate & Print Bill ({formatCurrency(grandTotal)})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Side: Farmer Selection & Product Picker (7 cols) */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          
          {/* 1. Farmer Selection Card */}
          <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                Farmer / Client (शेतकरी माहिती)
              </h2>
              <button
                type="button"
                onClick={() => setIsNewFarmer(!isNewFarmer)}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold underline"
              >
                {isNewFarmer ? '← Select Existing Farmer' : '+ Quick Add New Farmer'}
              </button>
            </div>

            {!isNewFarmer ? (
              <div>
                <select
                  value={selectedFarmerId}
                  onChange={(e) => setSelectedFarmerId(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {farmers.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} — {f.village} (Ph: {f.phone}) {f.outstandingBalance > 0 ? `[Udhaar: ₹${f.outstandingBalance}]` : '[No Dues]'}
                    </option>
                  ))}
                </select>

                {selectedFarmer && (
                  <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs flex flex-wrap justify-between items-center gap-2">
                    <div>
                      <span className="text-slate-500">Village:</span> <strong className="text-slate-800">{selectedFarmer.village}</strong>
                      <span className="mx-2 text-slate-300">•</span>
                      <span className="text-slate-500">Mobile:</span> <strong className="text-slate-800">+91 {selectedFarmer.phone}</strong>
                      {selectedFarmer.landAcres && (
                        <>
                          <span className="mx-2 text-slate-300">•</span>
                          <span className="text-slate-500">Land:</span> <strong>{selectedFarmer.landAcres} Acres</strong>
                        </>
                      )}
                    </div>
                    {selectedFarmer.outstandingBalance > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        Previous Udhaar: {formatCurrency(selectedFarmer.outstandingBalance)}
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ Khata Clean (No dues)
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Farmer Full Name *</label>
                  <input
                    type="text"
                    value={newFarmerName}
                    onChange={(e) => setNewFarmerName(e.target.value)}
                    placeholder="e.g. Tukaram Shinde"
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    value={newFarmerPhone}
                    onChange={(e) => setNewFarmerPhone(e.target.value)}
                    placeholder="e.g. 9822112233"
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Village / Gaon</label>
                  <input
                    type="text"
                    value={newFarmerVillage}
                    onChange={(e) => setNewFarmerVillage(e.target.value)}
                    placeholder="e.g. Vadgaon"
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Product Catalog / Quick Add to Bill */}
          <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Search className="w-4 h-4 text-emerald-600" />
                Select Products (खाद / बीज / कीटकनाशके जोडा)
              </h2>
              <span className="text-xs text-slate-400">Click item to add to bill</span>
            </div>

            {/* Search & Category Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 mb-3">
              <div className="sm:col-span-8 relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search by product name, brand (IFFCO, Bayer), batch..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="sm:col-span-4">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-slate-50 font-medium"
                >
                  <option value="All">All Categories</option>
                  <option value="Fertilizer">Fertilizers (खते)</option>
                  <option value="Seeds">Seeds (बियाणे)</option>
                  <option value="Pesticide & Fungicide">Pesticides (कीटकनाशके)</option>
                  <option value="Sprayer & Equipment">Sprayers & Tools</option>
                  <option value="Irrigation & Pipes">Drip / Irrigation</option>
                  <option value="Cattle & Poultry Feed">Cattle Feed</option>
                </select>
              </div>
            </div>

            {/* Product Quick-Click List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {filteredProducts.map(prod => {
                const isLow = prod.currentStock <= prod.minStockAlert;
                const isOut = prod.currentStock <= 0;
                return (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => handleAddProduct(prod)}
                    disabled={isOut}
                    className={`text-left p-2.5 rounded-lg border transition flex flex-col justify-between ${
                      isOut 
                        ? 'opacity-50 bg-slate-100 border-slate-200 cursor-not-allowed'
                        : isLow 
                        ? 'hover:border-amber-400 hover:bg-amber-50/40 bg-white border-amber-200' 
                        : 'hover:border-emerald-500 hover:bg-emerald-50/30 bg-white border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <span className="font-semibold text-xs text-slate-900 leading-tight line-clamp-1">{prod.name}</span>
                        <span className="font-mono font-bold text-xs text-emerald-700 whitespace-nowrap">{formatCurrency(prod.sellingPrice)}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                        <span>{prod.brand}</span>
                        <span>GST: {prod.taxRate}%</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] mt-2 pt-1 border-t border-slate-100">
                      <span className={`font-semibold ${
                        isOut ? 'text-rose-600' : isLow ? 'text-amber-700' : 'text-slate-600'
                      }`}>
                        Stock: {prod.currentStock} {prod.unit}
                        {isLow && !isOut && ' (Low!)'}
                      </span>
                      {prod.batchNo && <span className="text-slate-400 font-mono">B:{prod.batchNo}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Invoice Dates & Season Notes */}
          <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Bill Date (बिल दिनांक)</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Credit Due Date (मुदत)</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Crop Season (हंगाम)</label>
              <select
                value={seasonTag}
                onChange={(e: any) => setSeasonTag(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-slate-50"
              >
                <option value="Rabi">Rabi Season (रब्बी)</option>
                <option value="Kharif">Kharif Season (खरीप)</option>
                <option value="Zaid">Summer / Zaid (उन्हाळी)</option>
                <option value="General">General (वार्षिक)</option>
              </select>
            </div>
          </div>

        </div>

        {/* Right Side: Bill Items Table & Payment Summary (5 cols) */}
        <div className="col-span-12 lg:col-span-5 space-y-4">
          
          {/* Bill Table */}
          <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                Current Bill Items ({items.length})
              </h2>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => setItems([])}
                  className="text-xs text-rose-600 hover:text-rose-700 underline"
                >
                  Clear All
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-lg">
                <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-500">No items added yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Click products on the left to start billing</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div key={item.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <span className="font-semibold text-slate-900">{item.productName}</span>
                        <div className="text-[10px] text-slate-500">{item.brand} • GST {item.taxRate}% {item.batchNo ? `• Batch: ${item.batchNo}` : ''}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 font-mono">{formatCurrency(item.totalAmount)}</div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-400 hover:text-rose-600 transition p-0.5 mt-0.5"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-200/80 text-[11px]">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Qty ({item.unit})</span>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItemQty(idx, parseFloat(e.target.value) || 0)}
                          className="w-full p-1 border border-slate-300 rounded font-semibold text-center bg-white"
                        />
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Rate (₹)</span>
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateItemPrice(idx, parseFloat(e.target.value) || 0)}
                          className="w-full p-1 border border-slate-300 rounded font-semibold text-center bg-white"
                        />
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Disc %</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discountPercent}
                          onChange={(e) => handleUpdateItemDiscount(idx, parseFloat(e.target.value) || 0)}
                          className="w-full p-1 border border-slate-300 rounded text-center bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Calculations Breakdown */}
            <div className="mt-4 pt-3 border-t border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Excl. Tax):</span>
                <span className="font-mono">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total GST / Tax:</span>
                <span className="font-mono">{formatCurrency(taxTotal)}</span>
              </div>
              
              <div className="flex justify-between items-center text-slate-600">
                <span>Bill Discount (₹):</span>
                <input
                  type="number"
                  min="0"
                  value={billDiscount}
                  onChange={(e) => setBillDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-24 p-1 border border-slate-300 rounded text-right font-mono text-xs"
                />
              </div>

              {roundOff !== 0 && (
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Round Off:</span>
                  <span className="font-mono">{roundOff > 0 ? `+${roundOff}` : roundOff}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-300 flex justify-between text-base font-bold text-slate-900">
                <span>Grand Total:</span>
                <span className="text-emerald-700 text-lg font-mono">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Payment Terms & Collection */}
          <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Payment Collection</h3>

            {/* Mode selection buttons */}
            <div className="grid grid-cols-4 gap-1.5">
              {(['Cash', 'UPI', 'Credit', 'Bank Transfer'] as PaymentMode[]).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleSetQuickPayment(mode)}
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition ${
                    paymentMode === mode 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {mode === 'Credit' ? 'खाता (Credit)' : mode}
                </button>
              ))}
            </div>

            {/* Paid amount & Balance calculation */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-medium text-slate-700">Amount Received Now:</span>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500">₹</span>
                  <input
                    type="number"
                    min="0"
                    max={grandTotal}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    className="w-28 p-1 border border-slate-300 rounded text-right font-mono font-bold text-xs"
                  />
                </div>
              </div>

              {paymentMode === 'UPI' && (
                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-600">
                  <span>UPI Txn / Ref No:</span>
                  <input
                    type="text"
                    value={upiRef}
                    onChange={(e) => setUpiRef(e.target.value)}
                    placeholder="e.g. UPI-99218274"
                    className="w-36 p-1 border border-slate-300 rounded text-xs"
                  />
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-bold">
                <span className="text-slate-800">Balance Due (उधारी):</span>
                <span className={`font-mono text-sm ${balanceDue > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                  {formatCurrency(balanceDue)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Invoice Notes / Remarks</label>
              <input
                type="text"
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                placeholder="e.g. Paid Rs 2000 cash, balance by Nov 10 after harvest"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg"
              />
            </div>

            {/* Bottom Generate Button */}
            <button
              onClick={handleCompleteInvoice}
              disabled={items.length === 0}
              className={`w-full py-3 rounded-lg text-xs font-bold text-white shadow-md flex items-center justify-center gap-2 transition ${
                items.length > 0 ? 'bg-emerald-600 hover:bg-emerald-500 cursor-pointer' : 'bg-slate-400 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              Complete & Print Invoice ({formatCurrency(grandTotal)})
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
