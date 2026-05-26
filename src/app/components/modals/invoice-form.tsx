import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MultiSelect } from '@/components/ui/multi-select';
import { Invoice, InvoiceItem } from '@/api/invoices';
import { Organization, OrganizationPartner } from '@/types/organization';
import { fetchOrganizationPartners } from '@/api/organization-partners';
import { useOrg } from '@/contexts/OrgContext';

interface InvoiceFormProps {
  invoice: Partial<Invoice>;
  onInvoiceChange: (invoice: Partial<Invoice>) => void;
  organizations?: Organization[];
}

const MANUAL_ENTRY_ID = 'manual-entry';

export default function InvoiceForm({ invoice, onInvoiceChange, organizations = [] }: InvoiceFormProps) {
  const { t } = useTranslation();
  const { org } = useOrg();
  const [partners, setPartners] = React.useState<OrganizationPartner[]>([]);
  const [manualIssuer, setManualIssuer] = React.useState('');
  const [manualRecipient, setManualRecipient] = React.useState('');

  // Fetch partners when component mounts
  React.useEffect(() => {
    if (org?.id) {
      const loadPartners = async () => {
        const { data } = await fetchOrganizationPartners(org.id);
        if (data) {
          setPartners(data as OrganizationPartner[]);
        }
      };
      loadPartners();
    }
  }, [org?.id]);

  // Build multi-select options
  const buildOptions = () => {
    const options = [];
    
    // Current company
    if (org) {
      options.push({
        label: `${org.business_name || org.name} (Current)`,
        value: org.id,
      });
    }

    // Partners
    partners.forEach((partner: any) => {
      if (partner.partner_org) {
        options.push({
          label: partner.partner_org.business_name || partner.partner_org.name,
          value: partner.partner_org.id,
        });
      }
    });

    // Add manually option
    options.push({
      label: 'Add Manually',
      value: MANUAL_ENTRY_ID,
    });

    return options;
  };

  const options = buildOptions();

  const handleIssuerChange = (values: string[]) => {
    const value = values[0];
    if (value === MANUAL_ENTRY_ID) {
      onInvoiceChange({
        ...invoice,
        issuer_id: MANUAL_ENTRY_ID,
        issuer_name: manualIssuer,
      });
    } else {
      const selectedOrg = organizations.find((o) => o.id === value);
      onInvoiceChange({
        ...invoice,
        issuer_id: value,
        issuer_name: selectedOrg?.business_name || selectedOrg?.name,
      });
    }
  };

  const handleRecipientChange = (values: string[]) => {
    const value = values[0];
    if (value === MANUAL_ENTRY_ID) {
      onInvoiceChange({
        ...invoice,
        recipient_id: MANUAL_ENTRY_ID,
        recipient_name: manualRecipient,
      });
    } else {
      const selectedOrg = organizations.find((o) => o.id === value);
      onInvoiceChange({
        ...invoice,
        recipient_id: value,
        recipient_name: selectedOrg?.business_name || selectedOrg?.name,
      });
    }
  };

  const handleRemoveItem = (index: number) => {
    const newItems = invoice.items?.filter((_, i) => i !== index) || [];
    onInvoiceChange({ ...invoice, items: newItems });
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...(invoice.items || [])];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Update invoice amount based on items
    const totalAmount = newItems.reduce((sum, item) => {
      return sum + (item.quantity * item.price);
    }, 0);
    
    onInvoiceChange({ ...invoice, items: newItems, amount: totalAmount });
  };

  const handleAddItem = () => {
    const newItems = [
      ...(invoice.items || []),
      {
        name: '',
        description: '',
        quantity: 1,
        price: 0,
        apply_taxes: true,
      },
    ];
    onInvoiceChange({ ...invoice, items: newItems });
  };

  return (
    <div className="space-y-4 overflow-y-auto max-h-[600px]">
      {/* Parties */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-foreground">Parties</h3>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Issuer (From)
            </label>
            <MultiSelect
              options={options}
              selected={invoice.issuer_id ? [invoice.issuer_id] : []}
              onChange={handleIssuerChange}
              placeholder="Select issuer..."
            />
            {invoice.issuer_id === MANUAL_ENTRY_ID && (
              <input
                type="text"
                value={manualIssuer}
                onChange={(e) => {
                  setManualIssuer(e.target.value);
                  onInvoiceChange({ ...invoice, issuer_name: e.target.value });
                }}
                className="w-full mt-2 px-2 py-1 text-sm border border-border bg-background text-foreground rounded focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter issuer name"
              />
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Recipient (To)
            </label>
            <MultiSelect
              options={options}
              selected={invoice.recipient_id ? [invoice.recipient_id] : []}
              onChange={handleRecipientChange}
              placeholder="Select recipient..."
            />
            {invoice.recipient_id === MANUAL_ENTRY_ID && (
              <input
                type="text"
                value={manualRecipient}
                onChange={(e) => {
                  setManualRecipient(e.target.value);
                  onInvoiceChange({ ...invoice, recipient_name: e.target.value });
                }}
                className="w-full mt-2 px-2 py-1 text-sm border border-border bg-background text-foreground rounded focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter recipient name"
              />
            )}
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-foreground">Invoice Details</h3>
        
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Invoice Number
          </label>
          <input
            type="text"
            value={invoice.invoice_number || ''}
            onChange={(e) => onInvoiceChange({ ...invoice, invoice_number: e.target.value })}
            className="w-full px-2 py-1 text-sm border border-border bg-background text-foreground rounded focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="INV-001"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Issue Date
            </label>
            <input
              type="date"
              value={invoice.issue_date || ''}
              onChange={(e) => onInvoiceChange({ ...invoice, issue_date: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-border bg-background text-foreground rounded focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={invoice.due_date || ''}
              onChange={(e) => onInvoiceChange({ ...invoice, due_date: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-border bg-background text-foreground rounded focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Description
          </label>
          <textarea
            value={invoice.description || ''}
            onChange={(e) => onInvoiceChange({ ...invoice, description: e.target.value })}
            className="w-full px-2 py-1 text-sm border border-border bg-background text-foreground rounded focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            rows={2}
            placeholder="Invoice description"
          />
        </div>
      </div>

      {/* Items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-foreground">Items</h3>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAddItem}
            className="gap-1"
          >
            <Plus size={14} />
            Add Item
          </Button>
        </div>

        <div className="space-y-2">
          {(invoice.items || []).map((item, index) => (
            <div key={index} className="border border-border rounded p-3 space-y-2 bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Item {index + 1}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="text-destructive hover:bg-destructive/10 p-1 rounded"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <input
                type="text"
                value={item.name}
                onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-border bg-background text-foreground rounded focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Item name"
              />

              <textarea
                value={item.description || ''}
                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-border bg-background text-foreground rounded focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                rows={2}
                placeholder="Item description"
              />

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Qty
                  </label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                    className="w-full px-2 py-1 text-sm border border-border bg-background text-foreground rounded focus:outline-none focus:ring-2 focus:ring-ring"
                    min="1"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value))}
                    className="w-full px-2 py-1 text-sm border border-border bg-background text-foreground rounded focus:outline-none focus:ring-2 focus:ring-ring"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Taxes
                  </label>
                  <input
                    type="checkbox"
                    checked={item.apply_taxes}
                    onChange={(e) => handleItemChange(index, 'apply_taxes', e.target.checked)}
                    className="w-full h-8 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          ))}

          {(!invoice.items || invoice.items.length === 0) && (
            <div className="text-center text-xs text-muted-foreground py-4">
              No items added. Click "Add Item" to get started.
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm text-foreground">Total:</span>
          <span className="font-bold text-lg text-foreground">${(invoice.amount || 0).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
