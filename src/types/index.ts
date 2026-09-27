import { z } from "zod";

export const contactSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  business_name: z.string().optional(),
  business_email: z.union([z.string().email(), z.literal("")]).optional(),
  business_phone: z.string().optional(),
  business_website: z.union([z.string().url(), z.literal("")]).optional(),
  address_line_1: z.string().optional(),
  address_line_2: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  currency: z.string().default("EUR"),
  language: z.string().default("en"),
  default_due_days: z.number().int().positive().default(30),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Contact = z.infer<typeof contactSchema>;

export const createContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  business_name: z.string().optional(),
  business_email: z.union([z.string().email(), z.literal("")]).optional(),
  business_phone: z.string().optional(),
  business_website: z.union([z.string().url(), z.literal("")]).optional(),
  address_line_1: z.string().optional(),
  address_line_2: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  currency: z.string().optional(),
  language: z.string().optional(),
  default_due_days: z.coerce.number().int().positive().optional(),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;

export const updateContactSchema = createContactSchema.partial();

export type UpdateContactInput = z.infer<typeof updateContactSchema>;

export const partySnapshotSchema = z.object({
  name: z.string(),
  business_name: z.string().optional(),
  business_email: z.string().optional(),
  business_phone: z.string().optional(),
  business_website: z.string().optional(),
  address_line_1: z.string().optional(),
  address_line_2: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
});

export type PartySnapshot = z.infer<typeof partySnapshotSchema>;

export const invoiceLineSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit_price: z.number().nonnegative(),
});

export type InvoiceLine = z.infer<typeof invoiceLineSchema>;

export const invoiceStatusSchema = z.enum(["draft", "sent", "paid"]);

export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;

export const invoiceSchema = z.object({
  id: z.string().uuid(),
  number: z.string().min(1),
  status: invoiceStatusSchema,
  issue_date: z.string(),
  due_date: z.string(),
  currency: z.string().default("EUR"),
  notes: z.string().optional(),
  to_contact_id: z.string().uuid().optional(),
  from: partySnapshotSchema,
  to: partySnapshotSchema,
  lines: z.array(invoiceLineSchema).min(1),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Invoice = z.infer<typeof invoiceSchema>;

export interface Env {
  ALLOWED_ORIGINS?: string;
  ENVIRONMENT?: string;
  CONTACTS_KV?: KVNamespace;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
  };
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export const STORAGE_KEYS = {
  contacts: "krill-bill:contacts",
  company: "krill-bill:company",
  invoices: "krill-bill:invoices",
  invoiceCounter: "krill-bill:invoice-counter",
} as const;
