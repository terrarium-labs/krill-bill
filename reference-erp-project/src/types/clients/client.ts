import { SectionField } from "../general/custom_fields";
import { LanguageCode, CurrencyCode } from "../miscelanea";
import Employee from "../employees/employees";

export interface BasicClient {
  id: string;
  trade_name: string;
  client_name?: string;
  email?: string;
  photo_url?: string;
  country?: string;
  city?: string;
}

export interface Client extends BasicClient {
  id: string;
  // Required fields
  trade_name: string;
  tax_code: string;
  tax_code_type: string;
  // Optional fields
  client_name?: string;
  address_line_1?: string;
  address_line_2?: string;
  postal_code?: string;
  city?: string;
  state_province?: string;
  country?: string;
  notes?: string;
  photo_url?: string;
  url?: string;
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
  // For duplication from supplier
  is_from_supplier?: boolean;
  supplier_id?: string;
  // Metadata
  created_at?: string;
  updated_at?: string;
}


export interface ClientContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  notes?: string;
  is_default: boolean;
  schedule?: ContactSchedule;
  created_at?: string;
  updated_at?: string;
}

export interface ContactSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  is_available: boolean;
  start_time?: string;
  end_time?: string;
}

export interface ClientStakeholder {
  id: string;
  employee: Employee;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ClientPaymentMethod {
  id: string;
  bank: string;
  iban?: string;
  swift_bic?: string;
  mandate_reference?: string;
  mandate_date?: string;
  notes?: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}
