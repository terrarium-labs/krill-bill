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
 * Props for the {@link ClientModal} component.
 */
export interface ClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientCreated?: () => void | Promise<void>;
  onClose?: () => void;
  isSubmitting?: boolean;
}

/**
 * Modal for creating a new client.
 * Uses shadcn Dialog component with form validation.
 *
 * @example
 * ```tsx
 * <ClientModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onClientCreated={handleSuccess}
 *   isSubmitting={isLoading}
 * />
 * ```
 */
export default function ClientModal({
  open,
  onOpenChange,
  onClientCreated,
  onClose,
  isSubmitting = false,
}: ClientModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    address: '',
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

      if (!formData.name.trim()) {
        newErrors.name = t('clients.errors.nameRequired', 'Client name is required');
      }

      if (formData.email && !formData.email.includes('@')) {
        newErrors.email = t('clients.errors.invalidEmail', 'Please enter a valid email address');
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      try {
        // TODO: Create client via API
        await onClientCreated?.();
        toast.success(t('clients.createdSuccess', 'Client created successfully'));
        setFormData({ name: '', email: '', phone: '', address: '' });
        setErrors({});
        onClose?.();
        onOpenChange(false);
      } catch (error) {
        toast.error(t('clients.createError', 'Failed to create client'));
      }
    },
    [formData, onClientCreated, t, onClose, onOpenChange]
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
          <DialogTitle>{t('clients.createClient', 'Create Client')}</DialogTitle>
          <DialogDescription>
            {t('clients.createClientDescription', 'Add a new client to your system')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('common.name', 'Name')}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-background text-foreground ${
                errors.name
                  ? 'border-destructive focus:ring-destructive'
                  : 'border-border focus:ring-ring'
              }`}
              placeholder={t('clients.placeholders.name', 'e.g., Acme Inc.')}
            />
            {errors.name && (
              <p className="text-destructive text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('common.email', 'Email')}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-background text-foreground ${
                errors.email
                  ? 'border-destructive focus:ring-destructive'
                  : 'border-border focus:ring-ring'
              }`}
              placeholder={t('clients.placeholders.email', 'contact@example.com')}
            />
            {errors.email && (
              <p className="text-destructive text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('common.phone', 'Phone')}
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={t('clients.placeholders.phone', '+1 (555) 000-0000')}
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('common.address', 'Address')}
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              rows={2}
              placeholder={t('clients.placeholders.address', 'Street address')}
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
