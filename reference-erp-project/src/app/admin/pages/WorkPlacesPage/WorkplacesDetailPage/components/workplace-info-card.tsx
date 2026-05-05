import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';
import { useWorkPlace } from '../../context/WorkPlaceContext';
import { COUNTRIES } from '@/utils/countries';
import { IconInfoItem } from '@/app/components/custom-labels';

interface WorkplaceInfoCardProps {
    showActions?: boolean;
    onEdit?: () => void;
}

export const WorkplaceInfoCard: React.FC<WorkplaceInfoCardProps> = ({ onEdit }) => {
    const { t } = useTranslation();
    const { workplace } = useWorkPlace();

    const formatAddress = () => {
        const addressParts = [
            workplace?.address_line_1,
            workplace?.address_line_2,
            workplace?.postal_code,
            workplace?.city,
            workplace?.state_province,
            workplace?.country
        ].filter(Boolean);

        return addressParts.length > 0 ? addressParts.join(', ') : null;
    };

    const getCountryName = (countryCode: string) => {
        const country = COUNTRIES.find(c => c.code === countryCode);
        return country?.name || countryCode;
    };

    if (!workplace) {
        return null;
    }

    return (
        <Card className="w-full shadow-none">
            <CardHeader>
                <CardTitle>{t('workplaces.info', 'Workplace Information')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <IconInfoItem
                    icon={"phone"}
                    label={t('workplaces.phone', 'Phone')}
                    value={workplace.phone}
                    copyable
                    link
                    linkValue={`tel:${workplace.phone}`}
                    onEmptyClick={onEdit}
                />

                <IconInfoItem
                    icon={"map-pin"}
                    label={t('workplaces.address', 'Address')}
                    value={formatAddress()}
                    onEmptyClick={onEdit}
                />

                <IconInfoItem
                    icon={"globe"}
                    label={t('workplaces.country', 'Country')}
                    value={getCountryName(workplace.country || '')}
                    flag
                    countryCode={workplace.country || undefined}
                    onEmptyClick={onEdit}
                />

                <IconInfoItem
                    icon={"clock"}
                    label={t('workplaces.timezone', 'Timezone')}
                    value={workplace.timezone}
                    onEmptyClick={onEdit}
                />

                <IconInfoItem
                    icon={"users"}
                    label={t('workplaces.employees', 'Number of Employees')}
                    value={workplace.num_employees?.toString() || "0"}
                />

                <div className="pt-4 border-t border-border">
                    <IconInfoItem
                        icon={"file-text"}
                        label={t('workplaces.description', 'Description')}
                        value={workplace.description}
                        onEmptyClick={onEdit}
                    />
                </div>
            </CardContent>
        </Card>
    );
};
