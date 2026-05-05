import React from 'react';
import { Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { ClientStakeholder } from '@/types/clients/client';
import { deleteClientStakeholder } from '@/api/clients/stakeholders/stakeholders';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import IdBadge from '@/app/components/id-badge';
import CustomActionsDropdown from '@/app/components/custom-actions-dropdown';
import { EmployeeAvatar } from '@/app/components/avatars/employee-avatar';

interface StakeholderInfoModalProps {
    stakeholder: ClientStakeholder | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onStakeholderDeleted: () => void;
    clientId: string;
}

const StakeholderInfoModal: React.FC<StakeholderInfoModalProps> = ({
    stakeholder,
    open,
    onOpenChange,
    onStakeholderDeleted,
    clientId,
}) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();

    if (!stakeholder) return null;

    const handleDelete = async () => {
        if (!orgId || !clientId || !stakeholder.id) return;

        try {
            const response = await deleteClientStakeholder(orgId, clientId, stakeholder.id);

            if (response.success) {
                toast.success(t('clients.stakeholderDeleted', 'Stakeholder removed successfully'));
                onOpenChange(false);
                onStakeholderDeleted();
            } else {
                toast.error(
                    response.error?.message ||
                    t('clients.errorDeletingStakeholder', 'Failed to remove stakeholder')
                );
            }
        } catch (error) {
            console.error('Error deleting stakeholder:', error);
            toast.error(t('clients.errorDeletingStakeholder', 'Failed to remove stakeholder'));
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md" showCloseButton={false}>
                <DialogHeader>
                    <div className="flex items-start gap-2">
                        <DialogTitle className="flex  items-start gap-2">
                            <EmployeeAvatar employee={stakeholder.employee} showName={true} size="sm" variant="full" />
                        </DialogTitle>
                        <div className="flex items-center gap-2 ml-auto">
                            <IdBadge id={stakeholder.id} />
                        </div>
                        <CustomActionsDropdown
                            size="sm"
                            items={[
                                {
                                    label: t('common.delete', 'Delete'),
                                    icon: "trash-2",
                                    onClick: handleDelete,
                                    variant: "destructive",
                                },
                            ]}
                        />
                    </div>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Contact Information */}
                    <div className="space-y-3">
                        {stakeholder.employee?.email && (
                            <div className="flex items-center gap-3 hover:underline cursor-pointer text-blue-500" onClick={() => {
                                window.open(`mailto:${stakeholder.employee.email}`, '_blank');
                            }}>
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{stakeholder.employee.email}</span>
                            </div>
                        )}

                        {stakeholder.employee?.phone && (
                            <div className="flex items-center gap-3 hover:underline cursor-pointer text-blue-500" onClick={() => {
                                window.open(`tel:${stakeholder.employee.phone}`, '_blank');
                            }}>
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{stakeholder.employee.phone}</span>
                            </div>
                        )}

                        {!stakeholder.employee?.email && !stakeholder.employee?.phone && (
                            <p className="text-sm text-muted-foreground">
                                {t('clients.noContactInfo', 'No contact information available')}
                            </p>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default StakeholderInfoModal;

