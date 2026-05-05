import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { Loader2, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { patchOrgVehicle } from "@/api/orgs/vehicles/vehicles";
import { getLocations } from "@/api/orgs/locations/locations";
import { getWorkplaces } from "@/api/orgs/workplaces/workplaces";
import WorkplaceLabel from "@/app/components/labels/workplace-label";
import { Workplace } from "@/types/general/workplaces";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import CountriesInput from "@/app/components/forms-elements/countries-input";
import { MultiSelectApi } from "@/app/components/forms-elements/multi-select-api";
import { promptUnsavedChanges } from "@/app/components/forms-elements/modal-unsaved";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DynamicIcon, IconName } from "lucide-react/dynamic";
import { Vehicle } from "@/types/general/vehicles";
import IdBadge from "@/app/components/id-badge";
import { LicensePlateInput } from "@/app/components/forms-elements/license-plate-input";
import { refinePlateNumber } from "@/utils/license-plates";

const vehicleTypeSchema = z.enum(["van", "truck", "car", "motorcycle"]);
const statusSchema = z.enum(["active", "inactive", "maintenance", "out_of_service"]);

const formSchema = z.object({
    name: z.string().max(128).trim().optional().or(z.literal("")),
    plate_number: z.string().min(1, "Plate number is required").max(32).trim(),
    vehicle_type: vehicleTypeSchema.optional(),
    chassis_number: z.string().max(64).trim().optional().or(z.literal("")),
    status: statusSchema.optional(),
    location_id: z.string().optional().or(z.literal("")),
    workplace_id: z.string().optional().or(z.literal("")),
    origin_address_line_1: z.string().max(255).trim().optional().or(z.literal("")),
    origin_address_line_2: z.string().max(255).trim().optional().or(z.literal("")),
    origin_city: z.string().max(100).trim().optional().or(z.literal("")),
    origin_state_province: z.string().max(100).trim().optional().or(z.literal("")),
    origin_postal_code: z.string().max(20).trim().optional().or(z.literal("")),
    origin_country: z.string().max(2).optional().or(z.literal("")),
    plate_number_country: z.string().max(2).optional().or(z.literal("")),
}).superRefine(refinePlateNumber);

type FormValues = z.infer<typeof formSchema>;

interface VehicleEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    vehicle: Vehicle | null;
    onSuccess?: () => void;
    /** Render custom action buttons in the header (right side, next to ID badge). */
    renderActions?: React.ReactNode;
}

