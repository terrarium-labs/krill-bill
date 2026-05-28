import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Eye, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { deleteInvoice } from '@/api/invoices';
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
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-yellow-100 text-yellow-800',
};

interface Invoice {
  id: string;
  invoice_number: string;
  recipient_name?: string;
  issue_date: string;
  amount: number;
  currency: string;
  status: string;
}

interface InvoicesTableProps {
  invoices: Invoice[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
}

export default function InvoicesTable({ invoices, isLoading, onRefresh }: InvoicesTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedInvoiceToDelete, setSelectedInvoiceToDelete] = useState<typeof invoices[0] | null>(null);

  const handleDeleteClick = (invoice: typeof invoices[0]) => {
    setSelectedInvoiceToDelete(invoice);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedInvoiceToDelete) return;

    setDeleting(selectedInvoiceToDelete.id);
    try {
      const { error } = await deleteInvoice(selectedInvoiceToDelete.id);
      if (error) {
        toast.error(error);
      } else {
        toast.success(t('invoices.deletedSuccess', 'Invoice deleted successfully'));
        await onRefresh();
        setDeleteModalOpen(false);
      }
    } catch (error) {
      toast.error(t('errors.failedToDelete', 'Failed to delete invoice'));
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

  if (!invoices || invoices.length === 0) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-lg font-semibold text-foreground">
            {t('invoices.noInvoices', 'No invoices yet')}
          </h3>
          <p className="text-muted-foreground mt-1 max-w-sm">
            {t('invoices.createFirst', 'Create your first invoice to get started')}
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
        title={t('invoices.deleteTitle', 'Delete Invoice?')}
        description={t('invoices.deleteDescription', `Are you sure you want to delete invoice "${selectedInvoiceToDelete?.invoice_number}"? This action cannot be undone.`)}
        onConfirm={handleDelete}
        isDeleting={deleting === selectedInvoiceToDelete?.id}
        deleteText={t('common.delete', 'Delete')}
        cancelText={t('common.cancel', 'Cancel')}
      />
      <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted">
            <TableHead>{t('invoices.number', 'Number')}</TableHead>
            <TableHead>{t('invoices.recipient', 'Recipient')}</TableHead>
            <TableHead>{t('invoices.date', 'Date')}</TableHead>
            <TableHead>{t('invoices.amount', 'Amount')}</TableHead>
            <TableHead>{t('invoices.status', 'Status')}</TableHead>
            <TableHead className="text-right">{t('common.actions', 'Actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
              <TableCell>{invoice.recipient_name || '-'}</TableCell>
              <TableCell>
                {format(new Date(invoice.issue_date), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell>
                {invoice.amount} {invoice.currency}
              </TableCell>
              <TableCell>
                <Badge className={statusColors[invoice.status] || 'bg-gray-100 text-gray-800'}>
                  {t(`invoices.status.${invoice.status}`, invoice.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                  title={t('common.view', 'View')}
                >
                  <Eye size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClick(invoice)}
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
