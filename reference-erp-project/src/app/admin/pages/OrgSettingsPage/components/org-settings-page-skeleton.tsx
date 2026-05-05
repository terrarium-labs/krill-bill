import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function OrgSettingsFieldSkeleton({
  label,
  className,
  controlClassName,
}: {
  label: ReactNode;
  className?: string;
  controlClassName?: string;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Label>{label}</Label>
      <Skeleton className={cn("w-full rounded-md", controlClassName ?? "h-9")} />
    </div>
  );
}

/** Same section layout as the loaded org settings form; labels and descriptions are real, values are skeletons. */
export default function OrgSettingsPageSkeleton() {
  const { t } = useTranslation();

  return (
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
              <Skeleton className="h-24 w-24 shrink-0 rounded-lg" />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">
                  {t("orgs.organizationLogo", "Organization Logo")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "orgs.logoHint",
                    "Click the logo to upload or right-click for more options"
                  )}
                </p>
              </div>
            </div>
          </div>
          <OrgSettingsFieldSkeleton
            label={
              <>
                {t("orgs.organizationName", "Organization Name")} *
              </>
            }
          />
          <OrgSettingsFieldSkeleton label={t("orgs.website", "Website")} />
          <OrgSettingsFieldSkeleton label={t("orgs.email", "Email")} />
          <OrgSettingsFieldSkeleton label={t("orgs.phone", "Phone")} />
          <OrgSettingsFieldSkeleton label={t("orgs.taxCode", "Tax Code")} />
          <OrgSettingsFieldSkeleton label={t("orgs.language", "Language")} />
          <OrgSettingsFieldSkeleton
            className="md:col-span-2"
            label={t("orgs.description", "Description")}
            controlClassName="min-h-[88px] w-full"
          />
        </div>
      </div>

      {/* Address Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 border-t py-6">
        <div>
          <p className="text-md font-semibold">{t("orgs.addressInfo", "Address")}</p>
          <p className="text-sm text-muted-foreground">
            {t("orgs.addressInfoDescription", "Organization location and address")}
          </p>
        </div>
        <div className="col-span-3 grid grid-cols-1 items-start justify-start gap-4 md:grid-cols-2">
          <OrgSettingsFieldSkeleton
            className="md:col-span-2"
            label={t("orgs.addressLine1", "Address Line 1")}
          />
          <OrgSettingsFieldSkeleton
            className="md:col-span-2"
            label={t("orgs.addressLine2", "Address Line 2")}
          />
          <OrgSettingsFieldSkeleton label={t("orgs.city", "City")} />
          <OrgSettingsFieldSkeleton label={t("orgs.postalCode", "Postal Code")} />
          <OrgSettingsFieldSkeleton label={t("orgs.stateProvince", "State / Province")} />
          <OrgSettingsFieldSkeleton label={t("orgs.country", "Country")} />
        </div>
      </div>

      {/* Finance Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 border-t py-6">
        <div>
          <p className="text-md font-semibold">{t("orgs.financeInfo", "Finance")}</p>
          <p className="text-sm text-muted-foreground">
            {t("orgs.financeInfoDescription", "Currency and tax settings")}
          </p>
        </div>
        <div className="col-span-3 grid grid-cols-1 items-start justify-start gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>{t("orgs.currency", "Currency")}</Label>
            <Skeleton className="h-9 w-full rounded-md" />
            <p className="text-sm text-muted-foreground">
              {t(
                "orgs.currencyDescription",
                "Default currency for prices and transactions across the organization"
              )}
            </p>
          </div>
          <div className="space-y-2">
            <Label>{t("orgs.defaultTaxes", "Default Taxes")}</Label>
            <Skeleton className="min-h-10 w-full rounded-md" />
            <p className="text-sm text-muted-foreground">
              {t(
                "orgs.defaultTaxesDescription",
                "Taxes applied by default to transactions"
              )}
            </p>
          </div>
          <div className="grid gap-2">
            <Label>{t("orgs.defaultDueDays", "Default Due Days")}</Label>
            <Skeleton className="h-9 w-full rounded-md" />
            <p className="text-sm text-muted-foreground">
              {t(
                "orgs.defaultDueDaysDescription",
                "Default payment terms in days"
              )}
            </p>
          </div>
          <div className="grid gap-2">
            <Label>{t("orgs.paymentGuides", "Payment Guides")}</Label>
            <Skeleton className="min-h-[88px] w-full rounded-md" />
            <p className="text-sm text-muted-foreground">
              {t(
                "orgs.paymentGuidesDescription",
                "Payment instructions shown on invoices (bank details, payment methods, etc.)"
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Logistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 border-t py-6">
        <div>
          <p className="text-md font-semibold">{t("orgs.logisticsInfo", "Logistics")}</p>
          <p className="text-sm text-muted-foreground">
            {t(
              "orgs.logisticsInfoDescription",
              "Stock, commuting and transport settings"
            )}
          </p>
        </div>
        <div className="col-span-3 grid grid-cols-1 items-start justify-start gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>{t("orgs.pricePerKm", "Price per km")}</Label>
            <Skeleton className="h-9 w-full rounded-md" />
            <p className="text-sm text-muted-foreground">
              {t(
                "orgs.pricePerKmDescription",
                "Default billable price per kilometer for commuting expenses"
              )}
            </p>
          </div>
          <div className="grid gap-2">
            <Label>{t("orgs.costPerKm", "Cost per km")}</Label>
            <Skeleton className="h-9 w-full rounded-md" />
            <p className="text-sm text-muted-foreground">
              {t(
                "orgs.costPerKmDescription",
                "Default cost per kilometer for commuting expenses"
              )}
            </p>
          </div>
          <div className="grid gap-2">
            <Label>
              {t("orgs.stockRotationType", "Stock Rotation")} *
            </Label>
            <Skeleton className="h-9 w-full rounded-md" />
            <p className="text-sm text-muted-foreground">
              {t(
                "orgs.stockRotationDescription",
                "Method used to determine the order in which inventory items are sold or used"
              )}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
