import { SectionField } from "../general/custom_fields";
import { LanguageCode, CurrencyCode } from "../miscelanea";

export interface Supplier {
  id: string;
  // Required fields
  trade_name: string;
  tax_code: string;
  tax_code_type: string;
  // Optional fields
  supplier_name?: string;
  address_line_1?: string;
  address_line_2?: string;
  postal_code?: string;
  city?: string;
  state_province?: string;
  country?: string;
  notes?: string;
  photo_url?: string;
  url?: string;
  email?: string;
  phone?: string;
  sections?: SectionField[] | null;
  tags?: any[] | null;
  // Financial fields
  risk?: number | null;
  is_covered_risk?: boolean | null;
  default_due_days?: number | null;
  default_payment_day?: number | null;
  language?: LanguageCode | null; // Language code from languages.ts
  currency?: CurrencyCode | null; // Currency code from currencies.ts
  // Metadata
  created_at?: string;
  updated_at?: string;
}