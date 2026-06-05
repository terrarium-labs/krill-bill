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
 * Note: Backend will extract user_id from JWT token automatically
 */
export const getOrgUserPreferences = async (orgId: string): Promise<{ data: OrgMember | null; error: string | null }> => {
  try {
    // Get auth token from localStorage to extract user info if needed
    const token = localStorage.getItem('x-auth-token');
    if (!token) {
      return { data: null, error: 'User not authenticated' };
    }
    
    // Backend will handle extracting userId from JWT token
    return getOrgMember(orgId, '');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch preferences';
    console.error('API: Error in getOrgUserPreferences:', message);
    return { data: null, error: message };
  }
};

/**
 * @deprecated Use updateOrgMemberPreferences from org-members.ts instead
 * Update user preferences for an organization
 * Note: Backend will extract user_id from JWT token automatically
 */
export const updateOrgUserPreferences = async (
  orgId: string,
  updates: Partial<Omit<OrgMember, 'id' | 'org_id' | 'user_id' | 'created_at'>>
): Promise<{ data: OrgMember | null; error: string | null }> => {
  try {
    // Get auth token from localStorage
    const token = localStorage.getItem('x-auth-token');
    if (!token) {
      return { data: null, error: 'User not authenticated' };
    }

    return updateOrgMemberPreferences(orgId, '', updates);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update preferences';
    console.error('API: Error in updateOrgUserPreferences:', message);
    return { data: null, error: message };
  }
};

/**
 * Get user's role in organization
 * Note: Backend will extract user_id from JWT token automatically
 */
export const getUserOrgRole = async (orgId: string): Promise<{ data: string | null; error: string | null }> => {
  try {
    const token = localStorage.getItem('x-auth-token');
    if (!token) {
      return { data: null, error: 'User not authenticated' };
    }

    // Get current user's member record from the org
    const result = await getOrgMember(orgId, '');
    if (result.error) {
      return { data: null, error: result.error };
    }

    return { data: result.data?.role || null, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch user role';
    console.error('API: Error in getUserOrgRole:', message);
    return { data: null, error: message };
  }
};
