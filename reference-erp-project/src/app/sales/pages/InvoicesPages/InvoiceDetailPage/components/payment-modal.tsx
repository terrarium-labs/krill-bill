import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DateTimePicker } from "@/app/components/forms-elements/date-time-picker";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { postSalesInvoicePayment, patchSalesInvoicePayment } from "@/api/sales-invoices/payments/payments";
import { InvoicePayment } from "@/types/invoices/invoices";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const formInputSchema = z.object({
    payment_date: z.date(),
    amount: z.number().min(0.01, "Amount must be greater than 0"),
});

type FormValues = z.infer<typeof formInputSchema>;

interface PaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    invoiceId: string;
    payment?: InvoicePayment | null;
}

const PaymentModal = ({ open, onOpenChange, invoiceId, payment }: PaymentModalProps) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isEditing = !!payment;

    const form = useForm<FormValues>({
        resolver: zodResolver(formInputSchema),
        defaultValues: {
            payment_date: new Date(),
            amount: 0,
        },
    });

    // Reset form when modal opens or payment changes
    useEffect(() => {
        if (open) {
            if (payment) {
                form.reset({
                    payment_date: new Date(payment.payment_date),
                    amount: payment.amount,
                });
            } else {
                form.reset({
                    payment_date: new Date(),
                    amount: 0,
                });
            }
        }
    }, [open, payment, form]);

    const handleSubmit = async (data: FormValues) => {
        if (!orgId) return;

        setIsSubmitting(true);
        try {
            const payload = {
                payment_date: data.payment_date.toISOString(),
                amount: data.amount,
            };

            let response;
            if (isEditing && payment) {
                response = await patchSalesInvoicePayment(orgId, invoiceId, payment.id, payload);
            } else {
                response = await postSalesInvoicePayment(orgId, invoiceId, payload);
            }

            if (response.success) {
                toast.success(
                    isEditing
                        ? t("invoices.paymentUpdated", "Payment updated successfully")
                        : t("invoices.paymentCreated", "Payment created successfully")
                );
                onOpenChange(false);
            } else {
                toast.error(
                    isEditing
                        ? t("invoices.errorUpdatingPayment", "Error updating payment")
                        : t("invoices.errorCreatingPayment", "Error creating payment")
                );
            }
        } catch (error) {
            console.error("Error saving payment:", error);
            toast.error(
                isEditing
                    ? t("invoices.errorUpdatingPayment", "Error updating payment")
                    : t("invoices.errorCreatingPayment", "Error creating payment")
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>
                        {isEditing
                            ? t("invoices.editPayment", "Edit Payment")
                            : t("invoices.addPayment", "Add Payment")}
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-2">
                        <DateTimePicker
                            form={form}
                            name="payment_date"
                            showMonthYearPicker={true}
                            label={t("invoices.paymentDate", "Payment Date")}
                            placeholder={t("invoices.selectPaymentDate", "Select payment date")}
                        />

                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("invoices.amount", "Amount")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            {...field}
                                            value={field.value || ""}
                                            onChange={(e) => {
                                                const value = parseFloat(e.target.value);
                                                field.onChange(isNaN(value) ? 0 : value);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                {t("common.cancel", "Cancel")}
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        {isEditing
                                            ? t("common.saving", "Saving...")
                                            : t("common.creating", "Creating...")}
                                    </>
                                ) : isEditing ? (
                                    t("common.save", "Save")
                                ) : (
                                    t("invoices.addPayment", "Add Payment")
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default PaymentModal;
