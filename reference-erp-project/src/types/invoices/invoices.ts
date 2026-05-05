import { Client } from "../clients/client";
import { Supplier } from "../suppliers/supplier";
import { SerialNumber } from "../general/serial-numbers";
import { Origin } from "../general/origin";
import { TaxType } from "../miscelanea";
import { Item } from "../items/items";

export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  status: 'draft' | 'approved' | 'pending' | 'overdue' | 'partially_paid' | 'paid';
  origins: Origin[];
  due_dates: {
    id: string;
    due_date: string;
    amount: number;
  }[] | null;
  subtotal: number;
  subtotal_with_discount: number;
  taxes: {
    tax: string;
    is_negative: boolean;
    amount: number;
  }[];
  total: number;
  discount: number; // global discount percentage
  item_discount_enabled: boolean; // whether per-item discount is enabled
  lines: InvoiceItem[]; // invoice line items (always included)
  currency: string;
  exchange_rate: number;
  cost_price: number | null;
  margin: number | null;
  created_at: string;
  paid: number | null;
  additional_fields: Record<string, string> | null;
}

export interface SaleInvoice extends Invoice {
  type: 'sale';
  client: Client;
  serial_number_type: SerialNumber;

}

export interface PurchaseInvoice extends Invoice {
  type: 'purchase';
  supplier: Supplier;
  main_file: string | null;
}

export interface InvoicePayment {
  id: string;
  payment_date: string;
  amount: number;
}

export interface InvoicesMetadata {
  subtotal: number;
  taxes: number;
  total: number;
  cost_price: number | null;
  margin: number | null;
}

export interface PaymentsMetadata {
  total_amount: number;
}

export interface InvoiceItem {
  id: string | null; // null for new lines not yet saved
  parent: {
    id: string;
    name: string;
  } | null;
  is_header: boolean;
  type: 'material' | 'hour' | 'commuting' | null;
  item: Item | null;
  name: string;
  description: string;
  quantity: number | null;
  is_indirect_cost: boolean | null;
  is_visible: boolean | null;
  price: number | null;
  order: number;
  discount: number | null; // percentage
  taxes: TaxType[] | null;
  cost_price: number | null; // cost price (Precio Medio de Coste)
}

