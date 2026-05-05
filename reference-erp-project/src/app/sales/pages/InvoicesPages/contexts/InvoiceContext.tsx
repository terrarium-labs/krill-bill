/**
 * Bridge file: re-exports useSaleInvoice as useInvoice so that shared invoice components
 * (invoice-item-row, invoice-header-row, invoice-totals-section, invoice-items-section)
 * can import from "../../contexts/InvoiceContext" and work with the sale invoice context.
 */
export { useSaleInvoice as useInvoice, SaleInvoiceProvider as InvoiceProvider } from "./SaleInvoiceContext";
