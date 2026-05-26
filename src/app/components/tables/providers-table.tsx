import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Eye, Edit2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useOrg } from '@/contexts/OrgContext';
import { useProviders } from '@/contexts/ProvidersContext';
import { deleteProvider } from '@/api/providers';
import { Provider } from '@/types/providers';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DeleteModal } from '@/app/components/modals/delete-modal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';

interface ProvidersTableProps {
  onEdit?: (provider: Provider) => void;
}

export default function ProvidersTable({ onEdit }: ProvidersTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { org } = useOrg();
  const { providers, isLoading, refreshProviders } = useProviders();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProviderToDelete, setSelectedProviderToDelete] = useState<Provider | null>(null);

  const handleDeleteClick = (provider: Provider) => {
    setSelectedProviderToDelete(provider);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!org?.id || !selectedProviderToDelete) return;

    setDeleting(selectedProviderToDelete.id);
    try {
      const { error } = await deleteProvider(org.id, selectedProviderToDelete.id);
      if (error) {
        toast.error(error);
      } else {
        toast.success(t('providers.deletedSuccess', 'Provider deleted successfully'));
        await refreshProviders();
        setDeleteModalOpen(false);
      }
    } catch (error) {
      toast.error(t('errors.failedToDelete', 'Failed to delete provider'));
    } finally {
      setDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-12">
        <div className="flex justify-center items-center">
          <Loader2 className="animate-spin" size={32} />
        </div>
      </Card>
    );
  }

  if (!providers || providers.length === 0) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-lg font-semibold text-foreground">
            {t('providers.noProviders', 'No providers yet')}
          </h3>
          <p className="text-muted-foreground mt-1 max-w-sm">
            {t('providers.addFirstProvider', 'Create your first provider to get started')}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <DeleteModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title={t('providers.deleteTitle', 'Delete Provider?')}
        description={t('providers.deleteDescription', `Are you sure you want to delete "${selectedProviderToDelete?.name}"? This action cannot be undone.`)}
        onConfirm={handleDelete}
        isDeleting={deleting === selectedProviderToDelete?.id}
        deleteText={t('common.delete', 'Delete')}
        cancelText={t('common.cancel', 'Cancel')}
      />
      <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted">
            <TableHead>{t('common.name', 'Name')}</TableHead>
            <TableHead>{t('common.email', 'Email')}</TableHead>
            <TableHead>{t('common.phone', 'Phone')}</TableHead>
            <TableHead>{t('common.country', 'Country')}</TableHead>
            <TableHead className="text-right">{t('common.actions', 'Actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.map((provider) => (
            <TableRow key={provider.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">
                {provider.business_name || provider.name}
              </TableCell>
              <TableCell>{provider.business_email || '-'}</TableCell>
              <TableCell>{provider.business_phone || '-'}</TableCell>
              <TableCell>{provider.country || '-'}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/providers/${provider.id}`)}
                  title={t('common.view', 'View')}
                >
                  <Eye size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit?.(provider)}
                  title={t('common.edit', 'Edit')}
                >
                  <Edit2 size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClick(provider)}
                  title={t('common.delete', 'Delete')}
                >
                  <Trash2 size={16} />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
    </>
  );
}
