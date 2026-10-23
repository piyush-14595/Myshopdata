import { Product, Farmer, Invoice, StoreSettings } from '../types';
import { initialProducts, initialFarmers, initialInvoices, initialStoreSettings, initialPayments } from '../data/initialData';

const SETTINGS_KEY = 'ksk_store_settings_v1';
const PRODUCTS_KEY = 'ksk_products_v1';
const FARMERS_KEY = 'ksk_farmers_v1';
const INVOICES_KEY = 'ksk_invoices_v1';
const PAYMENTS_KEY = 'ksk_payments_v1';

export function getStoredSettings(): StoreSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) return initialStoreSettings;
    const parsed = { ...initialStoreSettings, ...JSON.parse(data) };
    if (parsed.storeName === 'Shree Balaji Krushi Sewa Kendra' || !parsed.storeName) {
      parsed.storeName = 'Piyush Krushi Sewa Kendra';
      parsed.storeHindiName = 'पीयूष कृषि सेवा केंद्र';
      parsed.ownerName = 'Piyush Patil';
      parsed.email = 'piyush14595@gmail.com';
      parsed.upiId = 'piyushkrushikendra@oksbi';
      parsed.upiName = 'Piyush Krushi Sewa Kendra';
      saveStoredSettings(parsed);
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load store settings', e);
    return initialStoreSettings;
  }
}

export function saveStoredSettings(settings: StoreSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getStoredProducts(): Product[] {
  try {
    const data = localStorage.getItem(PRODUCTS_KEY);
    if (!data) {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(initialProducts));
      return initialProducts;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load products', e);
    return initialProducts;
  }
}

export function saveStoredProducts(products: Product[]): void {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

export function getStoredFarmers(): Farmer[] {
  try {
    const data = localStorage.getItem(FARMERS_KEY);
    if (!data) {
      localStorage.setItem(FARMERS_KEY, JSON.stringify(initialFarmers));
      return initialFarmers;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load farmers', e);
    return initialFarmers;
  }
}

export function saveStoredFarmers(farmers: Farmer[]): void {
  localStorage.setItem(FARMERS_KEY, JSON.stringify(farmers));
}

export function getStoredInvoices(): Invoice[] {
  try {
    const data = localStorage.getItem(INVOICES_KEY);
    if (!data) {
      localStorage.setItem(INVOICES_KEY, JSON.stringify(initialInvoices));
      return initialInvoices;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load invoices', e);
    return initialInvoices;
  }
}

export function saveStoredInvoices(invoices: Invoice[]): void {
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
}

export function getStoredPayments(): { [farmerId: string]: any[] } {
  try {
    const data = localStorage.getItem(PAYMENTS_KEY);
    if (!data) {
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify(initialPayments));
      return initialPayments;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load payments', e);
    return initialPayments;
  }
}

export function saveStoredPayments(payments: { [farmerId: string]: any[] }): void {
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
}

export function exportFullBackup(): string {
  const backup = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    settings: getStoredSettings(),
    products: getStoredProducts(),
    farmers: getStoredFarmers(),
    invoices: getStoredInvoices(),
    payments: getStoredPayments()
  };
  return JSON.stringify(backup, null, 2);
}

export function importBackupData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (!data.products || !data.farmers || !data.invoices) {
      throw new Error('Invalid backup file schema');
    }
    if (data.settings) saveStoredSettings(data.settings);
    if (data.products) saveStoredProducts(data.products);
    if (data.farmers) saveStoredFarmers(data.farmers);
    if (data.invoices) saveStoredInvoices(data.invoices);
    if (data.payments) saveStoredPayments(data.payments);
    return true;
  } catch (e) {
    console.error('Backup import error:', e);
    return false;
  }
}

export function resetDemoData(): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(initialStoreSettings));
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(initialProducts));
  localStorage.setItem(FARMERS_KEY, JSON.stringify(initialFarmers));
  localStorage.setItem(INVOICES_KEY, JSON.stringify(initialInvoices));
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(initialPayments));
}
