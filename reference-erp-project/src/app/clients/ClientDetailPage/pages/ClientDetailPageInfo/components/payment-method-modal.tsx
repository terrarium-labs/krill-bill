import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { postPaymentsMethod, patchPaymentsMethod } from '@/api/clients/payment-methods/payment-methods';
import { ClientPaymentMethod } from '@/types/clients/client';
import { validateIBAN, formatIBAN } from '@/utils/iban-validator';
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
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { promptUnsavedChanges } from '@/app/components/forms-elements/modal-unsaved';
import { DateTimePicker } from '@/app/components/forms-elements/date-time-picker';

interface PaymentMethodModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPaymentMethodCreated?: () => void;
    paymentMethod?: ClientPaymentMethod | null; // For update mode
    mode?: 'create' | 'update';
    orgId: string;
    clientId: string;
}

// Form input schema
const formInputSchema = z.object({
    bank: z.string().min(1, 'Bank name is required'),
    iban: z.string()
        .min(1, 'IBAN is required')
        .refine((val) => validateIBAN(val), {
            message: 'Invalid IBAN format or checksum',
        }),
    swift_bic: z.string().optional(),
    mandate_reference: z.string().optional(),
    mandate_date: z.date().optional(),
    notes: z.string().optional(),
    is_default: z.boolean(),
});

