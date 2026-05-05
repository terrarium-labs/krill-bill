import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { useTranslation } from '@/hooks/useTranslation';
import { postClientStakeholder } from '@/api/clients/stakeholders/stakeholders';

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
import { MultiSelectApi } from '@/app/components/forms-elements/multi-select-api';
import { getOrgEmployees } from '@/api/employees/employees';
import { EmployeeAvatar } from '@/app/components/avatars/employee-avatar';

interface StakeholderModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onStakeholderSaved: () => void;
    clientId: string;
}

interface StakeholderFormData {
    employee_id: string[];
    role: string;
}

const StakeholderModal: React.FC<StakeholderModalProps> = ({
    open,
    onOpenChange,
    onStakeholderSaved,
    clientId,
}) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<StakeholderFormData>({
        defaultValues: {
            employee_id: [],
            role: '',
        },
    });

    // Reset form when modal opens/closes
    useEffect(() => {
        if (!open) {
            form.reset({
                employee_id: [],
                role: '',
            });
        }
    }, [open]);

    const onSubmit = async (data: StakeholderFormData) => {
        if (!orgId || !clientId) return;

        if (!data.employee_id || data.employee_id.length === 0) {
            toast.error(t('clients.selectEmployee', 'Please select an employee'));
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                employee_id: data.employee_id[0], // Single select, so take first item
                role: data.role || undefined,
            };

            const response = await postClientStakeholder(orgId, clientId, payload);

            if (response.success) {
                toast.success(t('clients.stakeholderAdded', 'Stakeholder added successfully'));
                onStakeholderSaved();
                form.reset();
            } else {
                toast.error(
                    response.error?.message ||
                    t('clients.errorAddingStakeholder', 'Failed to add stakeholder')
                );
            }
        } catch (error) {
            console.error('Error adding stakeholder:', error);
            toast.error(t('clients.errorAddingStakeholder', 'Failed to add stakeholder'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>{t('clients.addStakeholder', 'Add Stakeholder')}</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <div className="space-y-4 overflow-y-auto max-h-[70vh] scrollbar-hide mt-2">
                        {/* Employee Selection */}
                        <FormField
                            control={form.control}
                            name="employee_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t('clients.employee', 'Employee')} <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <MultiSelectApi
                                            fetchOptions={getOrgEmployees}
                                            fetchArgs={[orgId, undefined, undefined, undefined, undefined, undefined, undefined]}
                                            optionsKey="employees"
                                            enableParams="hidden"
                                            defaultParams="employees"
                                            customValueKey={(item) => item.id}
                                            customLabelKey={(item) =>
                                                <EmployeeAvatar employee={item} showName={true} size="sm" variant="full" />
                                            }
                                            placeholder={t('clients.selectEmployee', 'Select employee...')}
                                            searchPlaceholder={t('clients.searchEmployee', 'Search employee...')}
                                            emptyText={t('clients.noEmployees', 'No employees found')}
                                            value={field.value || []}
                                            onChangeValue={field.onChange}
                                            disabled={isSubmitting}
                                            maxCount={1}
                                            isApiSearchable={true}
                                            className="w-full truncate"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Role Input */}
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('clients.role', 'Role')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder={t('clients.rolePlaceholder', 'e.g. Account Manager')}
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

export default StakeholderModal;

