import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { patchWorkOrderChecklist } from "@/api/field-service/work-orders/checklists/checklists";
import { Checklist } from "@/types/field-service/work-orders/checklists";
import { promptUnsavedChanges } from "@/app/components/forms-elements/modal-unsaved";
import { useParams } from "react-router-dom";

const editFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
});
type EditFormInputs = z.infer<typeof editFormSchema>;

interface WorkOrderChecklistEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    checklist: Checklist | null;
    onChecklistUpdated: () => void;
    orgId?: string;
    workOrderId?: string;
    /** Optional actions to show in the header (e.g. Remove button) */
    renderActions?: React.ReactNode;
}

const WorkOrderChecklistEditModal = ({
    open,
    onOpenChange,
    checklist,
    onChecklistUpdated,
    orgId: orgIdProp,
    workOrderId: workOrderIdProp,
    renderActions,
}: WorkOrderChecklistEditModalProps) => {
    const { t } = useTranslation();
    const { orgId: orgIdParam, workOrderId: workOrderIdParam } = useParams<{
        orgId: string;
        workOrderId: string;
    }>();
    const orgId = orgIdProp ?? orgIdParam;
    const workOrderId = workOrderIdProp ?? workOrderIdParam;

    const [submitting, setSubmitting] = useState(false);

    const form = useForm<EditFormInputs>({
        resolver: zodResolver(editFormSchema),
        defaultValues: { name: "", description: "" },
    });

    useEffect(() => {
        if (open && checklist) {
            form.reset({
                name: checklist.name ?? "",
                description: checklist.description ?? "",
            });
        }
    }, [open, checklist, form]);

    const onSubmit = async (data: EditFormInputs) => {
        if (!orgId || !workOrderId || !checklist) return;

        setSubmitting(true);
        try {
            const response = await patchWorkOrderChecklist(orgId, workOrderId, checklist.id, {
                name: data.name.trim(),
                description: data.description?.trim() || null,
            });
            if (response.success) {
                toast.success(t("workorders.checklist.updatedSuccessfully", "Checklist updated successfully"));
                form.reset(data);
                onOpenChange(false);
                onChecklistUpdated();
            } else {
                toast.error(
                    (response as any).error?.message ??
                        t("workorders.checklist.errorUpdating", "Error updating checklist")
                );
            }
        } catch (error) {
            console.error("Error updating checklist:", error);
            toast.error(t("workorders.checklist.errorUpdating", "Error updating checklist"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenChange = async (newOpen: boolean) => {
        if (!newOpen) {
            if (form.formState.isDirty) {
                const discard = await promptUnsavedChanges();
                if (discard) {
                    form.reset();
                    onOpenChange(false);
                }
            } else {
                onOpenChange(false);
            }
        } else {
            onOpenChange(newOpen);
        }
    };

    const handleInteractOutside = (e: Event) => {
        if (form.formState.isDirty) {
            e.preventDefault();
            handleOpenChange(false);
        }
    };

    if (!orgId || !workOrderId || !checklist) return null;

    return (
        <Dialog
            open={open}
            onOpenChange={(newOpen) => (newOpen ? onOpenChange(true) : handleOpenChange(false))}
        >
            <DialogContent
                className="sm:max-w-[500px]"
                showCloseButton={false}
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between gap-2 text-lg font-semibold">
                        <span>{t("workorders.checklist.editTemplate", "Edit Checklist")}</span>
                        {renderActions}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.handleSubmit(onSubmit)(e);
                        }}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("workorders.checklist.name", "Name")} *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t("workorders.checklist.namePlaceholder", "Checklist name")}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("workorders.checklist.description", "Description")}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t(
                                                "workorders.checklist.descriptionPlaceholder",
                                                "Optional description"
                                            )}
                                            className="min-h-[80px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="gap-2">
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
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    form.handleSubmit(onSubmit)(e);
                                }}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
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

export default WorkOrderChecklistEditModal;
