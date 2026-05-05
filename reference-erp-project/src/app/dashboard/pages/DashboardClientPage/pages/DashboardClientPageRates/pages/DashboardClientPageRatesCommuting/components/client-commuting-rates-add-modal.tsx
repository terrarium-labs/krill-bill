import { useState, useEffect } from "react";
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
    FormDescription,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { MultiSelectApi } from "@/app/components/forms-elements/multi-select-api";
import { getOrgCommutingRates } from "@/api/orgs/commuting-rates/commuting-rates";
import { getClientLocations } from "@/api/clients/locations/locations";
import { postClientCommutingRate } from "@/api/clients/commuting-rates/commuting-rates";
import { DynamicIcon, IconName } from "lucide-react/dynamic";

interface ClientCommutingRatesAddModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCommutingRatesAdded?: () => void;
    orgId: string;
    clientId: string;
    preselectedCommutingRate?: { id: string; name: string } | null;
}

const formSchema = z.object({
    commuting_rate_id: z.string().min(1, "A commuting rate must be selected"),
    all_locations: z.boolean(),
    location_ids: z.array(z.string()),
}).refine(
    (data) => data.all_locations || data.location_ids.length > 0,
    {
        message: "Select at least one location or enable all locations",
        path: ["location_ids"],
    }
);

type FormValues = z.infer<typeof formSchema>;

const ClientCommutingRatesAddModal: React.FC<ClientCommutingRatesAddModalProps> = ({
    open,
    onOpenChange,
    onCommutingRatesAdded,
    orgId,
    clientId,
    preselectedCommutingRate,
}) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            commuting_rate_id: preselectedCommutingRate?.id ?? "",
            all_locations: true,
            location_ids: [],
        },
    });

    useEffect(() => {
        if (open && preselectedCommutingRate) {
            form.setValue("commuting_rate_id", preselectedCommutingRate.id);
        }
    }, [open, preselectedCommutingRate, form]);

    const watchedAllLocations = form.watch("all_locations");

    const handleSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            const payload: {
                location_ids?: string[] | null;
            } = {};

            if (!values.all_locations) {
                payload.location_ids = values.location_ids;
            }

            const response = await postClientCommutingRate(
                orgId,
                [clientId],
                values.commuting_rate_id,
                payload
            );

            if (response.success !== undefined) {
                toast.success(
                    t("clients.commutingRates.commutingRatesAdded", "Commuting rate added to client successfully")
                );
                form.reset();
                onOpenChange(false);
                onCommutingRatesAdded?.();
            } else {
                toast.error(
                    t("clients.commutingRates.errorAddingCommutingRates", "Error adding commuting rate to client")
                );
            }
        } catch (error) {
            console.error("Error adding commuting rate to client:", error);
            toast.error(
                t("clients.commutingRates.errorAddingCommutingRates", "Error adding commuting rate to client")
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
            onOpenChange={(next) => {
                if (!next) handleCancel();
                onOpenChange(next);
            }}
        >
            <DialogContent className="max-w-2xl" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>
                        {t("clients.commutingRates.addCommutingRatesToClient", "Add Commuting Rate to Client")}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <div className="space-y-6 mt-2">
                        <div className="grid gap-4">
                            <FormField
                                control={form.control}
                                name="commuting_rate_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t("clients.commutingRates.selectCommutingRates", "Commuting Rate")} *
                                        </FormLabel>
                                        <FormControl>
                                            {preselectedCommutingRate ? (
                                                <Input
                                                    value={preselectedCommutingRate.name}
                                                    disabled
                                                    className="w-full"
                                                />
                                            ) : (
                                                <MultiSelectApi
                                                    fetchOptions={getOrgCommutingRates}
                                                    fetchArgs={[orgId]}
                                                    optionsKey="commuting_rates"
                                                    className="w-full truncate"
                                                    customValueKey={(item) => item.id}
                                                    customLabelKey={(item) => (
                                                        <div className="flex items-center gap-2">
                                                            <span>{item.name || "-"}</span>
                                                        </div>
                                                    )}
                                                    placeholder={t(
                                                        "clients.commutingRates.selectCommutingRatesPlaceholder",
                                                        "Select a commuting rate..."
                                                    )}
                                                    searchPlaceholder={t(
                                                        "clients.commutingRates.searchCommutingRatesPlaceholder",
                                                        "Search commuting rates..."
                                                    )}
                                                    emptyText={t(
                                                        "clients.commutingRates.noCommutingRatesFound",
                                                        "No commuting rates found"
                                                    )}
                                                    value={field.value ? [field.value] : []}
                                                    onChangeValue={(values) => {
                                                        const selectedValue = values[0] || "";
                                                        field.onChange(selectedValue);
                                                    }}
                                                    maxCount={1}
                                                    isApiSearchable={true}
                                                    searchable={true}
                                                    disabled={isLoading}
                                                />
                                            )}
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="all_locations"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">
                                                {t("clients.commutingRates.allLocations", "All Locations")}
                                            </FormLabel>
                                            <FormDescription>
                                                {t(
                                                    "clients.commutingRates.allLocationsDescription",
                                                    "Apply this commuting rate to all locations of this client."
                                                )}
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={(checked) => {
                                                    field.onChange(checked);
                                                    if (checked) {
                                                        form.setValue("location_ids", []);
                                                    }
                                                }}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            {!watchedAllLocations && (
                                <FormField
                                    control={form.control}
                                    name="location_ids"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {t("clients.commutingRates.selectLocations", "Locations")} *
                                            </FormLabel>
                                            <FormControl>
                                                <MultiSelectApi
                                                    fetchOptions={getClientLocations}
                                                    fetchArgs={[orgId, clientId]}
                                                    optionsKey="locations"
                                                    className="w-full truncate"
                                                    customValueKey={(item) => item.id}
                                                    customLabelKey={(item) => (
                                                        <div className="flex items-center gap-2">
                                                            {item.icon_url && (
                                                                <DynamicIcon
                                                                    name={item.icon_url as IconName}
                                                                    className="h-4 w-4 text-foreground"
                                                                />
                                                            )}
                                                            <span>{item.name}</span>
                                                        </div>
                                                    )}
                                                    placeholder={t(
                                                        "clients.commutingRates.selectLocationsPlaceholder",
                                                        "Select locations..."
                                                    )}
                                                    searchPlaceholder={t(
                                                        "clients.commutingRates.searchLocationsPlaceholder",
                                                        "Search locations..."
                                                    )}
                                                    emptyText={t(
                                                        "clients.commutingRates.noLocationsFound",
                                                        "No locations found"
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
                            )}

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
                                    t("clients.commutingRates.addCommutingRates", "Add Commuting Rate")
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default ClientCommutingRatesAddModal;
