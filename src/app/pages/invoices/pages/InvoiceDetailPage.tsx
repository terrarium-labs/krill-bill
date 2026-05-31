import { useParams, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, ArrowLeft, Save, Trash2, Download } from 'lucide-react';
import { fetchInvoiceById, updateInvoice, deleteInvoice, Invoice, InvoiceItem } from '@/api/invoices';
import { useOrg } from '@/contexts/OrgContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { DeleteModal } from '@/app/components/modals/delete-modal';
import PageHeader from '@/app/components/page-header';
import InvoicePDFPreview from '@/app/pages/invoices/components/invoice-pdf-preview';
import { format } from 'date-fns';

export default function InvoiceDetailPage() {
  const { invoiceId: id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { org } = useOrg();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Invoice>>({});
  const [showPDF, setShowPDF] = useState(false);

  useEffect(() => {
    const loadInvoice = async () => {
      if (!id) return;
      try {
        const { data, error } = await fetchInvoiceById(id);
        if (error) {
          toast.error(error);
          navigate('/invoices');
        } else {
          setInvoice(data);
          setFormData(data || {});
        }
      } catch (error) {
        toast.error(t('errors.failedToLoad', 'Failed to load invoice'));
      } finally {
        setLoading(false);
      }
    };

    loadInvoice();
  }, [id, navigate, t]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const { data, error } = await updateInvoice(id, formData);
      if (error) {
        toast.error(error);
      } else {
        setInvoice(data);
        setFormData(data || {});
        toast.success(t('invoices.updatedSuccess', 'Invoice updated successfully'));
      }
    } catch (error) {
      toast.error(t('errors.failedToUpdate', 'Failed to update invoice'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !org?.id) return;

    setDeleting(true);
    try {
      const { error } = await deleteInvoice(org.id, id);
      if (error) {
        toast.error(error);
      } else {
        toast.success(t('invoices.deletedSuccess', 'Invoice deleted successfully'));
        setDeleteModalOpen(false);
        navigate('/invoices');
      }
    } catch (error) {
      toast.error(t('errors.failedToDelete', 'Failed to delete invoice'));
    } finally {
      setDeleting(false);
    }
  };

  const handleAddItem = () => {
    const items = (formData.items || []) as InvoiceItem[];
    setFormData({
      ...formData,
      items: [...items, { name: '', quantity: 1, price: 0, apply_taxes: false }],
    });
  };

  const handleUpdateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const items = (formData.items || []) as InvoiceItem[];
    items[index] = { ...items[index], [field]: value };
    
    // Recalculate amount
    const total = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    setFormData({
      ...formData,
      items,
      amount: total,
    });
  };

  const handleRemoveItem = (index: number) => {
    const items = (formData.items || []) as InvoiceItem[];
    items.splice(index, 1);
    
    const total = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    setFormData({
      ...formData,
      items,
      amount: total,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('errors.notFound', 'Invoice not found')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DeleteModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title={t('invoices.deleteTitle', 'Delete Invoice?')}
        description={t('invoices.deleteDescription', `Are you sure you want to delete invoice "${invoice?.invoice_number}"? This action cannot be undone.`)}
        onConfirm={handleDelete}
        isDeleting={deleting}
        deleteText={t('common.delete', 'Delete')}
        cancelText={t('common.cancel', 'Cancel')}
      />
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate('/invoices')}
          className="gap-2"
        >
          <ArrowLeft size={16} />
          {t('common.back', 'Back')}
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPDF(true)}
            className="gap-2"
          >
            <Download size={16} />
            {t('invoices.previewPDF', 'Preview PDF')}
          </Button>
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
        title={`${t('invoices.invoice', 'Invoice')} #${invoice.invoice_number}`}
        description={t('invoices.editInvoice', 'Edit invoice details')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('invoices.basicInfo', 'Basic Information')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('invoices.number', 'Invoice Number')} *</label>
                  <input
                    type="text"
                    value={formData.invoice_number || ''}
                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('invoices.type', 'Type')}</label>
                  <select
                    value={formData.invoice_type || 'sales'}
                    onChange={(e) => setFormData({ ...formData, invoice_type: e.target.value as 'sales' | 'purchase' })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="sales">{t('invoices.sales', 'Sales')}</option>
                    <option value="purchase">{t('invoices.purchase', 'Purchase')}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('invoices.issuer', 'Issuer')}</label>
                  <input
                    type="text"
                    value={formData.issuer_name || ''}
                    onChange={(e) => setFormData({ ...formData, issuer_name: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('invoices.recipient', 'Recipient')}</label>
                  <input
                    type="text"
                    value={formData.recipient_name || ''}
                    onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('invoices.issueDate', 'Issue Date')} *</label>
                  <input
                    type="date"
                    value={formData.issue_date || ''}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('invoices.dueDate', 'Due Date')} *</label>
                  <input
                    type="date"
                    value={formData.due_date || ''}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('invoices.status', 'Status')}</label>
                <select
                  value={formData.status || 'draft'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="draft">{t('invoices.status.draft', 'Draft')}</option>
                  <option value="sent">{t('invoices.status.sent', 'Sent')}</option>
                  <option value="paid">{t('invoices.status.paid', 'Paid')}</option>
                  <option value="overdue">{t('invoices.status.overdue', 'Overdue')}</option>
                  <option value="cancelled">{t('invoices.status.cancelled', 'Cancelled')}</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader className="flex justify-between items-center">
              <CardTitle>{t('invoices.items', 'Items')}</CardTitle>
              <Button onClick={handleAddItem} variant="outline" size="sm">
                {t('invoices.addItem', 'Add Item')}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {(formData.items || []).map((item: InvoiceItem, idx: number) => (
                <div key={idx} className="space-y-3 border-b pb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('common.name', 'Name')}</label>
                      <input
                        type="text"
                        value={item.name || ''}
                        onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('common.description', 'Description')}</label>
                      <input
                        type="text"
                        value={item.description || ''}
                        onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('common.quantity', 'Quantity')}</label>
                      <input
                        type="number"
                        value={item.quantity || 0}
                        onChange={(e) => handleUpdateItem(idx, 'quantity', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('common.price', 'Price')}</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.price || 0}
                        onChange={(e) => handleUpdateItem(idx, 'price', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={() => handleRemoveItem(idx)}
                        variant="destructive"
                        size="sm"
                        className="w-full"
                      >
                        {t('common.remove', 'Remove')}
                      </Button>
                    </div>
                  </div>
                  <div className="text-right text-sm font-medium">
                    {t('common.subtotal', 'Subtotal')}: {item.quantity * item.price}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t('common.additionalInfo', 'Additional Information')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('common.description', 'Description')}</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring min-h-20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('common.notes', 'Notes')}</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring min-h-20"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary & Preview */}
        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('invoices.summary', 'Summary')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('invoices.subtotal', 'Subtotal')}:</span>
                <span className="font-medium">{formData.amount || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('common.currency', 'Currency')}:</span>
                <span className="font-medium">{formData.currency || 'EUR'}</span>
              </div>
              <hr />
              <div className="flex justify-between text-lg font-bold">
                <span>{t('invoices.total', 'Total')}:</span>
                <span>{formData.amount || 0} {formData.currency || 'EUR'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t('common.details', 'Details')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <label className="text-muted-foreground">{t('common.createdAt', 'Created At')}</label>
                <p className="text-foreground">{invoice.created_at ? format(new Date(invoice.created_at), 'PPp') : '-'}</p>
              </div>
              <div>
                <label className="text-muted-foreground">{t('common.updatedAt', 'Updated At')}</label>
                <p className="text-foreground">{invoice.updated_at ? format(new Date(invoice.updated_at), 'PPp') : '-'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {showPDF && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">{t('invoices.pdfPreview', 'PDF Preview')}</h3>
              <Button
                variant="ghost"
                onClick={() => setShowPDF(false)}
                className="text-lg"
              >
                ✕
              </Button>
            </div>
            <div className="p-6">
              <InvoicePDFPreview invoice={formData as Invoice} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
