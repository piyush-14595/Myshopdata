import React, { useState } from 'react';
import { Invoice, StoreSettings } from '../../types';
import { formatCurrency, formatDate, getDaysDiff, generatePaymentReminderMessage } from '../../utils/formatters';
import { 
  BellRing, Share2, Copy, Check, Clock, AlertTriangle, 
  Send, User, Phone, CheckCircle2, FileText, ChevronRight, MessageSquare
} from 'lucide-react';

interface Props {
  invoices: Invoice[];
  settings: StoreSettings;
  onUpdateInvoice: (invoice: Invoice) => void;
  onRecordPaymentClick: (invoice: Invoice) => void;
  onViewInvoice: (invoice: Invoice) => void;
}

export const LatePaymentCenter: React.FC<Props> = ({
  invoices,
  settings,
  onUpdateInvoice,
  onRecordPaymentClick,
  onViewInvoice
}) => {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [templateType, setTemplateType] = useState<'polite' | 'harvest' | 'firm' | 'hindi'>('hindi');
  const [customText, setCustomText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Find all unpaid or partially paid invoices with balance
  const pendingInvoices = invoices.filter(inv => inv.balanceDue > 0);

  // Categorize by overdue status
  const overdueInvoices = pendingInvoices.filter(inv => {
    const days = getDaysDiff(inv.dueDate);
    return days > 0;
  }).sort((a, b) => getDaysDiff(b.dueDate) - getDaysDiff(a.dueDate));

  const criticalOverdue = overdueInvoices.filter(inv => getDaysDiff(inv.dueDate) > 30);
  const dueSoonInvoices = pendingInvoices.filter(inv => {
    const days = getDaysDiff(inv.dueDate);
    return days <= 0 && days >= -7;
  });

  const totalOverdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

  // Default selection
  const currentInvoice = invoices.find(inv => inv.id === selectedInvoiceId) || overdueInvoices[0] || pendingInvoices[0];

  // Update preview message when selection or template changes
  React.useEffect(() => {
    if (currentInvoice) {
      const days = getDaysDiff(currentInvoice.dueDate);
      const generated = generatePaymentReminderMessage(
        templateType,
        currentInvoice.farmerName,
        settings.storeName,
        currentInvoice.invoiceNumber,
        currentInvoice.balanceDue,
        currentInvoice.dueDate,
        days,
        settings.upiId,
        settings.phone
      );
      setCustomText(generated);
    }
  }, [currentInvoice?.id, templateType, settings]);

  const handleSendWhatsApp = () => {
    if (!currentInvoice) return;
    const cleanPhone = currentInvoice.farmerPhone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(customText)}`;
    
    // Mark reminder as sent
    const updated: Invoice = {
      ...currentInvoice,
      lastReminderSentAt: new Date().toISOString().split('T')[0],
      reminderCount: (currentInvoice.reminderCount || 0) + 1
    };
    onUpdateInvoice(updated);

    window.open(url, '_blank');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(customText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-[calc(100vh-80px)] text-slate-800">
      
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl shadow-xs border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BellRing className="w-5 h-5 text-amber-600" />
            Late Payment & Khata Reminder Center (उधारी वसुली स्मरणपत्र)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated WhatsApp reminders, overdue tracking, and fast debt collection for agricultural inputs.
          </p>
        </div>

        {/* Overview Stats */}
        <div className="flex items-center gap-3">
          <div className="bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg text-right">
            <span className="text-[10px] uppercase font-bold text-rose-700 block">Total Overdue Udhaar</span>
            <span className="text-base font-bold font-mono text-rose-900">{formatCurrency(totalOverdueAmount)}</span>
          </div>
          <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-right">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">Overdue Invoices</span>
            <span className="text-base font-bold font-mono text-amber-900">{overdueInvoices.length} Bills</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Side: Overdue Invoices List (5 cols) */}
        <div className="col-span-12 lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center text-xs font-bold text-slate-700">
              <span>Pending & Overdue Bills ({overdueInvoices.length})</span>
              <span className="text-[11px] font-normal text-slate-500">Sorted by days late</span>
            </div>

            {overdueInvoices.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No Overdue Bills!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">All customer payments are currently on time.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[calc(100vh-260px)] overflow-y-auto">
                {overdueInvoices.map(inv => {
                  const days = getDaysDiff(inv.dueDate);
                  const isSelected = (currentInvoice?.id === inv.id);
                  const isCritical = days > 30;

                  return (
                    <button
                      key={inv.id}
                      onClick={() => setSelectedInvoiceId(inv.id)}
                      className={`w-full text-left p-3.5 transition flex flex-col gap-1.5 ${
                        isSelected ? 'bg-amber-50/80 border-l-4 border-amber-600' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-xs text-slate-900">{inv.farmerName}</div>
                          <div className="text-[11px] text-slate-500">{inv.farmerVillage} • Ph: {inv.farmerPhone}</div>
                        </div>

                        <div className="text-right">
                          <div className="font-mono font-bold text-xs text-rose-700">{formatCurrency(inv.balanceDue)}</div>
                          <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            isCritical ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}>
                            {days} Days Late
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                        <span>Inv #{inv.invoiceNumber} (Due: {formatDate(inv.dueDate)})</span>
                        {inv.lastReminderSentAt ? (
                          <span className="text-emerald-700 font-medium">
                            Reminded {inv.reminderCount}x (Last: {formatDate(inv.lastReminderSentAt)})
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No reminder sent yet</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Due Soon Section */}
          {dueSoonInvoices.length > 0 && (
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-3">
              <h3 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Upcoming Dues in Next 7 Days ({dueSoonInvoices.length})
              </h3>
              <div className="space-y-1.5">
                {dueSoonInvoices.map(inv => (
                  <div key={inv.id} className="flex justify-between items-center text-xs p-2 bg-blue-50/50 rounded border border-blue-100">
                    <div>
                      <span className="font-semibold text-slate-900">{inv.farmerName}</span>
                      <span className="text-slate-500 text-[11px] ml-1">({inv.farmerVillage})</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-800">{formatCurrency(inv.balanceDue)}</span>
                      <div className="text-[10px] text-blue-700">Due: {formatDate(inv.dueDate)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Notification Customizer & 1-Click WhatsApp Sender (7 cols) */}
        <div className="col-span-12 lg:col-span-7 space-y-4">
          {currentInvoice ? (
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
              
              {/* Selected Bill Card */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">{currentInvoice.farmerName}</h2>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      Inv #{currentInvoice.invoiceNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Village: {currentInvoice.farmerVillage} • Phone: +91 {currentInvoice.farmerPhone}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewInvoice(currentInvoice)}
                    className="text-xs text-slate-600 hover:text-slate-900 underline px-2 py-1"
                  >
                    View Original Bill
                  </button>
                  <button
                    onClick={() => onRecordPaymentClick(currentInvoice)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                  >
                    Record Payment
                  </button>
                </div>
              </div>

              {/* Debt & Late Penalty Details */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Balance Due</span>
                  <span className="font-mono font-bold text-sm text-rose-700">{formatCurrency(currentInvoice.balanceDue)}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Due Date</span>
                  <span className="font-semibold text-slate-800">{formatDate(currentInvoice.dueDate)}</span>
                  <div className="text-[10px] text-rose-600 font-bold">{getDaysDiff(currentInvoice.dueDate)} Days Overdue</div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Late Interest (@1.5%)</span>
                  <span className="font-mono font-semibold text-slate-700">
                    +{formatCurrency(Math.max(0, (currentInvoice.balanceDue * 0.015 * (getDaysDiff(currentInvoice.dueDate) / 30))))}
                  </span>
                </div>
              </div>

              {/* Template Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  Choose Message Tone / Template (संदेश नमुना निवडा):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setTemplateType('hindi')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-medium border text-center transition ${
                      templateType === 'hindi' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🇮🇳 Hindi Friendly (विनम्र)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateType('harvest')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-medium border text-center transition ${
                      templateType === 'harvest' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🌾 Harvest Season (फसल कटाई)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateType('polite')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-medium border text-center transition ${
                      templateType === 'polite' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Gentle English
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateType('firm')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-medium border text-center transition ${
                      templateType === 'firm' ? 'bg-rose-700 text-white border-rose-700 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ⚠️ Urgent Notice (कडक)
                  </button>
                </div>
              </div>

              {/* Editable Message Box */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-semibold text-slate-600">
                    Message Preview (You can edit before sending):
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy Text'}
                  </button>
                </div>
                <textarea
                  rows={8}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="w-full text-xs p-3 font-sans border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 leading-relaxed bg-slate-50/50"
                />
              </div>

              {/* Bottom Send Button */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-500">
                  Target Mobile: <strong className="text-slate-800">+91 {currentInvoice.farmerPhone}</strong>
                </div>

                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm transition"
                >
                  <Send className="w-4 h-4" />
                  Send WhatsApp Reminder Now
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-12 text-center text-slate-400">
              Select an overdue invoice from the list on the left to prepare reminder.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
