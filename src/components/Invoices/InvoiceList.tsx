import React, { useState } from 'react';
import { Invoice, StoreSettings } from '../../types';
import { formatCurrency, formatDate, getDaysDiff, generatePaymentReminderMessage } from '../../utils/formatters';
import { 
  Receipt, Search, Filter, Printer, Share2, CreditCard, 
  Trash2, Eye, Calendar, User, CheckCircle2, AlertTriangle, ArrowUpDown
} from 'lucide-react';

interface Props {
  invoices: Invoice[];
  settings: StoreSettings;
  onViewInvoice: (invoice: Invoice) => void;
  onRecordPaymentClick: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onNewInvoiceClick: () => void;
}

export const InvoiceList: React.FC<Props> = ({
  invoices,
  settings,
  onViewInvoice,
  onRecordPaymentClick,
  onDeleteInvoice,
  onNewInvoiceClick
}) => {
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [seasonFilter, setSeasonFilter] = useState<string>('all');

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.farmerName.toLowerCase().includes(search.toLowerCase()) ||
      inv.farmerPhone.includes(search) ||
      inv.farmerVillage.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'overdue' && inv.paymentStatus === 'Overdue') ||
      (statusFilter === 'paid' && inv.paymentStatus === 'Paid') ||
      (statusFilter === 'partial' && inv.paymentStatus === 'Partial') ||
      (statusFilter === 'pending' && (inv.paymentStatus === 'Pending' || inv.balanceDue > 0));

    const matchesSeason = seasonFilter === 'all' || inv.seasonTag === seasonFilter;

    return matchesSearch && matchesStatus && matchesSeason;
  }).sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());

  const handleShareWhatsApp = (invoice: Invoice) => {
    const rawMsg = generatePaymentReminderMessage(
      'polite',
      invoice.farmerName,
      settings.storeName,
      invoice.invoiceNumber,
      invoice.balanceDue > 0 ? invoice.balanceDue : invoice.grandTotal,
      invoice.dueDate,
      0,
      settings.upiId,
      settings.phone
    );
    const cleanPhone = invoice.farmerPhone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(rawMsg)}`;
    window.open(url, '_blank');
  };

  const totalBilled = invoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalReceived = invoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const totalBalanceDue = invoices.reduce((sum, i) => sum + i.balanceDue, 0);

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-[calc(100vh-80px)] text-slate-800">
      
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl shadow-xs border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            Billing & Invoices History (कर बीजक नोंदवही)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View, search, print bills, record partial payments, and dispatch WhatsApp invoices.
          </p>
        </div>

        <button
          onClick={onNewInvoiceClick}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition shadow-xs"
        >
          + Create New Bill (नवीन बिल)
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Total Billed Sales</span>
          <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">{formatCurrency(totalBilled)}</span>
          <span className="text-[11px] text-slate-400 mt-1 block">{invoices.length} Invoices generated</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-emerald-700 font-bold uppercase tracking-wider block">Payments Collected</span>
          <span className="text-2xl font-bold font-mono text-emerald-800 mt-1 block">{formatCurrency(totalReceived)}</span>
          <span className="text-[11px] text-emerald-600 mt-1 block">Realized in Cash / UPI</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs">
          <span className="text-[11px] text-amber-800 font-bold uppercase tracking-wider block">Total Outstanding Udhaar</span>
          <span className="text-2xl font-bold font-mono text-amber-900 mt-1 block">{formatCurrency(totalBalanceDue)}</span>
          <span className="text-[11px] text-amber-700 mt-1 block">Receivable from farmers</span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice number (e.g. KSK/2026/101), farmer name, phone..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-slate-50 font-medium"
            >
              <option value="all">All Payment Statuses</option>
              <option value="overdue">Overdue (बाकी मुदत संपलेली)</option>
              <option value="pending">With Outstanding Balance</option>
              <option value="partial">Partial Payment</option>
              <option value="paid">Fully Paid</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-slate-50 font-medium"
            >
              <option value="all">All Crop Seasons</option>
              <option value="Kharif">Kharif Season (खरीप)</option>
              <option value="Rabi">Rabi Season (रब्बी)</option>
              <option value="Zaid">Summer / Zaid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No invoices found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="p-3">Invoice No & Date</th>
                  <th className="p-3">Farmer Client</th>
                  <th className="p-3">Season & Items</th>
                  <th className="p-3 text-right">Grand Total</th>
                  <th className="p-3 text-right">Paid</th>
                  <th className="p-3 text-right">Balance Due</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredInvoices.map(inv => {
                  const isOverdue = inv.balanceDue > 0 && getDaysDiff(inv.dueDate) > 0;
                  const days = getDaysDiff(inv.dueDate);

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3">
                        <div className="font-bold text-slate-900 font-mono text-xs">{inv.invoiceNumber}</div>
                        <div className="text-[10px] text-slate-500">{formatDate(inv.invoiceDate)}</div>
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{inv.farmerName}</div>
                        <div className="text-[10px] text-slate-500">{inv.farmerVillage} • +91 {inv.farmerPhone}</div>
                      </td>

                      <td className="p-3">
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-medium mr-1.5">
                          {inv.seasonTag || 'General'}
                        </span>
                        <span className="text-[11px] text-slate-600">{inv.items.length} Products</span>
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(inv.grandTotal)}
                      </td>

                      <td className="p-3 text-right font-mono font-medium text-emerald-700">
                        {formatCurrency(inv.paidAmount)}
                      </td>

                      <td className="p-3 text-right font-mono font-bold">
                        <span className={inv.balanceDue > 0 ? (isOverdue ? 'text-rose-700' : 'text-amber-800') : 'text-slate-400'}>
                          {formatCurrency(inv.balanceDue)}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                          inv.paymentStatus === 'Paid' 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : isOverdue 
                            ? 'bg-rose-100 text-rose-800 border-rose-300' 
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          {inv.paymentStatus}
                          {isOverdue && ` (${days}d late)`}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onViewInvoice(inv)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition"
                            title="View / Print Bill"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleShareWhatsApp(inv)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition"
                            title="Share on WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          {inv.balanceDue > 0 && (
                            <button
                              onClick={() => onRecordPaymentClick(inv)}
                              className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded transition font-bold"
                              title="Record Payment"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (confirm(`Delete invoice ${inv.invoiceNumber}?`)) {
                                onDeleteInvoice(inv.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                            title="Delete Invoice"
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
        )}
      </div>

    </div>
  );
};
