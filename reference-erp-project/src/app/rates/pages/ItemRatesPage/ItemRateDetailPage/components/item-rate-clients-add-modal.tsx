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
import { getClients } from "@/api/clients/clients";
import { postOrgRateClient } from "@/api/orgs/rates/clients/clients";
import { ClientAvatar } from "@/app/components/avatars/client-avatar";

interface ItemRateClientsAddModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onClientsAdded?: () => void;
    orgId: string;
    rateId: string;
}

const formSchema = z.object({
    clients: z.array(z.string()).min(1, "At least one client must be selected"),
});

type FormValues = z.infer<typeof formSchema>;

const ItemRateClientsAddModal: React.FC<ItemRateClientsAddModalProps> = ({
    open,
    onOpenChange,
    onClientsAdded,
    orgId,
    rateId,
}) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            clients: [],
        },
    });

    const handleSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            const response = await postOrgRateClient(orgId, rateId, {
                client_ids: values.clients,
            });

            if (response.success !== undefined) {
                toast.success(
                    t(
                        "rates.clients.clientsAdded",
                        "{{count}} client(s) added to rate successfully",
                        { count: values.clients.length }
                    )
                );
                form.reset();
                onOpenChange(false);
                onClientsAdded?.();
            } else {
                toast.error(
                    t("rates.clients.errorAddingClients", "Error adding clients to rate")
                );
            }
        } catch (error) {
            console.error("Error adding clients to rate:", error);
            toast.error(
                t(
                    "rates.clients.errorAddingClients",
                    "Error adding clients to rate"
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
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {t("rates.clients.addClientsToRate", "Add Clients to Rate")}
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
                                            {t("rates.clients.selectClients", "Clients")} *
                                        </FormLabel>
                                        <FormControl>
                                            <MultiSelectApi
                                                fetchOptions={getClients}
                                                fetchArgs={[orgId]}
                                                optionsKey="clients"
                                                className="w-full truncate"
                                                customValueKey={(item) => item.id}
                                                customLabelKey={(item) => <ClientAvatar client={item} showNameExtra={true} className="font-medium" />}
                                                placeholder={t(
                                                    "rates.clients.selectClientsPlaceholder",
                                                    "Select clients..."
                                                )}
                                                searchPlaceholder={t(
                                                    "rates.clients.searchClientsPlaceholder",
                                                    "Search clients..."
                                                )}
                                                emptyText={t(
                                                    "rates.clients.noClientsFound",
                                                    "No clients found"
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
                                    t("rates.clients.addClients", "Add Clients")
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default ItemRateClientsAddModal;
