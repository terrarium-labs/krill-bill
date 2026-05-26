import { supabase } from '@/lib/supabase'
import { Organization, CreateOrganizationInput } from '@/types/organization'

// Fetch all organizations for current user
export const fetchUserOrganizations = async (): Promise<{ data: Organization[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        *,
        org_members!inner(user_id)
      `)
      .eq('org_members.user_id', (await supabase.auth.getSession()).data.session?.user.id || '')

    if (error) return { data: null, error: error.message }
    return { data: data as Organization[] || [], error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

// Fetch single organization
export const fetchOrganization = async (id: string): Promise<{ data: Organization | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return { data: null, error: error.message }
    return { data: data as Organization, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

// Create organization
export const createOrganization = async (input: CreateOrganizationInput): Promise<{ data: Organization | null; error: string | null }> => {
  try {
    const user = (await supabase.auth.getSession()).data.session?.user
    if (!user) return { data: null, error: 'Not authenticated' }

    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name: input.name,
        business_name: input.business_name || null,
        business_email: input.business_email || null,
        business_phone: input.business_phone || null,
        business_website: input.business_website || null,
        address_line_1: input.address_line_1 || null,
        address_line_2: input.address_line_2 || null,
        city: input.city || null,
        postal_code: input.postal_code || null,
        state: input.state || null,
        country: input.country || 'ES',
        currency: input.currency || 'EUR',
        language: input.language || 'en',
      })
      .select()
      .single()

    if (error) return { data: null, error: error.message }

    const orgId = (data as Organization).id

    // Add creator as owner with default preferences
    await supabase.from('org_members').insert({
      org_id: orgId,
      user_id: user.id,
      role: 'owner',
      theme: 'system',
      accent_color: 'blue',
      language: 'en',
    })

    return { data: data as Organization, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

// Update organization
export const updateOrganization = async (id: string, updates: Partial<CreateOrganizationInput>): Promise<{ data: Organization | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data: data as Organization, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

// Delete organization
export const deleteOrganization = async (id: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id)

    if (error) return { success: false, error: error.message }
    return { success: true, error: null }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
