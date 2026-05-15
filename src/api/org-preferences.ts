import { supabase } from '@/lib/supabase';
import { OrgMember } from '@/types/organization';
import { getOrgMember, updateOrgMemberPreferences } from './org-members';

// Type alias for backward compatibility
export type OrgUserPreferences = OrgMember;

export interface OrgUserPreferencesInterface {
  id?: string;
  org_id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  accent_color: string;
  language: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * @deprecated Use getOrgMember from org-members.ts instead
 * Get user preferences for a specific organization
 */
export const getOrgUserPreferences = async (orgId: string): Promise<{ data: OrgMember | null; error: string | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }
    return getOrgMember(orgId, user.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch preferences';
    console.error('API: Error in getOrgUserPreferences:', message);
    return { data: null, error: message };
  }
};

/**
 * @deprecated Use updateOrgMemberPreferences from org-members.ts instead
 * Update user preferences for an organization
 */
export const updateOrgUserPreferences = async (
  orgId: string,
  updates: Partial<Omit<OrgMember, 'id' | 'org_id' | 'user_id' | 'created_at'>>
): Promise<{ data: OrgMember | null; error: string | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    return updateOrgMemberPreferences(orgId, user.id, updates);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update preferences';
    console.error('API: Error in updateOrgUserPreferences:', message);
    return { data: null, error: message };
  }
};

/**
 * Get user's role in organization
 */
export const getUserOrgRole = async (orgId: string): Promise<{ data: string | null; error: string | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('API: Error fetching user org role:', error);
      return { data: null, error: error.message };
    }

    return { data: data?.role || null, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch user role';
    console.error('API: Error in getUserOrgRole:', message);
    return { data: null, error: message };
  }
};
