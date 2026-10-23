import React from 'react';
import { Invoice, StoreSettings } from '../../../types';
import { formatCurrency, formatDate, generateUpiQrUrl } from '../../../utils/formatters';

interface TemplateProps {
  invoice: Invoice;
  settings: StoreSettings;
}

export const ThermalSlip: React.FC<TemplateProps> = ({ invoice, settings }) => {
  const upiQr = generateUpiQrUrl(
    settings.upiId,
    settings.upiName || settings.storeName,
    invoice.balanceDue > 0 ? invoice.balanceDue : invoice.grandTotal,
    `POS ${invoice.invoiceNumber}`
  );

  return (
    <div className="bg-white text-black p-4 max-w-[340px] mx-auto shadow-sm print:shadow-none print:p-0 print:max-w-none text-xs font-mono border border-slate-300 print:border-none" id="invoice-printable-area">
      {/* Store Header */}
      <div className="text-center space-y-0.5">
        <div className="font-bold text-sm tracking-wider">{settings.storeName}</div>
        {settings.storeHindiName && <div className="text-xs">{settings.storeHindiName}</div>}
        <div className="text-[10px]">{settings.address}</div>
        <div className="text-[10px]">Ph: {settings.phone}</div>
        <div className="text-[10px]">GSTIN: {settings.gstin}</div>
        <div className="text-[10px]">Fert Lic: {settings.fertilizerLicense}</div>
      </div>

      <div className="my-2 border-b border-dashed border-black"></div>

      {/* Invoice Meta */}
      <div className="text-[11px] space-y-0.5">
        <div className="flex justify-between">
          <span>Inv: <strong>{invoice.invoiceNumber}</strong></span>
          <span>Date: {formatDate(invoice.invoiceDate)}</span>
        </div>
        <div>Farmer: <strong>{invoice.farmerName}</strong></div>
        <div className="flex justify-between">
          <span>Village: {invoice.farmerVillage}</span>
          <span>Ph: {invoice.farmerPhone.slice(-5).padStart(10, '*')}</span>
        </div>
        {invoice.dueDate && (
          <div className="text-red-600 font-bold">Due Date: {formatDate(invoice.dueDate)}</div>
        )}
      </div>

      <div className="my-2 border-b border-dashed border-black"></div>

      {/* Itemized Table */}
      <table className="w-full text-left text-[11px]">
        <thead>
          <tr className="border-b border-black">
            <th className="pb-1">Item</th>
            <th className="pb-1 text-center">Qty</th>
            <th className="pb-1 text-right">Rate</th>
            <th className="pb-1 text-right">Amt</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dotted divide-slate-300">
          {invoice.items.map((item) => (
            <tr key={item.id}>
              <td className="py-1">
                <div className="font-bold leading-tight">{item.productName}</div>
                {item.batchNo && <div className="text-[9px] text-slate-600">B:{item.batchNo}</div>}
              </td>
              <td className="py-1 text-center whitespace-nowrap">{item.quantity}</td>
              <td className="py-1 text-right">{item.unitPrice}</td>
              <td className="py-1 text-right font-bold">{Math.round(item.totalAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="my-2 border-b border-dashed border-black"></div>

      {/* Summary */}
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(invoice.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax/GST:</span>
          <span>{formatCurrency(invoice.taxTotal)}</span>
        </div>
        {invoice.discountTotal > 0 && (
          <div className="flex justify-between text-emerald-700">
            <span>Discount:</span>
            <span>-{formatCurrency(invoice.discountTotal)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-bold border-t border-black pt-1">
          <span>TOTAL:</span>
          <span>{formatCurrency(invoice.grandTotal)}</span>
        </div>
        <div className="flex justify-between text-[11px] pt-0.5">
          <span>Paid ({invoice.paymentMode}):</span>
          <span>{formatCurrency(invoice.paidAmount)}</span>
        </div>
        <div className="flex justify-between font-bold text-xs bg-slate-100 p-1">
          <span>BALANCE DUE:</span>
          <span className="text-red-700">{formatCurrency(invoice.balanceDue)}</span>
        </div>
      </div>

      <div className="my-2 border-b border-dashed border-black"></div>

      {/* QR Code */}
      <div className="text-center py-1">
        <img src={upiQr} alt="Scan UPI" className="w-24 h-24 mx-auto border border-black p-0.5" />
        <div className="text-[10px] font-bold mt-1">Scan to Pay via UPI</div>
        <div className="text-[9px]">{settings.upiId}</div>
      </div>

      <div className="my-2 border-b border-dashed border-black"></div>

      {/* Footer */}
      <div className="text-center text-[10px] space-y-0.5">
        <div>Thank you! Visit again.</div>
        <div className="font-bold">जय जवान, जय किसान!</div>
        <div className="text-[8px] text-slate-500">POS System • KisanKendra</div>
      </div>
    </div>
  );
};
