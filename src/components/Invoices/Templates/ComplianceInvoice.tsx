import React from 'react';
import { Invoice, StoreSettings } from '../../../types';
import { formatCurrency, formatDate, numberToIndianWords, generateUpiQrUrl } from '../../../utils/formatters';

interface TemplateProps {
  invoice: Invoice;
  settings: StoreSettings;
}

export const ComplianceInvoice: React.FC<TemplateProps> = ({ invoice, settings }) => {
  const upiQr = generateUpiQrUrl(
    settings.upiId,
    settings.upiName || settings.storeName,
    invoice.balanceDue > 0 ? invoice.balanceDue : invoice.grandTotal,
    `Invoice ${invoice.invoiceNumber}`
  );

  return (
    <div className="bg-white text-slate-900 p-6 max-w-4xl mx-auto shadow-sm print:shadow-none print:p-2 border border-slate-300 text-xs font-sans" id="invoice-printable-area">
      {/* Statutory Header */}
      <div className="border-b-2 border-slate-800 pb-3">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Form M / Statutory Agricultural Cash-Credit Memo
            </span>
            <h1 className="text-xl font-black text-slate-900 uppercase">{settings.storeName}</h1>
            <p className="text-xs text-slate-700">{settings.address}, {settings.villageTown}, {settings.districtState}</p>
            <p className="text-xs text-slate-700 font-medium">Contact: {settings.phone} | Prop: {settings.ownerName}</p>
          </div>
          <div className="text-right">
            <span className="inline-block bg-slate-900 text-white font-mono font-bold text-xs px-2.5 py-1 rounded">
              STATUTORY AGRI INVOICE
            </span>
            <div className="mt-1 font-mono font-bold text-sm">No: {invoice.invoiceNumber}</div>
            <div className="text-xs text-slate-600">Date: {formatDate(invoice.invoiceDate)}</div>
          </div>
        </div>

        {/* 3 Licenses Box */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-slate-200 text-[11px] bg-slate-50 p-2 rounded">
          <div className="border-r border-slate-200 pr-2">
            <span className="font-bold block text-slate-700">1. Fertilizer Lic (FCO):</span>
            <span className="font-mono text-emerald-800 font-medium">{settings.fertilizerLicense}</span>
          </div>
          <div className="border-r border-slate-200 pr-2">
            <span className="font-bold block text-slate-700">2. Seed Lic (Seed Act 1966):</span>
            <span className="font-mono text-emerald-800 font-medium">{settings.seedLicense}</span>
          </div>
          <div>
            <span className="font-bold block text-slate-700">3. Insecticide Lic (CIB&RC):</span>
            <span className="font-mono text-emerald-800 font-medium">{settings.pesticideLicense}</span>
          </div>
        </div>
      </div>

      {/* Farmer and Land Info */}
      <div className="grid grid-cols-2 gap-4 border-b border-slate-300 py-3 text-xs">
        <div>
          <span className="font-bold uppercase text-[10px] text-slate-500 block">Cultivator / Buyer Information:</span>
          <div className="font-bold text-sm text-slate-900">{invoice.farmerName}</div>
          <div>Village / Taluka: <span className="font-medium">{invoice.farmerVillage}</span></div>
          <div>Mobile: <span className="font-medium">+91 {invoice.farmerPhone}</span></div>
        </div>
        <div className="text-right space-y-0.5">
          <div>GSTIN / UIN: <span className="font-mono font-bold">{settings.gstin}</span></div>
          <div>Season: <span className="font-bold">{invoice.seasonTag || 'Kharif'}</span></div>
          <div>Payment Terms: <span className="font-bold uppercase text-emerald-800">{invoice.paymentMode} ({invoice.paymentStatus})</span></div>
          {invoice.dueDate && <div>Due Date: <span className="font-bold text-rose-700">{formatDate(invoice.dueDate)}</span></div>}
        </div>
      </div>

      {/* Mandatory Batch, Expiry & Composition Table */}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left border-collapse border border-slate-300 text-[11px]">
          <thead>
            <tr className="bg-slate-100 text-slate-800 font-bold uppercase">
              <th className="p-1.5 border border-slate-300 w-8 text-center">#</th>
              <th className="p-1.5 border border-slate-300">Product Brand & Description</th>
              <th className="p-1.5 border border-slate-300 w-20">HSN</th>
              <th className="p-1.5 border border-slate-300 w-24">Batch No</th>
              <th className="p-1.5 border border-slate-300 w-20">Exp. Date</th>
              <th className="p-1.5 border border-slate-300 text-right w-14">Qty</th>
              <th className="p-1.5 border border-slate-300 text-right w-16">Rate</th>
              <th className="p-1.5 border border-slate-300 text-right w-12">GST%</th>
              <th className="p-1.5 border border-slate-300 text-right w-20">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={item.id} className="border-b border-slate-300">
                <td className="p-1.5 border border-slate-300 text-center">{index + 1}</td>
                <td className="p-1.5 border border-slate-300">
                  <div className="font-bold text-slate-900">{item.productName}</div>
                  <div className="text-[10px] text-slate-500">Mfr: {item.brand} | Cat: {item.category}</div>
                </td>
                <td className="p-1.5 border border-slate-300 font-mono text-[10px]">{item.hsnCode}</td>
                <td className="p-1.5 border border-slate-300 font-mono text-[10px] font-bold text-slate-700">{item.batchNo || 'N/A'}</td>
                <td className="p-1.5 border border-slate-300 font-mono text-[10px] text-slate-700">{item.expiryDate ? formatDate(item.expiryDate) : 'N/A'}</td>
                <td className="p-1.5 border border-slate-300 text-right font-bold">{item.quantity} {item.unit}</td>
                <td className="p-1.5 border border-slate-300 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                <td className="p-1.5 border border-slate-300 text-right">{item.taxRate}%</td>
                <td className="p-1.5 border border-slate-300 text-right font-bold font-mono">{formatCurrency(item.totalAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Statutory Certification & Totals */}
      <div className="grid grid-cols-12 gap-4 mt-3 border border-slate-300 p-3 rounded">
        <div className="col-span-7 flex flex-col justify-between space-y-2">
          <div>
            <span className="font-bold text-[10px] uppercase text-slate-500">Total in Words:</span>
            <p className="font-semibold text-slate-800 text-[11px] italic bg-slate-50 p-1.5 rounded border border-slate-200">
              {numberToIndianWords(invoice.grandTotal)}
            </p>
          </div>
          <div className="text-[10px] text-slate-600 bg-amber-50/50 p-2 rounded border border-amber-200">
            <strong>Statutory Declaration:</strong> We hereby certify that the seeds/fertilizers/pesticides supplied under this invoice conform to the germination, purity, and active ingredient specifications prescribed under the respective Acts and have been properly stored.
          </div>
        </div>

        <div className="col-span-5 space-y-1 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Taxable Value:</span>
            <span className="font-mono">{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Total GST:</span>
            <span className="font-mono">{formatCurrency(invoice.taxTotal)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm border-t border-slate-300 pt-1">
            <span>Bill Amount:</span>
            <span className="font-mono">{formatCurrency(invoice.grandTotal)}</span>
          </div>
          <div className="flex justify-between text-emerald-800 font-medium">
            <span>Paid Amount:</span>
            <span className="font-mono font-bold">{formatCurrency(invoice.paidAmount)}</span>
          </div>
          <div className="flex justify-between font-bold bg-slate-100 p-1 rounded text-red-700">
            <span>Outstanding Balance:</span>
            <span className="font-mono">{formatCurrency(invoice.balanceDue)}</span>
          </div>
        </div>
      </div>

      {/* Signature Strip */}
      <div className="flex justify-between items-end mt-6 pt-2 border-t border-slate-300 text-[11px]">
        <div className="text-center w-40">
          <div className="border-t border-slate-400 pt-1">Customer / Farmer's Signature</div>
        </div>
        <div className="text-center flex items-center gap-2">
          <img src={upiQr} alt="Scan QR" className="w-12 h-12 border border-slate-300 p-0.5" />
          <div className="text-left text-[10px]">
            <div>Pay via UPI: <strong>{settings.upiId}</strong></div>
            <div>Bank: {settings.bankName}</div>
          </div>
        </div>
        <div className="text-center w-48">
          <div className="border-t border-slate-400 pt-1 font-bold">
            For {settings.storeName}
            <div className="text-[10px] font-normal">Authorized Agri-Dealer Signatory</div>
          </div>
        </div>
      </div>
    </div>
  );
};
