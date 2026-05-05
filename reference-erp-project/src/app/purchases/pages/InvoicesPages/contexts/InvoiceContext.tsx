import { createContext, useContext, useEffect, useState } from "react";
import { getPurchaseInvoice, patchPurchaseInvoice } from "@/api/purchase-invoices/purchase-invoices";
import { getOrgTaxes } from "@/api/orgs/taxes/taxes";
import { useParams } from "react-router";
import { PageInvoiceSkeleton } from "@/components/ui/page-invoice-skeleton";
import { PurchaseInvoice, InvoiceItem } from "@/types/invoices/invoices";
import { TaxType } from "@/types/miscelanea";
import { useRef } from "react";

interface InvoiceCalculations {
  subtotalBeforeDiscount: number;
  itemsDiscount: number;
  subtotalAfterItemsDiscount: number;
  globalDiscountAmount: number;
  subtotal: number;
  taxesByType: Record<string, number>;
  totalTaxes: number;
  total: number;
}

interface InvoiceContextType {
  invoice: PurchaseInvoice;
  taxes: TaxType[];
  calculations: InvoiceCalculations;
  hasUnsavedChanges: boolean;
  setData: (data: Partial<PurchaseInvoice>) => void;
  refreshInvoice: () => void;
  saveInvoice: (data?: Partial<PurchaseInvoice>) => Promise<{ success: boolean; error?: string }>;
  // Line operations (use order as identifier since new lines have null IDs)
  updateLine: (order: number, field: keyof InvoiceItem, value: any) => void;
  updateLineMultiple: (order: number, updates: Partial<InvoiceItem>) => void;
  addLine: () => void;
  deleteLine: (order: number) => void;
  reorderLines: (reorderedLines: InvoiceItem[]) => void;
  // Discount helpers
  setGlobalDiscount: (percent: number) => void;
  toggleGlobalDiscount: (enabled: boolean) => void;
  toggleItemDiscount: (enabled: boolean) => void;
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export const InvoiceProvider = ({ children }: { children: React.ReactNode }) => {
  const [invoice, setInvoice] = useState<PurchaseInvoice | null>(null);
  const [taxes, setTaxes] = useState<TaxType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { invoiceId, orgId } = useParams<{ invoiceId: string, orgId: string }>();

  const invoiceRef = useRef<PurchaseInvoice | null>(null);

  useEffect(() => {
    if (invoice) {
      invoiceRef.current = invoice;
    }
  }, [invoice]);

  const fetchInvoice = async (invoiceId: string) => {
    if (!orgId) return;
    try {
      const response = await getPurchaseInvoice(orgId || "", invoiceId);
      if (response.success) {
        // Ensure lines is always an array
        const invoice = {
          ...response.success.invoice,
          lines: response.success.invoice.lines || [],
        };
        setInvoice(invoice);
        setHasUnsavedChanges(false); // Reset unsaved changes flag when loading fresh data
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch taxes for the organization
  const fetchTaxes = async () => {
    if (!orgId) return;

    try {
      const response = await getOrgTaxes(orgId, true);
      if (response.success && response.success.taxes) {
        setTaxes(response.success.taxes);
      }
    } catch (error) {
      console.error("Error fetching taxes:", error);
    }
  };

  useEffect(() => {
    if (orgId && invoiceId) {
      fetchInvoice(invoiceId);
      fetchTaxes();
    }
  }, [orgId, invoiceId]);

  if (isLoading || !invoice) {
    return <PageInvoiceSkeleton />;
  }

  const refreshInvoice = () => {
    if (orgId && invoiceId) {
      fetchInvoice(invoiceId);
    }
  };

  const setData = (data: Partial<PurchaseInvoice>) => {
    if (invoice) {
      setInvoice({ ...invoice, ...data });
      setHasUnsavedChanges(true);
    }
  };

  // Save invoice - single PATCH call with complete invoice data
  const saveInvoice = async (data?: Partial<PurchaseInvoice>): Promise<{ success: boolean; error?: string }> => {
    if (!orgId || !invoiceRef.current) {
      return { success: false, error: "Missing organization or invoice data" };
    }

    const linesToProcess = data?.lines || invoiceRef.current.lines;

    const processedLines = linesToProcess.map((line) => {
      // Handle parent IDs - use actual ID if available, otherwise determine from parent relationship
      let parentId = line.parent?.id || null;

      // Handle temporary parent IDs (convert temp-{order} back to find the actual parent)
      if (parentId && parentId.startsWith('temp-')) {
        const parentOrder = parseInt(parentId.replace('temp-', ''));
        const parentLine = linesToProcess.find(l => l.order === parentOrder && l.is_header);
        // Use the parent's actual ID if it exists, otherwise keep null (backend will handle by order)
        parentId = parentLine?.id || null;
      }

      return {
        id: line.id, // null for new lines
        item_id: line.item?.id || null,
        parent_id: parentId,
        name: line.name,
        description: line.description,
        quantity: line.quantity,
        price: line.price,
        discount: line.discount,
        is_header: line.is_header,
        order: line.order,
        taxes_ids: line.taxes?.map(tax => tax.id) || [],
        is_indirect_cost: line.is_indirect_cost ?? null,
        is_visible: line.is_visible ?? null,
        type: line.type ?? null,
      };
    });

    try {
      // Prepare complete invoice data including lines
      const updateData = {
        invoice_date: data?.invoice_date || invoiceRef.current.invoice_date,
        supplier_id: invoiceRef.current.supplier?.id,
        invoice_number: data?.invoice_number || invoiceRef.current.invoice_number,
        due_dates: data?.due_dates || invoiceRef.current.due_dates,
        main_file: data?.main_file || invoiceRef.current.main_file,
        discount: data?.discount || invoiceRef.current.discount,
        item_discount_enabled: data?.item_discount_enabled || invoiceRef.current.item_discount_enabled,
        currency: data?.currency || invoiceRef.current.currency,
        exchange_rate: data?.exchange_rate ?? invoiceRef.current.exchange_rate,
        // Include all invoice lines
        lines: processedLines,
      };

      const response = await patchPurchaseInvoice(orgId, invoiceRef.current.id, updateData);

      if (response.success) {
        // Refresh to get updated data from server (including new IDs for created lines)
        await fetchInvoice(invoiceRef.current.id);
        setHasUnsavedChanges(false); // Clear unsaved changes flag after successful save
        return { success: true };
      } else {
        return { success: false, error: "Failed to update invoice" };
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  };

  // Update a specific line item by order
  const updateLine = (order: number, field: keyof InvoiceItem, value: any) => {
    if (!invoice) return;

    setInvoice({
      ...invoice,
      lines: invoice.lines.map((line) => {
        if (line.order === order) {
          return { ...line, [field]: value };
        }
        return line;
      }),
    });
    setHasUnsavedChanges(true);
  };

  // Update multiple fields of a line item at once
  const updateLineMultiple = (order: number, updates: Partial<InvoiceItem>) => {
    if (!invoice) return;

    setInvoice({
      ...invoice,
      lines: invoice.lines.map((line) => {
        if (line.order === order) {
          return { ...line, ...updates };
        }
        return line;
      }),
    });
    setHasUnsavedChanges(true);
  };

  // Add a new line item
  const addLine = () => {
    if (!invoice) return;

    const newLine: InvoiceItem = {
      id: null, // New lines have null ID until saved
      parent: null,
      is_header: false,
      type: null,
      item: null,
      name: "",
      is_indirect_cost: null,
      is_visible: null,
      cost_price: null,
      description: "",
      quantity: 1,
      price: 0,
      order: invoice.lines.length,
      discount: 0,
      taxes: [],
    };

    setInvoice({
      ...invoice,
      lines: [...invoice.lines, newLine],
    });
    setHasUnsavedChanges(true);
  };

  // Delete a line item by order
  const deleteLine = (order: number) => {
    if (!invoice) return;

    // Filter out the line and re-index remaining lines
    const updatedLines = invoice.lines
      .filter((line) => line.order !== order)
      .map((line, index) => ({ ...line, order: index }));

    setInvoice({
      ...invoice,
      lines: updatedLines,
    });
    setHasUnsavedChanges(true);
  };

  // Discount helper methods
  const setGlobalDiscount = (percent: number) => {
    if (!invoice) return;
    setInvoice({ ...invoice, discount: percent });
    setHasUnsavedChanges(true);
  };

  const toggleGlobalDiscount = (enabled: boolean) => {
    if (!invoice) return;
    if (!enabled) {
      setInvoice({ ...invoice, discount: 0 });
    } else if (invoice.discount === 0) {
      setInvoice({ ...invoice, discount: 1 }); // Default 1% if enabling
    }
    setHasUnsavedChanges(true);
  };

  const toggleItemDiscount = (enabled: boolean) => {
    if (!invoice) return;

    // Reset all item discounts when toggling off
    if (!enabled) {
      const updatedLines = invoice.lines.map((item) => ({ ...item, discount: 0 }));
      setInvoice({ ...invoice, item_discount_enabled: enabled, lines: updatedLines });
    } else {
      setInvoice({ ...invoice, item_discount_enabled: enabled });
    }
    setHasUnsavedChanges(true);
  };

  // Reorder lines (e.g., after drag and drop)
  const reorderLines = (reorderedLines: InvoiceItem[]) => {
    if (!invoice) return;

    // Update order field for all lines
    const linesWithUpdatedOrder = reorderedLines.map((line, index) => ({
      ...line,
      order: index,
    }));

    setInvoice({
      ...invoice,
      lines: linesWithUpdatedOrder,
    });
    setHasUnsavedChanges(true);
  };

  // Calculate invoice totals in real-time
  const calculations: InvoiceCalculations = (() => {
    if (!invoice) {
      return {
        subtotalBeforeDiscount: 0,
        itemsDiscount: 0,
        subtotalAfterItemsDiscount: 0,
        globalDiscountAmount: 0,
        subtotal: 0,
        taxesByType: {},
        totalTaxes: 0,
        total: 0,
      };
    }

    // Only include non-header lines in calculations (headers are just groupings)
    const invoiceItems = invoice.lines.filter(line => !line.is_header);
    const showGlobalDiscount = invoice.discount > 0;
    const showItemDiscount = invoice.item_discount_enabled;
    const globalDiscountPercent = invoice.discount;

    // Calculate subtotal before any discounts
    const subtotalBeforeDiscount = invoiceItems.reduce((sum, item) => {
      const quantity = item.quantity ?? 0;
      const price = item.price ?? 0;
      return sum + (quantity * price);
    }, 0);

    // Per-item discount
    const itemsDiscount = showItemDiscount
      ? invoiceItems.reduce((sum, item) => {
        const quantity = item.quantity ?? 0;
        const price = item.price ?? 0;
        const discount = item.discount ?? 0;
        const itemSubtotal = quantity * price;
        return sum + (itemSubtotal * (discount / 100));
      }, 0)
      : 0;

    const subtotalAfterItemsDiscount = subtotalBeforeDiscount - itemsDiscount;

    // Global discount
    const globalDiscountAmount = showGlobalDiscount
      ? subtotalAfterItemsDiscount * (globalDiscountPercent / 100)
      : 0;

    const subtotal = subtotalAfterItemsDiscount - globalDiscountAmount;

    // Calculate taxes by type
    const taxesByType = invoiceItems.reduce((acc, item) => {
      const quantity = item.quantity ?? 0;
      const price = item.price ?? 0;
      const discount = showItemDiscount ? (item.discount ?? 0) : 0;
      const itemSubtotal = quantity * price;
      const itemDiscountAmount = itemSubtotal * (discount / 100);
      let itemSubtotalAfterDiscount = itemSubtotal - itemDiscountAmount;

      // Apply proportional global discount to this item
      if (showGlobalDiscount && subtotalAfterItemsDiscount > 0) {
        const itemProportion = itemSubtotalAfterDiscount / subtotalAfterItemsDiscount;
        const itemGlobalDiscount = globalDiscountAmount * itemProportion;
        itemSubtotalAfterDiscount -= itemGlobalDiscount;
      }

      item.taxes?.forEach(tax => {
        const taxAmount = itemSubtotalAfterDiscount * (tax.amount / 100) * (tax.is_negative ? -1 : 1);
        if (!acc[tax.type]) {
          acc[tax.type] = 0;
        }
        acc[tax.type] += taxAmount;
      });
      return acc;
    }, {} as Record<string, number>);

    const totalTaxes = Object.values(taxesByType).reduce((sum, amount) => sum + amount, 0);
    const total = subtotal + totalTaxes;

    return {
      subtotalBeforeDiscount,
      itemsDiscount,
      subtotalAfterItemsDiscount,
      globalDiscountAmount,
      subtotal,
      taxesByType,
      totalTaxes,
      total,
    };
  })();

  return (
    <InvoiceContext.Provider
      value={{
        invoice,
        taxes,
        calculations,
        hasUnsavedChanges,
        setData,
        refreshInvoice,
        saveInvoice,
        updateLine,
        updateLineMultiple,
        addLine,
        deleteLine,
        reorderLines,
        setGlobalDiscount,
        toggleGlobalDiscount,
        toggleItemDiscount,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  );
};

export const useInvoice = () => {
  const context = useContext(InvoiceContext);
  if (context === undefined) {
    throw new Error("useInvoice must be used within an InvoiceContext");
  }
  return context;
};
