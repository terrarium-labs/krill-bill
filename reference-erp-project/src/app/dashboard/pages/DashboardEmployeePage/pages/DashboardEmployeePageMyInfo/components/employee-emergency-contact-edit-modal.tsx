import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { useTranslation } from '@/hooks/useTranslation';
import { postEmployeeEmergencyContact, patchEmployeeEmergencyContact } from '@/api/employees/emergency-contacts/emergency-contacts';
import { EmployeeEmergencyContact } from '@/types/employees/employees';

import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/app/components/forms-elements/phone-input';

interface EmployeeEmergencyContactEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEmergencyContactSaved: () => void;
    emergencyContact?: EmployeeEmergencyContact | null;
}

interface EmployeeEmergencyContactFormData {
    name: string;
    phone: string;
    email: string;
    relationship: string;
}

const EmployeeEmergencyContactEditModal: React.FC<EmployeeEmergencyContactEditModalProps> = ({
    open,
    onOpenChange,
    onEmergencyContactSaved,
    emergencyContact,
}) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<EmployeeEmergencyContactFormData>({
        defaultValues: {
            name: '',
            phone: '',
            relationship: '',
        },
    });

    // Reset form when modal opens/closes or emergency contact changes
    useEffect(() => {
        if (open && emergencyContact) {
            form.reset({
                name: emergencyContact.name || '',
                phone: emergencyContact.phone || '',
                relationship: emergencyContact.relationship || '',
            });
        } else if (!open) {
            form.reset({
                name: '',
                phone: '',
                relationship: '',
            });
        }
    }, [open, emergencyContact]);

    const onSubmit = async (data: EmployeeEmergencyContactFormData) => {
        if (!orgId) return;

        if (!data.name || !data.phone || !data.relationship?.trim()) {
            toast.error(
                t(
                    'employees.namePhoneRelationshipRequired',
                    'Name, phone, and relationship are required'
                )
            );
            return;
        }

        setIsSubmitting(true);
        try {
            const trimmedEmail = data.email?.trim();
            const trimmedRelationship = data.relationship.trim();
            const payload = emergencyContact
                ? {
                      name: data.name,
                      phone: data.phone,
                      relationship: trimmedRelationship,
                      email: trimmedEmail || null,
                  }
                : {
                      name: data.name,
                      phone: data.phone,
                      relationship: trimmedRelationship,
                      ...(trimmedEmail ? { email: trimmedEmail } : {}),
                  };

            let response;
            if (emergencyContact) {
                response = await patchEmployeeEmergencyContact(orgId, "me", emergencyContact.id, payload);
            } else {
                response = await postEmployeeEmergencyContact(orgId, "me", payload);
            }

            if (response.success) {
                toast.success(
                    emergencyContact
                        ? t('employees.emergencyContactUpdated', 'Emergency contact updated successfully')
                        : t('employees.emergencyContactAdded', 'Emergency contact added successfully')
                );
                onEmergencyContactSaved();
                form.reset();
            } else {
                toast.error(
                    response.error?.message ||
                    t('employees.errorSavingEmergencyContact', 'Failed to save emergency contact')
                );
            }
        } catch (error) {
            console.error('Error saving emergency contact:', error);
            toast.error(t('employees.errorSavingEmergencyContact', 'Failed to save emergency contact'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>
                        {emergencyContact
                            ? t('employees.editEmergencyContact', 'Edit Emergency Contact')
                            : t('employees.addEmergencyContact', 'Add Emergency Contact')}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <div className="space-y-4 overflow-y-auto max-h-[70vh] scrollbar-hide mt-2 px-1">
                        {/* Name Input */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t('employees.name', 'Name')} *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder={t('employees.namePlaceholder', 'Enter contact name')}
                                            disabled={isSubmitting}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Phone Input */}
                        <PhoneInput
                            form={form}
                            name="phone"
                            label={t('employees.phone', 'Phone')}
                            required={true}
                            placeholder="123456789"
                            disabled={isSubmitting}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('common.email', 'Email')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            type="email"
                                            autoComplete="off"
                                            placeholder={t('employees.emergencyContactEmailPlaceholder', 'name@example.com')}
                                            disabled={isSubmitting}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Relationship Input */}
                        <FormField
                            control={form.control}
                            name="relationship"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t('employees.relationship', 'Relationship')} *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder={t('employees.relationshipPlaceholder', 'e.g. Spouse, Parent, Sibling')}
                                            disabled={isSubmitting}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                {t('common.cancel', 'Cancel')}
                            </Button>
                            <Button type="submit" disabled={isSubmitting} onClick={form.handleSubmit(onSubmit)}>
                                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {t('common.save', 'Save')}
                            </Button>
                        </DialogFooter>
                    </div>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default EmployeeEmergencyContactEditModal;

