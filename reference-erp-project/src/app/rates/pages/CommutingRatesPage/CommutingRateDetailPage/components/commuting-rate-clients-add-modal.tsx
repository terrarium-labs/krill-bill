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
    FormDescription,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { MultiSelectApi } from "@/app/components/forms-elements/multi-select-api";
import { getClients } from "@/api/clients/clients";
import { getClientLocations } from "@/api/clients/locations/locations";
import { postOrgCommutingRateClient } from "@/api/orgs/commuting-rates/clients/clients";
import { ClientAvatar } from "@/app/components/avatars/client-avatar";
import { DynamicIcon, IconName } from "lucide-react/dynamic";

interface CommutingRateClientsAddModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onClientsAdded?: () => void;
    orgId: string;
    commutingRateId: string;
}

const formSchema = z.object({
    clients: z.array(z.string()).min(1, "At least one client must be selected"),
    all_locations: z.boolean(),
    location_ids: z.array(z.string()),
}).refine(
    (data) => data.clients.length !== 1 || data.all_locations || data.location_ids.length > 0,
    {
        message: "Select at least one location or enable all locations",
        path: ["location_ids"],
    }
);

type FormValues = z.infer<typeof formSchema>;

const CommutingRateClientsAddModal: React.FC<CommutingRateClientsAddModalProps> = ({
    open,
    onOpenChange,
    onClientsAdded,
    orgId,
    commutingRateId,
}) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            clients: [],
            all_locations: true,
            location_ids: [],
        },
    });

    const watchedClients = form.watch("clients");
    const watchedAllLocations = form.watch("all_locations");
    const isSingleClient = watchedClients.length === 1;

    const handleSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            const clientIds = values.clients.map((id) => String(id));

            const payload: {
                client_ids: string[];
                location_ids?: string[];
            } = {
                client_ids: clientIds,
            };

            if (values.clients.length === 1 && !values.all_locations) {
                payload.location_ids = values.location_ids.map((id) => String(id));
            }

            const response = await postOrgCommutingRateClient(
                orgId,
                commutingRateId,
                payload
            );

            if (response.success !== undefined) {
                toast.success(
                    t("commutingRates.clients.clientAdded", "Client(s) added successfully")
                );
                form.reset();
                onOpenChange(false);
                onClientsAdded?.();
            } else {
                toast.error(
                    t("commutingRates.clients.errorAddingClient", "Error adding client(s)")
                );
            }
        } catch (error) {
            console.error("Error adding client to commuting rate:", error);
            toast.error(
                t("commutingRates.clients.errorAddingClient", "Error adding client(s)")
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
                        {t("commutingRates.clients.addClientToRate", "Add Clients to Commuting Rate")}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <div className="space-y-6 mt-2">
                        <div className="grid gap-4">
                            <FormField
                                control={form.control}
                                name="clients"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t("commutingRates.clients.selectClients", "Clients")} *
                                        </FormLabel>
                                        <FormControl>
                                            <MultiSelectApi
                                                fetchOptions={getClients}
                                                fetchArgs={[orgId]}
                                                optionsKey="clients"
                                                className="w-full truncate"
                                                customValueKey={(item) => item.id}
                                                customLabelKey={(item) => (
                                                    <ClientAvatar
                                                        client={item}
                                                        showNameExtra={true}
                                                        className="font-medium"
                                                    />
                                                )}
                                                placeholder={t(
                                                    "commutingRates.clients.selectClientsPlaceholder",
                                                    "Select clients..."
                                                )}
                                                searchPlaceholder={t(
                                                    "commutingRates.clients.searchClientsPlaceholder",
                                                    "Search clients..."
                                                )}
                                                emptyText={t(
                                                    "commutingRates.clients.noClientsFound",
                                                    "No clients found"
                                                )}
                                                onChangeValue={(values) => {
                                                    field.onChange(values);
                                                    if (values.length !== 1) {
                                                        form.setValue("all_locations", true);
                                                        form.setValue("location_ids", []);
                                                    }
                                                }}
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

                            {isSingleClient && (
                                <>
                                    <FormField
                                        control={form.control}
                                        name="all_locations"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">
                                                        {t("commutingRates.clients.allLocations", "All Locations")}
                                                    </FormLabel>
                                                    <FormDescription>
                                                        {t(
                                                            "commutingRates.clients.allLocationsDescription",
                                                            "Apply this commuting rate to all locations of the selected client."
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
                                                        {t("commutingRates.clients.selectLocations", "Locations")} *
                                                    </FormLabel>
                                                    <FormControl>
                                                        <MultiSelectApi
                                                            key={`locations-${watchedClients[0]}`}
                                                            fetchOptions={getClientLocations}
                                                            fetchArgs={[orgId, watchedClients[0]]}
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
                                                                "commutingRates.clients.selectLocationsPlaceholder",
                                                                "Select locations..."
                                                            )}
                                                            searchPlaceholder={t(
                                                                "commutingRates.clients.searchLocationsPlaceholder",
                                                                "Search locations..."
                                                            )}
                                                            emptyText={t(
                                                                "commutingRates.clients.noLocationsFound",
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
                                </>
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
                                    t("commutingRates.clients.addClients", "Add Clients")
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default CommutingRateClientsAddModal;
