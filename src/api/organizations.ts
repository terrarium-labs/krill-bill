import { Organization, CreateOrganizationInput } from '@/types/organization'
import { apiFetch, API_BASE_URL } from './api'

// Fetch all organizations for current user
export const fetchUserOrganizations = async (): Promise<{ data: Organization[] | null; error: string | null }> => {
  try {
    const response = await apiFetch(
      new URL(`${API_BASE_URL}/organizations`),
      { method: 'GET' }
    );
    
    if ('error' in response) {
      return { data: null, error: response.error };
    }
    
    const data = response.data as Organization[];
    return { data: data || [], error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

// Fetch single organization
export const fetchOrganization = async (id: string): Promise<{ data: Organization | null; error: string | null }> => {
  try {
    const response = await apiFetch(
      new URL(`${API_BASE_URL}/organizations/${id}`),
      { method: 'GET' }
    );
    
    if ('error' in response) {
      return { data: null, error: response.error };
    }
    
    const data = response.data as Organization;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

// Create organization
export const createOrganization = async (input: CreateOrganizationInput): Promise<{ data: Organization | null; error: string | null }> => {
  try {
    const response = await apiFetch(
      new URL(`${API_BASE_URL}/organizations`),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }
    );
    
    if ('error' in response) {
      return { data: null, error: response.error };
    }
    
    const data = response.data as Organization;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

// Update organization
export const updateOrganization = async (id: string, updates: Partial<CreateOrganizationInput>): Promise<{ data: Organization | null; error: string | null }> => {
  try {
    const response = await apiFetch(
      new URL(`${API_BASE_URL}/organizations/${id}`),
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }
    );
    
    if ('error' in response) {
      return { data: null, error: response.error };
    }
    
    const data = response.data as Organization;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

// Delete organization
export const deleteOrganization = async (id: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    const response = await apiFetch(
      new URL(`${API_BASE_URL}/organizations/${id}`),
      { method: 'DELETE' }
    );
    
    if ('error' in response) {
      return { success: false, error: response.error };
    }
    
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
