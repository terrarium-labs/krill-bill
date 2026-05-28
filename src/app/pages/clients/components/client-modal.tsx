import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useOrg } from '@/contexts/OrgContext';
import { createClient, updateClient } from '@/api/clients';
import { Client } from '@/types/clients';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface ClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client;
  onSubmit?: () => void | Promise<void>;
  onClose?: () => void;
}

export default function ClientModal({
  open,
  onOpenChange,
  client,
  onSubmit,
  onClose,
}: ClientModalProps) {
  const { t } = useTranslation();
  const { org } = useOrg();
  const [formData, setFormData] = React.useState<Partial<Client>>({
    name: '',
    business_name: '',
    business_email: '',
    business_phone: '',
    business_website: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    postal_code: '',
    state: '',
    country: '',
    currency: '',
    language: '',
    default_due_days: 30,
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (client) {
      setFormData(client);
    } else {
      setFormData({
        name: '',
        business_name: '',
        business_email: '',
        business_phone: '',
        business_website: '',
        address_line_1: '',
        address_line_2: '',
        city: '',
        postal_code: '',
        state: '',
        country: org?.country || '',
        currency: org?.currency || 'EUR',
        language: org?.language || 'en',
        default_due_days: 30,
      });
    }
    setErrors({});
  }, [client, open, org]);

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!next) {
        onClose?.();
        setErrors({});
      }
      onOpenChange(next);
    },
    [onClose, onOpenChange]
  );

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const newErrors: Record<string, string> = {};

      if (!formData.name?.trim()) {
        newErrors.name = t('clients.errors.nameRequired', 'Client name is required');
      }

      if (formData.business_email && !formData.business_email.includes('@')) {
        newErrors.business_email = t('clients.errors.invalidEmail', 'Please enter a valid email address');
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      if (!org?.id) {
        toast.error(t('errors.orgNotFound', 'Organization not found'));
        return;
      }

      setIsSubmitting(true);
      try {
        if (client?.id) {
          const { error } = await updateClient(org.id, client.id, formData);
          if (error) {
            toast.error(error);
          } else {
            toast.success(t('clients.updatedSuccess', 'Client updated successfully'));
            await onSubmit?.();
            handleOpenChange(false);
          }
        } else {
          const { error } = await createClient(org.id, formData as Omit<Client, 'id' | 'org_id' | 'created_at' | 'updated_at'>);
          if (error) {
            toast.error(error);
          } else {
            toast.success(t('clients.createdSuccess', 'Client created successfully'));
            setFormData({
              name: '',
              business_name: '',
              business_email: '',
              business_phone: '',
              business_website: '',
              address_line_1: '',
              address_line_2: '',
              city: '',
              postal_code: '',
              state: '',
              country: org?.country || '',
              currency: org?.currency || 'EUR',
              language: org?.language || 'en',
              default_due_days: 30,
            });
            await new Promise(resolve => setTimeout(resolve, 500));
            await onSubmit?.();
            handleOpenChange(false);
          }
        }
      } catch (error) {
        toast.error(t(client?.id ? 'clients.updateError' : 'clients.createError', 'Failed to save client'));
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, client, onSubmit, t, org?.id, handleOpenChange]
  );

  const isEditing = !!client?.id;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('clients.editClient', 'Edit Client') : t('clients.createClient', 'Create Client')}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? t('clients.editClientDescription', 'Update client information')
              : t('clients.createClientDescription', 'Add a new client to your system')
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('common.name', 'Name')} *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isSubmitting}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-background text-foreground ${
                  errors.name
                    ? 'border-destructive focus:ring-destructive'
                    : 'border-border focus:ring-ring'
                }`}
                placeholder={t('clients.placeholders.name', 'e.g., John Doe')}
              />
              {errors.name && <p className="text-destructive text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('common.businessName', 'Business Name')}
              </label>
              <input
                type="text"
                value={formData.business_name || ''}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder={t('clients.placeholders.businessName', 'e.g., Acme Inc.')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('common.email', 'Email')}
              </label>
              <input
                type="email"
                value={formData.business_email || ''}
                onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
                disabled={isSubmitting}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-background text-foreground ${
                  errors.business_email
                    ? 'border-destructive focus:ring-destructive'
                    : 'border-border focus:ring-ring'
                }`}
                placeholder={t('clients.placeholders.email', 'contact@example.com')}
              />
              {errors.business_email && <p className="text-destructive text-sm mt-1">{errors.business_email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('common.phone', 'Phone')}
              </label>
              <input
                type="tel"
                value={formData.business_phone || ''}
                onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder={t('clients.placeholders.phone', '+1 (555) 000-0000')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('common.website', 'Website')}
            </label>
            <input
              type="url"
              value={formData.business_website || ''}
              onChange={(e) => setFormData({ ...formData, business_website: e.target.value })}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="https://example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Address Line 1 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('common.addressLine1', 'Address Line 1')}
              </label>
              <input
                type="text"
                value={formData.address_line_1 || ''}
                onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Address Line 2 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('common.addressLine2', 'Address Line 2')}
              </label>
              <input
                type="text"
                value={formData.address_line_2 || ''}
                onChange={(e) => setFormData({ ...formData, address_line_2: e.target.value })}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('common.city', 'City')}
              </label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('common.postalCode', 'Postal Code')}
              </label>
              <input
                type="text"
                value={formData.postal_code || ''}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('common.state', 'State')}
              </label>
              <input
                type="text"
                value={formData.state || ''}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('common.country', 'Country')}
              </label>
              <input
                type="text"
                value={formData.country || ''}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('common.currency', 'Currency')}
              </label>
              <input
                type="text"
                value={formData.currency || ''}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="EUR"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('common.language', 'Language')}
              </label>
              <input
                type="text"
                value={formData.language || ''}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="en"
              />
            </div>
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
            type="button"
            variant="theme"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" />
                {t('common.saving', 'Saving...')}
              </>
            ) : (
              t(isEditing ? 'common.save' : 'common.create', isEditing ? 'Save' : 'Create')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
