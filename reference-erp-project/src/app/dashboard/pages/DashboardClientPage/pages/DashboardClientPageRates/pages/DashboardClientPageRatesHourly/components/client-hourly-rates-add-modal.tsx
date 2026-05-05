import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { MultiSelectApi } from "@/app/components/forms-elements/multi-select-api";
import { DateTimePicker } from "@/app/components/forms-elements/date-time-picker";
import { getOrgHourlyRates } from "@/api/orgs/hourly-rates/hourly-rates";
import { postClientHourlyRate } from "@/api/clients/hourly-rates/hourly-rate";

interface ClientHourlyRatesAddModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onHourlyRatesAdded?: () => void;
    orgId: string;
    clientId: string;
}

const formSchema = z.object({
    hourly_rates: z.array(z.string()).min(1, "At least one hourly rate must be selected"),
    valid_from: z.date({
        error: "Valid from date is required",
    }),
    valid_to: z.date().optional(),
}).refine((data) => {
    if (data.valid_to) {
        return data.valid_to > data.valid_from;
    }
    return true;
}, {
    message: "Valid to date must be after valid from date",
    path: ["valid_to"],
});

type FormValues = z.infer<typeof formSchema>;

const ClientHourlyRatesAddModal: React.FC<ClientHourlyRatesAddModalProps> = ({
    open,
    onOpenChange,
    onHourlyRatesAdded,
    orgId,
    clientId,
}) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            hourly_rates: [],
            valid_from: new Date(),
            valid_to: undefined,
        },
    });

    const handleSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            // Add client to each hourly rate
            const promises = values.hourly_rates.map((hourlyRateId) =>
                postClientHourlyRate(orgId, clientId, {
                    hourly_rate_id: hourlyRateId,
                    valid_from: values.valid_from.toISOString(),
                    valid_to: values.valid_to ? values.valid_to.toISOString() : undefined,
                })
            );

            const results = await Promise.all(promises);

            // Check if all requests were successful
            const allSuccessful = results.every(result => result.success);

            if (allSuccessful) {
                toast.success(
                    t(
                        "clients.hourlyRates.hourlyRatesAdded",
                        "{{count}} hourly rate(s) added to client successfully",
                        { count: values.hourly_rates.length }
                    )
                );
                form.reset();
                onOpenChange(false);
                onHourlyRatesAdded?.();
            } else {
                const failedCount = results.filter(result => !result.success).length;
                toast.error(
                    t(
                        "clients.hourlyRates.errorAddingHourlyRates",
                        "Error adding {{count}} hourly rate(s) to client",
                        { count: failedCount }
                    )
                );
            }
        } catch (error) {
            console.error("Error adding hourly rates to client:", error);
            toast.error(
                t(
                    "clients.hourlyRates.errorAddingHourlyRates",
                    "Error adding hourly rates to client"
                )
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        form.reset();
        onOpenChange(false);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(open) => {
                if (!open) {
                    handleCancel();
                }
                onOpenChange(open);
            }}
        >
            <DialogContent className="max-w-2xl" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>
                        {t("clients.hourlyRates.addHourlyRatesToClient", "Add Hourly Rates to Client")}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <div className="space-y-6 mt-2">
                        <div className="grid gap-4">
                            {/* Hourly Rates MultiSelect */}
                            <FormField
                                control={form.control}
                                name="hourly_rates"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t("clients.hourlyRates.selectHourlyRates", "Hourly Rates")} *
                                        </FormLabel>
                                        <FormControl>
                                            <MultiSelectApi
                                                fetchOptions={getOrgHourlyRates}
                                                fetchArgs={[orgId]}
                                                optionsKey="hourly_rates"
                                                className="w-full truncate"
                                                customValueKey={(item) => item.id}
                                                customLabelKey={(item) =>
                                                    <div className="flex items-center gap-2">
                                                        <span>{item.name || "-"}</span>
                                                    </div>
                                                }
                                                placeholder={t(
                                                    "clients.hourlyRates.selectHourlyRatesPlaceholder",
                                                    "Select hourly rates..."
                                                )}
                                                searchPlaceholder={t(
                                                    "clients.hourlyRates.searchHourlyRatesPlaceholder",
                                                    "Search hourly rates..."
                                                )}
                                                emptyText={t(
                                                    "clients.hourlyRates.noHourlyRatesFound",
                                                    "No hourly rates found"
                                                )}
                                                onChangeValue={(values) => field.onChange(values)}
                                                value={field.value}
                                                isApiSearchable={true}
                                                searchable={true}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Valid From DateTimePicker */}
                            <DateTimePicker
                                form={form}
                                name="valid_from"
                                showMonthYearPicker={true}
                                label={t("clients.hourlyRates.validFrom", "Valid From")}
                                required
                                placeholder={t(
                                    "clients.hourlyRates.validFromPlaceholder",
                                    "Select start date and time"
                                )}
                                disabled={isLoading}
                                showTime={true}
                            />

                            {/* Valid To DateTimePicker */}
                            <DateTimePicker
                                form={form}
                                name="valid_to"
                                showMonthYearPicker={true}
                                label={t("clients.hourlyRates.validTo", "Valid To")}
                                placeholder={t(
                                    "clients.hourlyRates.validToPlaceholder",
                                    "Select end date and time"
                                )}
                                disabled={isLoading}
                                showTime={true}
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                                disabled={isLoading}
                            >
                                {t("common.cancel", "Cancel")}
                            </Button>
                            <Button onClick={form.handleSubmit(handleSubmit)} disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {t("common.adding", "Adding...")}
                                    </>
                                ) : (
                                    t("clients.hourlyRates.addHourlyRates", "Add Hourly Rates")
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default ClientHourlyRatesAddModal;

