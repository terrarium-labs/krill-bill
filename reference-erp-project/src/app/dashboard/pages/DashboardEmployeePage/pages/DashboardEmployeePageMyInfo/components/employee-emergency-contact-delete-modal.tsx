import { useTranslation } from '@/hooks/useTranslation';
import { EmployeeEmergencyContact } from '@/types/employees/employees';
import { DeleteModal } from '@/app/components/modals/delete-modal';

export interface EmployeeEmergencyContactDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    emergencyContact: EmployeeEmergencyContact | null;
    onConfirm: () => Promise<void>;
    isDeleting: boolean;
}

export const EmployeeEmergencyContactDeleteModal = ({
    isOpen,
    onClose,
    emergencyContact,
    onConfirm,
    isDeleting,
}: EmployeeEmergencyContactDeleteModalProps) => {
    const { t } = useTranslation();

    if (!emergencyContact) return null;

    const contactName = emergencyContact.name || t('common.unknown', 'Unknown');

    return (
        <DeleteModal
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            title={t('employees.deleteEmergencyContact', 'Delete Emergency Contact')}
            description={t(
                'employees.deleteEmergencyContactConfirmation',
                'Are you sure you want to delete this emergency contact? This action cannot be undone.'
            )}
            onConfirm={onConfirm}
            isDeleting={isDeleting}
            contentClassName="max-w-md"
        >
            <div className="space-y-2 p-3 rounded-md bg-muted/50 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">
                        {t('employees.name', 'Name')}:
                    </span>
                    <span className="font-medium">{contactName}</span>
                </div>
                {emergencyContact.relationship && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">
                            {t('employees.relationship', 'Relationship')}:
                        </span>
                        <span className="font-medium">{emergencyContact.relationship}</span>
                    </div>
                )}
                {emergencyContact.phone && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">
                            {t('employees.phone', 'Phone')}:
                        </span>
                        <span className="font-medium">{emergencyContact.phone}</span>
                    </div>
                )}
                {emergencyContact.email && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">
                            {t('employees.email', 'Email')}:
                        </span>
                        <span className="font-medium">{emergencyContact.email}</span>
                    </div>
                )}
            </div>
        </DeleteModal>
    );
};

export default EmployeeEmergencyContactDeleteModal;
