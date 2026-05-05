import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { VehicleMaintenance } from "@/types/general/vehicles";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { formatDateForAPI } from "@/utils/miscelanea";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/app/components/forms-elements/date-time-picker";
import IdBadge from "@/app/components/id-badge";
import { promptUnsavedChanges } from "@/app/components/forms-elements/modal-unsaved";
import FilesSection from "@/app/components/files/files-section";
import {
    postVehicleMaintenance,
    patchVehicleMaintenance,
} from "@/api/orgs/vehicles/maintenances/maintenances";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";

const maintenanceSchema = z
    .object({
        from_date: z.date({ error: "From date is required" }),
        to_date: z.date().optional(),
        notes: z.string().optional(),
    })
    .refine(
        (data) => !data.to_date || data.to_date >= data.from_date,
        { path: ["to_date"], message: "To date must be on or after from date" }
    );

type FormValues = z.infer<typeof maintenanceSchema>;

export interface MaintenanceEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onMaintenanceCreatedOrUpdated?: () => void;
    orgId: string;
    vehicleId: string;
    maintenance?: VehicleMaintenance | null;
    mode: "create" | "edit";
    renderActions?: (
        maintenance: VehicleMaintenance,
        closeModal: () => void
    ) => React.ReactNode;
}

const MaintenanceEditModal: React.FC<MaintenanceEditModalProps> = ({
    open,
    onOpenChange,
    onMaintenanceCreatedOrUpdated,
    orgId,
    vehicleId,
    maintenance,
    mode,
    renderActions,
}) => {
    const { t } = useTranslation();
    const isEditMode = mode === "edit";
    const [isLoading, setIsLoading] = useState(false);
    const [modalMaintenanceId, setModalMaintenanceId] = useState<string | undefined>(
        maintenance?.id
    );

    const form = useForm<FormValues>({
        resolver: zodResolver(maintenanceSchema),
        defaultValues: {
            from_date: new Date(),
            to_date: undefined,
            notes: "",
        },
    });

    useEffect(() => {
        if (open) {
            setModalMaintenanceId(maintenance?.id ?? undefined);
        }
    }, [open, maintenance?.id]);

    useEffect(() => {
        if (open) {
            if (isEditMode && maintenance) {
                form.reset({
                    from_date: new Date(maintenance.from_date),
                    to_date: maintenance.to_date ? new Date(maintenance.to_date) : undefined,
                    notes: maintenance.notes ?? "",
                });
            } else {
                form.reset({
                    from_date: new Date(),
                    to_date: undefined,
                    notes: "",
                });
            }
        }
    }, [open, isEditMode, maintenance]);

    const handleOpenChange = async (nextOpen: boolean) => {
        if (!nextOpen) {
            if (form.formState.isDirty) {
                const discard = await promptUnsavedChanges();
                if (discard) {
                    form.reset();
                    setModalMaintenanceId(undefined);
                    onOpenChange(false);
                }
            } else {
                form.reset();
                setModalMaintenanceId(undefined);
                onOpenChange(false);
            }
        } else {
            onOpenChange(nextOpen);
        }
    };

    const handleInteractOutside = (e: Event) => {
        if (form.formState.isDirty) {
            e.preventDefault();
            handleOpenChange(false);
        }
    };

    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            const payload: Record<string, string | null> = {
                from_date: formatDateForAPI(values.from_date, "start"),
                to_date: values.to_date ? formatDateForAPI(values.to_date, "end") : null,
                notes: values.notes?.trim() || null,
            };

            let response: any;
            if (isEditMode && maintenance) {
                response = await patchVehicleMaintenance(orgId, vehicleId, maintenance.id, payload);
            } else {
                response = await postVehicleMaintenance(orgId, vehicleId, payload);
            }

            if (response.success) {
                if (!isEditMode && response.success.maintenance_id) {
                    setModalMaintenanceId(response.success.maintenance_id);
                }
                toast.success(
                    isEditMode
                        ? t("maintenance.updateSuccess", "Maintenance updated successfully")
                        : t("maintenance.createSuccess", "Maintenance created successfully")
                );
                form.reset();
                onMaintenanceCreatedOrUpdated?.();
                onOpenChange(false);
            } else {
                toast.error(
                    response.error?.message ||
                    response.error ||
                    (isEditMode
                        ? t("maintenance.updateError", "Failed to update maintenance")
                        : t("maintenance.createError", "Failed to create maintenance"))
                );
            }
        } catch (error) {
            console.error("Error saving maintenance:", error);
            toast.error(
                isEditMode
                    ? t("maintenance.updateError", "Failed to update maintenance")
                    : t("maintenance.createError", "Failed to create maintenance")
            );
        } finally {
            setIsLoading(false);
        }
    };

    const dialogTitle = isEditMode
        ? t("maintenance.editTitle", "Edit Maintenance")
        : t("maintenance.createTitle", "New Maintenance");

    return (
        <Dialog open={open} onOpenChange={handleOpenChange} key="maintenance-modal">
            <DialogContent
                className="max-w-2xl md:min-w-2xl"
                showCloseButton={false}
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between gap-2 text-lg font-semibold mb-4">
                        <span>{dialogTitle}</span>
                        {isEditMode && modalMaintenanceId && maintenance && (
                            <div className="flex items-center gap-2">
                                <IdBadge id={modalMaintenanceId} />
                                {renderActions?.(maintenance, () => handleOpenChange(false))}
                            </div>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <div className="space-y-6 overflow-y-auto max-h-[60vh] px-2 scrollbar-hide mb-16">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DateTimePicker
                                form={form}
                                name="from_date"
                                showMonthYearPicker={true}
                                label={t("maintenance.fromDate", "From date")}
                                required
                                showTime={false}
                                disabled={isLoading}
                            />
                            <DateTimePicker
                                form={form}
                                name="to_date"
                                showMonthYearPicker={true}
                                label={t("maintenance.toDate", "To date")}
                                showTime={false}
                                disabled={isLoading}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("maintenance.notes", "Notes")}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            rows={4}
                                            placeholder={t(
                                                "maintenance.notesPlaceholder",
                                                "Add notes about this maintenance..."
                                            )}
                                            {...field}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FilesSection
                            entity_id={modalMaintenanceId}
                            showBreadcrumbs={isEditMode}
                            showSearch={isEditMode}
                            showCreateFolder={false}
                            showUpload={isEditMode}
                        />

                        <DialogFooter className="flex-col rounded-b-lg sm:flex-row gap-2 fixed bottom-0 left-0 right-0 bg-background p-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                disabled={isLoading}
                            >
                                {t("common.cancel", "Cancel")}
                            </Button>
                            <Button
                                type="submit"
                                onClick={form.handleSubmit(onSubmit)}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {isEditMode
                                            ? t("common.updating", "Updating...")
                                            : t("common.creating", "Creating...")}
                                    </>
                                ) : isEditMode ? (
                                    t("common.update", "Update")
                                ) : (
                                    t("common.create", "Create")
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export { MaintenanceEditModal };
export default MaintenanceEditModal;
