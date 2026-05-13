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
 * Props for the {@link ProviderModal} component.
 */
export interface ProviderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProviderCreated?: () => void | Promise<void>;
  onClose?: () => void;
  isSubmitting?: boolean;
}

/**
 * Modal for creating a new provider.
 * Uses shadcn Dialog component with form validation.
 *
 * @example
 * ```tsx
 * <ProviderModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onProviderCreated={handleSuccess}
 *   isSubmitting={isLoading}
 * />
 * ```
 */
export default function ProviderModal({
  open,
  onOpenChange,
  onProviderCreated,
  onClose,
  isSubmitting = false,
}: ProviderModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = React.useState({
    providerName: '',
    email: '',
    phone: '',
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

      if (!formData.providerName.trim()) {
        newErrors.providerName = t('providers.errors.providerNameRequired', 'Provider name is required');
      }

      if (!formData.email.trim()) {
        newErrors.email = t('providers.errors.emailRequired', 'Email is required');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = t('providers.errors.emailInvalid', 'Email must be valid');
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      try {
        // TODO: Create provider via API
        await onProviderCreated?.();
        toast.success(t('providers.createdSuccess', 'Provider created successfully'));
        setFormData({ providerName: '', email: '', phone: '', description: '' });
        setErrors({});
        onClose?.();
        onOpenChange(false);
      } catch (error) {
        toast.error(t('providers.createError', 'Failed to create provider'));
      }
    },
    [formData, onProviderCreated, t, onClose, onOpenChange]
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
          <DialogTitle>{t('providers.createProvider', 'Create Provider')}</DialogTitle>
          <DialogDescription>
            {t('providers.createProviderDescription', 'Add a new provider to your network')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Provider Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('common.providerName', 'Provider Name')}
            </label>
            <input
              type="text"
              value={formData.providerName}
              onChange={(e) =>
                setFormData({ ...formData, providerName: e.target.value })
              }
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-background text-foreground ${
                errors.providerName
                  ? 'border-destructive focus:ring-destructive'
                  : 'border-border focus:ring-ring'
              }`}
              placeholder={t('providers.placeholders.providerName', 'e.g., Acme Supplies')}
            />
            {errors.providerName && (
              <p className="text-destructive text-sm mt-1">{errors.providerName}</p>
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
              placeholder={t('providers.placeholders.email', 'provider@example.com')}
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
              placeholder={t('providers.placeholders.phone', '+1 (555) 000-0000')}
            />
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
              placeholder={t('providers.placeholders.description', 'Provider details and notes')}
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
