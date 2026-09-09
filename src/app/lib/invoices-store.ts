import {
  invoiceSchema,
  STORAGE_KEYS,
  type Invoice,
  type PartySnapshot,
} from "@shared/types/index";
import { createId, nowIso } from "@/lib/utils";
import { newLine, todayIso } from "@/lib/invoice-utils";

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string) {
  localStorage.setItem(key, value);
}

function parseInvoices(raw: string | null): Invoice[] {
  if (!raw) return [];
  try {
    return invoiceSchema.array().parse(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function listInvoices(): Invoice[] {
  return parseInvoices(readRaw(STORAGE_KEYS.invoices)).sort(
    (a, b) => b.updated_at.localeCompare(a.updated_at),
  );
}

export function getInvoice(id: string): Invoice | undefined {
  return listInvoices().find((inv) => inv.id === id);
}

function saveAll(invoices: Invoice[]) {
  writeRaw(STORAGE_KEYS.invoices, JSON.stringify(invoices));
}

export function nextInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const key = `${STORAGE_KEYS.invoiceCounter}:${year}`;
  const current = Number(readRaw(key) ?? "0") + 1;
  writeRaw(key, String(current));
  return `INV-${year}-${String(current).padStart(4, "0")}`;
}

export type CreateInvoiceInput = {
  from: PartySnapshot;
  to: PartySnapshot;
  to_contact_id?: string;
  currency?: string;
  issue_date?: string;
  due_date?: string;
  notes?: string;
};

export function createInvoice(input: CreateInvoiceInput): Invoice {
  const now = nowIso();
  const issueDate = input.issue_date ?? todayIso();
  const invoice: Invoice = invoiceSchema.parse({
    id: createId(),
    number: nextInvoiceNumber(),
    status: "draft",
    issue_date: issueDate,
    due_date: input.due_date ?? issueDate,
    currency: input.currency ?? "EUR",
    notes: input.notes,
    to_contact_id: input.to_contact_id,
    from: input.from,
    to: input.to,
    lines: [newLine({ description: "Service", quantity: 1, unit_price: 0 })],
    created_at: now,
    updated_at: now,
  });
  const invoices = listInvoices();
  invoices.unshift(invoice);
  saveAll(invoices);
  return invoice;
}

export function updateInvoice(id: string, patch: Partial<Invoice>): Invoice {
  const invoices = listInvoices();
  const index = invoices.findIndex((inv) => inv.id === id);
  if (index === -1) throw new Error("Invoice not found");
  const updated = invoiceSchema.parse({
    ...invoices[index],
    ...patch,
    updated_at: nowIso(),
  });
  invoices[index] = updated;
  saveAll(invoices);
  return updated;
}

export function deleteInvoice(id: string) {
  saveAll(listInvoices().filter((inv) => inv.id !== id));
}
