import { Link } from "react-router";
import { FilePlus2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useInvoices } from "@/contexts/invoices-context";
import { formatDate, formatMoney, invoiceSubtotal } from "@/lib/invoice-utils";

export default function InvoicesPage() {
  const { invoices, remove } = useInvoices();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="mt-2 text-muted-foreground">
            Open, edit, and export your saved invoices.
          </p>
        </div>
        <Button asChild>
          <Link to="/invoices/new">
            <FilePlus2 className="size-4" />
            New invoice
          </Link>
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle>All invoices</CardTitle>
          <CardDescription>{invoices.length} saved on this device</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {invoices.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No invoices yet.</p>
              <Button asChild className="mt-4">
                <Link to="/invoices/new">Create your first invoice</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4"
                >
                  <div>
                    <Link
                      to={`/invoices/${invoice.id}`}
                      className="font-semibold hover:underline"
                    >
                      {invoice.number}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {invoice.to.business_name || invoice.to.name} · Issued{" "}
                      {formatDate(invoice.issue_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatMoney(invoiceSubtotal(invoice), invoice.currency)}
                      </p>
                      <Badge variant="outline" className="mt-1 capitalize">
                        {invoice.status}
                      </Badge>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/invoices/${invoice.id}`}>Open</Link>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (!window.confirm(`Delete ${invoice.number}?`)) return;
                        remove(invoice.id);
                        toast.success("Invoice deleted");
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
