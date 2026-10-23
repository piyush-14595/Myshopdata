import React from 'react';
import { Invoice, StoreSettings } from '../../../types';
import { formatCurrency, formatDate, numberToIndianWords, generateUpiQrUrl } from '../../../utils/formatters';
import { Sprout, Phone, Mail, MapPin, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface TemplateProps {
  invoice: Invoice;
  settings: StoreSettings;
}

export const ModernInvoice: React.FC<TemplateProps> = ({ invoice, settings }) => {
  const upiQr = generateUpiQrUrl(
    settings.upiId,
    settings.upiName || settings.storeName,
    invoice.balanceDue > 0 ? invoice.balanceDue : invoice.grandTotal,
    `Invoice ${invoice.invoiceNumber}`
  );

  return (
    <div className="bg-white text-slate-800 p-8 max-w-4xl mx-auto shadow-sm print:shadow-none print:p-4 print:max-w-none text-sm font-sans" id="invoice-printable-area">
      {/* Top Header Banner */}
      <div className="border-b-2 border-emerald-600 pb-6 mb-6">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm flex-shrink-0 print:border print:border-emerald-600">
              <Sprout className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{settings.storeName}</h1>
              </div>
              {settings.storeHindiName && (
                <p className="text-emerald-800 font-semibold text-base">{settings.storeHindiName}</p>
              )}
              <p className="text-xs text-slate-600 italic mt-0.5">{settings.tagline}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-emerald-600" /> {settings.address}, {settings.villageTown}, {settings.districtState}</span>
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-emerald-600" /> +91 {settings.phone}</span>
                {settings.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-emerald-600" /> {settings.email}</span>}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="inline-block bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded mb-2">
              TAX INVOICE
            </div>
            <div className="text-lg font-bold text-slate-900">{invoice.invoiceNumber}</div>
            <div className="text-xs text-slate-500 mt-1">Date: <span className="font-semibold text-slate-700">{formatDate(invoice.invoiceDate)}</span></div>
            {invoice.dueDate && (
              <div className="text-xs text-slate-500">
                Payment Due: <span className="font-semibold text-amber-700">{formatDate(invoice.dueDate)}</span>
              </div>
            )}
            {invoice.seasonTag && (
              <div className="text-xs inline-block mt-1 font-medium bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                Season: {invoice.seasonTag}
              </div>
            )}
          </div>
        </div>

        {/* Regulatory License Strip */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap justify-between text-[11px] text-slate-600 bg-slate-50 p-2 rounded">
          <span><strong>GSTIN:</strong> {settings.gstin || 'Unregistered'}</span>
          <span><strong>Fertilizer Lic:</strong> {settings.fertilizerLicense}</span>
          <span><strong>Seed Lic:</strong> {settings.seedLicense}</span>
          <span><strong>Pesticide Lic:</strong> {settings.pesticideLicense}</span>
        </div>
      </div>

      {/* Bill To / Farmer Details */}
      <div className="grid grid-cols-2 gap-6 bg-emerald-50/40 p-4 rounded-lg border border-emerald-100 mb-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
            Bill To (ग्राहक / शेतकरी तपशील):
          </span>
          <div className="font-bold text-slate-900 text-base">{invoice.farmerName}</div>
          <div className="text-xs text-slate-600 mt-0.5">Village / Address: <span className="font-medium text-slate-800">{invoice.farmerVillage}</span></div>
          <div className="text-xs text-slate-600">Mobile No: <span className="font-medium text-slate-800">+91 {invoice.farmerPhone}</span></div>
        </div>

        <div className="text-right flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Payment Status</span>
            <span className={`inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-full border ${
              invoice.paymentStatus === 'Paid' 
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : invoice.paymentStatus === 'Overdue'
                ? 'bg-rose-100 text-rose-800 border-rose-300'
                : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}>
              {invoice.paymentStatus === 'Paid' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {invoice.paymentStatus.toUpperCase()} ({invoice.paymentMode})
            </span>
          </div>
          {invoice.notes && (
            <div className="text-xs text-slate-500 italic mt-2">
              Note: {invoice.notes}
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-left border-collapse border border-slate-200">
          <thead>
            <tr className="bg-slate-100 text-slate-700 text-xs uppercase tracking-wider">
              <th className="p-2.5 border border-slate-200 w-10 text-center">#</th>
              <th className="p-2.5 border border-slate-200">Item Description & Brand</th>
              <th className="p-2.5 border border-slate-200 w-24">HSN/SAC</th>
              <th className="p-2.5 border border-slate-200 w-24">Batch / Exp</th>
              <th className="p-2.5 border border-slate-200 text-right w-16">Qty</th>
              <th className="p-2.5 border border-slate-200 text-right w-20">Rate</th>
              <th className="p-2.5 border border-slate-200 text-right w-16">GST%</th>
              <th className="p-2.5 border border-slate-200 text-right w-24">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {invoice.items.map((item, index) => (
              <tr key={item.id} className="hover:bg-slate-50/50">
                <td className="p-2.5 border border-slate-200 text-center font-medium text-slate-500">{index + 1}</td>
                <td className="p-2.5 border border-slate-200 font-medium text-slate-900">
                  <div>{item.productName}</div>
                  <div className="text-[11px] text-slate-500 font-normal">{item.brand} • {item.category}</div>
                </td>
                <td className="p-2.5 border border-slate-200 font-mono text-[11px] text-slate-600">{item.hsnCode}</td>
                <td className="p-2.5 border border-slate-200 text-[11px] text-slate-600">
                  {item.batchNo ? <div>B: {item.batchNo}</div> : '—'}
                  {item.expiryDate && <div className="text-slate-400">E: {formatDate(item.expiryDate)}</div>}
                </td>
                <td className="p-2.5 border border-slate-200 text-right font-medium">{item.quantity} {item.unit}</td>
                <td className="p-2.5 border border-slate-200 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                <td className="p-2.5 border border-slate-200 text-right text-slate-600">{item.taxRate}%</td>
                <td className="p-2.5 border border-slate-200 text-right font-bold text-slate-900 font-mono">{formatCurrency(item.totalAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary and Payment Breakdown */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        {/* Left Side: Amount in Words, Bank & UPI info */}
        <div className="col-span-7 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-wider block font-semibold mb-0.5">Amount in Words:</span>
            <p className="text-xs font-semibold text-slate-800 italic bg-slate-50 p-2.5 rounded border border-slate-200">
              {numberToIndianWords(invoice.grandTotal)}
            </p>
          </div>

          <div className="flex gap-4 items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="bg-white p-1 rounded shadow-xs border border-slate-200 flex-shrink-0">
              <img src={upiQr} alt="Scan & Pay UPI" className="w-24 h-24 object-contain" />
              <div className="text-[9px] text-center font-bold text-slate-600 mt-0.5">Scan to Pay UPI</div>
            </div>
            <div className="text-xs space-y-0.5 text-slate-600">
              <div className="font-bold text-slate-900 text-xs">Direct Bank / UPI Transfer</div>
              <div>UPI ID: <span className="font-mono font-semibold text-emerald-700">{settings.upiId}</span></div>
              <div>Bank: <span className="font-medium text-slate-800">{settings.bankName}</span></div>
              <div>A/C No: <span className="font-mono font-medium text-slate-800">{settings.bankAccountNo}</span></div>
              <div>IFSC: <span className="font-mono font-medium text-slate-800">{settings.bankIfsc}</span></div>
            </div>
          </div>
        </div>

        {/* Right Side: Totals Card */}
        <div className="col-span-5 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs space-y-2">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal (Excl. Tax):</span>
            <span className="font-mono">{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>GST / Tax Total:</span>
            <span className="font-mono">{formatCurrency(invoice.taxTotal)}</span>
          </div>
          {invoice.discountTotal > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Total Discount:</span>
              <span className="font-mono">-{formatCurrency(invoice.discountTotal)}</span>
            </div>
          )}
          {invoice.roundOff !== 0 && (
            <div className="flex justify-between text-slate-500">
              <span>Round Off:</span>
              <span className="font-mono">{invoice.roundOff > 0 ? `+${invoice.roundOff.toFixed(2)}` : invoice.roundOff.toFixed(2)}</span>
            </div>
          )}

          <div className="border-t border-slate-300 pt-2 flex justify-between text-base font-bold text-slate-900">
            <span>Grand Total:</span>
            <span className="text-emerald-700">{formatCurrency(invoice.grandTotal)}</span>
          </div>

          <div className="border-t border-dashed border-slate-300 pt-2 flex justify-between text-slate-700 font-medium">
            <span>Amount Paid:</span>
            <span className="text-emerald-800 font-bold font-mono">{formatCurrency(invoice.paidAmount)}</span>
          </div>

          <div className="flex justify-between text-sm font-bold bg-amber-50 p-2 rounded border border-amber-200 text-amber-900">
            <span>Balance Due (बाकी):</span>
            <span className="font-mono text-amber-900">{formatCurrency(invoice.balanceDue)}</span>
          </div>
        </div>
      </div>

      {/* Terms & Signature Section */}
      <div className="border-t border-slate-200 pt-4 grid grid-cols-12 gap-4 text-[11px] text-slate-500">
        <div className="col-span-8">
          <p className="font-bold text-slate-700 mb-1">Terms & Conditions (नियम व अटी):</p>
          <ul className="list-disc pl-4 space-y-0.5">
            {settings.termsAndConditions.slice(0, 3).map((term, i) => (
              <li key={i}>{term}</li>
            ))}
          </ul>
        </div>
        <div className="col-span-4 text-center flex flex-col justify-end items-center">
          <div className="h-10"></div>
          <div className="border-t border-slate-400 w-44 pt-1 font-semibold text-slate-800">
            For {settings.storeName}
          </div>
          <div className="text-[10px] text-slate-500">Authorized Signatory / मुहर</div>
        </div>
      </div>

      <div className="mt-4 pt-2 border-t border-slate-100 text-center text-[11px] text-slate-400 font-medium flex items-center justify-center gap-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        Authorized Agricultural Input Dealer • जय किसान!
      </div>
    </div>
  );
};
