import React, { useState } from 'react';
import { Farmer, Invoice, PaymentRecord, StoreSettings } from '../../types';
import { formatCurrency, formatDate, generatePaymentReminderMessage } from '../../utils/formatters';
import { 
  Users, Search, Plus, Phone, MapPin, IndianRupee, Calendar, 
  ArrowDownLeft, ArrowUpRight, CheckCircle2, AlertCircle, Share2, Printer, 
  CreditCard, ShieldAlert, FileText, ChevronRight
} from 'lucide-react';

interface Props {
  farmers: Farmer[];
  invoices: Invoice[];
  payments: { [farmerId: string]: PaymentRecord[] };
  settings: StoreSettings;
  onRecordPayment: (farmerId: string, amount: number, mode: any, refNo?: string, notes?: string) => void;
  onAddNewFarmer: (farmer: Farmer) => void;
  onViewInvoice: (invoice: Invoice) => void;
}

export const FarmerLedger: React.FC<Props> = ({
  farmers,
  invoices,
  payments,
  settings,
  onRecordPayment,
  onAddNewFarmer,
  onViewInvoice
}) => {
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>(farmers[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'withBalance' | 'clear'>('all');

  // Payment Recording Modal State
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMode, setPayMode] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque'>('Cash');
  const [payRef, setPayRef] = useState<string>('');
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [payNotes, setPayNotes] = useState<string>('');

  // Add Farmer Modal State
  const [showAddFarmerModal, setShowAddFarmerModal] = useState<boolean>(false);
  const [newFarmerName, setNewFarmerName] = useState<string>('');
  const [newFarmerPhone, setNewFarmerPhone] = useState<string>('');
  const [newFarmerVillage, setNewFarmerVillage] = useState<string>('');
  const [newFarmerLand, setNewFarmerLand] = useState<number>(0);
  const [newFarmerNotes, setNewFarmerNotes] = useState<string>('');

  // Filter farmers
  const filteredFarmers = farmers.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.phone.includes(searchQuery) ||
      f.village.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterType === 'withBalance') return matchesSearch && f.outstandingBalance > 0;
    if (filterType === 'clear') return matchesSearch && f.outstandingBalance <= 0;
    return matchesSearch;
  });

  const selectedFarmer = farmers.find(f => f.id === selectedFarmerId) || farmers[0];

  // Get invoices & payments for selected farmer
  const farmerInvoices = invoices.filter(inv => inv.farmerId === selectedFarmer?.id);
  const farmerPayments = (selectedFarmer ? payments[selectedFarmer.id] : []) || [];

  // Construct combined ledger transactions sorted chronologically
  type LedgerEntry = {
    id: string;
    date: string;
    type: 'INVOICE' | 'PAYMENT';
    title: string;
    refNumber: string;
    debit: number; // Invoice amount
    credit: number; // Payment received
    mode?: string;
    notes?: string;
    rawInvoice?: Invoice;
  };

  const ledgerEntries: LedgerEntry[] = [
    ...farmerInvoices.map(inv => ({
      id: inv.id,
      date: inv.invoiceDate,
      type: 'INVOICE' as const,
      title: `Invoice #${inv.invoiceNumber} (${inv.items.length} items)`,
      refNumber: inv.invoiceNumber,
      debit: inv.grandTotal,
      credit: 0,
      mode: inv.paymentMode,
      notes: inv.notes,
      rawInvoice: inv
    })),
    ...farmerPayments.map(p => ({
      id: p.id,
      date: p.paymentDate,
      type: 'PAYMENT' as const,
      title: `Payment Received (${p.paymentMode})`,
      refNumber: p.referenceNumber || 'Cash Rec',
      debit: 0,
      credit: p.amount,
      mode: p.paymentMode,
      notes: p.notes
    }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate running balance for each entry
  let running = 0;
  const ledgerWithRunning = ledgerEntries.map(entry => {
    running = running + entry.debit - entry.credit;
    return { ...entry, runningBalance: running };
  });

  const handleOpenPayModal = () => {
    if (!selectedFarmer) return;
    setPayAmount(selectedFarmer.outstandingBalance > 0 ? selectedFarmer.outstandingBalance : 0);
    setPayRef('');
    setPayNotes('');
    setShowPaymentModal(true);
  };

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }
    if (!selectedFarmer) return;

    onRecordPayment(selectedFarmer.id, payAmount, payMode, payRef, payNotes);
    setShowPaymentModal(false);
  };

  const handleCreateFarmer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFarmerName.trim()) {
      alert('Farmer name is required.');
      return;
    }
    const newFarmer: Farmer = {
      id: 'farmer-' + Date.now(),
      name: newFarmerName.trim(),
      phone: newFarmerPhone.trim() || '9800000000',
      village: newFarmerVillage.trim() || 'Local Area',
      landAcres: newFarmerLand || 0,
      totalPurchases: 0,
      totalPaid: 0,
      outstandingBalance: 0,
      createdAt: new Date().toISOString().split('T')[0],
      notes: newFarmerNotes.trim()
    };
    onAddNewFarmer(newFarmer);
    setSelectedFarmerId(newFarmer.id);
    setShowAddFarmerModal(false);
    setNewFarmerName('');
    setNewFarmerPhone('');
    setNewFarmerVillage('');
    setNewFarmerLand(0);
    setNewFarmerNotes('');
  };

  const handleSendFarmerReminder = () => {
    if (!selectedFarmer || selectedFarmer.outstandingBalance <= 0) return;
    const rawMsg = generatePaymentReminderMessage(
      'hindi',
      selectedFarmer.name,
      settings.storeName,
      'Multiple Bills / Khata',
      selectedFarmer.outstandingBalance,
      new Date().toISOString().split('T')[0],
      7,
      settings.upiId,
      settings.phone
    );
    const cleanPhone = selectedFarmer.phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(rawMsg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-[calc(100vh-80px)] text-slate-800">
      
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl shadow-xs border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Farmer Khata & Payment History (शेतकरी खातेवही)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track credit history, ledger entries, record payments, and send instant WhatsApp receipts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddFarmerModal(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add Farmer (नवीन शेतकरी)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Side: Farmer Directory List (4 cols) */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl shadow-xs border border-slate-200 flex flex-col max-h-[calc(100vh-220px)]">
          {/* Search & Filter Header */}
          <div className="p-3 border-b border-slate-200 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search farmer name, phone, village..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1 text-[11px]">
              <button
                onClick={() => setFilterType('all')}
                className={`flex-1 py-1 rounded text-center font-medium transition ${
                  filterType === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({farmers.length})
              </button>
              <button
                onClick={() => setFilterType('withBalance')}
                className={`flex-1 py-1 rounded text-center font-medium transition ${
                  filterType === 'withBalance' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Udhaar ({farmers.filter(f => f.outstandingBalance > 0).length})
              </button>
              <button
                onClick={() => setFilterType('clear')}
                className={`flex-1 py-1 rounded text-center font-medium transition ${
                  filterType === 'clear' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Clean ({farmers.filter(f => f.outstandingBalance <= 0).length})
              </button>
            </div>
          </div>

          {/* Farmer Scrollable List */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {filteredFarmers.map(farmer => {
              const isSelected = selectedFarmer?.id === farmer.id;
              const hasUdhaar = farmer.outstandingBalance > 0;
              return (
                <button
                  key={farmer.id}
                  onClick={() => setSelectedFarmerId(farmer.id)}
                  className={`w-full text-left p-3 transition flex items-center justify-between ${
                    isSelected ? 'bg-emerald-50/80 border-l-4 border-emerald-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="font-semibold text-xs text-slate-900 truncate">{farmer.name}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{farmer.village}</span>
                      <span>•</span>
                      <span>{farmer.phone}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-xs font-mono font-bold ${hasUdhaar ? 'text-amber-800' : 'text-emerald-700'}`}>
                      {formatCurrency(farmer.outstandingBalance)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {hasUdhaar ? 'Udhaar Due' : 'All Clear'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Detailed Farmer Khata Ledger (8 cols) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {selectedFarmer ? (
            <>
              {/* Farmer Profile Card & Udhaar Meter */}
              <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Farmer Khata Account
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-1">{selectedFarmer.name}</h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {selectedFarmer.village}, {selectedFarmer.tehsil || 'Baramati'}</span>
                      <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> +91 {selectedFarmer.phone}</span>
                      {selectedFarmer.landAcres && <span>Land: <strong>{selectedFarmer.landAcres} Acres</strong></span>}
                    </div>
                    {selectedFarmer.notes && (
                      <p className="text-xs text-slate-500 italic mt-2 bg-slate-50 p-2 rounded">
                        Note: {selectedFarmer.notes}
                      </p>
                    )}
                  </div>

                  {/* Balance Badge & Action Buttons */}
                  <div className="text-right space-y-2">
                    <div className={`p-3 rounded-lg border text-right ${
                      selectedFarmer.outstandingBalance > 0 
                        ? 'bg-amber-50 border-amber-200 text-amber-900' 
                        : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    }`}>
                      <div className="text-[10px] uppercase font-bold tracking-wider">Current Outstanding (बाकी)</div>
                      <div className="text-xl font-bold font-mono">{formatCurrency(selectedFarmer.outstandingBalance)}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Total Purchases: {formatCurrency(selectedFarmer.totalPurchases)}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      {selectedFarmer.outstandingBalance > 0 && (
                        <button
                          onClick={handleSendFarmerReminder}
                          className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition"
                          title="Send WhatsApp Payment Reminder"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          Remind via WhatsApp
                        </button>
                      )}

                      <button
                        onClick={handleOpenPayModal}
                        className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-xs"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                        Record Payment (जमा करा)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chronological Ledger Table */}
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    Transaction Statement & Receipts (खातेवही नोंदणी)
                  </h3>
                  <span className="text-xs text-slate-500">{ledgerWithRunning.length} Transactions</span>
                </div>

                {ledgerWithRunning.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No transactions recorded for this farmer yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                          <th className="p-3">Date</th>
                          <th className="p-3">Particulars / Ref</th>
                          <th className="p-3">Mode</th>
                          <th className="p-3 text-right">Debit (+ Bill)</th>
                          <th className="p-3 text-right">Credit (- Paid)</th>
                          <th className="p-3 text-right">Balance Due</th>
                          <th className="p-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {ledgerWithRunning.map(entry => (
                          <tr key={entry.id} className="hover:bg-slate-50/80">
                            <td className="p-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                              {formatDate(entry.date)}
                            </td>
                            <td className="p-3">
                              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                {entry.type === 'INVOICE' ? (
                                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                                ) : (
                                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                )}
                                <span>{entry.title}</span>
                              </div>
                              {entry.notes && (
                                <div className="text-[10px] text-slate-400 mt-0.5">{entry.notes}</div>
                              )}
                            </td>
                            <td className="p-3 text-slate-600 font-medium">
                              <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                                {entry.mode || 'Direct'}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono font-semibold text-slate-900">
                              {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-emerald-700">
                              {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900">
                              {formatCurrency(entry.runningBalance)}
                            </td>
                            <td className="p-3 text-center">
                              {entry.rawInvoice && (
                                <button
                                  onClick={() => onViewInvoice(entry.rawInvoice!)}
                                  className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold underline"
                                >
                                  View Bill
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-400">
              Select a farmer to view payment ledger history
            </div>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && selectedFarmer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Record Payment (जमा रक्कम पावती)</h3>
                <p className="text-xs text-slate-400">{selectedFarmer.name} • {selectedFarmer.village}</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRecordSubmit} className="p-5 space-y-4 text-xs">
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex justify-between items-center">
                <span className="text-amber-800 font-medium">Total Current Udhaar:</span>
                <span className="font-mono font-bold text-sm text-amber-900">{formatCurrency(selectedFarmer.outstandingBalance)}</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Amount Received (₹) *</label>
                <input
                  type="number"
                  min="1"
                  max={selectedFarmer.outstandingBalance > 0 ? selectedFarmer.outstandingBalance : undefined}
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-base font-bold font-mono focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={payMode}
                    onChange={(e: any) => setPayMode(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50"
                  >
                    <option value="Cash">Cash (नकद)</option>
                    <option value="UPI">UPI (GPay / PhonePe)</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Reference / UTR / Receipt No.</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. UPI-20938472 or Cash Slip #22"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Payment Notes</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Paid in full after soybean harvest sale"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-xs"
                >
                  Confirm & Credit Khata ({formatCurrency(payAmount)})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Farmer Modal */}
      {showAddFarmerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Add New Farmer Client (नवीन शेतकरी खाते)</h3>
                <p className="text-xs text-slate-400">Create khata for billing and credit ledger</p>
              </div>
              <button onClick={() => setShowAddFarmerModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateFarmer} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Farmer Full Name *</label>
                <input
                  type="text"
                  value={newFarmerName}
                  onChange={(e) => setNewFarmerName(e.target.value)}
                  placeholder="e.g. Babanrao Patil"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Mobile No. *</label>
                  <input
                    type="tel"
                    value={newFarmerPhone}
                    onChange={(e) => setNewFarmerPhone(e.target.value)}
                    placeholder="98xxxxxxxx"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Village / Gaon *</label>
                  <input
                    type="text"
                    value={newFarmerVillage}
                    onChange={(e) => setNewFarmerVillage(e.target.value)}
                    placeholder="e.g. Shivpur"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Land Holding (Acres)</label>
                <input
                  type="number"
                  step="0.5"
                  value={newFarmerLand}
                  onChange={(e) => setNewFarmerLand(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 7.5"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Crop / Notes</label>
                <input
                  type="text"
                  value={newFarmerNotes}
                  onChange={(e) => setNewFarmerNotes(e.target.value)}
                  placeholder="e.g. Sugarcane & Wheat grower"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddFarmerModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-xs"
                >
                  Save Farmer Khata
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
