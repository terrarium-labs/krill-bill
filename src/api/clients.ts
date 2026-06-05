import { apiFetch, API_BASE_URL } from './api';
import { Client } from '@/types/clients';

/**
 * Fetch all clients for an organization
 */
export const fetchOrgClients = async (orgId: string): Promise<{ data: Client[] | null; error: string | null }> => {
  try {
    const response = await apiFetch(
      new URL(`${API_BASE_URL}/contacts/clients?org_id=${orgId}`),
      { method: 'GET' }
    );

    if ('error' in response) {
      console.error('API: Error fetching clients:', response.error);
      return { data: null, error: response.error };
    }

    const data = response.data as Client[];
    console.log('API: Successfully fetched', data?.length || 0, 'clients');
    return { data: data || [], error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch clients';
    console.error('API: Error in fetchOrgClients:', message);
    return { data: null, error: message };
  }
};

/**
 * Fetch a single client by ID
 */
export const fetchClientById = async (orgId: string, clientId: string): Promise<{ data: Client | null; error: string | null }> => {
  try {
    const response = await apiFetch(
      new URL(`${API_BASE_URL}/contacts/clients/${clientId}?org_id=${orgId}`),
      { method: 'GET' }
    );

    if ('error' in response) {
      console.error('API: Error fetching client:', response.error);
      return { data: null, error: response.error };
    }

    const data = response.data as Client;
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch client';
    console.error('API: Error in fetchClientById:', message);
    return { data: null, error: message };
  }
};

/**
 * Create a new client
 */
export const createClient = async (orgId: string, clientData: Omit<Client, 'id' | 'org_id' | 'created_at' | 'updated_at'>): Promise<{ data: Client | null; error: string | null }> => {
  try {
    const response = await apiFetch(
      new URL(`${API_BASE_URL}/contacts/clients?org_id=${orgId}`),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
      }
    );

    if ('error' in response) {
      console.error('API: Error creating client:', response.error);
      return { data: null, error: response.error };
    }

    const data = response.data as Client;
    console.log('API: Successfully created client:', data.id);
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create client';
    console.error('API: Error in createClient:', message);
    return { data: null, error: message };
  }
};

/**
 * Update a client
 */
export const updateClient = async (orgId: string, clientId: string, updates: Partial<Client>): Promise<{ data: null; error: string | null }> => {
  try {
    const response = await apiFetch(
      new URL(`${API_BASE_URL}/contacts/clients/${clientId}?org_id=${orgId}`),
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }
    );

    if ('error' in response) {
      console.error('API: Error updating client:', response.error);
      return { data: null, error: response.error };
    }

    console.log('API: Successfully updated client:', clientId);
    return { data: null, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update client';
    console.error('API: Error in updateClient:', message);
    return { data: null, error: message };
  }
};

/**
 * Delete a client
 */
export const deleteClient = async (orgId: string, clientId: string): Promise<{ data: null; error: string | null }> => {
  try {
    const response = await apiFetch(
      new URL(`${API_BASE_URL}/contacts/clients/${clientId}?org_id=${orgId}`),
      { method: 'DELETE' }
    );

    if ('error' in response) {
      console.error('API: Error deleting client:', response.error);
      return { data: null, error: response.error };
    }

    console.log('API: Successfully deleted client:', clientId);
    return { data: null, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete client';
    console.error('API: Error in deleteClient:', message);
    return { data: null, error: message };
  }
};
