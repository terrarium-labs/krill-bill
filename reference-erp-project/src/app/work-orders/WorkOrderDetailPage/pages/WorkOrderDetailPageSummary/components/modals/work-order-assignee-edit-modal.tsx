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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MultiSelectApi } from '@/app/components/forms-elements/multi-select-api';
import { Loader2 } from 'lucide-react';
import { getOrgEmployees } from '@/api/employees/employees';
import { postWorkOrderAssignee, patchWorkOrderAssignee } from '@/api/field-service/work-orders/assignees/assignees';
import { EmployeeAvatar } from '@/app/components/avatars/employee-avatar';
import IdBadge from '@/app/components/id-badge';
import { promptUnsavedChanges } from '@/app/components/forms-elements/modal-unsaved';
import { Assignee } from '@/types/field-service/work-orders/assignees';

const formSchema = z.object({
    employee_id: z.string().min(1, 'Employee is required'),
    notes: z.string().optional(),
});

type FormInputs = z.infer<typeof formSchema>;

interface WorkOrderAssigneeEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: string;
    workOrderId: string;
    assignee?: Assignee | null;
    onSuccess?: () => void;
    /** When provided, shown in the header top-right (edit mode only). Substitutes the need for onDelete: use this to show Edit/Unassign etc., e.g. CustomActionsDropdown with item.showOption to hide Edit when already in edit. */
    renderActions?: React.ReactNode;
}

const WorkOrderAssigneeEditModal: React.FC<WorkOrderAssigneeEditModalProps> = ({
    open,
    onOpenChange,
    orgId,
    workOrderId,
    assignee,
    onSuccess,
    renderActions,
}) => {
    const { t } = useTranslation();
    const [submitting, setSubmitting] = useState(false);
    const [selectedEmployeeData, setSelectedEmployeeData] = useState<any[]>([]);

    const isEditMode = !!assignee;

    const form = useForm<FormInputs>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            employee_id: '',
            notes: '',
        },
    });

    // Reset form when modal opens with assignee data
    useEffect(() => {
        if (open && assignee) {
            const employeeData = assignee.employee ? [assignee.employee] : [];
            setSelectedEmployeeData(employeeData);
            form.reset({
                employee_id: assignee.employee.id,
                notes: assignee.notes || '',
            });
        } else if (open && !assignee) {
            // Reset for create mode
            form.reset({
                employee_id: '',
                notes: '',
            });
            setSelectedEmployeeData([]);
        }
    }, [open, assignee, form]);

    const onSubmit = async (data: FormInputs) => {
        if (!orgId || !workOrderId) return;

        setSubmitting(true);
        try {
            let response;
            if (isEditMode && assignee) {
                // For patch, only send notes
                const payload = {
                    notes: data.notes || null,
                };
                response = await patchWorkOrderAssignee(orgId, workOrderId, assignee.employee.id, payload);
            } else {
                // For post, send employee_id and notes
                const payload = {
                    employee_id: data.employee_id,
                    notes: data.notes || null,
                };
                response = await postWorkOrderAssignee(orgId, workOrderId, payload);
            }

            if (response.success) {
                toast.success(
                    isEditMode
                        ? t('workOrders.assigneeUpdatedSuccessfully', 'Assignee updated successfully')
                        : t('workOrders.assigneeAddedSuccessfully', 'Assignee added successfully')
                );
                form.reset();
                setSelectedEmployeeData([]);
                onOpenChange(false);
                onSuccess?.();
            } else {
                toast.error(
                    response.error ||
                    (isEditMode
                        ? t('workOrders.errorUpdatingAssignee', 'Error updating assignee')
                        : t('workOrders.errorAddingAssignee', 'Error adding assignee'))
                );
            }
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'adding'} work order assignee:`, error);
            toast.error(
                isEditMode
                    ? t('workOrders.errorUpdatingAssignee', 'Error updating assignee')
                    : t('workOrders.errorAddingAssignee', 'Error adding assignee')
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

    return (
        <Dialog
            open={open}
            onOpenChange={handleOpenChange}
            key="work-order-assignee-modal"
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
                                ? t('workOrders.editAssignee', 'Edit Assignee')
                                : t('workOrders.addAssignee', 'Add Assignee')}
                        </span>
                        <div className="flex items-center gap-2">
                            {isEditMode && assignee && <IdBadge id={assignee.employee.id} />}
                            {isEditMode && assignee && renderActions}
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(onSubmit)(e); }} className="space-y-4">
                        <div className="space-y-4 overflow-y-auto max-h-[60vh] px-2 scrollbar-hide">
                            {/* Employee Selection */}
                            <FormField
                                control={form.control}
                                name="employee_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('workOrders.employee', 'Employee')} *</FormLabel>
                                        <FormControl>
                                            <MultiSelectApi
                                                fetchOptions={getOrgEmployees}
                                                fetchArgs={[orgId, undefined, undefined, undefined, undefined, workOrderId || undefined, undefined]}
                                                optionsKey="employees"
                                                enableParams="hidden"
                                                defaultParams="employees"
                                                customValueKey={(item) => item.id}
                                                customLabelKey={(item) => <EmployeeAvatar employee={item} showName={true} showJobTitle={true} />}
                                                placeholder={t('workOrders.selectEmployee', 'Select an employee...')}
                                                value={field.value ? [field.value] : []}
                                                onChangeValue={(values) => field.onChange(values[0] || '')}
                                                onChangeValueWithItem={(_values, itemsMap) => {
                                                    setSelectedEmployeeData(Array.from(itemsMap.values()));
                                                }}
                                                defaultItems={selectedEmployeeData}
                                                className="w-full truncate"
                                                maxCount={1}
                                                disabled={submitting || isEditMode}
                                                isApiSearchable={true}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Notes/Description Field */}
                            {isEditMode &&
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
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            }
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

export default WorkOrderAssigneeEditModal;
