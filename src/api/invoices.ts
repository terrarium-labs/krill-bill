import { apiFetch, API_BASE_URL } from './api';

export interface InvoiceItem {
    id?: string;
    name: string;
    description?: string;
    quantity: number;
    price: number;
    apply_taxes: boolean;
}

export interface Invoice {
    id: string;
    organization_id: string;
    user_id: string;
    issuer_id?: string;
    recipient_id?: string;
    client_id?: string;
    provider_id?: string;
    issuer_name?: string;
    recipient_name?: string;
    invoice_number: string;
    invoice_type: 'sales' | 'purchase';
    issue_date: string;
    due_date: string;
    amount: number;
    currency: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    description?: string;
    notes?: string;
    items: InvoiceItem[];
    created_at: string;
    updated_at: string;
}

/**
 * Fetch all invoices for a specific organization
 */
export const fetchInvoices = async (orgId: string) => {
    try {
        const response = await apiFetch(
            new URL(`${API_BASE_URL}/invoices?org_id=${orgId}`),
            { method: 'GET' }
        );

        if ('error' in response) {
            return { data: [], error: response.error };
        }

        const data = response.data as Invoice[];
        return { data: data || [], error: null };
    } catch (error: any) {
        console.error('Error fetching invoices:', error);
        return { data: [], error: error.message };
    }
};

/**
 * Fetch a single invoice by ID
 */
export const fetchInvoiceById = async (id: string) => {
    try {
        const response = await apiFetch(
            new URL(`${API_BASE_URL}/invoices/${id}`),
            { method: 'GET' }
        );

        if ('error' in response) {
            return { data: null, error: response.error };
        }

        const data = response.data as Invoice;
        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching invoice:', error);
        return { data: null, error: error.message };
    }
};

/**
 * Create a new invoice
 */
export const createInvoice = async (invoice: Omit<Invoice, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
        const response = await apiFetch(
            new URL(`${API_BASE_URL}/invoices?org_id=${invoice.organization_id}`),
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invoice),
            }
        );

        if ('error' in response) {
            return { data: null, error: response.error };
        }

        const data = response.data as Invoice;
        return { data, error: null };
    } catch (error: any) {
        console.error('Error creating invoice:', error);
        return { data: null, error: error.message };
    }
};

/**
 * Update an invoice
 */
export const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    try {
        const response = await apiFetch(
            new URL(`${API_BASE_URL}/invoices/${id}`),
            {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            }
        );

        if ('error' in response) {
            return { data: null, error: response.error };
        }

        const data = response.data as Invoice;
        return { data, error: null };
    } catch (error: any) {
        console.error('Error updating invoice:', error);
        return { data: null, error: error.message };
    }
};

/**
 * Delete an invoice
 */
export const deleteInvoice = async (orgId: string, id: string) => {
    try {
        const response = await apiFetch(
            new URL(`${API_BASE_URL}/invoices/${id}`),
            { method: 'DELETE' }
        );

        if ('error' in response) {
            return { error: response.error };
        }

        return { error: null };
    } catch (error: any) {
        console.error('Error deleting invoice:', error);
        return { error: error.message };
    }
};

/**
 * Get invoice statistics for an organization
 */
export const getInvoiceStats = async (orgId: string) => {
    try {
        const response = await apiFetch(
            new URL(`${API_BASE_URL}/invoices/stats/${orgId}`),
            { method: 'GET' }
        );

        if ('error' in response) {
            throw new Error(response.error);
        }

        return response.data;

        return { data: stats, error: null };
    } catch (error: any) {
        console.error('Error getting invoice stats:', error);
        return { data: null, error: error.message };
    }
};