const VehicleEditModal: React.FC<VehicleEditModalProps> = ({
    open,
    onOpenChange,
    vehicle,
    onSuccess,
    renderActions,
}) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedLocationData, setSelectedLocationData] = useState<
        { id: string; name: string; icon_url?: string }[]
    >([]);
    const [selectedWorkplaceData, setSelectedWorkplaceData] = useState<Workplace[]>([]);
    const [originMode, setOriginMode] = useState<"workplace" | "manual">("workplace");

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            plate_number: "",
            vehicle_type: undefined,
            chassis_number: "",
            status: undefined,
            location_id: "",
            workplace_id: "",
            origin_address_line_1: "",
            origin_address_line_2: "",
            origin_city: "",
            origin_state_province: "",
            origin_postal_code: "",
            origin_country: "",
            plate_number_country: "",
        },
    });

    useEffect(() => {
        if (open && vehicle) {
            form.reset({
                name: vehicle.name ?? "",
                plate_number: vehicle.plate_number ?? "",
                vehicle_type: vehicle.vehicle_type ?? undefined,
                chassis_number: vehicle.chassis_number ?? "",
                status: vehicle.status ?? undefined,
                location_id: vehicle.location?.id ?? "",
                workplace_id: vehicle.workplace?.id ?? "",
                origin_address_line_1: vehicle.origin_address_line_1 ?? "",
                origin_address_line_2: vehicle.origin_address_line_2 ?? "",
                origin_city: vehicle.origin_city ?? "",
                origin_state_province: vehicle.origin_state_province ?? "",
                origin_postal_code: vehicle.origin_postal_code ?? "",
                origin_country: vehicle.origin_country ?? "",
                plate_number_country: vehicle.plate_number_country ?? "",
            });
            if (vehicle.location) {
                setSelectedLocationData([
                    {
                        id: vehicle.location.id,
                        name: vehicle.location.name,
                        icon_url: vehicle.location.icon_url ?? undefined,
                    },
                ]);
            } else {
                setSelectedLocationData([]);
            }
            setSelectedWorkplaceData(vehicle.workplace ? [vehicle.workplace] : []);
            const hasWorkplace = !!vehicle.workplace?.id;
            const hasManualAddress = !!(
                vehicle.origin_address_line_1?.trim() ||
                vehicle.origin_city?.trim() ||
                vehicle.origin_postal_code?.trim() ||
                vehicle.origin_country?.trim()
            );
            setOriginMode(hasWorkplace ? "workplace" : hasManualAddress ? "manual" : "workplace");
        }
    }, [open, vehicle]);

    const onSubmit = async (values: FormValues) => {
        if (!orgId || !vehicle?.id) return;
        setIsLoading(true);
        try {
            const payload: Record<string, string | null> = {
                plate_number: values.plate_number.trim(),
                plate_number_country: values.plate_number_country?.trim() || null,
                name: values.name?.trim() || null,
                vehicle_type: values.vehicle_type ?? null,
                chassis_number: values.chassis_number?.trim() || null,
                ...(values.status !== "maintenance" && { status: values.status ?? null }),
                location_id: values.location_id?.trim() || null,
                workplace_id: originMode === "workplace" ? (values.workplace_id?.trim() || null) : null,
                origin_address_line_1: originMode === "manual" ? (values.origin_address_line_1?.trim() || null) : null,
                origin_address_line_2: originMode === "manual" ? (values.origin_address_line_2?.trim() || null) : null,
                origin_city: originMode === "manual" ? (values.origin_city?.trim() || null) : null,
                origin_state_province: originMode === "manual" ? (values.origin_state_province?.trim() || null) : null,
                origin_postal_code: originMode === "manual" ? (values.origin_postal_code?.trim() || null) : null,
                origin_country: originMode === "manual" ? (values.origin_country?.trim() || null) : null,
            };

            const response = await patchOrgVehicle(orgId, vehicle.id, payload);
            if (response.success) {
                toast.success(t("vehicles.vehicleUpdated", "Vehicle updated successfully"));
                form.reset();
                onOpenChange(false);
                onSuccess?.();
            } else {
                toast.error(response.error || t("vehicles.errorUpdatingVehicle", "Error updating vehicle"));
            }
        } catch (error) {
            console.error(error);
            toast.error(t("vehicles.errorUpdatingVehicle", "Error updating vehicle"));
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
            onOpenChange(open);
        }
    };

    const handleInteractOutside = (e: Event) => {
        if (form.formState.isDirty) {
            e.preventDefault();
            handleOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange} key="vehicle-edit-modal">
            <DialogContent
                className="max-w-2xl md:min-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                showCloseButton={false}
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between gap-2 text-lg font-semibold">
                        <div className="flex items-center justify-between w-full">
                            <span className="flex-shrink-0">{t("vehicles.editVehicle", "Edit Vehicle")}</span>
                            <div className="flex items-center gap-2 ml-auto">
                                {vehicle && <IdBadge id={vehicle.id} />}
                                {renderActions}
                            </div>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto scrollbar-hide px-2 -mx-2">
                    <Form {...form}>
                        <div className="space-y-6 py-2 mb-4">
                            {/* Basic fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("vehicles.name", "Name")}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder={t("vehicles.enterName", "e.g. Van A1")}
                                                    {...field}
                                                    disabled={isLoading}
                                                    autoFocus
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <LicensePlateInput
                                    form={form}
                                    name="plate_number"
                                    countryName="plate_number_country"
                                    label={t("vehicles.plateNumber", "Plate Number")}
                                    required
                                    disabled={isLoading}
                                />
                                <FormField
                                    control={form.control}
                                    name="chassis_number"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("vehicles.chassisNumber", "Chassis Number")}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder={t("vehicles.enterChassisNumber", "Chassis number")}
                                                    {...field}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="vehicle_type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("vehicles.vehicleType", "Type")}</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                                disabled={isLoading}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder={t("vehicles.selectType", "Select type...")} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="van">{t("vehicles.type.van", "Van")}</SelectItem>
                                                    <SelectItem value="truck">{t("vehicles.type.truck", "Truck")}</SelectItem>
                                                    <SelectItem value="car">{t("vehicles.type.car", "Car")}</SelectItem>
                                                    <SelectItem value="motorcycle">{t("vehicles.type.motorcycle", "Motorcycle")}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="location_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("vehicles.location", "Location")}</FormLabel>
                                            <FormControl>
                                                <MultiSelectApi
                                                    fetchOptions={getLocations}
                                                    fetchArgs={[orgId || ""]}
                                                    optionsKey="locations"
                                                    customValueKey={(item: { id: string }) => item.id}
                                                    customLabelKey={(item: { id: string; name: string; icon_url?: string }) => (
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
                                                    placeholder={t("vehicles.selectLocation", "Select location...")}
                                                    searchPlaceholder={t("vehicles.searchLocation", "Search locations...")}
                                                    emptyText={t("vehicles.noLocations", "No locations found")}
                                                    value={field.value ? [field.value] : []}
                                                    onChangeValue={(values) => {
                                                        field.onChange(values[0] || "");
                                                        if (!values[0]) setSelectedLocationData([]);
                                                    }}
                                                    onChangeValueWithItem={(_values, itemsMap) => {
                                                        const items = Array.from(itemsMap.values()) as {
                                                            id: string;
                                                            name: string;
                                                            icon_url?: string;
                                                        }[];
                                                        setSelectedLocationData(items);
                                                    }}
                                                    defaultItems={selectedLocationData}
                                                    maxCount={1}
                                                    disabled={isLoading}
                                                    className="w-full truncate"
                                                    isApiSearchable
                                                />
                                            </FormControl>
                                                <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("common.status", "Status")}</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                                disabled={isLoading || field.value === "maintenance"}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder={t("vehicles.selectStatus", "Select status...")} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="active">{t("common.active", "Active")}</SelectItem>
                                                    <SelectItem value="inactive">{t("common.inactive", "Inactive")}</SelectItem>
                                                    {field.value === "maintenance" && (
                                                        <SelectItem value="maintenance">{t("vehicles.status.maintenance", "Maintenance")}</SelectItem>
                                                    )}
                                                    <SelectItem value="out_of_service">{t("vehicles.status.outOfService", "Out of Service")}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Origin section */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-1.5">
                                    {t("vehicles.origin", "Origin")}
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="h-4 w-4 text-muted-foreground shrink-0 cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-sm">
                                                <p>{t("vehicles.originAddressDescription", "Default departure address for this vehicle")}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </h3>

                                {/* Origin mode selector */}
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={originMode === "workplace" ? "default" : "outline"}
                                        onClick={() => {
                                            setOriginMode("workplace");
                                            form.setValue("origin_address_line_1", "");
                                            form.setValue("origin_address_line_2", "");
                                            form.setValue("origin_city", "");
                                            form.setValue("origin_state_province", "");
                                            form.setValue("origin_postal_code", "");
                                            form.setValue("origin_country", "");
                                        }}
                                        disabled={isLoading}
                                    >
                                        {t("vehicles.originWorkplace", "Workplace")}
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={originMode === "manual" ? "default" : "outline"}
                                        onClick={() => {
                                            setOriginMode("manual");
                                            form.setValue("workplace_id", "");
                                            setSelectedWorkplaceData([]);
                                        }}
                                        disabled={isLoading}
                                    >
                                        {t("vehicles.originManual", "Enter manually")}
                                    </Button>
                                </div>
                            </div>

                            {/* Workplace selector */}
                            {originMode === "workplace" && (
                                <FormField
                                    control={form.control}
                                    name="workplace_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <MultiSelectApi
                                                    fetchOptions={getWorkplaces}
                                                    fetchArgs={[orgId || ""]}
                                                    optionsKey="workplaces"
                                                    customValueKey={(item: { id: string }) => item.id}
                                                    customLabelKey={(item: Workplace) => (
                                                        <WorkplaceLabel data={item} />
                                                    )}
                                                    customSelectedLabelKey={(item: Workplace) => (
                                                        <WorkplaceLabel data={item} />
                                                    )}
                                                    placeholder={t("vehicles.selectWorkplace", "Select workplace...")}
                                                    searchPlaceholder={t("vehicles.searchWorkplace", "Search workplaces...")}
                                                    emptyText={t("vehicles.noWorkplaces", "No workplaces found")}
                                                    value={field.value ? [field.value] : []}
                                                    onChangeValue={(values) => {
                                                        field.onChange(values[0] || "");
                                                        if (!values[0]) setSelectedWorkplaceData([]);
                                                    }}
                                                    onChangeValueWithItem={(_values, itemsMap) => {
                                                        setSelectedWorkplaceData(Array.from(itemsMap.values()) as Workplace[]);
                                                    }}
                                                    defaultItems={selectedWorkplaceData}
                                                    maxCount={1}
                                                    disabled={isLoading}
                                                    className="w-full truncate"
                                                    isApiSearchable
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {/* Manual address fields */}
                            {originMode === "manual" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="origin_address_line_1"
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel>{t("vehicles.originAddressLine1", "Address Line 1")}</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder={t("vehicles.enterAddress", "Street address")}
                                                        {...field}
                                                        disabled={isLoading}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="origin_address_line_2"
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel>{t("vehicles.originAddressLine2", "Address Line 2")}</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder={t("vehicles.enterAddressLine2", "Apartment, suite, etc.")}
                                                        {...field}
                                                        disabled={isLoading}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="origin_city"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t("vehicles.originCity", "City")}</FormLabel>
                                                <FormControl>
                                                    <Input placeholder={t("vehicles.enterCity", "City")} {...field} disabled={isLoading} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="origin_postal_code"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t("vehicles.originPostalCode", "Postal Code")}</FormLabel>
                                                <FormControl>
                                                    <Input placeholder={t("vehicles.enterPostalCode", "Postal code")} {...field} disabled={isLoading} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="origin_state_province"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t("vehicles.originStateProvince", "State/Province")}</FormLabel>
                                                <FormControl>
                                                    <Input placeholder={t("vehicles.enterStateProvince", "State or province")} {...field} disabled={isLoading} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <CountriesInput
                                        form={form}
                                        name="origin_country"
                                        label={t("vehicles.originCountry", "Country")}
                                    />
                                </div>
                            )}
                        </div>
                    </Form>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={isLoading}
                    >
                        {t("common.cancel", "Cancel")}
                    </Button>
                    <Button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            form.handleSubmit(onSubmit)(e);
                        }}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {t("common.saving", "Saving...")}
                            </>
                        ) : (
                            t("common.save", "Save")
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default VehicleEditModal;
