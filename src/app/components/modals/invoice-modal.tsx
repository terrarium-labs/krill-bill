import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/auth/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { createInvoice } from '@/api/invoices';
import { Invoice } from '@/api/invoices';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import InvoiceForm from './invoice-form';
import InvoicePDFPreview from './invoice-pdf-preview';

/**
 * Props for the {@link InvoiceModal} component.
 */
export interface InvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceCreated?: (invoice: Invoice) => void | Promise<void>;
  onClose?: () => void;
}

/**
 * Modal for creating a new invoice with split layout.
 * Left side: Form inputs
 * Right side: PDF preview
 *
 * @example
 * ```tsx
 * <InvoiceModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onInvoiceCreated={handleSuccess}
 * />
 * ```
 */
export default function InvoiceModal({
  open,
  onOpenChange,
  onInvoiceCreated,
  onClose,
}: InvoiceModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { org } = useOrg();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [invoice, setInvoice] = React.useState<Partial<Invoice>>({
    invoice_number: '',
    invoice_type: 'sales',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    amount: 0,
    currency: org?.currency || 'EUR',
    status: 'draft',
    items: [],
    issuer_id: org?.id,
    issuer_name: org?.business_name || org?.name,
    recipient_id: '',
    recipient_name: '',
  });

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!next) {
        onClose?.();
        // Reset form
        setInvoice({
          invoice_number: '',
          invoice_type: 'sales',
          issue_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          amount: 0,
          currency: org?.currency || 'EUR',
          status: 'draft',
          items: [],
          issuer_id: org?.id,
          issuer_name: org?.business_name || org?.name,
          recipient_id: '',
          recipient_name: '',
        });
      }
      onOpenChange(next);
    },
    [onClose, onOpenChange, org?.currency, org?.id, org?.business_name, org?.name]
  );

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!invoice.invoice_number?.trim()) {
        toast.error(t('invoices.errors.invoiceNumberRequired', 'Invoice number is required'));
        return;
      }

      if (!invoice.issuer_name?.trim()) {
        toast.error(t('invoices.errors.issuerRequired', 'Issuer name is required'));
        return;
      }

      if (!invoice.recipient_name?.trim()) {
        toast.error(t('invoices.errors.recipientRequired', 'Recipient name is required'));
        return;
      }

      if (!invoice.issue_date) {
        toast.error(t('invoices.errors.issueDateRequired', 'Issue date is required'));
        return;
      }

      if (!invoice.items || invoice.items.length === 0) {
        toast.error(t('invoices.errors.noItems', 'Add at least one item to the invoice'));
        return;
      }

      if (!user || !org) {
        toast.error(t('errors.userOrOrgNotFound', 'User or organization not found'));
        return;
      }

      setIsSubmitting(true);
      try {
        const invoiceData: Omit<Invoice, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
          organization_id: org.id,
          client_id: invoice.client_id,
          issuer_id: invoice.issuer_id || undefined,
          recipient_id: invoice.recipient_id || undefined,
          issuer_name: invoice.issuer_name,
          recipient_name: invoice.recipient_name,
          invoice_number: invoice.invoice_number,
          invoice_type: invoice.invoice_type || 'sales',
          issue_date: invoice.issue_date || new Date().toISOString().split('T')[0],
          due_date: invoice.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          amount: invoice.amount || 0,
          currency: invoice.currency || org.currency,
          status: 'draft',
          description: invoice.description,
          items: invoice.items || [],
        };

        const { data: createdInvoice, error } = await createInvoice(invoiceData);

        if (error) {
          toast.error(error);
          return;
        }

        if (createdInvoice) {
          toast.success(t('toasts.invoiceCreated', 'Invoice created successfully'));
          await new Promise(resolve => setTimeout(resolve, 500));
          await onInvoiceCreated?.(createdInvoice);
          handleOpenChange(false);
        }
      } catch (error) {
        console.error('Error creating invoice:', error);
        toast.error(t('errors.creatingInvoice', 'Failed to create invoice'));
      } finally {
        setIsSubmitting(false);
      }
    },
    [invoice, user, org, t, onInvoiceCreated, handleOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-7xl md:min-w-7xl w-full w-[95vw] h-[95vh] flex flex-col p-0 overflow-visible">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{t('invoices.createInvoice', 'Create Invoice')}</DialogTitle>
          <DialogDescription>
            {t('invoices.createInvoiceDescription', 'Create a new invoice for your client')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex min-h-0 overflow-visible">
          {/* Responsive Grid Container */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-visible">
            {/* Left Side - Form */}
            <div className="flex flex-col border-b lg:border-b-0 lg:border-r border-border overflow-visible">
              <div className="px-6 py-4 overflow-y-auto overflow-x-visible">
                <InvoiceForm invoice={invoice} onInvoiceChange={setInvoice} />
              </div>
            </div>

            {/* Right Side - PDF Preview */}
            <div className="flex flex-col overflow-visible">
              <div className="px-6 py-4 overflow-y-auto overflow-x-visible">
                <InvoicePDFPreview invoice={invoice} businessName={org?.business_name || org?.name} />
              </div>
            </div>
          </div>
        </form>

        <DialogFooter className="px-6 py-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            type="button"
            variant="theme"
            onClick={handleSubmit}
            disabled={isSubmitting || !invoice.invoice_number || !invoice.issuer_name || !invoice.recipient_name || !invoice.items || invoice.items.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" />
                {t('common.creating', 'Creating...')}
              </>
            ) : (
              t('common.create', 'Create Invoice')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
