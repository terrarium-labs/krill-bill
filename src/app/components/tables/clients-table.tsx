import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Eye, Edit2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useOrg } from '@/contexts/OrgContext';
import { useClients } from '@/contexts/ClientsContext';
import { deleteClient } from '@/api/clients';
import { Client } from '@/types/clients';
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

interface ClientsTableProps {
  onEdit?: (client: Client) => void;
}

export default function ClientsTable({ onEdit }: ClientsTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { org } = useOrg();
  const { clients, isLoading, refreshClients } = useClients();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedClientToDelete, setSelectedClientToDelete] = useState<Client | null>(null);

  const handleDeleteClick = (client: Client) => {
    setSelectedClientToDelete(client);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!org?.id || !selectedClientToDelete) return;

    setDeleting(selectedClientToDelete.id);
    try {
      const { error } = await deleteClient(org.id, selectedClientToDelete.id);
      if (error) {
        toast.error(error);
      } else {
        toast.success(t('clients.deletedSuccess', 'Client deleted successfully'));
        await refreshClients();
        setDeleteModalOpen(false);
      }
    } catch (error) {
      toast.error(t('errors.failedToDelete', 'Failed to delete client'));
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

  if (!clients || clients.length === 0) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-lg font-semibold text-foreground">
            {t('clients.noClients', 'No clients yet')}
          </h3>
          <p className="text-muted-foreground mt-1 max-w-sm">
            {t('clients.addFirstClient', 'Create your first client to get started')}
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
        title={t('clients.deleteTitle', 'Delete Client?')}
        description={t('clients.deleteDescription', `Are you sure you want to delete "${selectedClientToDelete?.name}"? This action cannot be undone.`)}
        onConfirm={handleDelete}
        isDeleting={deleting === selectedClientToDelete?.id}
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
          {clients.map((client) => (
            <TableRow key={client.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">
                {client.business_name || client.name}
              </TableCell>
              <TableCell>{client.business_email || '-'}</TableCell>
              <TableCell>{client.business_phone || '-'}</TableCell>
              <TableCell>{client.country || '-'}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/clients/${client.id}`)}
                  title={t('common.view', 'View')}
                >
                  <Eye size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit?.(client)}
                  title={t('common.edit', 'Edit')}
                >
                  <Edit2 size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClick(client)}
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
