import type { Contact, Invoice, InvoiceLine, PartySnapshot } from "@shared/types/index";
import { createId } from "@/lib/utils";

export function contactToParty(contact: Contact): PartySnapshot {
  return {
    name: contact.name,
    business_name: contact.business_name,
    business_email: contact.business_email,
    business_phone: contact.business_phone,
    business_website: contact.business_website,
    address_line_1: contact.address_line_1,
    address_line_2: contact.address_line_2,
    city: contact.city,
    postal_code: contact.postal_code,
    state: contact.state,
    country: contact.country,
  };
}

export function emptyParty(name = ""): PartySnapshot {
  return { name };
}

export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "EUR",
  }).format(amount);
}

export function lineTotal(line: InvoiceLine): number {
  return line.quantity * line.unit_price;
}

export function invoiceSubtotal(invoice: Pick<Invoice, "lines">): number {
  return invoice.lines.reduce((sum, line) => sum + lineTotal(line), 0);
}

export function formatDate(iso: string): string {
  const date = new Date(iso.includes("T") ? iso : `${iso}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function newLine(partial?: Partial<InvoiceLine>): InvoiceLine {
  return {
    id: createId(),
    description: partial?.description ?? "",
    quantity: partial?.quantity ?? 1,
    unit_price: partial?.unit_price ?? 0,
  };
}

export function formatPartyAddress(party: PartySnapshot): string[] {
  const lines: string[] = [];
  if (party.business_name && party.business_name !== party.name) {
    lines.push(party.business_name);
  }
  lines.push(party.name);
  if (party.address_line_1) lines.push(party.address_line_1);
  if (party.address_line_2) lines.push(party.address_line_2);
  const cityLine = [party.postal_code, party.city].filter(Boolean).join(" ");
  if (cityLine) lines.push(cityLine);
  if (party.state) lines.push(party.state);
  if (party.country) lines.push(party.country);
  if (party.business_email) lines.push(party.business_email);
  if (party.business_phone) lines.push(party.business_phone);
  return lines.filter(Boolean);
}

export function exportInvoicePdf() {
  window.print();
}
