import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { SerialNumber, SerialNumberEntity } from '@/types/serial-numbers';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { validatePattern, generateNextDocumentNumber } from '@/app/utils/serial-number-patterns';

/**
 * Props for the {@link SerialNumberModal} component.
 * Handles both create and edit modes for serial number patterns.
 */
export interface SerialNumberModalProps {
  /** Controlled open state. */
  open: boolean;
  /** Called when open state should change. */
  onOpenChange: (open: boolean) => void;
  /** Called when the form is submitted with validated data. */
  onSubmit: (data: Omit<SerialNumber, 'id'>) => void | Promise<void>;
  /** Initial data for edit mode. Omit for create mode. */
  initialData?: SerialNumber;
  /** Modal mode: 'create' or 'edit'. */
  mode: 'create' | 'edit';
  /** Called when modal is closed (any method). */
  onClose?: () => void;
  /** When true, submit button shows spinner and is disabled. */
  isSubmitting?: boolean;
}

/**
 * Modal for creating or editing serial number patterns.
 * Uses shadcn Dialog component with proper form validation.
 *
 * @example
 * ```tsx
 * <SerialNumberModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   mode="create"
 *   onSubmit={handleCreate}
 *   isSubmitting={isLoading}
 * />
 * ```
 */
export default function SerialNumberModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode,
  onClose,
  isSubmitting = false,
}: SerialNumberModalProps) {
  const { t } = useTranslation();
  
  const ENTITIES: { value: SerialNumberEntity; label: string }[] = React.useMemo(
    () => [
      { value: 'sales_invoices', label: t('modals.serialNumber.salesInvoices', 'Sales Invoices') },
      { value: 'purchase_invoices', label: t('modals.serialNumber.purchaseInvoices', 'Purchase Invoices') },
      { value: 'orders', label: t('modals.serialNumber.orders', 'Orders') },
    ],
    [t]
  );

  const [formData, setFormData] = React.useState<Omit<SerialNumber, 'id'>>({
    entity: initialData?.entity || 'sales_invoices',
    name: initialData?.name || '',
    value: initialData?.value || '',
    last_num_value: initialData?.last_num_value || 0,
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

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
        newErrors.name = t('modals.serialNumber.errors.nameRequired');
      }

      const patternValidation = validatePattern(formData.value);
      if (!patternValidation.valid) {
        newErrors.value = patternValidation.error || t('modals.serialNumber.errors.patternInvalid');
      }

      if (formData.last_num_value < 0) {
        newErrors.last_num_value = t('modals.serialNumber.errors.lastNumberNegative');
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      await onSubmit(formData);
      setFormData({
        entity: 'sales_invoices',
        name: '',
        value: '',
        last_num_value: 0,
      });
      setErrors({});
      onClose?.();
      onOpenChange(false);
    },
    [formData, onSubmit, t, onClose, onOpenChange]
  );

  const submitButtonRef = React.useRef<HTMLButtonElement>(null);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          submitButtonRef.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {mode === 'create'
              ? t('modals.serialNumber.createTitle')
              : t('modals.serialNumber.editTitle')}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? t('modals.serialNumber.createDescription')
              : t('modals.serialNumber.editDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('modals.serialNumber.name')}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-background text-foreground ${
                errors.name
                  ? 'border-destructive focus:ring-destructive'
                  : 'border-border focus:ring-ring'
              }`}
              placeholder={t('modals.serialNumber.nameHelp')}
            />
            {errors.name && (
              <p className="text-destructive text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Entity */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('modals.serialNumber.entityType')}
            </label>
            <select
              value={formData.entity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  entity: e.target.value as SerialNumberEntity,
                })
              }
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {ENTITIES.map((entity) => (
                <option key={entity.value} value={entity.value}>
                  {entity.label}
                </option>
              ))}
            </select>
          </div>

          {/* Pattern Value */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('modals.serialNumber.pattern')}
            </label>
            <input
              type="text"
              value={formData.value}
              onChange={(e) =>
                setFormData({ ...formData, value: e.target.value })
              }
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-background text-foreground ${
                errors.value
                  ? 'border-destructive focus:ring-destructive'
                  : 'border-border focus:ring-ring'
              }`}
              placeholder={t('modals.serialNumber.patternPlaceholder', 'e.g., INV-[YYYY]-%%%%%')}
            />
            {errors.value && (
              <p className="text-destructive text-sm mt-1">{errors.value}</p>
            )}

            {/* Helper text with examples */}
            <div className="mt-3 p-3 bg-[color:var(--accent-background)] rounded-md border border-[color:var(--accent-border)]">
              <p className="text-xs font-semibold text-[color:var(--accent-color)] mb-2">
                {t('modals.serialNumber.patternFormat')}
              </p>
              <ul className="text-xs text-foreground space-y-1 ml-3">
                <li>• {t('modals.serialNumber.hints.digits')}</li>
                <li>• {t('modals.serialNumber.hints.year')}</li>
                <li>• {t('modals.serialNumber.hints.shortYear')}</li>
                <li>• {t('modals.serialNumber.hints.month')}</li>
                <li>• {t('modals.serialNumber.hints.day')}</li>
              </ul>
            </div>

            {/* Real-time preview */}
            {formData.value && validatePattern(formData.value).valid && (
              <div className="mt-3 p-3 bg-primary/10 rounded-md border border-primary">
                <p className="text-xs text-primary font-medium mb-1">
                  {t('modals.serialNumber.nextExample')} {formData.last_num_value}):
                </p>
                <p className="text-sm font-mono font-semibold text-primary">
                  {generateNextDocumentNumber(formData.value, formData.last_num_value)}
                </p>
              </div>
            )}
          </div>

          {/* Last Number */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('modals.serialNumber.lastNumberUsed')}
            </label>
            <input
              type="number"
              value={formData.last_num_value}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  last_num_value: parseInt(e.target.value) || 0,
                })
              }
              disabled={isSubmitting}
              min="0"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-background text-foreground ${
                errors.last_num_value
                  ? 'border-destructive focus:ring-destructive'
                  : 'border-border focus:ring-ring'
              }`}
            />
            {errors.last_num_value && (
              <p className="text-destructive text-sm mt-1">
                {errors.last_num_value}
              </p>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            {t('buttons.cancel')}
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
                {t('common.saving')}
              </>
            ) : (
              <>
                {mode === 'create'
                  ? t('modals.serialNumber.create')
                  : t('modals.serialNumber.update')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
