import React, { useState } from 'react';
import { Invoice, StoreSettings, InvoiceTemplateType } from '../../types';
import { ModernInvoice } from './Templates/ModernInvoice';
import { ClassicInvoice } from './Templates/ClassicInvoice';
import { ThermalSlip } from './Templates/ThermalSlip';
import { ComplianceInvoice } from './Templates/ComplianceInvoice';
import { Printer, Share2, X, FileText, CheckCircle, Receipt, ArrowLeft } from 'lucide-react';
import { formatCurrency, generatePaymentReminderMessage } from '../../utils/formatters';

interface Props {
  invoice: Invoice;
  settings: StoreSettings;
  onClose: () => void;
  onRecordPaymentClick?: (invoice: Invoice) => void;
}

export const InvoiceViewModal: React.FC<Props> = ({
  invoice,
  settings,
  onClose,
  onRecordPaymentClick
}) => {
  const [template, setTemplate] = useState<InvoiceTemplateType>(settings.defaultTemplate || 'modern');
  const [copiedNotification, setCopiedNotification] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
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

  const handleCopyBillDetails = () => {
    const text = `Invoice #${invoice.invoiceNumber}\nFarmer: ${invoice.farmerName} (${invoice.farmerVillage})\nTotal: ${formatCurrency(invoice.grandTotal)}\nPaid: ${formatCurrency(invoice.paidAmount)}\nBalance Due: ${formatCurrency(invoice.balanceDue)}\nStatus: ${invoice.paymentStatus}\nStore: ${settings.storeName} (${settings.phone})`;
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overflow-y-auto flex items-start justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-slate-100 rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden my-4 print:my-0 print:border-none print:shadow-none print:w-full print:max-w-none">
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
              title="Close modal"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">{invoice.invoiceNumber}</h3>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                  invoice.paymentStatus === 'Paid' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {invoice.paymentStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400">{invoice.farmerName} • {invoice.farmerVillage}</p>
            </div>
          </div>

          {/* Template Switcher Tabs */}
          <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
            <span className="text-[11px] text-slate-400 px-2 hidden sm:inline">Template:</span>
            <button
              onClick={() => setTemplate('modern')}
              className={`px-2.5 py-1 rounded font-medium transition ${template === 'modern' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'}`}
            >
              Modern
            </button>
            <button
              onClick={() => setTemplate('classic')}
              className={`px-2.5 py-1 rounded font-medium transition ${template === 'classic' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'}`}
            >
              Classic Mandi
            </button>
            <button
              onClick={() => setTemplate('compliance')}
              className={`px-2.5 py-1 rounded font-medium transition ${template === 'compliance' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'}`}
            >
              Agri Statutory
            </button>
            <button
              onClick={() => setTemplate('thermal')}
              className={`px-2.5 py-1 rounded font-medium transition ${template === 'thermal' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'}`}
            >
              Thermal POS (80mm)
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {invoice.balanceDue > 0 && onRecordPaymentClick && (
              <button
                onClick={() => onRecordPaymentClick(invoice)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-xs"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Receive Payment
              </button>
            )}

            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
              title="Share via WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              WhatsApp Bill
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / PDF
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)] print:max-h-none print:p-0">
          {template === 'modern' && <ModernInvoice invoice={invoice} settings={settings} />}
          {template === 'classic' && <ClassicInvoice invoice={invoice} settings={settings} />}
          {template === 'compliance' && <ComplianceInvoice invoice={invoice} settings={settings} />}
          {template === 'thermal' && <ThermalSlip invoice={invoice} settings={settings} />}
        </div>

        {/* Bottom bar */}
        <div className="bg-slate-200/80 p-3 border-t border-slate-300 flex justify-between items-center text-xs text-slate-600 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-medium">Total: {formatCurrency(invoice.grandTotal)}</span>
            <span>•</span>
            <span className={invoice.balanceDue > 0 ? 'text-amber-800 font-bold' : 'text-emerald-700 font-medium'}>
              Balance Due: {formatCurrency(invoice.balanceDue)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {copiedNotification && (
              <span className="text-emerald-700 font-medium text-xs flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Summary copied!
              </span>
            )}
            <button
              onClick={handleCopyBillDetails}
              className="hover:text-slate-900 underline text-xs"
            >
              Copy Summary
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
