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
import { Button } from '@/components/ui/button';
import { MultiSelectApi } from '@/app/components/forms-elements/multi-select-api';
import { Loader2 } from 'lucide-react';
import { getOrgEmployees } from '@/api/employees/employees';
import { postOrgTicketSupervisor } from '@/api/field-service/tickets/supervisors/supervisors';
import { EmployeeAvatar } from '@/app/components/avatars/employee-avatar';
import { promptUnsavedChanges } from '@/app/components/forms-elements/modal-unsaved';

const formSchema = z.object({
    employee_id: z.string().min(1, 'Employee is required'),
});

type FormInputs = z.infer<typeof formSchema>;

interface TicketSupervisorEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: string;
    ticketId: string;
    onSuccess?: () => void;
}

const TicketSupervisorEditModal: React.FC<TicketSupervisorEditModalProps> = ({
    open,
    onOpenChange,
    orgId,
    ticketId,
    onSuccess,
}) => {
    const { t } = useTranslation();
    const [submitting, setSubmitting] = useState(false);
    const [selectedEmployeeData, setSelectedEmployeeData] = useState<any[]>([]);

    const form = useForm<FormInputs>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            employee_id: '',
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                employee_id: '',
            });
            setSelectedEmployeeData([]);
        }
    }, [open, form]);

    const onSubmit = async (data: FormInputs) => {
        if (!orgId || !ticketId) return;

        setSubmitting(true);
        try {
            const payload = {
                supervisor_id: data.employee_id,
            };
            const response = await postOrgTicketSupervisor(orgId, ticketId, payload);

            if (response.success) {
                toast.success(t('tickets.supervisorAddedSuccessfully', 'Supervisor added successfully'));
                form.reset();
                setSelectedEmployeeData([]);
                onOpenChange(false);
                onSuccess?.();
            } else {
                toast.error(
                    response.error || t('tickets.errorAddingSupervisor', 'Error adding supervisor')
                );
            }
        } catch (error) {
            console.error('Error adding ticket supervisor:', error);
            toast.error(t('tickets.errorAddingSupervisor', 'Error adding supervisor'));
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

    return (
        <Dialog
            open={open}
            onOpenChange={handleOpenChange}
            key="ticket-supervisor-modal"
        >
            <DialogContent
                className="max-w-md"
                showCloseButton={false}
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
            >
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold mb-4">
                        {t('tickets.addSupervisor', 'Add Supervisor')}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(onSubmit)(e); }} className="space-y-4">
                        <div className="space-y-4 overflow-y-auto max-h-[60vh] px-2 scrollbar-hide">
                            <FormField
                                control={form.control}
                                name="employee_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('tickets.employee', 'Employee')} *</FormLabel>
                                        <FormControl>
                                            <MultiSelectApi
                                                enableParams="hidden"
                                                defaultParams="employees"
                                                fetchOptions={getOrgEmployees}
                                                fetchArgs={[orgId, undefined, undefined, undefined, undefined, undefined, undefined]}
                                                optionsKey="employees"
                                                customValueKey={(item) => item.id}
                                                customLabelKey={(item) => <EmployeeAvatar employee={item} showName={true} showJobTitle={true} />}
                                                placeholder={t('tickets.selectEmployee', 'Select an employee...')}
                                                value={field.value ? [field.value] : []}
                                                onChangeValue={(values) => field.onChange(values[0] || '')}
                                                onChangeValueWithItem={(_values, itemsMap) => {
                                                    setSelectedEmployeeData(Array.from(itemsMap.values()));
                                                }}
                                                defaultItems={selectedEmployeeData}
                                                className="w-full truncate"
                                                maxCount={1}
                                                disabled={submitting}
                                                isApiSearchable={true}
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

export default TicketSupervisorEditModal;
