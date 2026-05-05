import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';
import { useLocation } from '@/app/warehouses/contexts/LocationContext';
import { COUNTRIES } from '@/utils/countries';
import { formatDecimal, formatDistance, formatTimeToTravel } from '@/utils/miscelanea';
import { IconInfoItem } from '@/app/components/custom-labels';
import { FlagComponent } from '@/app/components/flag-component';
import TextLabel from '@/app/components/labels/text-label';

interface LocationInfoCardProps {
    showActions?: boolean;
    onEdit?: () => void;
}

export const LocationInfoCard: React.FC<LocationInfoCardProps> = ({ onEdit }) => {
    const { t } = useTranslation();
    const { location } = useLocation();

    const formatAddress = () => {
        const addressParts = [
            location.address_line_1,
            location.address_line_2,
            location.postal_code,
            location.city,
            location.state_province,
            location.country
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
                <CardTitle>{t('warehouses.info', 'Warehouse Information')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <IconInfoItem
                    icon={"map-pin"}
                    label={t('warehouses.address', 'Address')}
                    value={formatAddress()}
                    copyable
                    onEmptyClick={onEdit}
                />

                <IconInfoItem
                    icon={"globe"}
                    label={t('warehouses.country', 'Country')}
                    value={getCountryName(location.country)}
                    flag
                    countryCode={location.country}
                    onEmptyClick={onEdit}
                />

                {location.latitude && location.longitude && (
                    <IconInfoItem
                        icon={"navigation"}
                        label={t('warehouses.coordinates', 'Coordinates')}
                        value={`${formatDecimal(location.latitude, { maxFractionDigits: 6 })}, ${formatDecimal(location.longitude, { maxFractionDigits: 6 })}`}
                        copyable
                        link
                        linkValue={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                    />
                )}
                <IconInfoItem
                    icon={"route"}
                    label={t('warehouses.distance', 'Distance')}
                    value={location.distance !== null ? formatDistance(location.distance) : null}
                    onEmptyClick={onEdit}
                />
                <IconInfoItem
                    icon={"clock"}
                    label={t('warehouses.timeToTravel', 'Time to Travel')}
                    value={location.time_to_travel !== null ? formatTimeToTravel(location.time_to_travel) : null}
                    onEmptyClick={onEdit}
                />

                <IconInfoItem
                    icon={"package"}
                    label={t('warehouses.stockRotationType', 'Stock Rotation Policy')}
                    value={location.stock_rotation_type ? location.stock_rotation_type.toUpperCase() : null}
                    onEmptyClick={onEdit}
                />

                <IconInfoItem
                    icon={location.vehicle?.vehicle_type === "car" ? "car"
                        : location.vehicle?.vehicle_type === "van" ? "bus"
                            : location.vehicle?.vehicle_type === "motorcycle" ? "bike"
                                : "truck"
                    }
                    label={t('warehouses.vehicle', 'Vehicle')}
                    value={location.vehicle ? location.vehicle.name + " - " + location.vehicle.plate_number : null}
                    children={location.vehicle ? <div className="flex items-center gap-2">
                        <FlagComponent
                            country={location.vehicle.plate_number_country.toLowerCase()}
                            countryName={location.vehicle.plate_number_country.toUpperCase()}
                        />
                        <TextLabel data={location.vehicle.plate_number} className="font-medium max-w-xs truncate capitalize-all" />
                        <TextLabel data={"(" + location.vehicle.name + ")"} className="font-medium max-w-xs truncate capitalize-all" />
                    </div> : null}
                    onEmptyClick={onEdit}
                />

                <div className="pt-4 border-t border-border">
                    <IconInfoItem
                        icon={"file-text"}
                        label={t('warehouses.notes', 'Notes')}
                        value={location.notes}
                        onEmptyClick={onEdit}
                    />
                </div>
            </CardContent>
        </Card>
    );
};

