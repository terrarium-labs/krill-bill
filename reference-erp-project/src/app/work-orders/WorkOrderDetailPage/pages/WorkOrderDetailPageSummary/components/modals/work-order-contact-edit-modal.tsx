import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MultiSelectApi } from '@/app/components/forms-elements/multi-select-api';
import { PhoneInput } from '@/app/components/forms-elements/phone-input';
import { Loader2 } from 'lucide-react';
import { getClientContacts } from '@/api/clients/contacts/contacts';
import { postWorkOrderContact, patchWorkOrderContact } from '@/api/field-service/work-orders/contacts/contacts';
import { WorkOrderContact } from '@/types/field-service/work-orders/contacts';
import { ClientContact } from '@/types/clients/client';
import IdBadge from '@/app/components/id-badge';
import { promptUnsavedChanges } from '@/app/components/forms-elements/modal-unsaved';
import CustomActionsDropdown from '@/app/components/custom-actions-dropdown';

const formSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().optional(),
    notes: z.string().optional(),
});

type FormInputs = z.infer<typeof formSchema>;

interface WorkOrderContactEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: string;
    workOrderId: string;
    clientId?: string;
    contact?: WorkOrderContact | null;
    onSuccess?: () => void;
    onDelete?: (contactId: string) => void;
}

