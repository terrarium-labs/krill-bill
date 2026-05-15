export interface Client {
  id: string;
  org_id: string;
  name: string;
  business_name?: string;
  business_email?: string;
  business_phone?: string;
  business_website?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  postal_code?: string;
  state?: string;
  country?: string;
  currency?: string;
  language?: string;
  default_due_days?: number;
  created_at?: string;
  updated_at?: string;
}
