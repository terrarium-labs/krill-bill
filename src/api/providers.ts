import { apiFetch, API_BASE_URL } from './api';
import { Provider } from '@/types/providers';

/**
 * Fetch all providers for an organization
 */
export const fetchOrgProviders = async (orgId: string): Promise<{ data: Provider[] | null; error: string | null }> => {
  try {
    const response = await apiFetch(
      new URL(`${API_BASE_URL}/contacts/providers?org_id=${orgId}`),
      { method: 'GET' }
    );

    if ('error' in response) {
      console.error('API: Error fetching providers:', response.error);
      return { data: null, error: response.error };
    }

    const data = response.data as Provider[];
    console.log('API: Successfully fetched', data?.length || 0, 'providers');
    return { data: data || [], error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch providers';
    console.error('API: Error in fetchOrgProviders:', message);
    return { data: null, error: message };
  }
};

/**
 * Fetch a single provider by ID
 */
export const fetchProviderById = async (orgId: string, providerId: string): Promise<{ data: Provider | null; error: string | null }> => {
  try {
    const response = await apiFetch(
      new URL(`${API_BASE_URL}/contacts/providers/${providerId}?org_id=${orgId}`),
      { method: 'GET' }
    );

    if ('error' in response) {
      console.error('API: Error fetching provider:', response.error);
      return { data: null, error: response.error };
    }

    const data = response.data as Provider;
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch provider';
    console.error('API: Error in fetchProviderById:', message);
    return { data: null, error: message };
  }
};

/**
 * Create a new provider
 */
export const createProvider = async (orgId: string, providerData: Omit<Provider, 'id' | 'org_id' | 'created_at' | 'updated_at'>): Promise<{ data: Provider | null; error: string | null }> => {
  try {
    const response = await apiFetch(
      new URL(`${API_BASE_URL}/contacts/providers?org_id=${orgId}`),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(providerData),
      }
    );

    if ('error' in response) {
      console.error('API: Error creating provider:', response.error);
      return { data: null, error: response.error };
    }

    const data = response.data as Provider;
    console.log('API: Successfully created provider:', data.id);
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create provider';
    console.error('API: Error in createProvider:', message);
    return { data: null, error: message };
  }
};

/**
 * Update a provider
 */
export const updateProvider = async (orgId: string, providerId: string, updates: Partial<Provider>): Promise<{ data: null; error: string | null }> => {
  try {
    const response = await apiFetch(
      new URL(`${API_BASE_URL}/contacts/providers/${providerId}?org_id=${orgId}`),
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }
    );

    if ('error' in response) {
      console.error('API: Error updating provider:', response.error);
      return { data: null, error: response.error };
    }

    console.log('API: Successfully updated provider:', providerId);
    return { data: null, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update provider';
    console.error('API: Error in updateProvider:', message);
    return { data: null, error: message };
  }
};

/**
 * Delete a provider
 */
export const deleteProvider = async (orgId: string, providerId: string): Promise<{ data: null; error: string | null }> => {
  try {
    const response = await apiFetch(
      new URL(`${API_BASE_URL}/contacts/providers/${providerId}?org_id=${orgId}`),
      { method: 'DELETE' }
    );

    if ('error' in response) {
      console.error('API: Error deleting provider:', response.error);
      return { data: null, error: response.error };
    }

    console.log('API: Successfully deleted provider:', providerId);
    return { data: null, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete provider';
    console.error('API: Error in deleteProvider:', message);
    return { data: null, error: message };
  }
};
