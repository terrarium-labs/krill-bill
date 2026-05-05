import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Check, ChevronLeft } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { postOrgVehicle } from "@/api/orgs/vehicles/vehicles";
import {
    getOrgVehicleEmployees,
    deleteOrgVehicleEmployee,
} from "@/api/orgs/vehicles/employees/employees";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CountriesInput from "@/app/components/forms-elements/countries-input";
import { MultiSelectApi } from "@/app/components/forms-elements/multi-select-api";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";
import type { Employee } from "@/types/employees/employees";
import { promptUnsavedChanges } from "@/app/components/forms-elements/modal-unsaved";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Info, Pencil } from "lucide-react";
import VehicleDriverAddModal from "./vehicle-driver-add-modal";
import VehicleDriverDeleteModal, { type VehicleDriver } from "./vehicle-driver-delete-modal";
import VehicleDriverEditModal from "./vehicle-driver-edit-modal";
import { DynamicIcon, IconName } from "lucide-react/dynamic";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LicensePlateInput } from "@/app/components/forms-elements/license-plate-input";
import { refinePlateNumber } from "@/utils/license-plates";
import { VehicleEmployeeRecord } from "@/types/general/vehicles";

interface VehicleCreateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onVehicleCreated?: (query?: string) => Promise<void>;
}

const vehicleTypeSchema = z.enum(["van", "truck", "car", "motorcycle"]);
const statusSchema = z.enum(["active", "inactive", "maintenance", "out_of_service"]);

const formSchema = z.object({
    name: z
        .string()
        .max(128, "Name must be less than 128 characters")
        .trim()
        .optional()
        .or(z.literal("")),
    plate_number: z
        .string()
        .min(1, "Plate number is required")
        .max(32, "Plate number must be less than 32 characters")
        .trim(),
    vehicle_type: vehicleTypeSchema.optional(),
    chassis_number: z
        .string()
        .max(64, "Chassis number must be less than 64 characters")
        .trim()
        .optional()
        .or(z.literal("")),
    status: statusSchema.optional(),
    location_id: z.string().optional().or(z.literal("")),
    workplace_id: z.string().optional().or(z.literal("")),
    origin_address_line_1: z
        .string()
        .max(255)
        .trim()
        .optional()
        .or(z.literal("")),
    origin_address_line_2: z
        .string()
        .max(255)
        .trim()
        .optional()
        .or(z.literal("")),
    origin_city: z
        .string()
        .max(100)
        .trim()
        .optional()
        .or(z.literal("")),
    origin_state_province: z
        .string()
        .max(100)
        .trim()
        .optional()
        .or(z.literal("")),
    origin_postal_code: z
        .string()
        .max(20)
        .trim()
        .optional()
        .or(z.literal("")),
    origin_country: z
        .string()
        .max(2)
        .optional()
        .or(z.literal("")),
    plate_number_country: z.string().max(2).or(z.literal("")),
}).superRefine(refinePlateNumber);

type FormValues = z.infer<typeof formSchema>;

type WizardStep = "basic" | "drivers";

const STEPS: { id: WizardStep; label: string; translationKey: string }[] = [
    { id: "basic", label: "Basic Info", translationKey: "vehicles.steps.basicInfo" },
    { id: "drivers", label: "Drivers", translationKey: "vehicles.steps.drivers" },
];

