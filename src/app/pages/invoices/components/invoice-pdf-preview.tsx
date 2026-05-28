import { Invoice } from '@/api/invoices';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InvoicePDFPreviewProps {
  invoice: Partial<Invoice>;
  businessName?: string;
}

export default function InvoicePDFPreview({ invoice, businessName }: InvoicePDFPreviewProps) {
  const handleDownload = async () => {
    // TODO: Implement PDF download using react-pdf or similar library
    console.log('Download PDF:', invoice);
  };

  const subtotal = invoice.items?.reduce((sum, item) => {
    return sum + (item.quantity * item.price);
  }, 0) || 0;

  const taxableItems = invoice.items?.filter(item => item.apply_taxes) || [];
  const taxableAmount = taxableItems.reduce((sum, item) => {
    return sum + (item.quantity * item.price);
  }, 0);
  
  const taxes = taxableAmount * 0.21; // 21% VAT (Spain)
  const total = subtotal + taxes;

  return (
    <div className="flex flex-col h-full bg-white text-black rounded border border-border">
      {/* Header */}
      <div className="border-b border-gray-300 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{businessName || 'Invoice'}</h1>
            <p className="text-sm text-gray-600 mt-1">INVOICE</p>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p>Invoice #: <span className="font-semibold">{invoice.invoice_number || 'N/A'}</span></p>
            <p>Date: <span className="font-semibold">{invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString() : 'N/A'}</span></p>
            <p>Due: <span className="font-semibold">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}</span></p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Issuer and Recipient */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Issuer */}
          <div className="border border-gray-200 p-4 rounded bg-gray-50">
            <p className="text-xs font-semibold text-gray-600 uppercase mb-2">From</p>
            <p className="font-semibold text-gray-900">{invoice.issuer_name || businessName || 'Issuer Name'}</p>
          </div>
          {/* Recipient */}
          <div className="border border-gray-200 p-4 rounded bg-gray-50">
            <p className="text-xs font-semibold text-gray-600 uppercase mb-2">To</p>
            <p className="font-semibold text-gray-900">{invoice.recipient_name || 'Recipient Name'}</p>
          </div>
        </div>

        {/* Description */}
        {invoice.description && (
          <div className="mb-6">
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-200">
              {invoice.description}
            </p>
          </div>
        )}

        {/* Items Table */}
        <table className="w-full mb-6 text-sm">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-2 text-gray-700 font-semibold">Item</th>
              <th className="text-center py-2 text-gray-700 font-semibold w-20">Qty</th>
              <th className="text-right py-2 text-gray-700 font-semibold w-24">Price</th>
              <th className="text-right py-2 text-gray-700 font-semibold w-24">Total</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).length > 0 ? (
              (invoice.items || []).map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-3">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    {item.description && (
                      <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                    )}
                  </td>
                  <td className="text-center py-3 text-gray-700">{item.quantity}</td>
                  <td className="text-right py-3 text-gray-700">${item.price.toFixed(2)}</td>
                  <td className="text-right py-3 text-gray-900 font-medium">
                    ${(item.quantity * item.price).toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-500">
                  No items added
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Summary */}
      <div className="border-t border-gray-300 p-6 bg-gray-50">
        <div className="flex justify-end w-full max-w-xs ml-auto space-y-2">
          <div className="flex justify-between w-full text-sm">
            <span className="text-gray-700">Subtotal:</span>
            <span className="text-gray-900 font-medium">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between w-full text-sm">
            <span className="text-gray-700">Taxes (21% VAT):</span>
            <span className="text-gray-900 font-medium">${taxes.toFixed(2)}</span>
          </div>
          <div className="flex justify-between w-full border-t-2 border-gray-300 pt-2 font-bold text-lg">
            <span className="text-gray-900">Total:</span>
            <span className="text-gray-900">${total.toFixed(2)}</span>
          </div>
        </div>

        <Button
          type="button"
          variant="theme"
          onClick={handleDownload}
          className="w-full mt-4 gap-2 flex items-center justify-center"
        >
          <Download size={16} />
          Download PDF
        </Button>
      </div>
    </div>
  );
}
