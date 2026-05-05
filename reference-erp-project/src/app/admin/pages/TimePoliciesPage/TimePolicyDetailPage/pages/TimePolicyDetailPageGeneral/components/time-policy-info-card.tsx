import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { useTimePolicy } from '../../../../context/TimePolicyContext';
import { formatTimeToTravel } from '@/utils/miscelanea';
import { IconInfoItem } from '@/app/components/custom-labels';

interface TimePolicyInfoCardProps {
    onEdit?: () => void;
}

export const TimePolicyInfoCard: React.FC<TimePolicyInfoCardProps> = ({ onEdit }) => {
    const { t } = useTranslation();
    const { timePolicy } = useTimePolicy();

    if (!timePolicy) {
        return null;
    }

    return (
        <Card className="w-full shadow-none">
            <CardHeader>
                <CardTitle>{t('timePolicies.info', 'Time Policy Information')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <IconInfoItem
                    icon={"file-text"}
                    label={t('timePolicies.name', 'Name')}
                    value={timePolicy.name}
                    copyable
                    onEmptyClick={onEdit}
                />

                <IconInfoItem
                    icon={"file-text"}
                    label={t('timePolicies.description', 'Description')}
                    value={timePolicy.description}
                    onEmptyClick={onEdit}
                />

                <IconInfoItem
                    icon={"clock"}
                    label={t('timePolicies.flexibility', 'Flexibility')}
                    value={timePolicy.flexibility ? formatTimeToTravel(timePolicy.flexibility) : '-'}
                    onEmptyClick={onEdit}
                />

                <IconInfoItem
                    icon={"trending-up"}
                    label={t('timePolicies.defaultOvertimeMultiplier', 'Default Overtime Multiplier')}
                    value={timePolicy.default_overtime_multiplier ? `${timePolicy.default_overtime_multiplier}x` : '-'}
                    onEmptyClick={onEdit}
                />

                <div className="pt-4 border-t border-border space-y-4">
                    <p className="text-xs text-muted-foreground font-semibold mb-3">
                        {t('timePolicies.statistics', 'Statistics')}
                    </p>

                    <IconInfoItem
                        icon={"clock"}
                        label={t('timePolicies.numberOfTimeSlots', 'Number of Time Slots')}
                        value={timePolicy.number_of_slots}
                    />

                    <IconInfoItem
                        icon={"trending-up"}
                        label={t('timePolicies.numberOfOvertimeRules', 'Number of Overtime Rules')}
                        value={timePolicy.number_of_overtime_rules}
                    />
                </div>

            </CardContent>
        </Card>
    );
};

