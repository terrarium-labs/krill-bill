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
import { DateTimePicker } from '@/app/components/forms-elements/date-time-picker';
import { Loader2 } from 'lucide-react';
import { getOrgEmployees } from '@/api/employees/employees';
import { postWorkOrderTimeTracking, patchWorkOrderTimeTracking } from '@/api/field-service/work-orders/time-trackings/time-trackings';
import { EmployeeAvatar } from '@/app/components/avatars/employee-avatar';
import IdBadge from '@/app/components/id-badge';
import { promptUnsavedChanges } from '@/app/components/forms-elements/modal-unsaved';
import CustomActionsDropdown from '@/app/components/custom-actions-dropdown';
import { TimeTracking } from '@/types/field-service/work-orders/time-trackings';

const formSchema = z.object({
    employee_id: z.string().min(1, 'Employee is required'),
    start_time: z.date({
        error: 'Start time is required',
    }),
    end_time: z.date({
        error: 'End time is required',
    }),
}).refine((data) => data.end_time > data.start_time, {
    message: 'End time must be after start time',
    path: ['end_time'],
});

type FormInputs = z.infer<typeof formSchema>;

interface WorkOrderTimeTrackingEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: string;
    workOrderId: string;
    timeTracking?: TimeTracking | null;
    onSuccess?: () => void;
    onDelete?: (timeTrackingId: string) => void;
}

const WorkOrderTimeTrackingEditModal: React.FC<WorkOrderTimeTrackingEditModalProps> = ({
    open,
    onOpenChange,
    orgId,
    workOrderId,
    timeTracking,
    onSuccess,
    onDelete,
}) => {
    const { t } = useTranslation();
    const [submitting, setSubmitting] = useState(false);
    const [selectedEmployeeData, setSelectedEmployeeData] = useState<any[]>([]);

    const isEditMode = !!timeTracking;

    const form = useForm<FormInputs>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            employee_id: '',
            start_time: new Date(),
            end_time: new Date(),
        },
    });

    // Reset form when modal opens with timeTracking data
    useEffect(() => {
        if (open && timeTracking) {
            const employeeData = timeTracking.user ? [timeTracking.user] : [];
            setSelectedEmployeeData(employeeData);
            form.reset({
                employee_id: timeTracking.user.id,
                start_time: timeTracking.start_time ? new Date(timeTracking.start_time) : new Date(),
                end_time: timeTracking.end_time ? new Date(timeTracking.end_time) : new Date(),
            });
        } else if (open && !timeTracking) {
            // Reset for create mode
            const now = new Date();
            form.reset({
                employee_id: '',
                start_time: now,
                end_time: now,
            });
            setSelectedEmployeeData([]);
        }
    }, [open, timeTracking, form]);

    const onSubmit = async (data: FormInputs) => {
        if (!orgId || !workOrderId) return;

        setSubmitting(true);
        try {
            let response;
            if (isEditMode && timeTracking) {
                // For patch, send start_time and end_time (ISO strings)
                const payload = {
                    start_time: data.start_time.toISOString(),
                    end_time: data.end_time.toISOString(),
                };
                response = await patchWorkOrderTimeTracking(orgId, workOrderId, timeTracking.id, payload);
            } else {
                // For post, send employee_id, start_time and end_time (ISO strings)
                const payload = {
                    employee_id: data.employee_id,
                    start_time: data.start_time.toISOString(),
                    end_time: data.end_time.toISOString(),
                };
                response = await postWorkOrderTimeTracking(orgId, workOrderId, payload);
            }

            if (response.success) {
                toast.success(
                    isEditMode
                        ? t('workOrders.timeTrackingUpdatedSuccessfully', 'Time tracking updated successfully')
                        : t('workOrders.timeTrackingAddedSuccessfully', 'Time tracking added successfully')
                );
                form.reset();
                setSelectedEmployeeData([]);
                onOpenChange(false);
                onSuccess?.();
            } else {
                toast.error(
                    response.error ||
                    (isEditMode
                        ? t('workOrders.errorUpdatingTimeTracking', 'Error updating time tracking')
                        : t('workOrders.errorAddingTimeTracking', 'Error adding time tracking'))
                );
            }
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'adding'} time tracking:`, error);
            toast.error(
                isEditMode
                    ? t('workOrders.errorUpdatingTimeTracking', 'Error updating time tracking')
                    : t('workOrders.errorAddingTimeTracking', 'Error adding time tracking')
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
        if (timeTracking && onDelete) {
            onDelete(timeTracking.id);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={handleOpenChange}
            key="work-order-time-tracking-modal"
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
                                ? t('workOrders.editTimeTracking', 'Edit Time Tracking')
                                : t('workOrders.addTimeTracking', 'Add Time Tracking')}
                        </span>
                        <div className="flex items-center gap-2">
                            {isEditMode && timeTracking && <IdBadge id={timeTracking.id} />}
                            {isEditMode && timeTracking && onDelete && (
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
                            {/* Employee Selection (only in create mode) */}
                            {!isEditMode && (
                                <FormField
                                    control={form.control}
                                    name="employee_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('workOrders.employee', 'Employee')} *</FormLabel>
                                            <FormControl>
                                                <MultiSelectApi
                                                    fetchOptions={getOrgEmployees}
                                                    fetchArgs={[orgId, undefined, undefined, undefined, undefined, undefined, undefined]}
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
                                                    disabled={submitting}
                                                    isApiSearchable={true}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {/* Employee Display (only in edit mode, read-only) */}
                            {isEditMode && timeTracking?.user && (
                                <FormItem>
                                    <FormLabel>{t('workOrders.employee', 'Employee')}</FormLabel>
                                    <FormControl>
                                        <div className="px-3 py-2 border rounded-md bg-muted">
                                            <EmployeeAvatar employee={timeTracking.user} showName={true} showJobTitle={true} />
                                        </div>
                                    </FormControl>
                                </FormItem>
                            )}

                            {/* Start Time */}
                            <DateTimePicker
                                form={form}
                                name="start_time"
                                showMonthYearPicker={true}
                                label={t('workorders.startTime', 'Start Time')}
                                showTime={true}
                                disabled={submitting}
                            />

                            {/* End Time */}
                            <DateTimePicker
                                form={form}
                                name="end_time"
                                showMonthYearPicker={true}
                                label={t('workorders.endTime', 'End Time')}
                                showTime={true}
                                disabled={submitting}
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

export default WorkOrderTimeTrackingEditModal;