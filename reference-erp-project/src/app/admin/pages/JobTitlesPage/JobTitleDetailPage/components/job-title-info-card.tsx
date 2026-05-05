import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';
import { useJobTitle } from '../context/JobTitleContext';
import { IconInfoItem } from '@/app/components/custom-labels';
import CurrencyLabel from '@/app/components/labels/currency-label';

interface JobTitleInfoCardProps {
    showActions?: boolean;
    onEdit?: () => void;
}

export const JobTitleInfoCard: React.FC<JobTitleInfoCardProps> = ({ onEdit }) => {
    const { t } = useTranslation();
    const { jobTitle } = useJobTitle();

    if (!jobTitle) {
        return null;
    }

    return (
        <Card className="w-full shadow-none">
            <CardHeader>
                <CardTitle>{t('jobTitles.info', 'Job Title Information')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <IconInfoItem
                    icon={"users"}
                    label={t('jobTitles.employees', 'Number of Employees')}
                    value={jobTitle.num_employees?.toString() || "0"}
                />

                <div className="pt-4 border-t border-border space-y-4">
                    <IconInfoItem
                        icon={"dollar-sign"}
                        label={t('jobTitles.pmc', 'PMC')}
                        children={<CurrencyLabel data={jobTitle.pmc} />}
                        onEmptyClick={onEdit}
                    />

                    <IconInfoItem
                        icon={"dollar-sign"}
                        label={t('jobTitles.pvp', 'PVP')}
                        children={<CurrencyLabel data={jobTitle.pvp} />}
                        onEmptyClick={onEdit}
                    />
                </div>

                <div className="pt-4 border-t border-border">
                    <IconInfoItem
                        icon={"file-text"}
                        label={t('jobTitles.description', 'Description')}
                        value={jobTitle.description}
                        onEmptyClick={onEdit}
                    />
                </div>
            </CardContent>
        </Card>
    );
};

