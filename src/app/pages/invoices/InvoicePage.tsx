import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Download, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Invoice, InvoiceLine, InvoiceStatus } from "@shared/types/index";
import { InvoicePreview } from "@/components/invoice-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useContacts } from "@/contexts/contacts-context";
import { useInvoices } from "@/contexts/invoices-context";
import { getCompanyProfile } from "@/lib/contacts-store";
import {
  addDays,
  contactToParty,
  emptyParty,
  exportInvoicePdf,
  newLine,
  todayIso,
} from "@/lib/invoice-utils";
import { getInvoice } from "@/lib/invoices-store";
import { cn } from "@/lib/utils";

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function sanitizeLines(lines: InvoiceLine[]): InvoiceLine[] {
  const cleaned = lines.map((line) => ({
    ...line,
    description: line.description.trim() || "Item",
    quantity: line.quantity > 0 ? line.quantity : 1,
    unit_price: Number.isFinite(line.unit_price) ? line.unit_price : 0,
  }));
  return cleaned.length > 0 ? cleaned : [newLine({ description: "Service" })];
}

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { contacts } = useContacts();
  const { add, update, remove } = useInvoices();
  const isNew = id === "new";
  const creatingRef = useRef(false);
  const [draft, setDraft] = useState<Invoice | null>(() =>
    id && !isNew ? (getInvoice(id) ?? null) : null,
  );
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!isNew || draft || creatingRef.current) return;
    creatingRef.current = true;

    const company = getCompanyProfile();
    const issueDate = todayIso();
    const invoice = add({
      from: company ? contactToParty(company) : emptyParty("Your company"),
      to: emptyParty(),
      currency: company?.currency ?? "EUR",
      issue_date: issueDate,
      due_date: issueDate,
    });
    setDraft(invoice);
    navigate(`/invoices/${invoice.id}`, { replace: true });
  }, [isNew, draft, add, navigate]);

  useEffect(() => {
    if (!id || isNew) return;
    const existing = getInvoice(id);
    if (existing) setDraft(existing);
  }, [id, isNew]);

  const sortedContacts = useMemo(
    () => [...contacts].sort((a, b) => a.name.localeCompare(b.name)),
    [contacts],
  );

  const patch = (patch: Partial<Invoice>) => {
    if (!draft) return;
    setDraft({ ...draft, ...patch });
    setDirty(true);
  };

  const handleSave = () => {
    if (!draft) return;
    try {
      const saved = update(draft.id, {
        ...draft,
        lines: sanitizeLines(draft.lines),
      });
      setDraft(saved);
      setDirty(false);
      toast.success("Invoice saved");
    } catch {
      toast.error("Could not save invoice — check required fields");
    }
  };

  const handleContactChange = (contactId: string) => {
    if (!draft) return;
    if (!contactId) {
      patch({ to_contact_id: undefined, to: emptyParty() });
      return;
    }
    const contact = sortedContacts.find((c) => c.id === contactId);
    if (!contact) return;
    patch({
      to_contact_id: contact.id,
      to: contactToParty(contact),
      currency: contact.currency,
      due_date: addDays(draft.issue_date, contact.default_due_days),
    });
  };

  const updateLine = (lineId: string, field: keyof InvoiceLine, value: string | number) => {
    if (!draft) return;
    patch({
      lines: draft.lines.map((line) =>
        line.id === lineId ? { ...line, [field]: value } : line,
      ),
    });
  };

  const addLineItem = () => {
    if (!draft) return;
    patch({ lines: [...draft.lines, newLine()] });
  };

  const removeLineItem = (lineId: string) => {
    if (!draft) return;
    const next = draft.lines.filter((line) => line.id !== lineId);
    patch({ lines: next.length > 0 ? next : [newLine({ description: "Service" })] });
  };

  if (!draft) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        {isNew ? (
          "Creating invoice…"
        ) : (
          <>
            Invoice not found.{" "}
            <Link to="/invoices" className="text-foreground underline">
              Back to invoices
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 print:hidden">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{draft.number}</h1>
            <Badge variant="outline" className="capitalize">
              {draft.status}
            </Badge>
            {dirty ? (
              <Badge variant="secondary">Unsaved changes</Badge>
            ) : null}
          </div>
          <p className="mt-2 text-muted-foreground">
            Edit details on the left — preview updates live on the right.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => exportInvoicePdf()}>
            <Download className="size-4" />
            Export PDF
          </Button>
          <Button onClick={handleSave} disabled={!dirty}>
            <Save className="size-4" />
            Save
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (!window.confirm(`Delete ${draft.number}?`)) return;
              remove(draft.id);
              toast.success("Invoice deleted");
              navigate("/invoices");
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Client</CardTitle>
              <CardDescription>
                Select a contact to auto-fill bill-to fields, or edit manually below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact">Contact</Label>
                <select
                  id="contact"
                  className={selectClassName}
                  value={draft.to_contact_id ?? ""}
                  onChange={(e) => handleContactChange(e.target.value)}
                >
                  <option value="">Manual entry</option>
                  {sortedContacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.business_name || contact.name}
                    </option>
                  ))}
                </select>
                {sortedContacts.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No contacts yet.{" "}
                    <Link to="/contacts" className="underline">
                      Add one
                    </Link>{" "}
                    to enable auto-fill.
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="to-name">Bill-to name</Label>
                  <Input
                    id="to-name"
                    value={draft.to.name}
                    onChange={(e) =>
                      patch({ to: { ...draft.to, name: e.target.value } })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to-business">Business name</Label>
                  <Input
                    id="to-business"
                    value={draft.to.business_name ?? ""}
                    onChange={(e) =>
                      patch({ to: { ...draft.to, business_name: e.target.value } })
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="to-email">Email</Label>
                  <Input
                    id="to-email"
                    type="email"
                    value={draft.to.business_email ?? ""}
                    onChange={(e) =>
                      patch({ to: { ...draft.to, business_email: e.target.value } })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Invoice details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className={selectClassName}
                  value={draft.status}
                  onChange={(e) => patch({ status: e.target.value as InvoiceStatus })}
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={draft.currency}
                  onChange={(e) => patch({ currency: e.target.value.toUpperCase() })}
                  maxLength={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issue-date">Issue date</Label>
                <Input
                  id="issue-date"
                  type="date"
                  value={draft.issue_date}
                  onChange={(e) => patch({ issue_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due-date">Due date</Label>
                <Input
                  id="due-date"
                  type="date"
                  value={draft.due_date}
                  onChange={(e) => patch({ due_date: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  className={cn(selectClassName, "min-h-24 py-2")}
                  value={draft.notes ?? ""}
                  onChange={(e) => patch({ notes: e.target.value })}
                  placeholder="Payment terms, bank details, thank-you note…"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Line items</CardTitle>
                <CardDescription>Quantity × unit price = line total</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="size-4" />
                Add line
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {draft.lines.map((line, index) => (
                <div key={line.id} className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Line {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(line.id)}
                      disabled={draft.lines.length === 1}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <div className="grid gap-3">
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={line.description}
                        onChange={(e) => updateLine(line.id, "description", e.target.value)}
                        placeholder="Consulting, hosting, design…"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min={0.01}
                          step="0.01"
                          value={line.quantity}
                          onChange={(e) =>
                            updateLine(line.id, "quantity", Number(e.target.value))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit price</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={line.unit_price}
                          onChange={(e) =>
                            updateLine(line.id, "unit_price", Number(e.target.value))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="xl:sticky xl:top-20 xl:self-start">
          <p className="mb-3 text-sm font-medium text-muted-foreground">Live preview</p>
          <InvoicePreview invoice={draft} />
        </div>
      </div>
    </div>
  );
}
