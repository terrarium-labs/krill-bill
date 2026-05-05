import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useInvoice } from "../../contexts/InvoiceContext";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DateTimePicker } from "@/app/components/forms-elements/date-time-picker";
import { DueDatesInput } from "../../components/due-dates-input";

const InfoInvoiceSection = () => {
    const { t } = useTranslation();
    const { invoice, calculations, setData } = useInvoice();

    const form = useForm({
        defaultValues: {
            invoice_date: invoice.invoice_date ? new Date(invoice.invoice_date) : undefined,
            invoice_number: invoice.invoice_number || '',
            due_dates: invoice.due_dates || null,
        },
    });

    // Watch form changes and update context
    useEffect(() => {
        const subscription = form.watch((values) => {
            const updates: any = {};

            if (values.invoice_date !== undefined) {
                updates.invoice_date = values.invoice_date instanceof Date ? values.invoice_date.toISOString() : values.invoice_date;
            }
            if (values.invoice_number !== undefined) {
                updates.invoice_number = values.invoice_number;
            }
            if (values.due_dates !== undefined) {
                updates.due_dates = values.due_dates;
            }

            if (Object.keys(updates).length > 0) {
                setData(updates);
            }
        });

        return () => subscription.unsubscribe();
    }, [form, setData]);

    return (
        <div className="space-y-6 py-4 px-1">
            <Form {...form}>
                {/* Visible Fields - 3 Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Invoice Number */}
                    <FormField
                        control={form.control}
                        name="invoice_number"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    {t('invoices.invoiceNumber', 'Invoice Number')}
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        placeholder={t('invoices.invoiceNumberPlaceholder', 'Enter invoice number')}
                                        className="w-full"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Invoice Date */}
                    <DateTimePicker
                        form={form}
                        name="invoice_date"
                        label={t('invoices.invoiceDate', 'Invoice Date')}
                        placeholder={t('invoices.selectInvoiceDate', 'Select invoice date')}
                        showTime={false}
                        className="w-full"
                    />

                    {/* Payment Terms / Due Dates */}
                    <DueDatesInput
                        form={form}
                        name="due_dates"
                        label={t('invoices.paymentTerms', 'Payment Terms')}
                        value={invoice.due_dates}
                        invoiceTotal={calculations.total}
                        currency={invoice.currency || undefined}
                    />
                </div>
            </Form>
        </div>
    );
};

export default InfoInvoiceSection;
