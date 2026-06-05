import { apiFetch, API_BASE_URL } from './api'
import { OrganizationPartner, CreateOrganizationPartnerInput } from '@/types/organization'

/**
 * Fetch all partners for an organization
 */
export const fetchOrganizationPartners = async (orgId: string) => {
  try {
    const response = await apiFetch(
      new URL(`${API_BASE_URL}/partners/${orgId}`),
      { method: 'GET' }
    );

    if ('error' in response) {
      return { data: [], error: response.error };
    }

    const data = response.data as any[];
    return { data: data || [], error: null };
  } catch (error: any) {
    console.error('Error fetching organization partners:', error);
    return { data: [], error: error.message };
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
    const response = await apiFetch(
      new URL(`${API_BASE_URL}/partners/${orgId}`),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }
    );

    if ('error' in response) {
      return { data: null, error: response.error };
    }

    const data = response.data as OrganizationPartner;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error adding organization partner:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Remove a partner from an organization
 */
export const removeOrganizationPartner = async (partnerId: string, orgId: string) => {
  try {
    const response = await apiFetch(
      new URL(`${API_BASE_URL}/partners/${partnerId}?org_id=${orgId}`),
      { method: 'DELETE' }
    );

    if ('error' in response) {
      return { error: response.error };
    }

    return { error: null };
  } catch (error: any) {
    console.error('Error removing organization partner:', error);
    return { error: error.message };
  }
}

/**
 * Update a partner type
 */
export const updateOrganizationPartner = async (
  partnerId: string,
  orgId: string,
  partnerType: 'client' | 'provider'
) => {
  try {
    const response = await apiFetch(
      new URL(`${API_BASE_URL}/partners/${partnerId}?org_id=${orgId}`),
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partner_type: partnerType }),
      }
    );

    if ('error' in response) {
      return { data: null, error: response.error };
    }

    const data = response.data as OrganizationPartner;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating organization partner:', error);
    return { data: null, error: error.message };
  }
}
