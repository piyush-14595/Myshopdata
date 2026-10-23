export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatCompactCurrency(amount: number): string {
  if (isNaN(amount)) return '₹0';
  return '₹' + Math.round(amount).toLocaleString('en-IN');
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export function getDaysDiff(targetDateString: string, baseDateString?: string): number {
  const target = new Date(targetDateString);
  const base = baseDateString ? new Date(baseDateString) : new Date();
  
  // Set both to midnight UTC for pure day difference
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const baseMidnight = new Date(base.getFullYear(), base.getMonth(), base.getDate()).getTime();
  
  const diffTime = baseMidnight - targetMidnight;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export function getOverdueStatus(dueDate: string, balanceDue: number): {
  isOverdue: boolean;
  daysOverdue: number;
  badgeColor: string;
  badgeText: string;
} {
  if (balanceDue <= 0) {
    return { isOverdue: false, daysOverdue: 0, badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300', badgeText: 'Fully Paid' };
  }
  
  const daysOverdue = getDaysDiff(dueDate);
  
  if (daysOverdue > 30) {
    return {
      isOverdue: true,
      daysOverdue,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      badgeText: `${daysOverdue}d Overdue (Critical)`
    };
  } else if (daysOverdue > 0) {
    return {
      isOverdue: true,
      daysOverdue,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      badgeText: `${daysOverdue}d Overdue`
    };
  } else if (daysOverdue >= -3) {
    return {
      isOverdue: false,
      daysOverdue,
      badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      badgeText: `Due Soon (${Math.abs(daysOverdue)}d)`
    };
  } else {
    return {
      isOverdue: false,
      daysOverdue,
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      badgeText: `Due on ${formatDate(dueDate)}`
    };
  }
}

// Convert numbers to Indian Words (Lakhs, Crores, Thousands)
export function numberToIndianWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
  }

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let result = inWords(integerPart) + ' Rupees';
  if (decimalPart > 0) {
    result += ' and ' + inWords(decimalPart) + ' Paise';
  }
  return result + ' Only';
}

export function generateUpiQrUrl(upiId: string, payeeName: string, amount: number, transactionNote: string): string {
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(upiUrl)}`;
}

export function generatePaymentReminderMessage(
  templateType: 'polite' | 'firm' | 'hindi' | 'harvest',
  farmerName: string,
  storeName: string,
  invoiceNumber: string,
  balanceDue: number,
  dueDate: string,
  daysOverdue: number,
  upiId: string,
  phone: string
): string {
  const formattedAmount = formatCurrency(balanceDue);
  const formattedDueDate = formatDate(dueDate);

  switch (templateType) {
    case 'hindi':
      return `नमस्ते ${farmerName} जी 🙏\n\nयह ${storeName} की ओर से विनम्र स्मरण पत्र है। आपके बिल क्र. ${invoiceNumber} की कुल बकाया राशि ${formattedAmount} है, जिसकी देय तिथि ${formattedDueDate} (${daysOverdue > 0 ? `${daysOverdue} दिन पहले` : 'निकट'}) थी।\n\nकृपया अपनी सुविधा अनुसार Google Pay, PhonePe या दुकान पर नकद जमा कराकर खाता चुकता करें।\n\nUPI ID: ${upiId}\nसंपर्क: ${phone}\n\nधन्यवाद! 🌾\n- ${storeName}`;

    case 'harvest':
      return `आदरणीय ${farmerName} जी (जय किसान!) 🌾\n\nखरीफ/रबी फसल कटाई का समय आ गया है। आपके द्वारा खाद/बीज/दवाई के लिए लिए गए बिल संख्या ${invoiceNumber} की राशि ${formattedAmount} अभी बाकी है।\n\nकृषि केंद्र के अगले सीजन के स्टॉक आवंटन के लिए कृपया अपना बकाया शीघ्र क्लियर करें ताकि आपको नई खाद व बीज समय पर उपलब्ध हो सकें।\n\nदुकान: ${storeName}\nUPI ID: ${upiId} | फोन: ${phone}`;

    case 'firm':
      return `URGENT PAYMENT NOTICE: Dear ${farmerName},\nThis is an official notice regarding overdue balance on Invoice #${invoiceNumber} from ${storeName}.\nOutstanding Balance: ${formattedAmount}\nDue Date was: ${formattedDueDate} (${daysOverdue} days overdue).\n\nPlease settle this account immediately via UPI (${upiId}) or visit the store counter to avoid interest charges and keep your credit account active.\n\nThank you,\n${storeName} (${phone})`;

    case 'polite':
    default:
      return `Hello ${farmerName} ji 🙏,\nWarm greetings from ${storeName}.\nThis is a gentle reminder that an amount of ${formattedAmount} is pending against Invoice #${invoiceNumber} (Due: ${formattedDueDate}).\n\nYou can pay directly via UPI: ${upiId} or cash at our shop.\nFor any queries, please call us at ${phone}.\n\nThank you for your business! 🌾`;
  }
}
