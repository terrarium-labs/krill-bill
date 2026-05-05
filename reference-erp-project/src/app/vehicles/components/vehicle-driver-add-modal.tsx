import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Info } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MultiSelectApi } from "@/app/components/forms-elements/multi-select-api";
import { DateTimePicker } from "@/app/components/forms-elements/date-time-picker";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";
import { getOrgEmployees } from "@/api/employees/employees";
import { postOrgVehicleEmployee } from "@/api/orgs/vehicles/employees/employees";
import { promptUnsavedChanges } from "@/app/components/forms-elements/modal-unsaved";

const formSchema = z.object({
    employee_id: z.string().min(1, "Employee is required"),
    valid_from: z.date({ error: "Valid from is required" }),
    valid_to: z.date().optional(),
}).refine((data) => {
    if (data.valid_from && data.valid_to) {
        return data.valid_to > data.valid_from;
    }
    return true;
}, {
    message: "Valid to must be after valid from",
    path: ["valid_to"],
});

type FormValues = z.infer<typeof formSchema>;

interface VehicleDriverAddModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: string;
    vehicleId: string;
    onSuccess?: () => void;
    existingDriverIds?: string[];
}

const VehicleDriverAddModal: React.FC<VehicleDriverAddModalProps> = ({
    open,
    onOpenChange,
    orgId,
    vehicleId,
    onSuccess,
    existingDriverIds: _existingDriverIds = [],
}) => {
    const { t } = useTranslation();
    const [submitting, setSubmitting] = useState(false);
    const [selectedEmployeeData, setSelectedEmployeeData] = useState<any[]>([]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            employee_id: "",
            valid_from: new Date(),
            valid_to: undefined,
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({ employee_id: "", valid_from: new Date(), valid_to: undefined });
            setSelectedEmployeeData([]);
        }
    }, [open]);

    const onSubmit = async (data: FormValues) => {
        if (!orgId || !vehicleId) return;
        setSubmitting(true);
        try {
            const payload = {
                employee_id: data.employee_id,
                valid_from: data.valid_from.toISOString(),
                valid_to: data.valid_to ? data.valid_to.toISOString() : null,
            };

            const response = await postOrgVehicleEmployee(orgId, vehicleId, payload);
            if (response.success) {
                toast.success(t("vehicles.driverAdded", "Driver added successfully"));
                form.reset();
                setSelectedEmployeeData([]);
                onOpenChange(false);
                onSuccess?.();
            } else {
                toast.error(response.error || t("vehicles.errorAddingDriver", "Error adding driver"));
            }
        } catch (error) {
            console.error(error);
            toast.error(t("vehicles.errorAddingDriver", "Error adding driver"));
        } finally {
            setSubmitting(false);
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

    if (!orgId || !vehicleId) return null;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange} key="vehicle-driver-add-modal">
            <DialogContent
                className="max-w-md"
                showCloseButton={false}
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
            >
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">
                        {t("vehicles.addDriver", "Add Driver")}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(onSubmit)(e); }}
                        className="space-y-4"
                    >
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="employee_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("vehicles.employee", "Employee")} *</FormLabel>
                                        <FormControl>
                                            <MultiSelectApi
                                                fetchOptions={getOrgEmployees}
                                                fetchArgs={[orgId, undefined, undefined, undefined, undefined, undefined, undefined]}
                                                optionsKey="employees"
                                                enableParams="hidden"
                                                defaultParams="employees"
                                                customValueKey={(item) => item.id}
                                                customLabelKey={(item) => (
                                                    <EmployeeAvatar employee={item} showName showJobTitle />
                                                )}
                                                placeholder={t("vehicles.selectEmployee", "Select an employee...")}
                                                value={field.value ? [field.value] : []}
                                                onChangeValue={(values) => field.onChange(values[0] || "")}
                                                onChangeValueWithItem={(_values, itemsMap) => {
                                                    setSelectedEmployeeData(Array.from(itemsMap.values()));
                                                }}
                                                defaultItems={selectedEmployeeData}
                                                className="w-full truncate"
                                                maxCount={1}
                                                disabled={submitting}
                                                isApiSearchable
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DateTimePicker
                                form={form}
                                name="valid_from"
                                label={t("vehicles.validFrom", "Valid From")}
                                required
                                placeholder={t("vehicles.selectStartDate", "Select start date")}
                                disabled={submitting}
                                showTime={false}
                            />

                            <div className="space-y-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span className="text-sm font-medium">{t("vehicles.validTo", "Valid To")}</span>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors cursor-help">
                                                    <Info className="h-3.5 w-3.5" />
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent side="right" className="max-w-xs">
                                                <p className="text-xs">
                                                    {t("vehicles.validToInfo", "If no end date is defined, the employee will be considered currently active on this vehicle.")}
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <DateTimePicker
                                    form={form}
                                    name="valid_to"
                                    placeholder={t("vehicles.selectEndDate", "Select end date")}
                                    disabled={submitting}
                                    showTime={false}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                disabled={submitting}
                            >
                                {t("common.cancel", "Cancel")}
                            </Button>
                            <Button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(onSubmit)(e); }}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t("common.adding", "Adding...")}
                                    </>
                                ) : (
                                    t("common.add", "Add")
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default VehicleDriverAddModal;
