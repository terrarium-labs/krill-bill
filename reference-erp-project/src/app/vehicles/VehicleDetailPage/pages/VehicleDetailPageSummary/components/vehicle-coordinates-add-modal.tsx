import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { postOrgVehicleCoordinates } from "@/api/orgs/vehicles/coordinates/coordinates";
import { useVehicle } from "@/app/vehicles/contexts/VehicleContext";
import SingleItemMap from "@/app/components/maps/single-item-map";
import { DateTimePicker } from "@/app/components/forms-elements/date-time-picker";
import { getTagColorFromString } from "@/app/components/tag/utils";
import { toast } from "sonner";

const vehicleTypeIconMap: Record<string, string> = {
    truck: "truck",
    van: "bus",
    car: "car",
    motorcycle: "bike",
};

const formSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    event_time: z.date(),
});

type FormValues = z.infer<typeof formSchema>;

interface VehicleCoordinatesAddModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    /** When provided, used as preselected event_time when modal opens. */
    selectedDate?: string;
}

const VehicleCoordinatesAddModal = ({
    open,
    onOpenChange,
    onSuccess,
    selectedDate,
}: VehicleCoordinatesAddModalProps) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const { vehicle } = useVehicle();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const vehicleIcon = vehicle ? vehicleTypeIconMap[vehicle.vehicle_type] ?? "truck" : "truck";
    const pinColor = vehicle ? getTagColorFromString(vehicle.vehicle_type) : "blue";

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            latitude: 0,
            longitude: 0,
            event_time: new Date(),
        },
    });

    useEffect(() => {
        if (open) {
            const eventTime = selectedDate ? new Date(selectedDate) : new Date();
            form.reset({ latitude: 0, longitude: 0, event_time: eventTime });
        }
    }, [open, selectedDate]);

    const latitude = form.watch("latitude");
    const longitude = form.watch("longitude");
    const hasCoordinates =
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        !(latitude === 0 && longitude === 0);
    const mapData = hasCoordinates
        ? { latitude, longitude, icon_url: vehicleIcon }
        : null;

    const handleMapClick = (lat: number, lng: number) => {
        form.setValue("latitude", lat, { shouldDirty: true });
        form.setValue("longitude", lng, { shouldDirty: true });
    };

    const handleSubmit = async (data: FormValues) => {
        if (!orgId || !vehicle?.id) return;
        setIsSubmitting(true);
        try {
            const response = await postOrgVehicleCoordinates(orgId, vehicle.id, {
                latitude: Number(data.latitude.toFixed(4)),
                longitude: Number(data.longitude.toFixed(4)),
                event_time: data.event_time.toISOString(),
            });
            if (response.success) {
                toast.success(t("vehicles.coordinatesAdded", "Coordinates added successfully"));
                onOpenChange(false);
                form.reset({ latitude: 0, longitude: 0, event_time: new Date() });
                onSuccess?.();
            } else {
                toast.error(t("vehicles.coordinatesAddError", "Failed to add coordinates"));
            }
        } catch {
            toast.error(t("vehicles.coordinatesAddError", "Failed to add coordinates"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false} className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {t("vehicles.addCoordinates", "Add Coordinates")}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="latitude"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("vehicles.latitude", "Latitude")} *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="any"
                                                placeholder="41.3851"
                                                {...field}
                                                onChange={(e) =>
                                                    field.onChange(parseFloat(e.target.value) || 0)
                                                }
                                                value={field.value}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="longitude"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("vehicles.longitude", "Longitude")} *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="any"
                                                placeholder="2.1734"
                                                {...field}
                                                onChange={(e) =>
                                                    field.onChange(parseFloat(e.target.value) || 0)
                                                }
                                                value={field.value}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="event_time"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("vehicles.eventTime", "Event Time")} *</FormLabel>
                                    <FormControl>
                                        <DateTimePicker
                                            value={field.value}
                                            onChange={field.onChange}
                                            showTime={true}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-2">
                            <FormLabel>{t("vehicles.selectOnMap", "Select location on map")}</FormLabel>
                            <div className="rounded-lg overflow-hidden border border-border">
                                <SingleItemMap
                                    data={mapData}
                                    onMapClick={handleMapClick}
                                    flyToOnDataChange={false}
                                    pinColor={pinColor}
                                    variant="default"
                                    height={250}
                                    style="streets"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {t("vehicles.clickMapToSelect", "Click on the map to set the coordinates")}
                            </p>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                {t("common.cancel", "Cancel")}
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                {t("common.add", "Add")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default VehicleCoordinatesAddModal;
