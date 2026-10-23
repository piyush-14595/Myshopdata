import React, { useState } from 'react';
import { StoreSettings, InvoiceTemplateType } from '../../types';
import { exportFullBackup, importBackupData, resetDemoData } from '../../utils/storage';
import { 
  Settings, Building2, ShieldCheck, QrCode, FileText, 
  Download, Upload, RotateCcw, Check, X, Sparkles
} from 'lucide-react';

interface Props {
  settings: StoreSettings;
  onSaveSettings: (settings: StoreSettings) => void;
  onClose: () => void;
  onDataReset: () => void;
}

export const StoreSettingsModal: React.FC<Props> = ({
  settings,
  onSaveSettings,
  onClose,
  onDataReset
}) => {
  const [activeTab, setActiveTab] = useState<'store' | 'licenses' | 'bank' | 'template' | 'backup'>('store');
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [termsText, setTermsText] = useState<string>(settings.termsAndConditions.join('\n'));
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: StoreSettings = {
      ...formData,
      termsAndConditions: termsText.split('\n').filter(t => t.trim().length > 0)
    };
    onSaveSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1000);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(exportFullBackup());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `krushi_kendra_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importBackupData(content);
        if (ok) {
          alert('Backup restored successfully!');
          onDataReset();
          onClose();
        } else {
          alert('Failed to import backup file. Invalid format.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all data back to the default Krushi Sewa Kendra sample records? Any custom invoices or products created will be replaced.')) {
      resetDemoData();
      onDataReset();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col text-xs text-slate-800">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold">Krushi Kendra Store & Billing Settings (दुकान व बिल सेटिंग्ज)</h2>
              <p className="text-[11px] text-slate-400">Branding, licenses, UPI QR, and customizable templates</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('store')}
            className={`py-2 px-3 font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === 'store' ? 'border-emerald-600 text-emerald-700 bg-white rounded-t' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Store Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('licenses')}
            className={`py-2 px-3 font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === 'licenses' ? 'border-emerald-600 text-emerald-700 bg-white rounded-t' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Agri Licenses & GSTIN
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bank')}
            className={`py-2 px-3 font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === 'bank' ? 'border-emerald-600 text-emerald-700 bg-white rounded-t' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            UPI & Bank QR
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('template')}
            className={`py-2 px-3 font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === 'template' ? 'border-emerald-600 text-emerald-700 bg-white rounded-t' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Templates & Terms
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`py-2 px-3 font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === 'backup' ? 'border-emerald-600 text-emerald-700 bg-white rounded-t' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Backup & Reset
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto space-y-4">
          
          {/* Store Tab */}
          {activeTab === 'store' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Store / Shop Name (English) *</label>
                  <input
                    type="text"
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Store Name in Hindi / Marathi</label>
                  <input
                    type="text"
                    value={formData.storeHindiName}
                    onChange={(e) => setFormData({ ...formData, storeHindiName: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-serif"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tagline / Business Line</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Proprietor / Owner Name</label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Primary Mobile *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Alternate Phone</label>
                  <input
                    type="tel"
                    value={formData.alternatePhone || ''}
                    onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Shop Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Town / Mandi Market</label>
                  <input
                    type="text"
                    value={formData.villageTown}
                    onChange={(e) => setFormData({ ...formData, villageTown: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">District & State</label>
                  <input
                    type="text"
                    value={formData.districtState}
                    onChange={(e) => setFormData({ ...formData, districtState: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Licenses Tab */}
          {activeTab === 'licenses' && (
            <div className="space-y-3">
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-800">
                These statutory license numbers are automatically printed on official invoices to comply with the Fertiliser Control Order (FCO) and the Seeds Act.
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">GSTIN (GST Number)</label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                  placeholder="27AABCS1429B1Z5"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Fertilizer License Number (खत परवाना क्र.)</label>
                <input
                  type="text"
                  value={formData.fertilizerLicense}
                  onChange={(e) => setFormData({ ...formData, fertilizerLicense: e.target.value })}
                  placeholder="FL-PUN-2023-8841"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Seed License Number (बियाणे परवाना क्र.)</label>
                <input
                  type="text"
                  value={formData.seedLicense}
                  onChange={(e) => setFormData({ ...formData, seedLicense: e.target.value })}
                  placeholder="SL-MH-PUN-4092"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Insecticide / Pesticide License Number (कीटकनाशक परवाना क्र.)</label>
                <input
                  type="text"
                  value={formData.pesticideLicense}
                  onChange={(e) => setFormData({ ...formData, pesticideLicense: e.target.value })}
                  placeholder="IL-MH-2022-7712"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>
          )}

          {/* UPI & Bank Tab */}
          {activeTab === 'bank' && (
            <div className="space-y-3">
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-xs text-emerald-800">
                A dynamic UPI QR code is automatically created on your invoices and payment reminders so farmers can pay directly via Google Pay, PhonePe, or Paytm.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">UPI ID (VPA) *</label>
                  <input
                    type="text"
                    value={formData.upiId}
                    onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                    placeholder="e.g. shreebalajikendra@oksbi"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Payee Name</label>
                  <input
                    type="text"
                    value={formData.upiName}
                    onChange={(e) => setFormData({ ...formData, upiName: e.target.value })}
                    placeholder="e.g. Shree Balaji Krushi"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="State Bank of India"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Bank Account Number</label>
                  <input
                    type="text"
                    value={formData.bankAccountNo}
                    onChange={(e) => setFormData({ ...formData, bankAccountNo: e.target.value })}
                    placeholder="30492817263"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={formData.bankIfsc}
                    onChange={(e) => setFormData({ ...formData, bankIfsc: e.target.value })}
                    placeholder="SBIN0001234"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Template & Terms Tab */}
          {activeTab === 'template' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Default Invoice Template</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'modern', name: 'Modern Agri', desc: 'Clean with GST breakdown' },
                    { id: 'classic', name: 'Classic Mandi', desc: 'Bilingual traditional bill' },
                    { id: 'compliance', name: 'Agri Statutory', desc: 'Batch, FCO & Seed Act' },
                    { id: 'thermal', name: 'Thermal POS (80mm)', desc: 'Fast receipt printer' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, defaultTemplate: t.id as InvoiceTemplateType })}
                      className={`p-2.5 rounded-lg border text-left transition ${
                        formData.defaultTemplate === t.id 
                          ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500' 
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-900">{t.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Invoice Prefix</label>
                  <input
                    type="text"
                    value={formData.invoicePrefix}
                    onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Overdue Late Interest Rate (% per month)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.lateInterestRatePercent}
                    onChange={(e) => setFormData({ ...formData, lateInterestRatePercent: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Terms & Conditions (One rule per line)
                </label>
                <textarea
                  rows={4}
                  value={termsText}
                  onChange={(e) => setTermsText(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-sans"
                />
              </div>
            </div>
          )}

          {/* Backup & Reset Tab */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900">Export Full Data Backup</h4>
                <p className="text-[11px] text-slate-600">
                  Save all invoices, inventory products, stock levels, farmer records, and transaction ledgers to an offline JSON file.
                </p>
                <button
                  type="button"
                  onClick={handleExport}
                  className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-lg"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Backup File (.json)
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900">Restore from Backup</h4>
                <p className="text-[11px] text-slate-600">
                  Upload a previously saved JSON backup file to restore all store records.
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
                />
              </div>

              <div className="p-4 bg-rose-50 rounded-lg border border-rose-200 space-y-2">
                <h4 className="font-bold text-rose-900">Reset Demo Data</h4>
                <p className="text-[11px] text-rose-700">
                  Restore all initial agricultural products (IFFCO Urea, DAP, Seeds, Sprayers, etc.) and sample farmer ledger balances.
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset to Krushi Kendra Demo Records
                </button>
              </div>
            </div>
          )}

          {/* Footer Save Button */}
          <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
            {saveSuccess ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1 text-xs">
                <Check className="w-4 h-4" /> Settings Saved!
              </span>
            ) : <span />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-xs"
              >
                Save Settings (जतन करा)
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
