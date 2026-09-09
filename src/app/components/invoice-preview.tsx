import type { Invoice } from "@shared/types/index";
import {
  formatDate,
  formatMoney,
  formatPartyAddress,
  invoiceSubtotal,
} from "@/lib/invoice-utils";

type Props = {
  invoice: Invoice;
};

export function InvoicePreview({ invoice }: Props) {
  const subtotal = invoiceSubtotal(invoice);

  return (
    <div
      id="invoice-print-root"
      className="rounded-xl border bg-white p-8 text-black shadow-sm print:border-0 print:shadow-none"
    >
      <div className="flex flex-wrap items-start justify-between gap-6 border-b border-black/10 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">
            Invoice
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">{invoice.number}</h2>
          <p className="mt-2 text-sm capitalize text-black/60">{invoice.status}</p>
        </div>
        <div className="text-right text-sm text-black/70">
          <p>
            <span className="font-medium text-black">Issue date:</span>{" "}
            {formatDate(invoice.issue_date)}
          </p>
          <p>
            <span className="font-medium text-black">Due date:</span>{" "}
            {formatDate(invoice.due_date)}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/50">
            From
          </p>
          <div className="mt-3 space-y-1 text-sm leading-relaxed">
            {formatPartyAddress(invoice.from).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/50">
            Bill to
          </p>
          <div className="mt-3 space-y-1 text-sm leading-relaxed">
            {formatPartyAddress(invoice.to).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-lg border border-black/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/[0.03] text-black/60">
            <tr>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Qty</th>
              <th className="px-4 py-3 font-medium">Unit</th>
              <th className="px-4 py-3 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line) => (
              <tr key={line.id} className="border-t border-black/10">
                <td className="px-4 py-3">{line.description}</td>
                <td className="px-4 py-3">{line.quantity}</td>
                <td className="px-4 py-3">
                  {formatMoney(line.unit_price, invoice.currency)}
                </td>
                <td className="px-4 py-3 text-right">
                  {formatMoney(line.quantity * line.unit_price, invoice.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
        <div className="min-w-48 space-y-2 text-sm">
          <div className="flex justify-between gap-8">
            <span className="text-black/60">Subtotal</span>
            <span className="font-semibold">{formatMoney(subtotal, invoice.currency)}</span>
          </div>
          <div className="flex justify-between gap-8 border-t border-black/10 pt-2 text-base">
            <span className="font-medium">Total due</span>
            <span className="font-bold">{formatMoney(subtotal, invoice.currency)}</span>
          </div>
        </div>
      </div>

      {invoice.notes ? (
        <div className="mt-8 border-t border-black/10 pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/50">
            Notes
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-black/70">
            {invoice.notes}
          </p>
        </div>
      ) : null}
    </div>
  );
}
