import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Contact, CreateContactInput } from "@shared/types/index";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ContactForm } from "@/components/contact-form";
import { useContacts } from "@/contexts/contacts-context";

export default function ContactsPage() {
  const { contacts, add, update, remove } = useContacts();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);

  const sorted = useMemo(
    () => [...contacts].sort((a, b) => a.name.localeCompare(b.name)),
    [contacts],
  );

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (contact: Contact) => {
    setEditing(contact);
    setOpen(true);
  };

  const handleSubmit = (values: CreateContactInput) => {
    if (editing) {
      update(editing.id, values);
      toast.success("Contact updated");
    } else {
      add(values);
      toast.success("Contact created");
    }
    setOpen(false);
    setEditing(null);
  };

  const handleDelete = (contact: Contact) => {
    if (!window.confirm(`Delete ${contact.name}?`)) return;
    remove(contact.id);
    toast.success("Contact deleted");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="mt-2 text-muted-foreground">
            Saved clients and partners — pick one when creating an invoice to auto-fill bill-to fields.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New contact
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Directory</CardTitle>
          <CardDescription>{sorted.length} saved on this device</CardDescription>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground">No contacts yet. Create your first one.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-3 pr-4 font-medium">Name</th>
                    <th className="py-3 pr-4 font-medium">Business</th>
                    <th className="py-3 pr-4 font-medium">Email</th>
                    <th className="py-3 pr-4 font-medium">Phone</th>
                    <th className="py-3 pr-4 font-medium">Country</th>
                    <th className="py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((contact) => (
                    <tr key={contact.id} className="border-b border-border/60">
                      <td className="py-3 pr-4 font-medium">{contact.name}</td>
                      <td className="py-3 pr-4">{contact.business_name || "—"}</td>
                      <td className="py-3 pr-4">{contact.business_email || "—"}</td>
                      <td className="py-3 pr-4">{contact.business_phone || "—"}</td>
                      <td className="py-3 pr-4">{contact.country || "—"}</td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(contact)}>
                            <Pencil className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(contact)}>
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit contact" : "New contact"}</DialogTitle>
            <DialogDescription>
              Enterprise-style fields shared across clients, providers, and partners.
            </DialogDescription>
          </DialogHeader>
          <ContactForm
            contact={editing ?? undefined}
            submitLabel={editing ? "Save changes" : "Create contact"}
            onSubmit={handleSubmit}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
