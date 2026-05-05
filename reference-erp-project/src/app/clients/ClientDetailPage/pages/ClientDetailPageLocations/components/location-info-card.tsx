import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';
import { Location } from '@/types/general/location';
import { COUNTRIES } from '@/utils/countries';
import { formatDecimal, formatTimeToTravel } from '@/utils/miscelanea';
import { CommutingRate } from '@/types/general/commuting-rates';
import { IconInfoItem } from '@/app/components/custom-labels';
import WorkplaceLabel from '@/app/components/labels/workplace-label';
import { useNavigate, useParams } from 'react-router-dom';
interface LocationInfoCardProps {
    location: Location;
    showActions?: boolean;
    onEdit?: () => void;
}

const EstimatedCommutingInfo: React.FC<{
    rate: CommutingRate;
    distance: number;
    timeMinutes: number;
    t: (key: string, fallback: string) => string;
}> = ({ rate, distance, timeMinutes, t }) => {
    let fixed = 0;
    let distanceCost = 0;

    if (rate.is_fixed_price && rate.fixed_price) {
        fixed = rate.fixed_price;
    }
    if (rate.is_price_per_km && rate.price_per_km && distance > 0) {
        distanceCost = distance * rate.price_per_km;
    }

    const minApplied = rate.min_price && distanceCost > 0 && distanceCost < rate.min_price;
    const effectiveDistanceCost = minApplied ? rate.min_price! : distanceCost;
    const total = fixed + effectiveDistanceCost;

    const parts: string[] = [];
    if (rate.is_fixed_price && rate.fixed_price) {
        parts.push(`${formatDecimal(fixed, { minFractionDigits: 2, maxFractionDigits: 2 })} €`);
    }
    if (rate.is_price_per_km && rate.price_per_km && distance > 0) {
        let kmPart = `${formatDecimal(distance, { minFractionDigits: 0, maxFractionDigits: 1 })} km × ${formatDecimal(rate.price_per_km, { minFractionDigits: 2, maxFractionDigits: 2 })} €/km`;
        if (minApplied) {
            kmPart += ` (min. ${formatDecimal(rate.min_price!, { minFractionDigits: 0, maxFractionDigits: 2 })} €)`;
        }
        parts.push(kmPart);
    }

    return (
        <div className="space-y-0.5">
            <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold">
                    {formatDecimal(total, { minFractionDigits: 2, maxFractionDigits: 2 })} €
                </span>
            </div>
            {parts.length > 0 && (
                <p className="text-xs text-muted-foreground">
                    {parts.join(' + ')}
                </p>
            )}
            {rate.is_travel_time_billable && (
                <p className="text-xs text-muted-foreground italic">
                    + {t('locations.travelTimeBillable', 'travel time billable')}
                    {timeMinutes > 0 && ` (${formatTimeToTravel(timeMinutes)})`}
                </p>
            )}
        </div>
    );
};

export const LocationInfoCard: React.FC<LocationInfoCardProps> = ({ location, onEdit }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();
    const formatAddress = () => {
        const addressParts = [
            location?.address_line_1,
            location?.address_line_2,
            location?.postal_code,
            location?.city,
            location?.state_province,
            location?.country
        ].filter(Boolean);

        return addressParts.length > 0 ? addressParts.join(', ') : null;
    };

    const getCountryName = (countryCode: string) => {
        const country = COUNTRIES.find(c => c.code === countryCode);
        return country?.name || countryCode;
    };

    if (!location) {
        return null;
    }

    return (
        <Card className="w-full shadow-none">
            <CardHeader>
                <CardTitle>{t('locations.info', 'Location Information')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <IconInfoItem
                    icon={"map-pin"}
                    label={t('locations.address', 'Address')}
                    value={formatAddress()}
                    copyable
                    onEmptyClick={onEdit}
                />

                <IconInfoItem
                    icon={"globe"}
                    label={t('locations.country', 'Country')}
                    value={getCountryName(location.country)}
                    flag
                    countryCode={location.country}
                    onEmptyClick={onEdit}
                />

                {location.latitude && location.longitude && (
                    <IconInfoItem
                        icon={"navigation"}
                        label={t('locations.coordinates', 'Coordinates')}
                        value={`${formatDecimal(location.latitude, { maxFractionDigits: 6 })}, ${formatDecimal(location.longitude, { maxFractionDigits: 6 })}`}
                        copyable
                        link
                        linkValue={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                    />
                )}
                <IconInfoItem
                    icon={"route"}
                    label={t('locations.distance', 'Distance')}
                    value={location.distance !== null ? `${location.distance} km` : null}
                    onEmptyClick={onEdit}
                />
                <IconInfoItem
                    icon={"clock"}
                    label={t('locations.timeToTravel', 'Time to Travel')}
                    value={location.time_to_travel !== null ? `${location.time_to_travel} min` : null}
                    onEmptyClick={onEdit}
                />
                <IconInfoItem
                    icon={"building-2"}
                    label={t('locations.originWorkplace', 'Origin Workplace')}
                    value={location.origin_workplace?.name || null}
                    onEmptyClick={onEdit}
                >
                    <WorkplaceLabel data={location.origin_workplace} link />
                </IconInfoItem>
                {location.commuting_rate && <IconInfoItem
                    icon={"banknote"}
                    label={t('locations.commutingRate', 'Commuting Rate')}
                    value={location.commuting_rate?.name || null}
                    onEmptyClick={onEdit}
                >
                    <div className="text-sm font-normal cursor-pointer hover:underline" onClick={() => navigate(`/${orgId}/commuting-rates/${location.commuting_rate?.id}`)}>
                        {location.commuting_rate?.name}
                    </div>
                </IconInfoItem>}

                {location.commuting_rate && (
                    <IconInfoItem
                        icon={"calculator"}
                        label={t('locations.estimatedCommuting', 'Est. Commuting')}
                        value=" "
                    >
                        <EstimatedCommutingInfo
                            rate={location.commuting_rate}
                            distance={location.distance}
                            timeMinutes={location.time_to_travel}
                            t={t}
                        />
                    </IconInfoItem>
                )}

                <div className="pt-4 border-t border-border">
                    <IconInfoItem
                        icon={"file-text"}
                        label={t('locations.notes', 'Notes')}
                        value={location.notes}
                        onEmptyClick={onEdit}
                    />
                </div>
            </CardContent>
        </Card>
    );
};