type FormValues = z.infer<typeof formInputSchema>;

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
    open,
    onOpenChange,
    onPaymentMethodCreated,
    paymentMethod = null,
    mode = 'create',
    orgId,
    clientId,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [ibanValue, setIbanValue] = useState('');
    const { t } = useTranslation();

    const form = useForm<FormValues>({
        resolver: zodResolver(formInputSchema),
        defaultValues: {
            bank: '',
            iban: '',
            swift_bic: '',
            mandate_reference: '',
            mandate_date: undefined,
            notes: '',
            is_default: false,
        },
    });

    // Populate form with payment method data in update mode
    useEffect(() => {
        if (open && mode === 'update' && paymentMethod) {
            const ibanVal = paymentMethod.iban || '';
            setIbanValue(ibanVal);
            form.reset({
                bank: paymentMethod.bank || '',
                iban: ibanVal,
                swift_bic: paymentMethod.swift_bic || '',
                mandate_reference: paymentMethod.mandate_reference || '',
                mandate_date: paymentMethod.mandate_date ? new Date(paymentMethod.mandate_date) : undefined,
                notes: paymentMethod.notes || '',
                is_default: paymentMethod.is_default ?? false,
            });
        } else if (open && mode === 'create') {
            setIbanValue('');
            form.reset({
                bank: '',
                iban: '',
                swift_bic: '',
                mandate_reference: '',
                mandate_date: undefined,
                notes: '',
                is_default: false,
            });
        }
    }, [open, mode, paymentMethod, form]);

    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            const payload = {
                bank: values.bank,
                iban: values.iban || null,
                swift_bic: values.swift_bic || null,
                mandate_reference: values.mandate_reference || null,
                mandate_date: values.mandate_date ? values.mandate_date.toISOString().split('T')[0] : null,
                notes: values.notes || null,
                is_default: values.is_default,
            };

            console.log(payload);

            let response;
            if (mode === 'update' && paymentMethod?.id) {
                response = await patchPaymentsMethod(orgId, clientId, paymentMethod.id, payload);
            } else {
                response = await postPaymentsMethod(orgId, clientId, payload);
            }

            if (response.success) {
                const successMessage = mode === 'update'
                    ? t('clients.paymentMethod.updated', 'Payment method updated successfully')
                    : t('clients.paymentMethod.created', 'Payment method created successfully');
                toast.success(successMessage);

                form.reset();
                onOpenChange(false);
                if (onPaymentMethodCreated) {
                    onPaymentMethodCreated();
                }
            } else {
                const errorMessage = mode === 'update'
                    ? t('clients.paymentMethod.updateError', 'Failed to update payment method')
                    : t('clients.paymentMethod.createError', 'Failed to create payment method');
                toast.error(response.error || errorMessage);
            }
        } catch (error) {
            console.error(`Error ${mode === 'update' ? 'updating' : 'creating'} payment method:`, error);
            const errorMessage = mode === 'update'
                ? t('clients.paymentMethod.updateError', 'Failed to update payment method')
                : t('clients.paymentMethod.createError', 'Failed to create payment method');
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
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
            onOpenChange(true);
        }
    };

    const handleInteractOutside = (e: Event) => {
        if (form.formState.isDirty) {
            e.preventDefault();
            handleOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="max-w-2xl"
                showCloseButton={false}
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                        {mode === 'update'
                            ? t('clients.paymentMethod.update', 'Update Payment Method')
                            : t('clients.paymentMethod.add', 'Add Payment Method')
                        }
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <div className="space-y-6 overflow-y-auto max-h-[60vh] px-2 scrollbar-hide">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start justify-start">
                            {/* Bank Name */}
                            <FormField
                                control={form.control}
                                name="bank"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>
                                            {t('clients.paymentMethod.bankName', 'Bank Name')} *
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                placeholder={t('clients.paymentMethod.enterBankName', 'Enter bank name')}
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* IBAN */}
                            <FormField
                                control={form.control}
                                name="iban"
                                render={({ field }) => {
                                    const isValid = ibanValue && validateIBAN(ibanValue);
                                    const hasValue = ibanValue.length > 0;

                                    return (
                                        <FormItem className="col-span-2">
                                            <FormLabel>
                                                {t('clients.paymentMethod.iban', 'IBAN')} *
                                            </FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type="text"
                                                        placeholder={t('clients.paymentMethod.enterIban', 'Enter IBAN')}
                                                        {...field}
                                                        value={field.value}
                                                        onChange={(e) => {
                                                            const value = e.target.value.toUpperCase();
                                                            setIbanValue(value);
                                                            field.onChange(value);
                                                        }}
                                                        onBlur={(e) => {
                                                            // Auto-format on blur if valid
                                                            if (validateIBAN(e.target.value)) {
                                                                const formatted = formatIBAN(e.target.value);
                                                                setIbanValue(formatted);
                                                                field.onChange(formatted);
                                                            }
                                                            field.onBlur();
                                                        }}
                                                        disabled={isLoading}
                                                        className={`pr-10 ${hasValue ? (isValid ? 'border-green-500' : 'border-red-500') : ''}`}
                                                    />
                                                    {hasValue && (
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                            {isValid ? (
                                                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                            ) : (
                                                                <XCircle className="h-5 w-5 text-red-500" />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </FormControl>
                                            <FormDescription>
                                                {t('clients.paymentMethod.ibanDescription', 'International Bank Account Number')}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    );
                                }}
                            />

                            {/* SWIFT/BIC */}
                            <FormField
                                control={form.control}
                                name="swift_bic"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>
                                            {t('clients.paymentMethod.swiftBic', 'SWIFT/BIC')}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                placeholder={t('clients.paymentMethod.enterSwiftBic', 'Enter SWIFT/BIC')}
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Mandate Reference */}
                            <FormField
                                control={form.control}
                                name="mandate_reference"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('clients.paymentMethod.mandateReference', 'Mandate Reference')}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                placeholder={t('clients.paymentMethod.enterMandateReference', 'Enter mandate reference')}
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            {t('clients.paymentMethod.mandateReferenceDescription', 'SEPA mandate reference')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Mandate Date */}
                            <DateTimePicker
                                form={form}
                                name="mandate_date"
                                showMonthYearPicker={true}
                                label={t('clients.paymentMethod.mandateDate', 'Mandate Date')}
                                description={t('clients.paymentMethod.mandateDateDescription', 'Date of the mandate')}
                                placeholder={t('clients.paymentMethod.selectMandateDate', 'Select mandate date')}
                                disabled={isLoading}
                                showTime={false}
                            />

                            <div className="flex items-center justify-between gap-2 col-span-2">
                                <h3 className="text-sm font-bold my-4 text-muted-foreground border-b border-border pb-2 flex-1">
                                    {t('clients.paymentMethod.other', 'Other')}
                                </h3>
                            </div>

                            {/* Is Default */}
                            <FormField
                                control={form.control}
                                name="is_default"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 col-span-2">
                                        <div className="space-y-0.5">
                                            <FormLabel>
                                                {t('clients.paymentMethod.isDefault', 'Default Payment Method')}
                                            </FormLabel>
                                            <FormDescription>
                                                {t('clients.paymentMethod.isDefaultDescription', 'Set as the default payment method for this client')}
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            {/* Notes */}
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>
                                            {t('clients.paymentMethod.notes', 'Notes')}
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder={t('clients.paymentMethod.enterNotes', 'Additional notes about this payment method')}
                                                {...field}
                                                disabled={isLoading}
                                                rows={3}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={isLoading}
                        >
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button type="submit" onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {mode === 'update'
                                        ? t('clients.paymentMethod.updating', 'Updating...')
                                        : t('clients.paymentMethod.creating', 'Creating...')
                                    }
                                </>
                            ) : (
                                mode === 'update'
                                    ? t('clients.paymentMethod.update', 'Update')
                                    : t('clients.paymentMethod.create', 'Create')
                            )}
                        </Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default PaymentMethodModal;

