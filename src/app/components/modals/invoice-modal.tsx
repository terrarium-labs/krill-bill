import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * Props for the {@link InvoiceModal} component.
 */
export interface InvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceCreated?: () => void | Promise<void>;
  onClose?: () => void;
  isSubmitting?: boolean;
}

/**
 * Modal for creating a new invoice.
 * Uses shadcn Dialog component with form validation.
 *
 * @example
 * ```tsx
 * <InvoiceModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onInvoiceCreated={handleSuccess}
 *   isSubmitting={isLoading}
 * />
 * ```
 */
export default function InvoiceModal({
  open,
  onOpenChange,
  onInvoiceCreated,
  onClose,
  isSubmitting = false,
}: InvoiceModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = React.useState({
    clientName: '',
    amount: '',
    description: '',
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const submitButtonRef = React.useRef<HTMLButtonElement>(null);

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!next) {
        onClose?.();
      }
      onOpenChange(next);
    },
    [onClose, onOpenChange]
  );

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const newErrors: Record<string, string> = {};

      if (!formData.clientName.trim()) {
        newErrors.clientName = t('invoices.errors.clientNameRequired', 'Client name is required');
      }

      if (!formData.amount.trim()) {
        newErrors.amount = t('invoices.errors.amountRequired', 'Amount is required');
      } else if (isNaN(parseFloat(formData.amount))) {
        newErrors.amount = t('invoices.errors.amountInvalid', 'Amount must be a valid number');
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      try {
        // TODO: Create invoice via API
        await onInvoiceCreated?.();
        toast.success(t('invoices.createdSuccess', 'Invoice created successfully'));
        setFormData({ clientName: '', amount: '', description: '' });
        setErrors({});
        onClose?.();
        onOpenChange(false);
      } catch (error) {
        toast.error(t('invoices.createError', 'Failed to create invoice'));
      }
    },
    [formData, onInvoiceCreated, t, onClose, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          submitButtonRef.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>{t('invoices.createInvoice', 'Create Invoice')}</DialogTitle>
          <DialogDescription>
            {t('invoices.createInvoiceDescription', 'Create a new invoice for your client')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('common.clientName', 'Client Name')}
            </label>
            <input
              type="text"
              value={formData.clientName}
              onChange={(e) =>
                setFormData({ ...formData, clientName: e.target.value })
              }
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-background text-foreground ${
                errors.clientName
                  ? 'border-destructive focus:ring-destructive'
                  : 'border-border focus:ring-ring'
              }`}
              placeholder={t('invoices.placeholders.clientName', 'e.g., Acme Inc.')}
            />
            {errors.clientName && (
              <p className="text-destructive text-sm mt-1">{errors.clientName}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('common.amount', 'Amount')}
            </label>
            <input
              type="text"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-background text-foreground ${
                errors.amount
                  ? 'border-destructive focus:ring-destructive'
                  : 'border-border focus:ring-ring'
              }`}
              placeholder={t('invoices.placeholders.amount', '0.00')}
            />
            {errors.amount && (
              <p className="text-destructive text-sm mt-1">{errors.amount}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('common.description', 'Description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              rows={3}
              placeholder={t('invoices.placeholders.description', 'Invoice description')}
            />
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            ref={submitButtonRef}
            type="button"
            variant="theme"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" />
                {t('common.creating', 'Creating...')}
              </>
            ) : (
              t('common.create', 'Create')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
