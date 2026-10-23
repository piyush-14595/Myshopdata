import React from 'react';
import { Invoice, StoreSettings } from '../../../types';
import { formatCurrency, formatDate, numberToIndianWords, generateUpiQrUrl } from '../../../utils/formatters';

interface TemplateProps {
  invoice: Invoice;
  settings: StoreSettings;
}

export const ClassicInvoice: React.FC<TemplateProps> = ({ invoice, settings }) => {
  const upiQr = generateUpiQrUrl(
    settings.upiId,
    settings.upiName || settings.storeName,
    invoice.balanceDue > 0 ? invoice.balanceDue : invoice.grandTotal,
    `Invoice ${invoice.invoiceNumber}`
  );

  return (
    <div className="bg-white text-black p-6 max-w-4xl mx-auto shadow-sm print:shadow-none print:p-2 border-2 border-black text-xs font-serif" id="invoice-printable-area">
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-3">
        <div className="text-[10px] uppercase font-bold tracking-widest text-slate-700">॥ श्री गणेशाय नमः ॥ जय किसान ॥</div>
        <h1 className="text-2xl font-black uppercase tracking-wide mt-1">{settings.storeHindiName || settings.storeName}</h1>
        <h2 className="text-lg font-bold">{settings.storeName}</h2>
        <p className="text-xs italic">{settings.tagline}</p>
        <p className="text-xs mt-1">{settings.address}, {settings.villageTown}, {settings.districtState}</p>
        <p className="text-xs font-mono font-bold mt-0.5">Mob: {settings.phone} {settings.alternatePhone ? `| ${settings.alternatePhone}` : ''}</p>
        
        <div className="flex justify-between border-t border-black mt-2 pt-1 font-sans text-[11px] font-semibold px-2">
          <span>GSTIN: {settings.gstin}</span>
          <span>खाद परवाना: {settings.fertilizerLicense}</span>
          <span>बीज परवाना: {settings.seedLicense}</span>
          <span>कीटकनाशक परवाना: {settings.pesticideLicense}</span>
        </div>
      </div>

      <div className="text-center py-1 font-bold tracking-widest border-b-2 border-black bg-slate-100 text-sm font-sans uppercase">
        कर बीजक / TAX INVOICE (CASH / CREDIT MEMO)
      </div>

      {/* Bill Meta */}
      <div className="grid grid-cols-2 border-b-2 border-black font-sans">
        <div className="p-2 border-r border-black">
          <div><strong className="font-serif">M/s / Shri (शेतकरी नाव):</strong> <span className="font-bold text-sm">{invoice.farmerName}</span></div>
          <div><strong>Village / पत्ता:</strong> {invoice.farmerVillage}</div>
          <div><strong>Mobile / फोन:</strong> {invoice.farmerPhone}</div>
          <div><strong>Season:</strong> {invoice.seasonTag || 'Kharif'}</div>
        </div>
        <div className="p-2 text-right">
          <div><strong>Invoice No. (बिल क्र.):</strong> <span className="font-mono font-bold text-sm">{invoice.invoiceNumber}</span></div>
          <div><strong>Date (दिनांक):</strong> {formatDate(invoice.invoiceDate)}</div>
          {invoice.dueDate && (
            <div><strong>Due Date (मुदत):</strong> <span className="text-red-700 font-bold">{formatDate(invoice.dueDate)}</span></div>
          )}
          <div><strong>Payment Mode:</strong> <span className="uppercase font-bold">{invoice.paymentMode} ({invoice.paymentStatus})</span></div>
        </div>
      </div>

      {/* Table */}
      <table className="w-full border-collapse border-b-2 border-black font-sans text-xs">
        <thead>
          <tr className="border-b border-black bg-slate-50 font-bold text-left">
            <th className="border-r border-black p-1.5 text-center w-8">क्र.</th>
            <th className="border-r border-black p-1.5">मालाचे विवरण (Particulars / Brand)</th>
            <th className="border-r border-black p-1.5 w-20">HSN Code</th>
            <th className="border-r border-black p-1.5 w-24">बॅच / Exp.</th>
            <th className="border-r border-black p-1.5 text-right w-16">नग (Qty)</th>
            <th className="border-r border-black p-1.5 text-right w-20">दर (Rate)</th>
            <th className="p-1.5 text-right w-24">रक्कम (Amount)</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, idx) => (
            <tr key={item.id} className="border-b border-slate-300">
              <td className="border-r border-black p-1.5 text-center font-bold">{idx + 1}</td>
              <td className="border-r border-black p-1.5">
                <span className="font-bold">{item.productName}</span> ({item.brand})
              </td>
              <td className="border-r border-black p-1.5 font-mono">{item.hsnCode}</td>
              <td className="border-r border-black p-1.5 font-mono text-[10px]">
                {item.batchNo || '—'} {item.expiryDate ? `(${formatDate(item.expiryDate)})` : ''}
              </td>
              <td className="border-r border-black p-1.5 text-right font-bold">{item.quantity} {item.unit}</td>
              <td className="border-r border-black p-1.5 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
              <td className="p-1.5 text-right font-bold font-mono">{formatCurrency(item.totalAmount)}</td>
            </tr>
          ))}
          {/* Fill blank rows if less than 5 items for classic ledger feel */}
          {invoice.items.length < 4 && Array.from({ length: 4 - invoice.items.length }).map((_, i) => (
            <tr key={`blank-${i}`} className="border-b border-slate-200 h-6">
              <td className="border-r border-black"></td>
              <td className="border-r border-black"></td>
              <td className="border-r border-black"></td>
              <td className="border-r border-black"></td>
              <td className="border-r border-black"></td>
              <td className="border-r border-black"></td>
              <td></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals Section */}
      <div className="grid grid-cols-12 border-b-2 border-black font-sans">
        <div className="col-span-7 p-2 border-r border-black flex flex-col justify-between">
          <div>
            <strong>Amount in Words (अक्षरी रुपये):</strong>
            <div className="font-serif italic font-bold mt-1 text-slate-800">{numberToIndianWords(invoice.grandTotal)}</div>
          </div>
          
          <div className="flex items-center gap-3 mt-3 pt-2 border-t border-slate-300">
            <img src={upiQr} alt="Scan QR" className="w-16 h-16 border border-black p-0.5" />
            <div className="text-[11px] leading-tight">
              <div className="font-bold">UPI Payment: {settings.upiId}</div>
              <div>Bank: {settings.bankName} | A/C: {settings.bankAccountNo}</div>
              <div>IFSC: {settings.bankIfsc}</div>
            </div>
          </div>
        </div>

        <div className="col-span-5 p-2 space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Subtotal (एकूण किंमत):</span>
            <span className="font-mono">{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>GST / कर:</span>
            <span className="font-mono">{formatCurrency(invoice.taxTotal)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm border-t border-black pt-1">
            <span>Grand Total (एकूण बिल):</span>
            <span className="font-mono">{formatCurrency(invoice.grandTotal)}</span>
          </div>
          <div className="flex justify-between border-t border-dashed border-slate-400 pt-1">
            <span>Amount Paid (जमा रक्कम):</span>
            <span className="font-mono font-bold text-emerald-800">{formatCurrency(invoice.paidAmount)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm bg-slate-100 p-1 rounded">
            <span>Balance Due (उधारी बाकी):</span>
            <span className="font-mono text-red-700">{formatCurrency(invoice.balanceDue)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="grid grid-cols-12 p-2 pt-3 font-sans text-[11px]">
        <div className="col-span-8 text-[10px] space-y-0.5">
          <p className="font-bold">नियम व अटी (Terms):</p>
          <p>1. विकलेला माल परत घेतला जाणार नाही.</p>
          <p>2. कीटकनाशके व रसायने मुलांपासून लांब ठेवावीत.</p>
          <p>3. उधारीची रक्कम दिलेल्या मुदतीत जमा करणे बंधनकारक आहे.</p>
        </div>
        <div className="col-span-4 text-center flex flex-col justify-between items-center h-20">
          <div className="text-[10px]">ग्राहक सही (Customer Sign)</div>
          <div className="font-bold border-t border-black w-36 pt-1">
            For {settings.storeName}
            <div className="text-[9px] font-normal">अधिकृत स्वाक्षरी</div>
          </div>
        </div>
      </div>
    </div>
  );
};
