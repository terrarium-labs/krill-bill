import PageHeader from "@/app/components/page-header";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { getOrg, patchOrg } from "@/api/orgs/orgs";
import { getOrgTaxes, postOrgTaxesDefault } from "@/api/orgs/taxes/taxes";
import { Org } from "@/types/general/org";
import { TaxType } from "@/types/miscelanea";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import CountriesInput from "@/app/components/forms-elements/countries-input";
import { PhoneInput } from "@/app/components/forms-elements/phone-input";
import { TaxCodeInput } from "@/app/components/forms-elements/tax-code-input";
import CURRENCIES from "@/utils/currencies";
import { PRIORITIZED_LANGUAGES } from "@/utils/languages";
import { STOCK_ROTATION_OPTIONS } from "@/utils/stock-rotation";
import { StockRotation } from "@/types/general/stock-rotation";
import { OrgAvatar } from "@/app/components/avatars/org-avatar";
import { MultiSelect, Option } from "@/components/ui/multi-select";
import OrgSettingsPageSkeleton from "@/app/admin/pages/OrgSettingsPage/components/org-settings-page-skeleton";

type FormValues = {
  name: string;
  description?: string;
  language?: string;
  currency?: string;
  default_due_days?: number;
  address_line_1?: string;
  address_line_2?: string;
  postal_code?: string;
  city?: string;
  state_province?: string;
  country?: string;
  email?: string;
  phone?: string;
  url?: string;
  tax_code?: string;
  tax_code_type?: string;
  payment_guides?: string;
  stock_rotation_type: StockRotation;
  price_per_km?: number | null;
  cost_per_km?: number | null;
};

