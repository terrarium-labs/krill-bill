import { apiFetch, API_BASE_URL } from './api'
import { OrgMember, OrgMemberRole } from '@/types/organization'

// Fetch a specific member's data (including preferences)
export const getOrgMember = async (orgId: string, userId: string): Promise<{ data: OrgMember | null; error: string | null }> => {
  try {
    const response = await apiFetch(
      new URL(`${API_BASE_URL}/members/${orgId}/${userId}`),
      { method: 'GET' }
    );

    if ('error' in response) {
      return { data: null, error: response.error };
    }

    const data = response.data as OrgMember;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

// Fetch members of an organization
export const fetchOrgMembers = async (orgId: string): Promise<{ data: OrgMember[] | null; error: string | null }> => {
  try {
    const response = await apiFetch(
      new URL(`${API_BASE_URL}/members/${orgId}`),
      { method: 'GET' }
    );

    if ('error' in response) {
      return { data: null, error: response.error };
    }

    const data = response.data as OrgMember[];
    return { data: data || [], error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

// Add member to organization
export const addOrgMember = async (orgId: string, userId: string, role: OrgMemberRole = 'member'): Promise<{ data: OrgMember | null; error: string | null }> => {
  try {
    const response = await apiFetch(
      new URL(`${API_BASE_URL}/members/${orgId}`),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          role,
          theme: 'system',
          accent_color: 'blue',
          language: 'en',
        }),
      }
    );

    if ('error' in response) {
      return { data: null, error: response.error };
    }

    const data = response.data as OrgMember;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

// Update member role
export const updateOrgMemberRole = async (memberId: string, role: OrgMemberRole, orgId: string): Promise<{ data: OrgMember | null; error: string | null }> => {
  try {
    const response = await apiFetch(
      new URL(`${API_BASE_URL}/members/${memberId}/role?org_id=${orgId}`),
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      }
    );

    if ('error' in response) {
      return { data: null, error: response.error };
    }

    const data = response.data as OrgMember;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

// Update member preferences (theme, accent_color, language)
export const updateOrgMemberPreferences = async (
  orgId: string,
  userId: string,
  updates: Partial<Pick<OrgMember, 'theme' | 'accent_color' | 'language'>>
): Promise<{ data: OrgMember | null; error: string | null }> => {
  try {
    const response = await apiFetch(
      new URL(`${API_BASE_URL}/members/${orgId}/${userId}/preferences`),
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }
    );

    if ('error' in response) {
      return { data: null, error: response.error };
    }

    const data = response.data as OrgMember;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
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
