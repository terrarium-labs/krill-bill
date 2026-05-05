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
import { getOrgRates } from "@/api/orgs/rates/rates";
import { postClientRate } from "@/api/clients/rates/rates";

interface ClientRatesAddModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onRatesAdded?: () => void;
    orgId: string;
    clientId: string;
}

const formSchema = z.object({
    rates: z.array(z.string()).min(1, "At least one rate must be selected"),
});

type FormValues = z.infer<typeof formSchema>;

const ClientRatesAddModal: React.FC<ClientRatesAddModalProps> = ({
    open,
    onOpenChange,
    onRatesAdded,
    orgId,
    clientId,
}) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            rates: [],
        },
    });

    const handleSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            // Add client to each rate
            const response = await postClientRate(orgId, clientId, {
                rate_ids: values.rates,
            });

            if (response.success !== undefined) {
                toast.success(
                    t(
                        "clients.rates.ratesAdded",
                        "{{count}} rate(s) added to client successfully",
                        { count: values.rates.length }
                    )
                );
                form.reset();
                onOpenChange(false);
                onRatesAdded?.();
            } else {
                toast.error(
                    t(
                        "clients.rates.errorAddingRates",
                        "Error adding rates to client successfully"
                    )
                );
            }
        } catch (error) {
            console.error("Error adding rates to client:", error);
            toast.error(
                t(
                    "clients.rates.errorAddingRates",
                    "Error adding rates to client"
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
                        {t("clients.rates.addRatesToClient", "Add Rates to Client")}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <div className="space-y-6 mt-2">
                        <div className="grid gap-4">
                            {/* Rates MultiSelect */}
                            <FormField
                                control={form.control}
                                name="rates"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t("clients.rates.selectRates", "Rates")} *
                                        </FormLabel>
                                        <FormControl>
                                            <MultiSelectApi
                                                fetchOptions={getOrgRates}
                                                fetchArgs={[orgId]}
                                                optionsKey="rates"
                                                className="w-full truncate"
                                                customValueKey={(item) => item.id}
                                                customLabelKey={(item) =>
                                                    <div className="flex items-center gap-2">
                                                        <span>{item.name || "-"}</span>
                                                    </div>
                                                }
                                                placeholder={t(
                                                    "clients.rates.selectRatesPlaceholder",
                                                    "Select rates..."
                                                )}
                                                searchPlaceholder={t(
                                                    "clients.rates.searchRatesPlaceholder",
                                                    "Search rates..."
                                                )}
                                                emptyText={t(
                                                    "clients.rates.noRatesFound",
                                                    "No rates found"
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
                                    t("clients.rates.addRates", "Add Rates")
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default ClientRatesAddModal;

