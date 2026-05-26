import { supabase } from '@/lib/supabase'
import { OrganizationPartner, CreateOrganizationPartnerInput } from '@/types/organization'

/**
 * Fetch all partners for an organization
 */
export const fetchOrganizationPartners = async (orgId: string) => {
  try {
    const { data, error } = await supabase
      .from('organization_partners')
      .select(`
        *,
        partner_org:partner_organization_id (
          id,
          name,
          business_name,
          business_email,
          business_phone,
          country,
          currency
        )
      `)
      .eq('organization_id', orgId)

    if (error) throw error
    return { data: (data as any[]) || [], error: null }
  } catch (error: any) {
    console.error('Error fetching organization partners:', error)
    return { data: [], error: error.message }
  }
}

/**
 * Add a partner to an organization
 */
export const addOrganizationPartner = async (
  orgId: string,
  input: CreateOrganizationPartnerInput
) => {
  try {
    const { data, error } = await supabase
      .from('organization_partners')
      .insert({
        organization_id: orgId,
        partner_organization_id: input.partner_organization_id,
        partner_type: input.partner_type,
      })
      .select()
      .single()

    if (error) throw error
    return { data: (data as OrganizationPartner) || null, error: null }
  } catch (error: any) {
    console.error('Error adding organization partner:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Remove a partner from an organization
 */
export const removeOrganizationPartner = async (partnerId: string) => {
  try {
    const { error } = await supabase
      .from('organization_partners')
      .delete()
      .eq('id', partnerId)

    if (error) throw error
    return { error: null }
  } catch (error: any) {
    console.error('Error removing organization partner:', error)
    return { error: error.message }
  }
}

/**
 * Update a partner type
 */
export const updateOrganizationPartner = async (
  partnerId: string,
  partnerType: 'client' | 'provider'
) => {
  try {
    const { data, error } = await supabase
      .from('organization_partners')
      .update({ partner_type: partnerType })
      .eq('id', partnerId)
      .select()
      .single()

    if (error) throw error
    return { data: (data as OrganizationPartner) || null, error: null }
  } catch (error: any) {
    console.error('Error updating organization partner:', error)
    return { data: null, error: error.message }
  }
}
