import { LanguageCode, CurrencyCode } from "../miscelanea";

export interface Org {
  id: string;
  name: string;
  description: string | null;
  photo_url: string | null;
  n_users: number;
  n_invitations: number;
  language: LanguageCode;
  currency: CurrencyCode;
  default_due_days: number;
  address_line_1: string | null;
  address_line_2: string | null;
  postal_code: string | null;
  city: string | null;
  state_province: string | null;
  country: string;
  email: string | null;
  phone: string | null;
  url: string | null;
  tax_code: string | null;
  tax_code_type: string | null;
  payment_guides: string | null;
  stock_rotation_type: string | null;
  created_at: string;
  price_per_km: number | null;
  cost_per_km: number | null;
}

/** Interface for the payload of the PATCH /orgs/{org_id} endpoint. */
export interface OrgSettings {
  name?: string | null;
  description?: string | null;
  photo?: {
    name: string;
    content_type: string;
    content_length: number;
  } | null;
  photo_url?: string | null;
  language?: string | null;
  currency?: string | null;
  default_due_days?: number | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  postal_code?: string | null;
  city?: string | null;
  state_province?: string | null;
  country?: string | null;
  email?: string | null;
  phone?: string | null;
  url?: string | null;
  tax_code?: string | null;
  tax_code_type?: string | null;
  payment_guides?: string | null;
  stock_rotation_type?: string | null;
  price_per_km?: number | null;
  cost_per_km?: number | null;
}