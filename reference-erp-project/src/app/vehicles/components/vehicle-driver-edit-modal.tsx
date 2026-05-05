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
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DateTimePicker } from "@/app/components/forms-elements/date-time-picker";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";
import IdBadge from "@/app/components/id-badge";
import { patchOrgVehicleEmployee } from "@/api/orgs/vehicles/employees/employees";
import { promptUnsavedChanges } from "@/app/components/forms-elements/modal-unsaved";
import { VehicleEmployeeRecord } from "@/types/general/vehicles";

const formSchema = z.object({
    valid_from: z.date().optional(),
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



interface VehicleDriverEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: string;
    vehicleId: string;
    vehicleEmployee: VehicleEmployeeRecord | null;
    onSuccess?: () => void;
    renderActions?: React.ReactNode;
}

const VehicleDriverEditModal: React.FC<VehicleDriverEditModalProps> = ({
    open,
    onOpenChange,
    orgId,
    vehicleId,
    vehicleEmployee,
    onSuccess,
    renderActions,
}) => {
    const { t } = useTranslation();
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            valid_from: undefined,
            valid_to: undefined,
        },
    });

    useEffect(() => {
        if (open && vehicleEmployee) {
            form.reset({
                valid_from: vehicleEmployee.valid_from ? new Date(vehicleEmployee.valid_from) : undefined,
                valid_to: vehicleEmployee.valid_to ? new Date(vehicleEmployee.valid_to) : undefined,
            });
        } else if (open && !vehicleEmployee) {
            form.reset({ valid_from: undefined, valid_to: undefined });
        }
    }, [open, vehicleEmployee]);

    const onSubmit = async (data: FormValues) => {
        if (!orgId || !vehicleId || !vehicleEmployee) return;
        setSubmitting(true);
        try {
            const payload: Record<string, any> = {};
            if (data.valid_from !== undefined) {
                payload.valid_from = data.valid_from ? data.valid_from.toISOString() : null;
            }
            if (data.valid_to !== undefined) {
                payload.valid_to = data.valid_to ? data.valid_to.toISOString() : null;
            }

            const response = await patchOrgVehicleEmployee(orgId, vehicleId, vehicleEmployee.id, payload);
            if (response.success) {
                toast.success(t("vehicles.driverUpdated", "Driver updated successfully"));
                form.reset();
                onOpenChange(false);
                onSuccess?.();
            } else {
                toast.error(response.error || t("vehicles.errorUpdatingDriver", "Error updating driver"));
            }
        } catch (error) {
            console.error(error);
            toast.error(t("vehicles.errorUpdatingDriver", "Error updating driver"));
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

    return (
        <Dialog open={open} onOpenChange={handleOpenChange} key="vehicle-driver-edit-modal">
            <DialogContent
                className="max-w-md"
                showCloseButton={false}
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between gap-2 text-lg font-semibold mb-4">
                        <span>{t("vehicles.editDriver", "Edit Driver")}</span>
                        <div className="flex items-center gap-2">
                            {vehicleEmployee && (
                                <IdBadge id={vehicleEmployee.id} />
                            )}
                            {renderActions}
                        </div>
                    </DialogTitle>
                </DialogHeader>

                {vehicleEmployee?.employee && (
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-md mb-2">
                        <EmployeeAvatar
                            employee={vehicleEmployee.employee}
                            showName
                            showJobTitle
                        />
                    </div>
                )}

                <Form {...form}>
                    <form
                        onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(onSubmit)(e); }}
                        className="space-y-4"
                    >
                        <div className="space-y-4">
                            <DateTimePicker
                                form={form}
                                name="valid_from"
                                label={t("vehicles.validFrom", "Valid From")}
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
                                        {t("common.saving", "Saving...")}
                                    </>
                                ) : (
                                    t("common.save", "Save")
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default VehicleDriverEditModal;
