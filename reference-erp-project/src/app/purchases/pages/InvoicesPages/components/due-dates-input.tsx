import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Calendar, Plus, Trash2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DateTimePicker } from "@/app/components/forms-elements/date-time-picker";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CurrencyLabel from "@/app/components/labels/currency-label";

interface DueDate {
    id: string;
    due_date: string;
    amount: number;
}

interface DueDatesInputProps {
    form: UseFormReturn<any>;
    name: string;
    label?: string;
    disabled?: boolean;
    value?: DueDate[] | null;
    onChange?: (value: DueDate[] | null) => void;
    invoiceTotal?: number;
    currency?: string;
}

export const DueDatesInput = ({
    form: parentForm,
    name,
    label,
    disabled = false,
    value = null,
    onChange,
    invoiceTotal = 0,
    currency,
}: DueDatesInputProps) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [dueDates, setDueDates] = useState<DueDate[]>(value || []);

    const dueDateForm = useForm({
        defaultValues: {
            due_date: undefined as Date | undefined,
            amount: 0,
        },
    });

    const handleAddDueDate = () => {
        const formValues = dueDateForm.getValues();
        if (!formValues.due_date || !formValues.amount) {
            return;
        }

        const newDueDate: DueDate = {
            id: crypto.randomUUID(),
            due_date: formValues.due_date.toISOString(),
            amount: formValues.amount,
        };

        const updatedDueDates = [...dueDates, newDueDate];
        setDueDates(updatedDueDates);

        // Update parent form
        parentForm.setValue(name, updatedDueDates);
        if (onChange) {
            onChange(updatedDueDates);
        }

        // Reset form
        dueDateForm.reset();
    };

    const handleRemoveDueDate = (id: string) => {
        const updatedDueDates = dueDates.filter(dd => dd.id !== id);
        setDueDates(updatedDueDates);

        // Update parent form
        parentForm.setValue(name, updatedDueDates.length > 0 ? updatedDueDates : null);
        if (onChange) {
            onChange(updatedDueDates.length > 0 ? updatedDueDates : null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const getTotalAmount = () => {
        return dueDates.reduce((sum, dd) => sum + dd.amount, 0);
    };

    const exceedsTotal = () => {
        return invoiceTotal > 0 && getTotalAmount() > invoiceTotal;
    };

    const getSummaryText = () => {
        if (dueDates.length === 0) {
            return t('invoices.noDueDates', 'No payment terms set');
        }
        if (dueDates.length === 1) {
            return <div> {formatDate(dueDates[0].due_date)} - <CurrencyLabel data={{ value: dueDates[0].amount, currency }} /></div>;
        }
        return <div className="flex items-center gap-2"><span>{dueDates.length} {t('invoices.paymentTerms', 'payment terms')}</span> - <CurrencyLabel data={{ value: getTotalAmount(), currency }} /></div>;
    };

    return (
        <FormField
            control={parentForm.control}
            name={name}
            render={() => (
                <FormItem>
                    <FormLabel>
                        {label || t('invoices.paymentTerms', 'Payment Terms')}
                    </FormLabel>
                    <Popover open={open} onOpenChange={setOpen} modal={true}>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    disabled={disabled}
                                    className={cn(
                                        "disabled:opacity-80 disabled:cursor-not-allowed shadow-none",
                                        "w-full justify-between shadow-none",
                                        dueDates.length === 0 && "text-muted-foreground"
                                    )}
                                    type="button"
                                >
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        <span className="truncate">{getSummaryText()}</span>
                                    </div>
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-96 p-4">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-medium text-sm mb-3">
                                        {t('invoices.managePaymentTerms', 'Manage Payment')}
                                    </h4>

                                    {/* List of existing due dates */}
                                    {dueDates.length > 0 ? (
                                        <ScrollArea className="max-h-48 overflow-y-auto mb-4">
                                            <div className="space-y-2">
                                                {dueDates.map((dueDate) => (
                                                    <div
                                                        key={dueDate.id}
                                                        className="flex items-center justify-between p-2 border rounded-md bg-muted/50"
                                                    >
                                                        <div className="flex items-center gap-2 text-sm font-medium">
                                                            {formatDate(dueDate.due_date)} - <CurrencyLabel data={{ value: dueDate.amount, currency }} />
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => handleRemoveDueDate(dueDate.id)}
                                                            type="button"
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    ) : (
                                        <div className="text-center py-8 text-sm text-muted-foreground">
                                            {t('invoices.noPaymentTerms', 'No payment terms set')}
                                        </div>
                                    )}

                                    {/* Add new due date form */}
                                    <Form {...dueDateForm}>
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-2">
                                                <DateTimePicker
                                                    form={dueDateForm}
                                                    name="due_date"
                                                    label={t('invoices.dueDate', 'Due Date')}
                                                    placeholder={t('invoices.selectDueDate', 'Select date')}
                                                    showTime={false}
                                                    showMonthYearPicker={true}
                                                    className="w-full"
                                                />

                                                <FormField
                                                    control={dueDateForm.control}
                                                    name="amount"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                {t('invoices.amount', 'Amount')}
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    placeholder="0.00"
                                                                    {...field}
                                                                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={handleAddDueDate}
                                                className="w-full"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                {t('invoices.addPaymentTerm', 'Add Payment')}
                                            </Button>
                                        </div>
                                    </Form>

                                    {dueDates.length > 0 && (
                                        <>
                                            <div className="mt-4 pt-3 border-t">
                                                <div className="flex justify-between items-center text-sm font-medium">
                                                    <span>{t('invoices.total', 'Total')}:</span>
                                                    <span className={cn(exceedsTotal() && "text-destructive")}>
                                                        <CurrencyLabel data={{ value: getTotalAmount(), currency }} />
                                                    </span>
                                                </div>
                                                {invoiceTotal > 0 && (
                                                    <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                                                        <span>{t('invoices.invoiceTotal', 'Invoice Total')}:</span>
                                                        <CurrencyLabel data={{ value: invoiceTotal, currency }} />
                                                    </div>
                                                )}
                                            </div>

                                            {exceedsTotal() && (
                                                <Alert variant="destructive" className="mt-3">
                                                    <AlertTriangle className="h-4 w-4" />
                                                    <AlertDescription>
                                                        {t('invoices.paymentTermsExceedTotal', 'Payment terms total exceeds invoice total')}
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                    {exceedsTotal() && (
                        <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            {t('invoices.paymentTermsExceedTotal', 'Payment terms total exceeds invoice total')}
                        </p>
                    )}
                    <FormMessage />
                </FormItem>
            )}
        />
    );
};
