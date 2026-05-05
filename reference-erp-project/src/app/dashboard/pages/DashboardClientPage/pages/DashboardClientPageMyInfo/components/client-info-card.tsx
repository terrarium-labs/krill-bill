import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";
import { useClient } from "@/app/dashboard/contexts/DashboardClientContext";
import { COUNTRIES } from "@/utils/countries";
import CURRENCIES from "@/utils/currencies";
import { getLanguageByCode } from "@/utils/languages";
import { IconInfoItem } from "@/app/components/custom-labels";
import CurrencyLabel from "@/app/components/labels/currency-label";
import DateLabel from "@/app/components/labels/date-label";

export const ClientInfoCard: React.FC = () => {
  const { t } = useTranslation();
  const { client } = useClient();

  const formatAddress = () => {
    const addressParts = [
      client.address_line_1,
      client.address_line_2,
      client.postal_code,
      client.city,
      client.state_province,
      client.country,
    ].filter(Boolean);
    return addressParts.length > 0 ? addressParts.join(", ") : null;
  };

  const getCountryName = (countryCode: string) => {
    const country = COUNTRIES.find((c) => c.code === countryCode);
    return country?.name || countryCode;
  };

  const getCurrencyName = (currencyCode: string) => {
    const currency = CURRENCIES.find((c) => c.code === currencyCode);
    return currency ? `${currency.symbol} ${currency.code}` : currencyCode;
  };

  const getLanguageName = (languageCode: string) => {
    const language = getLanguageByCode(languageCode);
    return language ? `${language.name} (${language.nativeName})` : languageCode;
  };

  const getBasicFields = () => {
    return client.sections?.filter((field) => field.handler === "basic")[0]?.fields?.filter((field: any) => field.value);
  };

  const getFinancialFields = () => {
    return client.sections?.filter((field) => field.handler === "financials")[0]?.fields?.filter((field: any) => field.value);
  };

  if (!client) return null;

  return (
    <Card className="w-full shadow-none">
      <CardHeader>
        <CardTitle>{t("clients.info", "Client Information")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <IconInfoItem
          icon="mail"
          label={t("clients.email", "Email")}
          value={client.email}
          copyable
          link
          linkValue={`mailto:${client.email}`}
        />
        <IconInfoItem
          icon="phone"
          label={t("clients.phone", "Phone")}
          value={client.phone}
          copyable
          link
          linkValue={`tel:${client.phone}`}
        />
        <IconInfoItem icon="globe" label={t("clients.website", "Website")} value={client.url} link linkValue={client.url} />
        <IconInfoItem icon="map-pin" label={t("clients.address", "Address")} value={formatAddress()} />
        {client.country && (
          <IconInfoItem
            icon="globe"
            label={t("clients.country", "Country")}
            value={getCountryName(client.country)}
            flag
            countryCode={client.country}
          />
        )}
        <IconInfoItem icon="building-2" label={t("clients.taxCode", "Tax Code")} value={client.tax_code} copyable />
        <IconInfoItem icon="file-text" label={t("clients.notes", "Notes")} value={client.notes} />

        {client.sections &&
          client.sections.length > 0 &&
          client.sections.filter((field) => field.handler === "basic").length > 0 &&
          getBasicFields() &&
          (getBasicFields() || []).length > 0 && (
            <div className="pt-2">
              <p className="text-xs text-muted-foreground font-semibold mb-2">{t("clients.customFields", "Custom Basic Fields")}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {getBasicFields()?.map((field: any) => (
                  <div key={field.id}>
                    <p className="text-xs text-muted-foreground">{field.name}</p>
                    <div className="text-sm font-normal text-foreground">
                      {Array.isArray(field.value) ? (
                        <div className="flex flex-col gap-0.5">
                          {field.value.map((v: string, i: number) => (
                            <span key={i}>{v}</span>
                          ))}
                        </div>
                      ) : (
                        field.value
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {((client.risk !== null && client.risk !== undefined) ||
          client.is_covered_risk !== null ||
          (client.default_due_days !== null && client.default_due_days !== undefined) ||
          (client.default_payment_day !== null && client.default_payment_day !== undefined) ||
          client.language ||
          client.currency) && (
          <div className="pt-4 border-t border-border space-y-4">
            <p className="text-xs text-muted-foreground font-semibold mb-3">{t("clients.financialInformation", "Financial Information")}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {client.risk !== null && client.risk !== undefined && (
                <IconInfoItem
                  icon="dollar-sign"
                  label={t("clients.risk", "Risk")}
                  children={<CurrencyLabel data={{ value: client.risk, currency: client.currency || undefined }} />}
                />
              )}
              {client.is_covered_risk !== null && (
                <IconInfoItem
                  icon="shield"
                  label={t("clients.isCoveredRisk", "Risk is Covered")}
                  value={client.is_covered_risk ? t("common.yes", "Yes") : t("common.no", "No")}
                />
              )}
              {client.default_due_days !== null && client.default_due_days !== undefined && (
                <IconInfoItem
                  icon="calendar"
                  label={t("clients.defaultDueDays", "Default Due Days")}
                  value={`${client.default_due_days} ${t("clients.days", "days")}`}
                />
              )}
              {client.default_payment_day !== null && client.default_payment_day !== undefined && (
                <IconInfoItem
                  icon="calendar"
                  label={t("clients.defaultPaymentDay", "Default Payment Day")}
                  value={`${client.default_payment_day}${t("clients.dayOfMonth", " day of month")}`}
                />
              )}
              {client.language && (
                <IconInfoItem
                  icon="languages"
                  label={t("clients.language", "Preferred Language")}
                  value={getLanguageName(client.language)}
                />
              )}
              {client.currency && (
                <IconInfoItem
                  icon="dollar-sign"
                  label={t("clients.currency", "Preferred Currency")}
                  value={getCurrencyName(client.currency)}
                />
              )}
            </div>
          </div>
        )}

        {client.tags && client.tags.length > 0 && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-normal mb-2">{t("clients.tags", "Tags")}</p>
            <div className="flex flex-wrap gap-1">
              {client.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag.name || tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {client.sections &&
          client.sections.length > 0 &&
          client.sections.filter((field) => field.handler === "financials").length > 0 &&
          getFinancialFields() &&
          (getFinancialFields() || []).length > 0 && (
            <div className="pt-2">
              <p className="text-xs text-muted-foreground font-semibold mb-2">{t("clients.customFinancialFields", "Custom Financial Fields")}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {getFinancialFields()?.map((field: any) => (
                  <div key={field.id}>
                    <p className="text-xs text-muted-foreground">{field.name}</p>
                    <div className="text-sm font-normal text-foreground">
                      {Array.isArray(field.value) ? (
                        <div className="flex flex-col gap-0.5">
                          {field.value.map((v: string, i: number) => (
                            <span key={i}>{v}</span>
                          ))}
                        </div>
                      ) : (
                        field.value
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {client.sections &&
          client.sections.length > 0 &&
          client.sections
            .filter((field) => field.handler !== "basic" && field.handler !== "financials")
            .map((section) => {
              const visibleFields = section.fields?.filter((field: any) => field.value) || [];
              if (visibleFields.length === 0) return null;
              return (
                <div key={section.id} className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground font-semibold mb-2">{section.title}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {visibleFields.map((field: any) => (
                      <div key={field.id}>
                        <p className="text-xs text-muted-foreground">{field.name}</p>
                        <div className="text-sm font-normal text-foreground">
                          {Array.isArray(field.value) ? (
                            <div className="flex flex-col gap-0.5">
                              {field.value.map((v: string, i: number) => (
                                <span key={i}>{v}</span>
                              ))}
                            </div>
                          ) : (
                            field.value
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

        {(client.created_at || client.updated_at) && (
          <div className="pt-4 border-t border-border text-xs text-muted-foreground">
            <div className="flex justify-between">
              {client.created_at && (
                <span>
                  {t("common.created", "Created")}: <DateLabel data={client.created_at} options={{ hide: ["seconds"] }} />
                </span>
              )}
              {client.updated_at && (
                <span>
                  {t("common.updated", "Updated")}: <DateLabel data={client.updated_at} options={{ hide: ["seconds"] }} />
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
