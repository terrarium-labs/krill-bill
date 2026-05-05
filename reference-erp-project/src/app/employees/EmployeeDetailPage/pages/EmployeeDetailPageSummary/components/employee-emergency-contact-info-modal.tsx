import React, { useState } from 'react';
import { Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { EmployeeEmergencyContact } from '@/types/employees/employees';
import { deleteEmployeeEmergencyContact } from '@/api/employees/emergency-contacts/emergency-contacts';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import IdBadge from '@/app/components/id-badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getColorFromString } from '@/utils/miscelanea';
import EmployeeEmergencyContactEditModal from './employee-emergency-contact-edit-modal';
import EmployeeEmergencyContactDeleteModal from './employee-emergency-contact-delete-modal';
import CustomActionsDropdown from '@/app/components/custom-actions-dropdown';

interface EmployeeEmergencyContactInfoModalProps {
    emergencyContact: EmployeeEmergencyContact | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEmergencyContactDeleted: () => void;
    employeeId: string;
}

const EmployeeEmergencyContactInfoModal: React.FC<EmployeeEmergencyContactInfoModalProps> = ({
    emergencyContact,
    open,
    onOpenChange,
    onEmergencyContactDeleted,
    employeeId,
}) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    if (!emergencyContact) return null;

    const handleDeleteClick = () => {
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!orgId || !employeeId || !emergencyContact.id) return;

        setIsDeleting(true);
        try {
            const response = await deleteEmployeeEmergencyContact(orgId, employeeId, emergencyContact.id);

            if (response.success) {
                toast.success(t('employees.emergencyContactDeleted', 'Emergency contact removed successfully'));
                setIsDeleteModalOpen(false);
                onOpenChange(false);
                onEmergencyContactDeleted();
            } else {
                toast.error(
                    response.error?.message ||
                    t('employees.errorDeletingEmergencyContact', 'Failed to remove emergency contact')
                );
            }
        } catch (error) {
            console.error('Error deleting emergency contact:', error);
            toast.error(t('employees.errorDeletingEmergencyContact', 'Failed to remove emergency contact'));
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEdit = () => {
        setIsEditModalOpen(true);
    };

    const handleEmergencyContactUpdated = () => {
        setIsEditModalOpen(false);
        onEmergencyContactDeleted(); // Refresh the list
    };

    const contactName = emergencyContact.name || t('common.unknown', 'Unknown');

    return (
        <>
            <Dialog open={open && !isEditModalOpen} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-md" showCloseButton={false}>
                    <DialogHeader>
                        <div className="flex items-start gap-2">
                            <DialogTitle className="flex items-start gap-2">
                                <Avatar className="h-9 w-9 rounded-full">
                                    <AvatarFallback
                                        className="text-sm font-medium h-9 w-9 rounded-full text-white"
                                        style={{ backgroundColor: getColorFromString(contactName) }}
                                    >
                                        {contactName.charAt(0) || '-'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col items-start gap-1">
                                    <div className="flex items-center gap-2">
                                        {contactName}
                                    </div>
                                    {emergencyContact.relationship && (
                                        <span className="text-xs font-normal text-muted-foreground">
                                            {emergencyContact.relationship}
                                        </span>
                                    )}
                                </div>
                            </DialogTitle>
                            <div className="flex items-center gap-2 ml-auto">
                                <IdBadge id={emergencyContact.id} />
                            </div>
                            <CustomActionsDropdown
                                size="sm"
                                items={[
                                    {
                                        label: t('common.edit', 'Edit'),
                                        icon: "edit",
                                        onClick: handleEdit,
                                    },
                                    {
                                        label: t('common.delete', 'Delete'),
                                        icon: "trash-2",
                                        onClick: handleDeleteClick,
                                        variant: "destructive",
                                    },
                                ]}
                            />
                        </div>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Contact Information */}
                        <div className="space-y-3">
                            {emergencyContact.phone && (
                                <div
                                    className="flex items-center gap-3 hover:underline cursor-pointer text-blue-500"
                                    onClick={() => {
                                        window.open(`tel:${emergencyContact.phone}`, '_blank');
                                    }}
                                >
                                    <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    <span className="text-sm">{emergencyContact.phone}</span>
                                </div>
                            )}

                            {emergencyContact.email?.trim() && (
                                <div
                                    className="flex items-center gap-3 hover:underline cursor-pointer text-blue-500"
                                    onClick={() => {
                                        window.open(`mailto:${emergencyContact.email}`, '_blank');
                                    }}
                                >
                                    <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    <span className="text-sm break-all">{emergencyContact.email}</span>
                                </div>
                            )}

                            {!emergencyContact.phone && !emergencyContact.email?.trim() && (
                                <p className="text-sm text-muted-foreground">
                                    {t('employees.noContactInfo', 'No contact information available')}
                                </p>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <EmployeeEmergencyContactEditModal
                open={isEditModalOpen}
                onOpenChange={(open: boolean) => {
                    if (!open) {
                        setIsEditModalOpen(false);
                    }
                }}
                onEmergencyContactSaved={handleEmergencyContactUpdated}
                employeeId={employeeId}
                emergencyContact={emergencyContact}
            />

            {/* Delete Modal */}
            <EmployeeEmergencyContactDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                emergencyContact={emergencyContact}
                onConfirm={handleDeleteConfirm}
                isDeleting={isDeleting}
            />
        </>
    );
};

export default EmployeeEmergencyContactInfoModal;

