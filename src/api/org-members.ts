import { supabase } from '@/lib/supabase'
import { OrgMember, OrgMemberRole } from '@/types/organization'

// Fetch a specific member's data (including preferences)
export const getOrgMember = async (orgId: string, userId: string): Promise<{ data: OrgMember | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('org_members')
      .select('*')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .single()

    if (error) return { data: null, error: error.message }
    return { data: data as OrgMember, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

// Fetch members of an organization
export const fetchOrgMembers = async (orgId: string): Promise<{ data: OrgMember[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('org_members')
      .select('*')
      .eq('org_id', orgId)

    if (error) return { data: null, error: error.message }
    return { data: data as OrgMember[] || [], error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

// Add member to organization
export const addOrgMember = async (orgId: string, userId: string, role: OrgMemberRole = 'member'): Promise<{ data: OrgMember | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('org_members')
      .insert({
        org_id: orgId,
        user_id: userId,
        role,
        theme: 'system',
        accent_color: 'blue',
        language: 'en',
      })
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data: data as OrgMember, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

// Update member role
export const updateOrgMemberRole = async (memberId: string, role: OrgMemberRole): Promise<{ data: OrgMember | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('org_members')
      .update({ role })
      .eq('id', memberId)
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data: data as OrgMember, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

// Update member preferences (theme, accent_color, language)
export const updateOrgMemberPreferences = async (
  orgId: string,
  userId: string,
  updates: Partial<Pick<OrgMember, 'theme' | 'accent_color' | 'language'>>
): Promise<{ data: OrgMember | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('org_members')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data: data as OrgMember, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

// Remove member from organization
export const removeOrgMember = async (memberId: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase
      .from('org_members')
      .delete()
      .eq('id', memberId)

    if (error) return { success: false, error: error.message }
    return { success: true, error: null }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
