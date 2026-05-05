import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useNavigate, useParams } from 'react-router-dom';
import { useSupplier } from '../../../../contexts/SupplierContext';
import { COUNTRIES } from '@/utils/countries';
import CURRENCIES from '@/utils/currencies';
import { getLanguageByCode } from '@/utils/languages';
import { IconInfoItem } from '@/app/components/custom-labels';
import CurrencyLabel from '@/app/components/labels/currency-label';
import DateLabel from '@/app/components/labels/date-label';

interface SupplierInfoCardProps {
    showActions?: boolean;
    onEdit?: () => void;
}

export const SupplierInfoCard: React.FC<SupplierInfoCardProps> = ({ onEdit }) => {
    const { t } = useTranslation();
    const { supplier } = useSupplier();
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();

    const formatAddress = () => {
        const addressParts = [
            supplier.address_line_1,
            supplier.address_line_2,
            supplier.postal_code,
            supplier.city,
            supplier.state_province,
            supplier.country
        ].filter(Boolean);

        return addressParts.length > 0 ? addressParts.join(', ') : null;
    };

    const getCountryName = (countryCode: string) => {
        const country = COUNTRIES.find(c => c.code === countryCode);
        return country?.name || countryCode;
    };

    const getCurrencyName = (currencyCode: string) => {
        const currency = CURRENCIES.find(c => c.code === currencyCode);
        return currency ? `${currency.symbol} ${currency.code}` : currencyCode;
    };

    const getLanguageName = (languageCode: string) => {
        const language = getLanguageByCode(languageCode);
        return language ? `${language.name} (${language.nativeName})` : languageCode;
    };

    const getBasicFields = () => {
        return supplier.sections?.filter((field) => field.handler === 'basic')[0].fields?.filter((field: any) => field.value);
    };

    const getFinancialFields = () => {
        return supplier.sections?.filter((field) => field.handler === 'financials')[0].fields?.filter((field: any) => field.value);
    };

    if (!supplier) {
        return null;
    }

    return (
        <Card className="w-full shadow-none">
            <CardHeader>
                <CardTitle>{t('suppliers.info', 'Supplier Information')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <IconInfoItem
                    icon={"mail"}
                    label={t('suppliers.email', 'Email')}
                    value={supplier.email}
                    copyable
                    link
                    linkValue={`mailto:${supplier.email}`}
                    onEmptyClick={onEdit}
                />

                <IconInfoItem
                    icon={"phone"}
                    label={t('suppliers.phone', 'Phone')}
                    value={supplier.phone}
                    copyable
                    link
                    linkValue={`tel:${supplier.phone}`}
                    onEmptyClick={onEdit}
                />

                <IconInfoItem
                    icon={"globe"}
                    label={t('suppliers.website', 'Website')}
                    value={supplier.url}
                    link
                    linkValue={supplier.url}
                    onEmptyClick={onEdit}
                />

                <IconInfoItem
                    icon={"map-pin"}
                    label={t('suppliers.address', 'Address')}
                    value={formatAddress()}
                    onEmptyClick={onEdit}
                />

                {supplier.country && (
                    <IconInfoItem
                        icon={"globe"}
                        label={t('suppliers.country', 'Country')}
                        value={getCountryName(supplier.country)}
                        flag
                        countryCode={supplier.country}
                        onEmptyClick={onEdit}
                    />
                )}

                <IconInfoItem
                    icon={"building-2"}
                    label={t('suppliers.taxCode', 'Tax Code')}
                    value={supplier.tax_code}
                    copyable
                    onEmptyClick={onEdit}
                />

                <IconInfoItem
                    icon={"file-text"}
                    label={t('suppliers.notes', 'Notes')}
                    value={supplier.notes}
                    onEmptyClick={onEdit}
                />

                {/* Basic Custom Fields Section */}
                {supplier.sections
                    && supplier.sections.length > 0
                    && supplier.sections.filter((field) => field.handler === 'basic').length > 0
                    && getBasicFields()
                    && (getBasicFields() || []).length > 0
                    && (
                        <div className="pt-2">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-xs text-muted-foreground font-semibold">
                                    {t('suppliers.customFields', 'Custom Basic Fields')}
                                </p>
                                <Button variant="ghost" size="icon" onClick={() => navigate(`/${orgId}/admin/fields/suppliers`)}>
                                    <Settings className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {getBasicFields()?.map((field: any) => (
                                    <div key={field.id}>
                                        <p className="text-xs text-muted-foreground">
                                            {field.name}
                                        </p>
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

                {/* Financial Information Section */}
                {(supplier.risk !== null && supplier.risk !== undefined) ||
                    supplier.is_covered_risk !== null ||
                    (supplier.default_due_days !== null && supplier.default_due_days !== undefined) ||
                    (supplier.default_payment_day !== null && supplier.default_payment_day !== undefined) ||
                    supplier.language ||
                    supplier.currency ? (
                    <div className="pt-4 border-t border-border space-y-4">
                        <p className="text-xs text-muted-foreground font-semibold mb-3">
                            {t('suppliers.financialInformation', 'Financial Information')}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {supplier.risk !== null && supplier.risk !== undefined && (
                                <IconInfoItem
                                    icon={"dollar-sign"}
                                    label={t('suppliers.risk', 'Risk')}
                                    children={<CurrencyLabel data={{ value: supplier.risk, currency: supplier.currency || undefined }} />}
                                />
                            )}

                            {supplier.is_covered_risk !== null && (
                                <IconInfoItem
                                    icon={"shield"}
                                    label={t('suppliers.isCoveredRisk', 'Risk is Covered')}
                                    value={supplier.is_covered_risk ? t('common.yes', 'Yes') : t('common.no', 'No')}
                                />
                            )}

                            {supplier.default_due_days !== null && supplier.default_due_days !== undefined && (
                                <IconInfoItem
                                    icon={"calendar"}
                                    label={t('suppliers.defaultDueDays', 'Default Due Days')}
                                    value={`${supplier.default_due_days} ${t('suppliers.days', 'days')}`}
                                />
                            )}

                            {supplier.default_payment_day !== null && supplier.default_payment_day !== undefined && (
                                <IconInfoItem
                                    icon={"calendar"}
                                    label={t('suppliers.defaultPaymentDay', 'Default Payment Day')}
                                    value={`${supplier.default_payment_day}${t('suppliers.dayOfMonth', ' day of month')}`}
                                />
                            )}

                            {supplier.language && (
                                <IconInfoItem
                                    icon={"languages"}
                                    label={t('suppliers.language', 'Preferred Language')}
                                    value={getLanguageName(supplier.language)}
                                />
                            )}

                            {supplier.currency && (
                                <IconInfoItem
                                    icon={"dollar-sign"}
                                    label={t('suppliers.currency', 'Preferred Currency')}
                                    value={getCurrencyName(supplier.currency)}
                                />
                            )}
                        </div>
                    </div>
                ) : null}

                {supplier.tags && supplier.tags.length > 0 && (
                    <div className="pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide font-normal mb-2">
                            {t('suppliers.tags', 'Tags')}
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {supplier.tags.map((tag, index) => (
                                <Badge
                                    key={index}
                                    variant="secondary"
                                    className="text-xs"
                                >
                                    {tag.name || tag}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}



                {/* Financial Custom Fields Section */}
                {supplier.sections && supplier.sections.length > 0 && supplier.sections.filter((field) => field.handler === 'financials').length > 0
                    && getFinancialFields()
                    && (getFinancialFields() || []).length > 0
                    && (
                        <div className="pt-2">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-xs text-muted-foreground font-semibold">
                                    {t('suppliers.customFinancialFields', 'Custom Financial Fields')}
                                </p>
                                <Button variant="ghost" size="icon" onClick={() => navigate(`/${orgId}/admin/fields/suppliers`)}>
                                    <Settings className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {getFinancialFields()?.map((field: any) => (
                                    <div key={field.id}>
                                        <p className="text-xs text-muted-foreground">
                                            {field.name}
                                        </p>
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

                {/* Other Custom Sections */}
                {supplier.sections
                    && supplier.sections.length > 0
                    && supplier.sections.filter((field) => field.handler !== 'basic' && field.handler !== 'financials').length > 0
                    && supplier.sections.filter((field) => field.handler !== 'basic' && field.handler !== 'financials').map((section) => {
                        const visibleFields = section.fields?.filter((field: any) => field.value) || [];
                        if (visibleFields.length === 0) return null;

                        return (
                            <div key={section.id} className="pt-2 border-t border-border">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs text-muted-foreground font-semibold">
                                        {section.title}
                                    </p>
                                    <Button variant="ghost" size="icon" onClick={() => navigate(`/${orgId}/admin/fields/suppliers`)}>
                                        <Settings className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {visibleFields.map((field: any) => (
                                        <div key={field.id}>
                                            <p className="text-xs text-muted-foreground">
                                                {field.name}
                                            </p>
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

                {(supplier.created_at || supplier.updated_at) && (
                    <div className="pt-4 border-t border-border text-xs text-muted-foreground">
                        <div className="flex justify-between">
                            {supplier.created_at && (
                                <span>
                                    {t('common.created', 'Created')}: <DateLabel data={supplier.created_at} options={{ hide: ['seconds'] }} />
                                </span>
                            )}
                            {supplier.updated_at && (
                                <span>
                                    {t('common.updated', 'Updated')}: <DateLabel data={supplier.updated_at} options={{ hide: ['seconds'] }} />
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

