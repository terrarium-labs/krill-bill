import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createContactSchema,
  type Contact,
  type CreateContactInput,
} from "@shared/types/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  contact?: Contact;
  submitLabel?: string;
  onSubmit: (values: CreateContactInput) => void;
  onCancel?: () => void;
};

export function ContactForm({ contact, submitLabel = "Save contact", onSubmit, onCancel }: Props) {
  const form = useForm<CreateContactInput>({
    resolver: zodResolver(createContactSchema),
    defaultValues: {
      name: "",
      business_name: "",
      business_email: "",
      business_phone: "",
      business_website: "",
      address_line_1: "",
      address_line_2: "",
      city: "",
      postal_code: "",
      state: "",
      country: "",
      currency: "EUR",
      language: "en",
      default_due_days: 30,
    },
  });

  useEffect(() => {
    if (!contact) return;
    form.reset({
      name: contact.name,
      business_name: contact.business_name ?? "",
      business_email: contact.business_email ?? "",
      business_phone: contact.business_phone ?? "",
      business_website: contact.business_website ?? "",
      address_line_1: contact.address_line_1 ?? "",
      address_line_2: contact.address_line_2 ?? "",
      city: contact.city ?? "",
      postal_code: contact.postal_code ?? "",
      state: contact.state ?? "",
      country: contact.country ?? "",
      currency: contact.currency,
      language: contact.language,
      default_due_days: contact.default_due_days,
    });
  }, [contact, form]);

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Contact name *</Label>
          <Input id="name" {...form.register("name")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="business_name">Business / legal name</Label>
          <Input id="business_name" {...form.register("business_name")} />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="business_email">Email</Label>
          <Input id="business_email" type="email" {...form.register("business_email")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="business_phone">Phone</Label>
          <Input id="business_phone" {...form.register("business_phone")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="business_website">Website</Label>
        <Input id="business_website" placeholder="https://example.com" {...form.register("business_website")} />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="address_line_1">Address line 1</Label>
          <Input id="address_line_1" {...form.register("address_line_1")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address_line_2">Address line 2</Label>
          <Input id="address_line_2" {...form.register("address_line_2")} />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" {...form.register("city")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="postal_code">Postal code</Label>
          <Input id="postal_code" {...form.register("postal_code")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State / region</Label>
          <Input id="state" {...form.register("state")} />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input id="country" {...form.register("country")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Input id="currency" {...form.register("currency")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="default_due_days">Default due days</Label>
          <Input id="default_due_days" type="number" {...form.register("default_due_days", { valueAsNumber: true })} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
