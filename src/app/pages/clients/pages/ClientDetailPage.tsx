import { useParams, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, ArrowLeft, Save, Trash2 } from 'lucide-react';
import { useOrg } from '@/contexts/OrgContext';
import { fetchClientById, updateClient, deleteClient } from '@/api/clients';
import { Client } from '@/types/clients';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { DeleteModal } from '@/app/components/modals/delete-modal';
import PageHeader from '@/app/components/page-header';

export default function ClientDetailPage() {
  const { clientId: id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { org } = useOrg();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Client>>({});

  useEffect(() => {
    const loadClient = async () => {
      if (!org?.id || !id) return;
      try {
        const { data, error } = await fetchClientById(org.id, id);
        if (error) {
          toast.error(error);
          navigate('/clients');
        } else {
          setClient(data);
          setFormData(data || {});
        }
      } catch (error) {
        toast.error(t('errors.failedToLoad', 'Failed to load client'));
      } finally {
        setLoading(false);
      }
    };

    loadClient();
  }, [id, org?.id, navigate, t]);

  const handleSave = async () => {
    if (!org?.id || !id) return;
    setSaving(true);
    try {
      const { error } = await updateClient(org.id, id, formData);
      if (error) {
        toast.error(error);
      } else {
        setClient({ ...client, ...formData } as Client);
        toast.success(t('clients.updatedSuccess', 'Client updated successfully'));
      }
    } catch (error) {
      toast.error(t('errors.failedToUpdate', 'Failed to update client'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!org?.id || !id) return;

    setDeleting(true);
    try {
      const { error } = await deleteClient(org.id, id);
      if (error) {
        toast.error(error);
      } else {
        toast.success(t('clients.deletedSuccess', 'Client deleted successfully'));
        setDeleteModalOpen(false);
        navigate('/clients');
      }
    } catch (error) {
      toast.error(t('errors.failedToDelete', 'Failed to delete client'));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('errors.notFound', 'Client not found')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DeleteModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title={t('clients.deleteTitle', 'Delete Client?')}
        description={t('clients.deleteDescription', `Are you sure you want to delete "${client?.name}"? This action cannot be undone.`)}
        onConfirm={handleDelete}
        isDeleting={deleting}
        deleteText={t('common.delete', 'Delete')}
        cancelText={t('common.cancel', 'Cancel')}
      />
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate('/clients')}
          className="gap-2"
        >
          <ArrowLeft size={16} />
          {t('common.back', 'Back')}
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setDeleteModalOpen(true)}
            className="gap-2 text-destructive"
          >
            <Trash2 size={16} />
            {t('common.delete', 'Delete')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {t('common.save', 'Save')}
          </Button>
        </div>
      </div>

      <PageHeader
        title={client.business_name || client.name}
        description={t('clients.editClient', 'Edit client information')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('common.basicInfo', 'Basic Information')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('common.name', 'Name')} *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('common.businessName', 'Business Name')}</label>
              <input
                type="text"
                value={formData.business_name || ''}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('common.email', 'Email')}</label>
              <input
                type="email"
                value={formData.business_email || ''}
                onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('common.phone', 'Phone')}</label>
              <input
                type="tel"
                value={formData.business_phone || ''}
                onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('common.website', 'Website')}</label>
              <input
                type="url"
                value={formData.business_website || ''}
                onChange={(e) => setFormData({ ...formData, business_website: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('common.address', 'Address')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('common.addressLine1', 'Address Line 1')}</label>
              <input
                type="text"
                value={formData.address_line_1 || ''}
                onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('common.addressLine2', 'Address Line 2')}</label>
              <input
                type="text"
                value={formData.address_line_2 || ''}
                onChange={(e) => setFormData({ ...formData, address_line_2: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('common.city', 'City')}</label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('common.postalCode', 'Postal Code')}</label>
                <input
                  type="text"
                  value={formData.postal_code || ''}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('common.state', 'State')}</label>
                <input
                  type="text"
                  value={formData.state || ''}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('common.country', 'Country')}</label>
                <input
                  type="text"
                  value={formData.country || ''}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{t('common.settings', 'Settings')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('common.currency', 'Currency')}</label>
              <input
                type="text"
                value={formData.currency || ''}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="EUR"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('common.language', 'Language')}</label>
              <input
                type="text"
                value={formData.language || ''}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="en"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('common.defaultDueDays', 'Default Due Days')}</label>
              <input
                type="number"
                value={formData.default_due_days || 30}
                onChange={(e) => setFormData({ ...formData, default_due_days: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>{t('common.metadata', 'Metadata')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <label className="text-muted-foreground">{t('common.createdAt', 'Created At')}</label>
              <p className="text-foreground">{client.created_at ? new Date(client.created_at).toLocaleString() : '-'}</p>
            </div>
            <div>
              <label className="text-muted-foreground">{t('common.updatedAt', 'Updated At')}</label>
              <p className="text-foreground">{client.updated_at ? new Date(client.updated_at).toLocaleString() : '-'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
