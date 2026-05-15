import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface Invoice {
    id: string;
    user_id: string;
    client_id?: string;
    provider_id?: string;
    invoice_number: string;
    invoice_type: 'sales' | 'purchase';
    issue_date: string;
    due_date: string;
    amount: number;
    currency: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    description?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

/**
 * Fetch all invoices for the current user
 */
export const fetchInvoices = async () => {
    try {
        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .order('issue_date', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching invoices:', error);
        return { data: null, error: error.message };
    }
};

/**
 * Fetch a single invoice by ID
 */
export const fetchInvoiceById = async (id: string) => {
    try {
        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
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
        const { data, error } = await supabase
            .from('invoices')
            .insert([invoice])
            .select()
            .single();

        if (error) throw error;
        toast.success('Invoice created successfully');
        return { data, error: null };
    } catch (error: any) {
        console.error('Error creating invoice:', error);
        toast.error(error.message || 'Failed to create invoice');
        return { data: null, error: error.message };
    }
};

/**
 * Update an invoice
 */
export const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    try {
        const { data, error } = await supabase
            .from('invoices')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        toast.success('Invoice updated successfully');
        return { data, error: null };
    } catch (error: any) {
        console.error('Error updating invoice:', error);
        toast.error(error.message || 'Failed to update invoice');
        return { data: null, error: error.message };
    }
};

/**
 * Delete an invoice
 */
export const deleteInvoice = async (id: string) => {
    try {
        const { error } = await supabase
            .from('invoices')
            .delete()
            .eq('id', id);

        if (error) throw error;
        toast.success('Invoice deleted successfully');
        return { error: null };
    } catch (error: any) {
        console.error('Error deleting invoice:', error);
        toast.error(error.message || 'Failed to delete invoice');
        return { error: error.message };
    }
};

/**
 * Get invoice statistics
 */
export const getInvoiceStats = async () => {
    try {
        const { data, error } = await supabase
            .from('invoices')
            .select('amount, status');

        if (error) throw error;

        const stats = {
            total: data?.length || 0,
            totalAmount: data?.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0) || 0,
            paid: data?.filter((inv: any) => inv.status === 'paid').length || 0,
            pending: data?.filter((inv: any) => inv.status === 'sent' || inv.status === 'draft').length || 0,
        };

        return { data: stats, error: null };
    } catch (error: any) {
        console.error('Error getting invoice stats:', error);
        return { data: null, error: error.message };
    }
};
