import React from 'react';
import { Mail, Phone, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { deleteSupplierContact, postSupplierContactDefault } from '@/api/suppliers/contacts/contacts';
import { ClientContact as SupplierContact } from '@/types/clients/client';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import IdBadge from '@/app/components/id-badge';
import Tag from '@/app/components/tag/tag';
import CustomActionsDropdown from '@/app/components/custom-actions-dropdown';

interface ContactInfoModalProps {
    contact: SupplierContact | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEditContact: (contact: SupplierContact) => void;
    onContactDeleted: () => void;
    onContactDefaultChanged: () => void;
    supplierId: string;
}

const ContactInfoModal: React.FC<ContactInfoModalProps> = ({
    contact,
    open,
    onOpenChange,
    onEditContact,
    onContactDeleted,
    onContactDefaultChanged,
    supplierId,
}) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string; supplierId: string }>();

    if (!contact) return null;

    const handleDeleteContact = async () => {
        if (!orgId || !supplierId || !contact.id) return;

        try {
            const response = await deleteSupplierContact(orgId, supplierId, contact.id);

            if (response.success) {
                toast.success(t('suppliers.contactDeletedSuccess', 'Contact deleted successfully'));
                onOpenChange(false);
                onContactDeleted();
            } else {
                toast.error(response.error || t('suppliers.errorDeletingContact', 'Failed to delete contact'));
            }
        } catch (error) {
            console.error('Error deleting contact:', error);
            toast.error(t('suppliers.errorDeletingContact', 'Failed to delete contact'));
        }
    };

    const handleSetDefault = async () => {
        if (!orgId || !supplierId || !contact.id) return;

        try {
            const response = await postSupplierContactDefault(orgId, supplierId, contact.id, true);

            if (response.success) {
                toast.success(t('suppliers.defaultContactSet', 'Default contact updated'));
                onContactDefaultChanged();
            } else {
                toast.error(response.error || t('suppliers.errorSettingDefault', 'Failed to set default contact'));
            }
        } catch (error) {
            console.error('Error setting default contact:', error);
            toast.error(t('suppliers.errorSettingDefault', 'Failed to set default contact'));
        }
    };

    const getDetailedSchedule = (contact: SupplierContact) => {
        if (!contact.schedule) return [];

        return Object.entries(contact.schedule)
            .filter(([_, schedule]) => schedule.is_available)
            .map(([day, schedule]) => ({
                day: day.charAt(0).toUpperCase() + day.slice(1),
                startTime: schedule.start_time,
                endTime: schedule.end_time,
            }));
    };

    const detailedSchedule = getDetailedSchedule(contact);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md" showCloseButton={false}>
                <DialogHeader>
                    <div className="flex items-start gap-2">
                        <DialogTitle className="flex flex-col items-start gap-1">
                            <div className="flex items-center gap-2">
                                {contact.name}
                                {contact.is_default && (
                                    <Tag text={t('suppliers.default', 'Default')} color='yellow' />
                                )}
                            </div>
                            <span className="text-xs font-normal text-muted-foreground">{contact.role}</span>
                        </DialogTitle>
                        <div className="flex items-center gap-2 ml-auto">
                            <IdBadge id={contact.id} />
                        </div>
                        <CustomActionsDropdown
                            size="sm"
                            items={[
                                {
                                    label: t('common.edit', 'Edit'),
                                    icon: "edit",
                                    onClick: () => {
                                        onEditContact(contact);
                                        onOpenChange(false);
                                    },
                                },
                                {
                                    label: t('suppliers.setAsDefault', 'Set as Default'),
                                    icon: "star",
                                    onClick: handleSetDefault,
                                    showOption: !contact.is_default,
                                },
                                {
                                    label: t('common.delete', 'Delete'),
                                    icon: "trash-2",
                                    onClick: handleDeleteContact,
                                    variant: "destructive",
                                },
                            ]}
                        />
                    </div>
                </DialogHeader>

                <div className="space-y-4">

                    {/* Contact Information */}
                    <div className="space-y-3">


                        {contact.email && (
                            <div className="flex items-center gap-3 hover:underline cursor-pointer text-blue-500" onClick={() => {
                                window.open(`mailto:${contact.email}`, '_blank');
                            }}>
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{contact.email}</span>
                            </div>
                        )}

                        {contact.phone && (
                            <div className="flex items-center gap-3 hover:underline cursor-pointer text-blue-500" onClick={() => {
                                window.open(`tel:${contact.phone}`, '_blank');
                            }}>
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{contact.phone}</span>
                            </div>
                        )}

                        {!contact.email && !contact.phone && (
                            <p className="text-sm text-muted-foreground">
                                {t('suppliers.noContactInfo', 'No contact information available')}
                            </p>
                        )}
                    </div>

                    {/* Schedule */}
                    {detailedSchedule.length > 0 && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <h4 className="font-medium text-sm flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    {t('suppliers.schedule', 'Schedule')}
                                </h4>
                                <div className="space-y-2">
                                    {detailedSchedule.map((schedule) => (
                                        <div key={schedule.day} className="flex justify-between text-sm">
                                            <span className="font-medium">{schedule.day}</span>
                                            <span className="text-muted-foreground">
                                                {schedule.startTime} - {schedule.endTime}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Notes */}
                    {contact.notes && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <h4 className="font-medium text-sm">{t('suppliers.notes', 'Notes')}</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {contact.notes}
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent >
        </Dialog >
    );
};

export default ContactInfoModal;