const WorkOrderContactEditModal: React.FC<WorkOrderContactEditModalProps> = ({
    open,
    onOpenChange,
    orgId,
    workOrderId,
    clientId,
    contact,
    onSuccess,
    onDelete,
}) => {
    const { t } = useTranslation();
    const [submitting, setSubmitting] = useState(false);
    const [selectedClientContactData, setSelectedClientContactData] = useState<ClientContact[]>([]);

    const isEditMode = !!contact;

    const form = useForm<FormInputs>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            notes: '',
        },
    });

    // Reset form when modal opens with contact data
    useEffect(() => {
        if (open && contact) {
            form.reset({
                first_name: contact.first_name || '',
                last_name: contact.last_name || '',
                email: contact.email || '',
                phone: contact.phone || '',
                notes: contact.notes || '',
            });
            setSelectedClientContactData([]);
        } else if (open && !contact) {
            // Reset for create mode
            form.reset({
                first_name: '',
                last_name: '',
                email: '',
                phone: '',
                notes: '',
            });
            setSelectedClientContactData([]);
        }
    }, [open, contact, form]);

    const onSubmit = async (data: FormInputs) => {
        if (!orgId || !workOrderId) return;

        setSubmitting(true);
        try {
            const payload = {
                first_name: data.first_name,
                last_name: data.last_name,
                email: data.email || '',
                phone: data.phone || '',
                notes: data.notes || '',
            };

            let response;
            if (isEditMode && contact) {
                response = await patchWorkOrderContact(orgId, workOrderId, contact.id, payload);
            } else {
                response = await postWorkOrderContact(orgId, workOrderId, payload);
            }

            if (response.success) {
                toast.success(
                    isEditMode
                        ? t('workOrders.contactUpdatedSuccessfully', 'Contact updated successfully')
                        : t('workOrders.contactAddedSuccessfully', 'Contact added successfully')
                );
                form.reset();
                setSelectedClientContactData([]);
                onOpenChange(false);
                onSuccess?.();
            } else {
                toast.error(
                    response.error ||
                    (isEditMode
                        ? t('workOrders.errorUpdatingContact', 'Error updating contact')
                        : t('workOrders.errorAddingContact', 'Error adding contact'))
                );
            }
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'adding'} work order contact:`, error);
            toast.error(
                isEditMode
                    ? t('workOrders.errorUpdatingContact', 'Error updating contact')
                    : t('workOrders.errorAddingContact', 'Error adding contact')
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenChange = async (open: boolean) => {
        if (!open) {
            if (form.formState.isDirty) {
                const discard = await promptUnsavedChanges();
                if (discard) {
                    form.reset();
                    onOpenChange(false);
                }
            } else {
                form.reset();
                onOpenChange(false);
            }
        } else {
            onOpenChange(open);
        }
    };

    const handleInteractOutside = (e: Event) => {
        if (form.formState.isDirty) {
            e.preventDefault();
            handleOpenChange(false);
        }
    };

    const handleDelete = () => {
        if (contact && onDelete) {
            onDelete(contact.id);
        }
    };

    // Handle client contact selection from MultiSelectApi
    const handleClientContactSelect = (_values: string[], _itemsMap: Map<string, ClientContact>, lastItem?: ClientContact) => {
        if (lastItem) {
            // Split name into first_name and last_name
            const nameParts = (lastItem.name || '').trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            form.setValue('first_name', firstName);
            form.setValue('last_name', lastName);
            form.setValue('email', lastItem.email || '');
            form.setValue('phone', lastItem.phone || '');
            form.setValue('notes', lastItem.notes || '');
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={handleOpenChange}
            key="work-order-contact-modal"
        >
            <DialogContent
                className="max-w-md"
                showCloseButton={false}
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between gap-2 text-lg font-semibold mb-4">
                        <span>
                            {isEditMode
                                ? t('workOrders.editContact', 'Edit Contact')
                                : t('workOrders.addContact', 'Add Contact')}
                        </span>
                        <div className="flex items-center gap-2">
                            {isEditMode && contact && <IdBadge id={contact.id} />}
                            {isEditMode && contact && onDelete && (
                                <CustomActionsDropdown
                                    items={[
                                        {
                                            label: t('common.delete', 'Delete'),
                                            icon: 'trash-2',
                                            onClick: handleDelete,
                                            variant: 'destructive',
                                        },
                                    ]}
                                />
                            )}
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(onSubmit)(e); }} className="space-y-4">
                        <div className="space-y-4 overflow-y-auto max-h-[60vh] px-2 scrollbar-hide">
                            {/* Client Contact Selection (only in create mode, only if clientId is available) */}
                            {!isEditMode && clientId && (
                                <FormItem>
                                    <FormLabel>{t('workOrders.selectFromClient', 'Select from Client Contacts (optional)')}</FormLabel>
                                    <FormControl>
                                        <MultiSelectApi
                                            fetchOptions={getClientContacts}
                                            fetchArgs={[orgId, clientId, undefined, undefined]}
                                            optionsKey="contacts"
                                            customValueKey={(item) => item.id}
                                            customLabelKey={(item) => (
                                                <div className="flex flex-col">
                                                    <span>{item.name}</span>
                                                    {item.email && (
                                                        <span className="text-xs text-muted-foreground">{item.email}</span>
                                                    )}
                                                </div>
                                            )}
                                            placeholder={t('workOrders.selectClientContact', 'Select a client contact to auto-fill...')}
                                            value={[]}
                                            onChangeValue={() => {}}
                                            onChangeValueWithItem={(values, itemsMap, lastItem) => {
                                                const selectedItems = Array.from(itemsMap.values());
                                                setSelectedClientContactData(selectedItems);
                                                handleClientContactSelect(values, itemsMap, lastItem);
                                            }}
                                            defaultItems={selectedClientContactData}
                                            className="w-full truncate"
                                            maxCount={1}
                                            disabled={submitting}
                                            isApiSearchable={true}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}

                            {/* First Name */}
                            <FormField
                                control={form.control}
                                name="first_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('workOrders.firstName', 'First Name')} *</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t('workOrders.enterFirstName', 'Enter first name...')}
                                                {...field}
                                                disabled={submitting}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Last Name */}
                            <FormField
                                control={form.control}
                                name="last_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('workOrders.lastName', 'Last Name')} *</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t('workOrders.enterLastName', 'Enter last name...')}
                                                {...field}
                                                disabled={submitting}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Email */}
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('workOrders.email', 'Email')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder={t('workOrders.enterEmail', 'Enter email...')}
                                                {...field}
                                                disabled={submitting}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Phone */}
                            <PhoneInput
                                form={form}
                                name="phone"
                                required={false}
                                label={t('workOrders.phone', 'Phone')}
                                placeholder={t('workOrders.enterPhone', 'Enter phone...')}
                                disabled={submitting}
                            />

                            {/* Notes */}
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('workOrders.notes', 'Notes')}</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder={t('workOrders.enterNotes', 'Enter notes...')}
                                                className="min-h-[100px]"
                                                {...field}
                                                disabled={submitting}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                disabled={submitting}
                            >
                                {t('common.cancel', 'Cancel')}
                            </Button>
                            <Button 
                                type="button" 
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(onSubmit)(e); }}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('common.saving', 'Saving...')}
                                    </>
                                ) : (
                                    t('common.save', 'Save')
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default WorkOrderContactEditModal;
