import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { useCommutingRate } from "@/app/rates/contexts/CommutingRateContext";
import { IconInfoItem } from "@/app/components/custom-labels";
import Tag from "@/app/components/tag/tag";
import CurrencyLabel from "@/app/components/labels/currency-label";
import { formatDate } from "@/utils/miscelanea";
import { Check, X } from "lucide-react";

interface CommutingRateInfoCardProps {
    onEdit?: () => void;
}

const CommutingRateInfoCard = ({ onEdit }: CommutingRateInfoCardProps) => {
    const { t } = useTranslation();
    const { commutingRate } = useCommutingRate();

    return (
        <Card className="w-full shadow-none">
            <CardHeader>
                <CardTitle>{t("commutingRates.info", "Rate Information")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <IconInfoItem
                    icon="tag"
                    label={t("commutingRates.name", "Name")}
                    value={commutingRate.name}
                />

                <IconInfoItem
                    icon="activity"
                    label={t("commutingRates.status", "Status")}
                >
                    <Tag text={commutingRate.status} className="capitalize" />
                </IconInfoItem>

                <IconInfoItem
                    icon="calendar"
                    label={t("commutingRates.validFrom", "Valid From")}
                    value={
                        commutingRate.valid_from
                            ? formatDate(commutingRate.valid_from)
                            : null
                    }
                    onEmptyClick={onEdit}
                />

                <IconInfoItem
                    icon="calendar-clock"
                    label={t("commutingRates.validTo", "Valid To")}
                    value={
                        commutingRate.due_date
                            ? formatDate(commutingRate.due_date)
                            : null
                    }
                    onEmptyClick={onEdit}
                />

                <div className="pt-4 border-t border-border">
                    <IconInfoItem
                        icon="file-text"
                        label={t("commutingRates.description", "Description")}
                        value={commutingRate.description}
                        onEmptyClick={onEdit}
                    />
                </div>

                <div className="pt-4 border-t border-border space-y-4">
                    <IconInfoItem
                        icon="banknote"
                        label={t("commutingRates.fixedPrice", "Fixed Price")}
                    >
                        {commutingRate.is_fixed_price ? (
                            <CurrencyLabel data={commutingRate.fixed_price ?? 0} />
                        ) : (
                            <span className="text-muted-foreground text-sm">
                                {t("common.disabled", "Disabled")}
                            </span>
                        )}
                    </IconInfoItem>

                    <IconInfoItem
                        icon="ruler"
                        label={t("commutingRates.pricePerKm", "Price per Kilometre")}
                    >
                        {commutingRate.is_price_per_km ? (
                            <div className="flex items-center gap-1.5 text-sm">
                                <CurrencyLabel data={commutingRate.price_per_km ?? 0} />
                                <span className="text-muted-foreground">/km</span>
                                {commutingRate.min_price != null && commutingRate.min_price > 0 && (
                                    <span className="text-muted-foreground">
                                        (min. <CurrencyLabel data={commutingRate.min_price} />)
                                    </span>
                                )}
                            </div>
                        ) : (
                            <span className="text-muted-foreground text-sm">
                                {t("common.disabled", "Disabled")}
                            </span>
                        )}
                    </IconInfoItem>

                    <IconInfoItem
                        icon="clock"
                        label={t("commutingRates.travelTimeBillable", "Travel Time Billable")}
                    >
                        {commutingRate.is_travel_time_billable ? (
                            <div className="flex items-center gap-1.5 text-sm">
                                <Check className="h-3.5 w-3.5 text-green-500" />
                                <span>{t("commutingRates.billable", "Billable")}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 text-sm">
                                <X className="h-3.5 w-3.5 text-red-500" />
                                <span className="text-muted-foreground">
                                    {t("common.disabled", "Disabled")}
                                </span>
                            </div>
                        )}
                    </IconInfoItem>
                </div>
            </CardContent>
        </Card>
    );
};

export default CommutingRateInfoCard;