const VehicleCreateModal: React.FC<VehicleCreateModalProps> = ({
    open,
    onOpenChange,
    onVehicleCreated,
}) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [createdVehicleId, setCreatedVehicleId] = useState<string | undefined>(undefined);
    const [currentStep, setCurrentStep] = useState<WizardStep>("basic");
    const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(new Set());

    const [drivers, setDrivers] = useState<VehicleDriver[]>([]);
    const [loadingDrivers, setLoadingDrivers] = useState(false);
    const [isDriverAddModalOpen, setIsDriverAddModalOpen] = useState(false);
    const [driverToRemove, setDriverToRemove] = useState<VehicleDriver | null>(null);
    const [driverToEdit, setDriverToEdit] = useState<VehicleEmployeeRecord | null>(null);
    const [isDeletingDriver, setIsDeletingDriver] = useState(false);
    const [selectedLocationData, setSelectedLocationData] = useState<{ id: string; name: string; icon_url?: string }[]>([]);
    const [selectedWorkplaceData, setSelectedWorkplaceData] = useState<Workplace[]>([]);
    const [originMode, setOriginMode] = useState<"workplace" | "manual">("workplace");

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            plate_number: "",
            vehicle_type: "van",
            chassis_number: "",
            status: "active",
            location_id: "",
            workplace_id: "",
            origin_address_line_1: "",
            origin_address_line_2: "",
            origin_city: "",
            origin_state_province: "",
            origin_postal_code: "",
            origin_country: "ES",
            plate_number_country: "ES",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                name: "",
                plate_number: "",
                vehicle_type: "van",
                chassis_number: "",
                status: "active",
                location_id: "",
                workplace_id: "",
                origin_address_line_1: "",
                origin_address_line_2: "",
                origin_city: "",
                origin_state_province: "",
                origin_postal_code: "",
                origin_country: "ES",
                plate_number_country: "ES",
            });
            setCreatedVehicleId(undefined);
            setCurrentStep("basic");
            setCompletedSteps(new Set());
            setDrivers([]);
            setSelectedLocationData([]);
            setSelectedWorkplaceData([]);
            setOriginMode("workplace");
        }
    }, [open, form]);

    const onSubmitBasicInfo = async (values: FormValues) => {
        if (!orgId) return;

        setIsLoading(true);
        try {
            const payload: Record<string, string> = {
                plate_number: values.plate_number.trim().toUpperCase(),
                plate_number_country: values.plate_number_country?.trim() || "ES",
            };
            if (values.name?.trim()) payload.name = values.name.trim();
            if (values.vehicle_type) payload.vehicle_type = values.vehicle_type;
            if (values.chassis_number?.trim()) payload.chassis_number = values.chassis_number.trim();
            if (values.status) payload.status = values.status;
            if (values.location_id?.trim()) payload.location_id = values.location_id.trim();
            if (values.workplace_id?.trim()) payload.workplace_id = values.workplace_id.trim();
            if (originMode === "manual") {
                if (values.origin_address_line_1?.trim()) payload.origin_address_line_1 = values.origin_address_line_1.trim();
                if (values.origin_address_line_2?.trim()) payload.origin_address_line_2 = values.origin_address_line_2.trim();
                if (values.origin_city?.trim()) payload.origin_city = values.origin_city.trim();
                if (values.origin_state_province?.trim()) payload.origin_state_province = values.origin_state_province.trim();
                if (values.origin_postal_code?.trim()) payload.origin_postal_code = values.origin_postal_code.trim();
                if (values.origin_country?.trim()) payload.origin_country = values.origin_country.trim();
            }

            const response = await postOrgVehicle(orgId, payload);

            if (response.success) {
                const vehicleId =
                    (response.success as { vehicle?: { id?: string } })?.vehicle?.id ??
                    (response.success as { vehicle_id?: string })?.vehicle_id;
                if (vehicleId) {
                    setCreatedVehicleId(vehicleId);
                    setCompletedSteps((prev) => new Set(prev).add("basic"));
                    setCurrentStep("drivers");
                    toast.success(t("vehicles.vehicleCreated", "Vehicle created successfully"));
                } else {
                    toast.success(t("vehicles.vehicleCreated", "Vehicle created successfully"));
                    form.reset();
                    onOpenChange(false);
                    await onVehicleCreated?.();
                }
            } else {
                toast.error(response.error || t("vehicles.errorCreatingVehicle", "Error creating vehicle"));
            }
        } catch (error) {
            console.error(error);
            toast.error(t("vehicles.errorCreatingVehicle", "Error creating vehicle"));
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDrivers = useCallback(async () => {
        if (!orgId || !createdVehicleId) return;
        setLoadingDrivers(true);
        try {
            const response = await getOrgVehicleEmployees(orgId, createdVehicleId);
            if (response.success) {
                const list = (response.success.employees || response.success) as VehicleDriver[];
                setDrivers(Array.isArray(list) ? list : []);
            } else {
                setDrivers([]);
            }
        } catch {
            setDrivers([]);
        } finally {
            setLoadingDrivers(false);
        }
    }, [orgId, createdVehicleId]);

    useEffect(() => {
        if (currentStep === "drivers" && createdVehicleId) {
            fetchDrivers();
        }
    }, [currentStep, createdVehicleId, fetchDrivers]);

    const handleDeleteDriver = async (vehicleEmployeeId: string) => {
        if (!orgId || !createdVehicleId) return;
        setIsDeletingDriver(true);
        try {
            const response = await deleteOrgVehicleEmployee(orgId, createdVehicleId, vehicleEmployeeId);
            if (response.success) {
                toast.success(t("vehicles.driverRemoved", "Driver removed successfully"));
                fetchDrivers();
                setDriverToRemove(null);
            } else {
                toast.error(response.error || t("vehicles.errorRemovingDriver", "Error removing driver"));
            }
        } catch (error) {
            toast.error(t("vehicles.errorRemovingDriver", "Error removing driver"));
        } finally {
            setIsDeletingDriver(false);
        }
    };

    const handleClose = async () => {
        if (createdVehicleId) {
            onVehicleCreated?.();
            form.reset();
            onOpenChange(false);
            if (orgId) {
                navigate(`/${orgId}/vehicles/${createdVehicleId}`);
            }
            return;
        }
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
    };

    const handlePrevious = () => {
        const idx = STEPS.findIndex((s) => s.id === currentStep);
        if (idx > 0) {
            setCurrentStep(STEPS[idx - 1].id);
        }
    };

    const handleFinish = () => {
        onVehicleCreated?.();
        form.reset();
        onOpenChange(false);
        if (orgId && createdVehicleId) {
            navigate(`/${orgId}/vehicles/${createdVehicleId}`);
        }
    };

    const getCurrentStepIndex = () => STEPS.findIndex((s) => s.id === currentStep);
    const isFirstStep = () => getCurrentStepIndex() === 0;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                className="max-w-2xl md:min-w-2xl w-full max-h-[90vh] min-h-[90vh] overflow-hidden flex flex-col"
                showCloseButton={false}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between gap-2 text-lg font-semibold">
                        <span>{t("vehicles.addVehicle", "Add Vehicle")}</span>
                    </DialogTitle>
                </DialogHeader>

                {/* Step Indicator */}
                <div className="flex items-center justify-between gap-2 px-2 py-2">
                    {STEPS.map((step, index) => {
                        const isCompleted = completedSteps.has(step.id);
                        const isCurrent = step.id === currentStep;
                        const isAccessible = index === 0 || completedSteps.has(STEPS[index - 1].id);
                        return (
                            <div key={step.id} className="flex items-center flex-1">
                                <button
                                    type="button"
                                    onClick={() => isAccessible && setCurrentStep(step.id)}
                                    disabled={!isAccessible}
                                    className={cn(
                                        "flex items-center gap-2 text-xs font-medium transition-colors",
                                        isCurrent && "text-primary",
                                        isCompleted && !isCurrent && "text-muted-foreground",
                                        !isCompleted && !isCurrent && !isAccessible && "text-muted-foreground/50",
                                        !isCompleted && !isCurrent && isAccessible && "text-muted-foreground hover:text-foreground",
                                        isAccessible && "cursor-pointer",
                                        !isAccessible && "cursor-not-allowed"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs",
                                            isCurrent && "bg-primary text-primary-foreground",
                                            isCompleted && !isCurrent && "bg-primary/20 text-primary",
                                            !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                                        )}
                                    >
                                        {isCompleted ? <Check className="h-3 w-3" /> : index + 1}
                                    </div>
                                    <span className="hidden sm:inline">{t(step.translationKey, step.label)}</span>
                                </button>
                                {index < STEPS.length - 1 && (
                                    <div
                                        className={cn(
                                            "h-[2px] flex-1 mx-1",
                                            isCompleted ? "bg-primary/50" : "bg-muted"
                                        )}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Step Content */}
                <div className="flex-1 overflow-y-auto scrollbar-hide px-2 -mx-2">
                    {currentStep === "basic" && (
                        <Form {...form}>
                            <div className="space-y-6 py-2 mb-20">
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
                                        defaultCountry="ES"
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
                                                            <SelectValue />
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
                                                            const items = Array.from(itemsMap.values()) as { id: string; name: string; icon_url?: string }[];
                                                            setSelectedLocationData(items);
                                                        }}
                                                        defaultItems={selectedLocationData}
                                                        maxCount={1}
                                                        disabled={isLoading}
                                                        className="w-full truncate"
                                                        isApiSearchable={true}
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
                                                    disabled={isLoading}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="active">{t("common.active", "Active")}</SelectItem>
                                                        <SelectItem value="inactive">{t("common.inactive", "Inactive")}</SelectItem>
                                                        <SelectItem value="out_of_service">{t("vehicles.status.outOfService", "Out of Service")}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                </div>

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
                                                form.setValue("origin_country", "ES");
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
                                                        isApiSearchable={true}
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
                                                        <Input placeholder={t("vehicles.enterAddress", "Street address")} {...field} disabled={isLoading} />
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
                                                        <Input placeholder={t("vehicles.enterAddressLine2", "Apartment, suite, etc.")} {...field} disabled={isLoading} />
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
                                        <CountriesInput form={form} name="origin_country" label={t("vehicles.originCountry", "Country")} defaultValue="ES" />
                                    </div>
                                )}
                            </div>
                        </Form>
                    )}

                    {currentStep === "drivers" && createdVehicleId && orgId && (
                        <div className="py-2 space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        {t("vehicles.drivers", "Drivers")}
                                        <Badge variant="secondary">{drivers.length}</Badge>
                                    </h3>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsDriverAddModalOpen(true)}
                                    >
                                        <Plus className="h-4 w-4" />
                                        {t("vehicles.addDriver", "Add")}
                                    </Button>
                                </div>
                                {loadingDrivers ? (
                                    <div className="flex items-center justify-center p-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : drivers.length === 0 ? (
                                    <div className="text-sm text-muted-foreground py-6 text-center">
                                        {t("vehicles.noDrivers", "No drivers assigned yet.")}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {drivers.map((driver) => (
                                            <div
                                                key={driver.id}
                                                className="flex items-center justify-between text-sm py-2 px-2 rounded border"
                                            >
                                                <EmployeeAvatar employee={driver.employee as Employee} showJobTitle={true} />
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                        onClick={() => setDriverToEdit(driver as unknown as VehicleEmployeeRecord)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => setDriverToRemove(driver)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <VehicleDriverAddModal
                                    open={isDriverAddModalOpen}
                                    onOpenChange={setIsDriverAddModalOpen}
                                    orgId={orgId}
                                    vehicleId={createdVehicleId}
                                    onSuccess={fetchDrivers}
                                    existingDriverIds={drivers.map((d) => d.employee.id)}
                                />
                                <VehicleDriverDeleteModal
                                    open={!!driverToRemove}
                                    onOpenChange={(open) => !open && setDriverToRemove(null)}
                                    driver={driverToRemove}
                                    orgId={orgId}
                                    vehicleId={createdVehicleId}
                                    onConfirm={handleDeleteDriver}
                                    isDeleting={isDeletingDriver}
                                />
                                <VehicleDriverEditModal
                                    open={!!driverToEdit}
                                    onOpenChange={(open) => !open && setDriverToEdit(null)}
                                    orgId={orgId}
                                    vehicleId={createdVehicleId}
                                    vehicleEmployee={driverToEdit}
                                    onSuccess={fetchDrivers}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 fixed bottom-0 left-0 right-0 bg-background p-4 rounded-b-lg border-t">
                    <div className="flex gap-2">
                        {!isFirstStep() && (
                            <Button type="button" variant="outline" onClick={handlePrevious} disabled={isLoading}>
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                {t("common.previous", "Previous")}
                            </Button>
                        )}
                    </div>
                    <div className="flex-1" />
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                            {createdVehicleId ? t("common.close", "Close") : t("common.cancel", "Cancel")}
                        </Button>
                        {currentStep === "basic" && !createdVehicleId && (
                            <Button
                                type="submit"
                                onClick={form.handleSubmit(onSubmitBasicInfo)}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {t("vehicles.creating", "Creating...")}
                                    </>
                                ) : (
                                    t("common.create", "Create")
                                )}
                            </Button>
                        )}
                        {currentStep === "drivers" && (
                            <Button type="button" onClick={handleFinish}>
                                {t("common.finish", "Finish")}
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default VehicleCreateModal;