export default function OrgSettingsPage() {
  const { t } = useTranslation();
  const { orgId } = useParams<{ orgId: string }>();
  const [org, setOrg] = useState<Org | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Taxes state
  const [allTaxes, setAllTaxes] = useState<TaxType[]>([]);
  const [selectedTaxIds, setSelectedTaxIds] = useState<string[]>([]);
  const [initialTaxIds, setInitialTaxIds] = useState<string[]>([]);

  // Transform API taxes to MultiSelect options format
  const taxOptions: Option[] = useMemo(() => {
    return allTaxes.map((tax) => ({
      value: tax.id,
      label: tax.type,
    }));
  }, [allTaxes]);

  const hasTaxChanges = useMemo(() => {
    if (selectedTaxIds.length !== initialTaxIds.length) return true;
    return !selectedTaxIds.every((id) => initialTaxIds.includes(id));
  }, [selectedTaxIds, initialTaxIds]);

  const formSchema = z.object({
    name: z
      .string()
      .min(1, t("orgs.validation.nameRequired", "Organization name is required"))
      .min(
        2,
        t(
          "orgs.validation.nameMinLength",
          "Organization name must be at least 2 characters"
        )
      )
      .max(
        100,
        t(
          "orgs.validation.nameMaxLength",
          "Organization name must be less than 100 characters"
        )
      )
      .trim(),
    description: z.string().max(1000).optional(),
    language: z.string().optional(),
    currency: z.string().optional(),
    default_due_days: z.number().min(0).max(365).optional(),
    address_line_1: z.string().max(255).optional(),
    address_line_2: z.string().max(255).optional(),
    postal_code: z.string().max(20).optional(),
    city: z.string().max(100).optional(),
    state_province: z.string().max(100).optional(),
    country: z.string().max(2).optional(),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    url: z.string().url().optional().or(z.literal("")),
    tax_code: z.string().max(50).optional(),
    tax_code_type: z.string().max(50).optional(),
    payment_guides: z.string().max(5000).optional(),
    stock_rotation_type: z.enum(["fifo", "lifo", "fefo", "lefo", "hifo", "lofo"]),
    price_per_km: z.number().min(0).nullable().optional(),
    cost_per_km: z.number().min(0).nullable().optional(),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      language: "es",
      currency: "EUR",
      default_due_days: 30,
      address_line_1: "",
      address_line_2: "",
      postal_code: "",
      city: "",
      state_province: "",
      country: "ES",
      email: "",
      phone: "",
      url: "",
      tax_code: "",
      tax_code_type: "",
      payment_guides: "",
      stock_rotation_type: "fifo",
      price_per_km: null,
      cost_per_km: null,
    },
  });

  const fetchOrg = async () => {
    if (!orgId) return;
    try {
      // Fetch org data, all taxes, and default taxes in parallel
      const [orgResponse, allTaxesResponse, defaultTaxesResponse] = await Promise.all([
        getOrg(orgId),
        getOrgTaxes(orgId),
        getOrgTaxes(orgId, true),
      ]);

      if (orgResponse.success?.org) {
        const orgData = orgResponse.success.org;
        setOrg(orgData);
        // Populate form with org data
        form.reset({
          name: orgData.name || "",
          description: orgData.description || "",
          language: orgData.language || "es",
          currency: orgData.currency || "EUR",
          default_due_days: orgData.default_due_days || 30,
          address_line_1: orgData.address_line_1 || "",
          address_line_2: orgData.address_line_2 || "",
          postal_code: orgData.postal_code || "",
          city: orgData.city || "",
          state_province: orgData.state_province || "",
          country: orgData.country || "ES",
          email: orgData.email || "",
          phone: orgData.phone || "",
          url: orgData.url || "",
          tax_code: orgData.tax_code || "",
          tax_code_type: orgData.tax_code_type || "",
          payment_guides: orgData.payment_guides || "",
          stock_rotation_type:
            (orgData.stock_rotation_type as StockRotation) || "fifo",
          price_per_km: orgData.price_per_km ?? null,
          cost_per_km: orgData.cost_per_km ?? null,
        });
      }

      if (allTaxesResponse.success?.taxes) {
        setAllTaxes(allTaxesResponse.success.taxes);
      }

      if (defaultTaxesResponse.success?.taxes) {
        const taxIds = defaultTaxesResponse.success.taxes.map((tax: TaxType) => tax.id);
        setSelectedTaxIds(taxIds);
        setInitialTaxIds(taxIds);
      }
    } catch (error) {
      console.error("Error fetching organization:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrg();
  }, [orgId]);

  const onSubmit = async (values: FormValues) => {
    if (!orgId) return;

    setIsSaving(true);
    try {
      // Build payload matching the API expected format
      const payload: {
        name?: string;
        description?: string;
        language?: string;
        currency?: string;
        default_due_days?: number;
        address_line_1?: string;
        address_line_2?: string;
        postal_code?: string;
        city?: string;
        state_province?: string;
        country?: string;
        email?: string;
        phone?: string;
        url?: string;
        tax_code?: string;
        tax_code_type?: string;
        payment_guides?: string;
        stock_rotation_type?: string;
        price_per_km?: number | null;
        cost_per_km?: number | null;
      } = {};

      if (values.name) payload.name = values.name;
      if (values.description !== undefined && values.description.trim() !== "") {
        payload.description = values.description;
      }
      if (values.language) payload.language = values.language;
      if (values.currency) payload.currency = values.currency;
      if (values.default_due_days !== undefined)
        payload.default_due_days = values.default_due_days;
      if (values.address_line_1) payload.address_line_1 = values.address_line_1;
      if (values.address_line_2) payload.address_line_2 = values.address_line_2;
      if (values.postal_code) payload.postal_code = values.postal_code;
      if (values.city) payload.city = values.city;
      if (values.state_province) payload.state_province = values.state_province;
      if (values.country) payload.country = values.country;
      if (values.email) payload.email = values.email;
      if (values.phone) payload.phone = values.phone;
      if (values.url) payload.url = values.url;
      if (values.tax_code) payload.tax_code = values.tax_code;
      if (values.tax_code_type) payload.tax_code_type = values.tax_code_type;
      if (values.payment_guides !== undefined && values.payment_guides.trim() !== "") {
        payload.payment_guides = values.payment_guides;
      }
      if (values.stock_rotation_type)
        payload.stock_rotation_type = values.stock_rotation_type;
      payload.price_per_km = values.price_per_km ?? null;
      payload.cost_per_km = values.cost_per_km ?? null;
      // Save org and taxes in parallel
      const promises: Promise<unknown>[] = [patchOrg(orgId, payload)];

      if (hasTaxChanges) {
        promises.push(postOrgTaxesDefault(orgId, { tax_ids: selectedTaxIds }));
      }

      const [orgResponse, taxResponse] = await Promise.all(promises);

      if ((orgResponse as { success?: boolean }).success) {
        // Update initial tax ids if taxes were saved
        if (hasTaxChanges && (taxResponse as { success?: boolean })?.success) {
          setInitialTaxIds(selectedTaxIds);
        }
        toast.success(
          t("orgs.orgUpdatedSuccess", "Organization updated successfully")
        );
        await fetchOrg();
      } else {
        toast.error(
          (orgResponse as { error?: string }).error ||
          t("orgs.patchOrgError", "Failed to update organization")
        );
      }
    } catch (error) {
      console.error("Error updating organization:", error);
      toast.error(t("orgs.patchOrgError", "Failed to update organization"));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoading && !org) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">
          {t("settings.org.notFound", "Organization not found")}
        </p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={t("settings.org.title", "Organization settings")}
        description={t(
          "settings.org.description",
          "Manage your organization settings."
        )}
        showBackButton={true}
        docs={{ slug: "pd_admin_org_settings" }}
        action={
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={
              isLoading ||
              isSaving ||
              (!form.formState.isValid && !hasTaxChanges)
            }
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("orgs.saving", "Saving...")}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t("common.saveChanges", "Save changes")}
              </>
            )}
          </Button>
        }
      />

      <Form {...form}>
        <div className="mt-6 space-y-0">
          {isLoading ? (
            <OrgSettingsPageSkeleton />
          ) : (
            <>
          {/* General Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-6">
            <div>
              <p className="text-md font-semibold">{t("orgs.generalInfo", "General")}</p>
              <p className="text-sm text-muted-foreground">
                {t("orgs.generalInfoDescription", "Basic organization information")}
              </p>
            </div>
            <div className="col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 pb-2">
                    <div className="flex items-center gap-4">
                      {org && (
                        <OrgAvatar
                          org={org}
                          showName={false}
                          size="4xl"
                          imageEditable={true}
                          onImageChange={fetchOrg}
                        />
                      )}
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium">
                          {t("orgs.organizationLogo", "Organization Logo")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("orgs.logoHint", "Click the logo to upload or right-click for more options")}
                        </p>
                      </div>
                    </div>
                  </div>
                  <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("orgs.organizationName", "Organization Name")} *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          "orgs.enterOrgName",
                          "Enter organization name"
                        )}
                        {...field}
                        disabled={isSaving}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem >
                    <FormLabel>{t("orgs.website", "Website")}</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder={t(
                          "orgs.websitePlaceholder",
                          "https://example.com"
                        )}
                        {...field}
                        disabled={isSaving}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("orgs.email", "Email")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t(
                          "orgs.emailPlaceholder",
                          "organization@example.com"
                        )}
                        {...field}
                        disabled={isSaving}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <PhoneInput
                form={form}
                name="phone"
                label={t("orgs.phone", "Phone")}
                disabled={isSaving}
              />

              <TaxCodeInput
                form={form}
                name="tax_code"
                taxCodeTypeName="tax_code_type"
                label={t("orgs.taxCode", "Tax Code")}
                disabled={isSaving}
              />

              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("orgs.language", "Language")}</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isSaving}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={t(
                              "orgs.selectLanguage",
                              "Select a language"
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITIZED_LANGUAGES.map((language) => (
                            <SelectItem
                              key={language.code}
                              value={language.code}
                            >
                              {language.name} ({language.nativeName})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t("orgs.description", "Description")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t(
                          "orgs.enterDescription",
                          "Enter organization description"
                        )}
                        {...field}
                        disabled={isSaving}
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>
          </div>

          {/* Address Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-6 border-t">
            <div>
              <p className="text-md font-semibold">{t("orgs.addressInfo", "Address")}</p>
              <p className="text-sm text-muted-foreground">
                {t("orgs.addressInfoDescription", "Organization location and address")}
              </p>
            </div>
            <div className="col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 items-start justify-start">
                  <FormField
                    control={form.control}
                    name="address_line_1"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>
                          {t("orgs.addressLine1", "Address Line 1")}
                        </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          "orgs.addressLine1Placeholder",
                          "Street address"
                        )}
                        {...field}
                        disabled={isSaving}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address_line_2"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>
                      {t("orgs.addressLine2", "Address Line 2")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          "orgs.addressLine2Placeholder",
                          "Apartment, suite, unit, etc."
                        )}
                        {...field}
                        disabled={isSaving}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("orgs.city", "City")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("orgs.cityPlaceholder", "City")}
                        {...field}
                        disabled={isSaving}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="postal_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("orgs.postalCode", "Postal Code")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          "orgs.postalCodePlaceholder",
                          "Postal code"
                        )}
                        {...field}
                        disabled={isSaving}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state_province"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("orgs.stateProvince", "State / Province")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          "orgs.stateProvincePlaceholder",
                          "State or province"
                        )}
                        {...field}
                        disabled={isSaving}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <CountriesInput
                form={form}
                name="country"
                label={t("orgs.country", "Country")}
                defaultValue={"ES"}
              />
            </div>
          </div>

          {/* Finance Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-6 border-t">
            <div>
              <p className="text-md font-semibold">{t("orgs.financeInfo", "Finance")}</p>
              <p className="text-sm text-muted-foreground">
                {t("orgs.financeInfoDescription", "Currency and tax settings")}
              </p>
            </div>
            <div className="col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 items-start justify-start">
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("orgs.currency", "Currency")}</FormLabel>
                        <FormControl>
                          <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isSaving}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={t(
                              "orgs.selectCurrency",
                              "Select a currency"
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((currency) => (
                            <SelectItem
                              key={currency.code}
                              value={currency.code}
                            >
                              {currency.symbol} - {currency.name} (
                              {currency.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      {t(
                        "orgs.currencyDescription",
                        "Default currency for prices and transactions across the organization"
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>{t("orgs.defaultTaxes", "Default Taxes")}</FormLabel>
                <MultiSelect
                  options={taxOptions}
                  selected={selectedTaxIds}
                  onChange={setSelectedTaxIds}
                  placeholder={t("orgs.selectTaxes", "Select taxes...")}
                  disabled={isSaving}
                />
                <p className="text-sm text-muted-foreground">
                  {t(
                    "orgs.defaultTaxesDescription",
                    "Taxes applied by default to transactions"
                  )}
                </p>
              </div>

              <FormField
                control={form.control}
                name="default_due_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("orgs.defaultDueDays", "Default Due Days")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="365"
                        placeholder="30"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                        disabled={isSaving}
                      />
                    </FormControl>
                    <FormDescription>
                      {t(
                        "orgs.defaultDueDaysDescription",
                        "Default payment terms in days"
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_guides"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("orgs.paymentGuides", "Payment Guides")}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t(
                          "orgs.paymentGuidesPlaceholder",
                          "e.g. Bank: IBAN ES00 0000 0000 0000 0000 0000"
                        )}
                        {...field}
                        disabled={isSaving}
                        rows={4}
                      />
                    </FormControl>
                    <FormDescription>
                      {t(
                        "orgs.paymentGuidesDescription",
                        "Payment instructions shown on invoices (bank details, payment methods, etc.)"
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Logistics Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-6 border-t">
            <div>
              <p className="text-md font-semibold">{t("orgs.logisticsInfo", "Logistics")}</p>
              <p className="text-sm text-muted-foreground">
                {t("orgs.logisticsInfoDescription", "Stock, commuting and transport settings")}
              </p>
            </div>
            <div className="col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 items-start justify-start">
                  <FormField
                    control={form.control}
                    name="price_per_km"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("orgs.pricePerKm", "Price per km")}
                        </FormLabel>
                        <FormControl>
                          <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder={t("orgs.pricePerKmPlaceholder", "0.19")}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === "" ? null : parseFloat(val));
                        }}
                        disabled={isSaving}
                      />
                    </FormControl>
                    <FormDescription>
                      {t(
                        "orgs.pricePerKmDescription",
                        "Default billable price per kilometer for commuting expenses"
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cost_per_km"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("orgs.costPerKm", "Cost per km")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder={t("orgs.costPerKmPlaceholder", "0.19")}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === "" ? null : parseFloat(val));
                        }}
                        disabled={isSaving}
                      />
                    </FormControl>
                    <FormDescription>
                      {t(
                        "orgs.costPerKmDescription",
                        "Default cost per kilometer for commuting expenses"
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stock_rotation_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("orgs.stockRotationType", "Stock Rotation")} *
                    </FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isSaving}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={t(
                              "orgs.selectStockRotation",
                              "Select stock rotation type"
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {STOCK_ROTATION_OPTIONS.map((option) => (
                            <SelectItem key={option.code} value={option.code}>
                              {option.name} ({option.description})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      {t(
                        "orgs.stockRotationDescription",
                        "Method used to determine the order in which inventory items are sold or used"
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
            </>
          )}
        </div>
      </Form>
    </>
  );
}
