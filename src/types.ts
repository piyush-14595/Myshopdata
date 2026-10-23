export type ProductCategory = 
  | 'Fertilizer' 
  | 'Seeds' 
  | 'Pesticide & Fungicide' 
  | 'Sprayer & Equipment' 
  | 'Irrigation & Pipes' 
  | 'Cattle & Poultry Feed'
  | 'General Agri Supplies';

export type UnitType = 'Bag' | 'Kg' | 'Litre' | 'Packet' | 'Bottle' | 'Piece' | 'Quintal' | 'Meter';

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  sku: string;
  hsnCode: string;
  unit: UnitType;
  costPrice: number; // Purchase price
  sellingPrice: number; // Retail price
  mrp: number;
  taxRate: number; // 0, 5, 12, 18
  currentStock: number;
  minStockAlert: number; // Threshold
  batchNo?: string;
  expiryDate?: string; // YYYY-MM-DD
  mfgDate?: string; // YYYY-MM-DD
  composition?: string; // E.g., Chlorpyrifos 50% + Cypermethrin 5% EC
  description?: string;
}

export interface Farmer {
  id: string;
  name: string;
  phone: string;
  village: string;
  tehsil?: string;
  district?: string;
  aadhaarOrId?: string;
  landAcres?: number;
  totalPurchases: number;
  totalPaid: number;
  outstandingBalance: number; // Udhaar
  createdAt: string;
  notes?: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  brand: string;
  category: ProductCategory;
  batchNo?: string;
  expiryDate?: string;
  hsnCode: string;
  unit: UnitType;
  quantity: number;
  unitPrice: number;
  mrp: number;
  taxRate: number; // e.g. 5, 12, 18, 0
  discountPercent: number;
  taxAmount: number;
  totalAmount: number;
}

export type PaymentStatus = 'Paid' | 'Partial' | 'Pending' | 'Overdue';
export type PaymentMode = 'Cash' | 'UPI' | 'Credit' | 'Bank Transfer' | 'Cheque';

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  farmerId: string;
  amount: number;
  paymentDate: string;
  paymentMode: PaymentMode;
  referenceNumber?: string; // UPI Ref / Cheque No
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  farmerVillage: string;
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD for credit
  seasonTag?: 'Kharif' | 'Rabi' | 'Zaid' | 'General';
  items: InvoiceItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  roundOff: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
  paymentMode: PaymentMode;
  upiRef?: string;
  notes?: string;
  lastReminderSentAt?: string;
  reminderCount?: number;
}

export type InvoiceTemplateType = 'modern' | 'classic' | 'thermal' | 'compliance';

export interface StoreSettings {
  storeName: string;
  storeHindiName: string;
  tagline: string;
  ownerName: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address: string;
  villageTown: string;
  districtState: string;
  gstin: string;
  fertilizerLicense: string;
  seedLicense: string;
  pesticideLicense: string;
  upiId: string;
  upiName: string;
  bankName: string;
  bankAccountNo: string;
  bankIfsc: string;
  termsAndConditions: string[];
  defaultTemplate: InvoiceTemplateType;
  invoicePrefix: string;
  nextInvoiceSequence: number;
  themeColor: 'emerald' | 'amber' | 'blue' | 'slate';
  enableLatePaymentInterest: boolean;
  lateInterestRatePercent: number; // E.g. 1.5% per month
}
