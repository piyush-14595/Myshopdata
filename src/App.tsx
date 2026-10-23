import React, { useState, useEffect } from 'react';
import { Product, Farmer, Invoice, StoreSettings, PaymentRecord } from './types';
import { 
  getStoredSettings, saveStoredSettings,
  getStoredProducts, saveStoredProducts,
  getStoredFarmers, saveStoredFarmers,
  getStoredInvoices, saveStoredInvoices,
  getStoredPayments, saveStoredPayments
} from './utils/storage';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { QuickBilling } from './components/Billing/QuickBilling';
import { InvoiceList } from './components/Invoices/InvoiceList';
import { InvoiceViewModal } from './components/Invoices/InvoiceViewModal';
import { FarmerLedger } from './components/Farmers/FarmerLedger';
import { LatePaymentCenter } from './components/Notifications/LatePaymentCenter';
import { InventoryManager } from './components/Inventory/InventoryManager';
import { LowStockAlerts } from './components/Inventory/LowStockAlerts';
import { StoreSettingsModal } from './components/Settings/StoreSettingsModal';
import { getDaysDiff } from './utils/formatters';

type ViewMode = 'dashboard' | 'billing' | 'invoices' | 'farmers' | 'notifications' | 'inventory' | 'lowstock';

export default function App() {
  const [settings, setSettings] = useState<StoreSettings>(() => getStoredSettings());
  const [products, setProducts] = useState<Product[]>(() => getStoredProducts());
  const [farmers, setFarmers] = useState<Farmer[]>(() => getStoredFarmers());
  const [invoices, setInvoices] = useState<Invoice[]>(() => getStoredInvoices());
  const [payments, setPayments] = useState<{ [farmerId: string]: PaymentRecord[] }>(() => getStoredPayments());

  const [activeView, setActiveView] = useState<ViewMode>('dashboard');
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Sync to local storage
  useEffect(() => {
    saveStoredSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveStoredProducts(products);
  }, [products]);

  useEffect(() => {
    saveStoredFarmers(farmers);
  }, [farmers]);

  useEffect(() => {
    saveStoredInvoices(invoices);
  }, [invoices]);

  useEffect(() => {
    saveStoredPayments(payments);
  }, [payments]);

  // Derived counts for notification badges
  const overdueCount = invoices.filter(inv => inv.balanceDue > 0 && getDaysDiff(inv.dueDate) > 0).length;
  const lowStockCount = products.filter(prod => prod.currentStock <= prod.minStockAlert).length;

  // Invoice Handlers
  const handleSaveInvoice = (newInvoice: Invoice, updatedProducts: Product[], updatedFarmer: Farmer) => {
    // 1. Update Invoices
    const updatedInvoices = [newInvoice, ...invoices];
    setInvoices(updatedInvoices);

    // 2. Update Products
    setProducts(updatedProducts);

    // 3. Update Farmer
    const farmerExists = farmers.some(f => f.id === updatedFarmer.id);
    let newFarmersList: Farmer[];
    if (farmerExists) {
      newFarmersList = farmers.map(f => f.id === updatedFarmer.id ? updatedFarmer : f);
    } else {
      newFarmersList = [updatedFarmer, ...farmers];
    }
    setFarmers(newFarmersList);

    // 4. Record initial payment if any paid at counter
    if (newInvoice.paidAmount > 0) {
      const newPayRecord: PaymentRecord = {
        id: 'pay-' + Date.now(),
        invoiceId: newInvoice.id,
        farmerId: updatedFarmer.id,
        amount: newInvoice.paidAmount,
        paymentDate: newInvoice.invoiceDate,
        paymentMode: newInvoice.paymentMode,
        referenceNumber: newInvoice.upiRef || 'Cash Deposit',
        notes: `Payment recorded on creation of Invoice #${newInvoice.invoiceNumber}`
      };
      const existingFarmerPays = payments[updatedFarmer.id] || [];
      setPayments({
        ...payments,
        [updatedFarmer.id]: [...existingFarmerPays, newPayRecord]
      });
    }

    // 5. Increment next invoice sequence
    setSettings(prev => ({
      ...prev,
      nextInvoiceSequence: prev.nextInvoiceSequence + 1
    }));

    // Open created invoice in modal immediately for printing
    setViewingInvoice(newInvoice);
    setActiveView('invoices');
  };

  const handleUpdateInvoice = (updated: Invoice) => {
    setInvoices(invoices.map(i => i.id === updated.id ? updated : i));
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    setInvoices(invoices.filter(i => i.id !== invoiceId));
    if (viewingInvoice?.id === invoiceId) {
      setViewingInvoice(null);
    }
  };

  // Payment Recording Handler
  const handleRecordPayment = (
    farmerId: string, 
    amount: number, 
    mode: any, 
    refNo?: string, 
    notes?: string
  ) => {
    const farmer = farmers.find(f => f.id === farmerId);
    if (!farmer) return;

    let remainingToAllocate = amount;

    // Allocate payment against oldest unpaid invoices of this farmer
    const updatedInvoices = invoices.map(inv => {
      if (inv.farmerId === farmerId && inv.balanceDue > 0 && remainingToAllocate > 0) {
        const canPay = Math.min(inv.balanceDue, remainingToAllocate);
        remainingToAllocate -= canPay;
        const newPaid = inv.paidAmount + canPay;
        const newBalance = inv.balanceDue - canPay;
        return {
          ...inv,
          paidAmount: newPaid,
          balanceDue: newBalance,
          paymentStatus: (newBalance === 0 ? 'Paid' : 'Partial') as any
        };
      }
      return inv;
    });

    setInvoices(updatedInvoices);

    // Update Farmer outstanding balance
    const updatedFarmers = farmers.map(f => {
      if (f.id === farmerId) {
        return {
          ...f,
          totalPaid: f.totalPaid + amount,
          outstandingBalance: Math.max(0, f.outstandingBalance - amount)
        };
      }
      return f;
    });
    setFarmers(updatedFarmers);

    // Record Payment
    const paymentRecord: PaymentRecord = {
      id: 'pay-' + Date.now(),
      invoiceId: 'khata-payment',
      farmerId,
      amount,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: mode,
      referenceNumber: refNo || 'CASH-REC',
      notes: notes || 'Khata credit payment'
    };

    const farmerPays = payments[farmerId] || [];
    setPayments({
      ...payments,
      [farmerId]: [...farmerPays, paymentRecord]
    });

    alert(`Payment of ₹${amount.toLocaleString('en-IN')} successfully credited to ${farmer.name}'s Khata!`);
  };

  // Inventory Handlers
  const handleAddProduct = (product: Product) => {
    setProducts([product, ...products]);
  };

  const handleUpdateProduct = (product: Product) => {
    setProducts(products.map(p => p.id === product.id ? product : p));
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(products.filter(p => p.id !== productId));
  };

  const handleAdjustStock = (productId: string, delta: number, reason: string) => {
    setProducts(products.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          currentStock: Math.max(0, p.currentStock + delta)
        };
      }
      return p;
    }));
  };

  // Farmer Handlers
  const handleAddNewFarmer = (farmer: Farmer) => {
    setFarmers([farmer, ...farmers]);
  };

  const handleDataReload = () => {
    setSettings(getStoredSettings());
    setProducts(getStoredProducts());
    setFarmers(getStoredFarmers());
    setInvoices(getStoredInvoices());
    setPayments(getStoredPayments());
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        activeView={activeView}
        onNavigate={setActiveView}
        settings={settings}
        onOpenSettings={() => setShowSettings(true)}
        overdueCount={overdueCount}
        lowStockCount={lowStockCount}
      />

      {/* Main Active View */}
      <main className="flex-1">
        {activeView === 'dashboard' && (
          <Dashboard
            products={products}
            farmers={farmers}
            invoices={invoices}
            settings={settings}
            onNavigate={setActiveView}
            onViewInvoice={setViewingInvoice}
            onRecordPaymentClick={(inv) => {
              handleRecordPayment(inv.farmerId, inv.balanceDue, 'Cash', undefined, `Direct settlement for Invoice #${inv.invoiceNumber}`);
            }}
          />
        )}

        {activeView === 'billing' && (
          <QuickBilling
            products={products}
            farmers={farmers}
            settings={settings}
            onSaveInvoice={handleSaveInvoice}
            onCancel={() => setActiveView('dashboard')}
          />
        )}

        {activeView === 'invoices' && (
          <InvoiceList
            invoices={invoices}
            settings={settings}
            onViewInvoice={setViewingInvoice}
            onRecordPaymentClick={(inv) => {
              handleRecordPayment(inv.farmerId, inv.balanceDue, 'Cash', undefined, `Direct payment for Invoice #${inv.invoiceNumber}`);
            }}
            onDeleteInvoice={handleDeleteInvoice}
            onNewInvoiceClick={() => setActiveView('billing')}
          />
        )}

        {activeView === 'farmers' && (
          <FarmerLedger
            farmers={farmers}
            invoices={invoices}
            payments={payments}
            settings={settings}
            onRecordPayment={handleRecordPayment}
            onAddNewFarmer={handleAddNewFarmer}
            onViewInvoice={setViewingInvoice}
          />
        )}

        {activeView === 'notifications' && (
          <LatePaymentCenter
            invoices={invoices}
            settings={settings}
            onUpdateInvoice={handleUpdateInvoice}
            onRecordPaymentClick={(inv) => {
              handleRecordPayment(inv.farmerId, inv.balanceDue, 'Cash', undefined, `Settlement from Overdue reminder #${inv.invoiceNumber}`);
            }}
            onViewInvoice={setViewingInvoice}
          />
        )}

        {activeView === 'inventory' && (
          <InventoryManager
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onAdjustStock={handleAdjustStock}
          />
        )}

        {activeView === 'lowstock' && (
          <LowStockAlerts
            products={products}
            settings={settings}
            onAdjustStock={handleAdjustStock}
          />
        )}
      </main>

      {/* Invoice View / Print Modal */}
      {viewingInvoice && (
        <InvoiceViewModal
          invoice={viewingInvoice}
          settings={settings}
          onClose={() => setViewingInvoice(null)}
          onRecordPaymentClick={(inv) => {
            handleRecordPayment(inv.farmerId, inv.balanceDue, 'Cash', undefined, `Settlement from Invoice View #${inv.invoiceNumber}`);
            // Update viewing invoice state
            setViewingInvoice({
              ...inv,
              paidAmount: inv.grandTotal,
              balanceDue: 0,
              paymentStatus: 'Paid'
            });
          }}
        />
      )}

      {/* Store Settings Modal */}
      {showSettings && (
        <StoreSettingsModal
          settings={settings}
          onSaveSettings={setSettings}
          onClose={() => setShowSettings(false)}
          onDataReset={handleDataReload}
        />
      )}
    </div>
  );
}
