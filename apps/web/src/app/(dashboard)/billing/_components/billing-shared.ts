export type InvoiceStatus = "DRAFT" | "UNPAID" | "PAID" | "REFUNDED";

export type PaymentMethod =
  | "CASH"
  | "QRIS"
  | "DEBIT_CARD"
  | "CREDIT_CARD"
  | "BPJS"
  | "TRANSFER";

export interface InvoiceItem {
  id: string;
  itemType: "CONSULTATION" | "PROCEDURE" | "DRUG" | "OTHER";
  itemName: string;
  quantity: number;
  unitPrice: string | number;
  totalPrice: string | number;
}

export interface InvoicePayment {
  id: string;
  amount: string | number;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  processedAt: string;
}

export interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  subtotal: string | number;
  discount: string | number;
  total: string | number;
  paidAt: string | null;
  createdAt: string;
  patient: { id: string; name: string; medicalRecordNumber: string };
  items: InvoiceItem[];
  payments: InvoicePayment[];
}

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: "Draft",
  UNPAID: "Belum Dibayar",
  PAID: "Lunas",
  REFUNDED: "Refund",
};

export const INVOICE_STATUS_BADGE: Record<InvoiceStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  UNPAID: "bg-amber-50 text-amber-700",
  PAID: "bg-emerald-50 text-emerald-700",
  REFUNDED: "bg-rose-50 text-rose-700",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "Tunai",
  QRIS: "QRIS",
  DEBIT_CARD: "Kartu Debit",
  CREDIT_CARD: "Kartu Kredit",
  BPJS: "BPJS",
  TRANSFER: "Transfer",
};
