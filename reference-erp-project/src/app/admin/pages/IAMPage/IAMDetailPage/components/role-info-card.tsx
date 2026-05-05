import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { useRole } from '../../context/RoleContext';
import { formatDate } from '@/utils/miscelanea';
import { IconInfoItem } from '@/app/components/custom-labels';

interface RoleInfoCardProps {
    onEdit?: () => void;
}

export const RoleInfoCard: React.FC<RoleInfoCardProps> = ({ onEdit }) => {
    const { t } = useTranslation();
    const { role } = useRole();

    if (!role) {
        return null;
    }

    return (
        <Card className="w-full shadow-none">
            <CardHeader>
                <CardTitle>{t('admin.iam.roleInfo', 'Role Information')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <IconInfoItem
                    icon={"file-text"}
                    label={t('admin.iam.name', 'Name')}
                    value={role.name}
                    copyable
                    onEmptyClick={onEdit}
                />

                <IconInfoItem
                    icon={"file-text"}
                    label={t('admin.iam.description', 'Description')}
                    value={role.description}
                    onEmptyClick={onEdit}
                />

                <div className="pt-4 border-t border-border space-y-4">
                    <p className="text-xs text-muted-foreground font-semibold mb-3">
                        {t('admin.iam.statistics', 'Statistics')}
                    </p>

                    <IconInfoItem
                        icon={"shield"}
                        label={t('admin.iam.numberOfPermissions', 'Number of Permissions')}
                        value={role.num_permissions}
                    />
                </div>

                {(role.created_at || role.updated_at) && (
                    <div className="pt-4 border-t border-border text-xs text-muted-foreground">
                        <div className="flex flex-col gap-1">
                            {role.created_at && (
                                <span>
                                    {t('common.created', 'Created')}: {formatDate(role.created_at, { showTime: true })}
                                </span>
                            )}
                            {role.updated_at && (
                                <span>
                                    {t('common.updated', 'Updated')}: {formatDate(role.updated_at, { showTime: true })}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

