import { supabase } from '@/lib/supabase';
import { Client } from '@/types/clients';

/**
 * Fetch all clients for an organization
 */
export const fetchOrgClients = async (orgId: string): Promise<{ data: Client[] | null; error: string | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    // Verify user has access to this org
    const { data: orgMember } = await supabase
      .from('org_members')
      .select('*')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (!orgMember) {
      console.error('API: User does not have access to org:', orgId);
      return { data: null, error: 'Access denied' };
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('org_id', orgId)
      .order('name', { ascending: true });

    if (error) {
      console.error('API: Error fetching clients:', error);
      return { data: null, error: error.message };
    }

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    // Verify access
    const { data: orgMember } = await supabase
      .from('org_members')
      .select('*')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (!orgMember) {
      return { data: null, error: 'Access denied' };
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('org_id', orgId)
      .single();

    if (error) {
      console.error('API: Error fetching client:', error);
      return { data: null, error: error.message };
    }

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    // Verify access and permission
    const { data: orgMember } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (!orgMember) {
      return { data: null, error: 'Access denied' };
    }

    const { data, error } = await supabase
      .from('clients')
      .insert([{ ...clientData, org_id: orgId }])
      .select()
      .single();

    if (error) {
      console.error('API: Error creating client:', error);
      return { data: null, error: error.message };
    }

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    // Verify access and admin permission
    const { data: orgMember } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (!orgMember || !['owner', 'admin'].includes(orgMember.role)) {
      return { data: null, error: 'Permission denied' };
    }

    const { error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', clientId)
      .eq('org_id', orgId);

    if (error) {
      console.error('API: Error updating client:', error);
      return { data: null, error: error.message };
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    // Verify access and admin permission
    const { data: orgMember } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (!orgMember || !['owner', 'admin'].includes(orgMember.role)) {
      return { data: null, error: 'Permission denied' };
    }

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)
      .eq('org_id', orgId);

    if (error) {
      console.error('API: Error deleting client:', error);
      return { data: null, error: error.message };
    }

    console.log('API: Successfully deleted client:', clientId);
    return { data: null, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete client';
    console.error('API: Error in deleteClient:', message);
    return { data: null, error: message };
  }
};
