export type OrganizationType = 'mine' | 'client' | 'provider'
export type OrgMemberRole = 'owner' | 'admin' | 'member'

export interface Organization {
  id: string
  name: string
  type: OrganizationType
  business_name?: string | null
  business_email?: string | null
  business_phone?: string | null
  business_website?: string | null
  address_line_1?: string | null
  address_line_2?: string | null
  city?: string | null
  postal_code?: string | null
  state?: string | null
  country: string
  currency: string
  language: string
  created_at: string
  updated_at: string
}

export interface OrgMember {
  id: string
  org_id?: string | null
  user_id: string
  role: OrgMemberRole
  theme?: string
  accent_color?: string
  language?: string
  created_at: string
  updated_at: string
}

export interface CreateOrganizationInput {
  name: string
  type: OrganizationType
  business_name?: string
  business_email?: string
  business_phone?: string
  business_website?: string
  address_line_1?: string
  address_line_2?: string
  city?: string
  postal_code?: string
  state?: string
  country?: string
  currency?: string
  language?: string
}
