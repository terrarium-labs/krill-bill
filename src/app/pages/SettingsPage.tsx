import { toast } from "sonner";
import type { CreateContactInput } from "@shared/types/index";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactForm } from "@/components/contact-form";
import { getCompanyProfile, saveCompanyProfile } from "@/lib/contacts-store";

export default function SettingsPage() {
  const company = getCompanyProfile();

  const handleSubmit = (values: CreateContactInput) => {
    saveCompanyProfile(values);
    toast.success("Company profile saved locally");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your company</h1>
        <p className="mt-2 text-muted-foreground">
          Issuer details for new invoices — stored locally on this device.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company profile</CardTitle>
          <CardDescription>Appears in the From block on every new invoice.</CardDescription>
        </CardHeader>
        <CardContent>
          <ContactForm
            contact={company ?? undefined}
            submitLabel="Save company profile"
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
