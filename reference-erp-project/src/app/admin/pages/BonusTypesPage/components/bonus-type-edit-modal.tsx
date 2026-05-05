import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { postBonusType, patchBonusType } from "@/api/orgs/bonus-types/bonus-types";
import * as z from "zod";
import { promptUnsavedChanges } from "@/app/components/forms-elements/modal-unsaved";
import { BonusType } from "@/types/general/bonus-types";

interface BonusTypeEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onBonusTypeCreated: () => void;
    bonusTypeToEdit?: BonusType | null;
    mode?: "create" | "edit";
}

const BonusTypeEditModal = ({
    open,
    onOpenChange,
    onBonusTypeCreated,
    bonusTypeToEdit,
    mode = "create",
}: BonusTypeEditModalProps) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [isLoading, setIsLoading] = useState(false);

    const formSchema = z.object({
        name: z
            .string()
            .min(1, t("admin.bonusTypes.nameRequired", "Name is required"))
            .max(100, t("admin.bonusTypes.nameMaxLength", "Name must be less than 100 characters"))
            .trim(),
        description: z
            .string()
            .max(500, t("admin.bonusTypes.descriptionMaxLength", "Description must be less than 500 characters"))
            .optional(),
        amount: z
            .number({ invalid_type_error: t("admin.bonusTypes.amountRequired", "Amount is required") })
            .min(0, t("admin.bonusTypes.amountMinValue", "Amount must be zero or greater")),
    });

    type FormValues = z.infer<typeof formSchema>;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: bonusTypeToEdit?.name ?? "",
            description: bonusTypeToEdit?.description ?? "",
            amount: bonusTypeToEdit?.amount ?? 0,
        },
    });

    const onSubmit = async (values: FormValues) => {
        if (!orgId) {
            toast.error("Organization ID is required");
            return;
        }

        setIsLoading(true);
        try {
            let response;
            if (mode === "edit" && bonusTypeToEdit?.id) {
                response = await patchBonusType(orgId, bonusTypeToEdit.id, {
                    name: values.name.trim(),
                    description: values.description?.trim() || null,
                    amount: values.amount,
                });
            } else {
                response = await postBonusType(orgId, {
                    name: values.name.trim(),
                    description: values.description?.trim() || null,
                    amount: values.amount,
                });
            }

            if (response.success) {
                const successMessage =
                    mode === "edit"
                        ? t("admin.bonusTypes.bonusTypeUpdated", "Bonus type updated successfully")
                        : t("admin.bonusTypes.bonusTypeCreated", "Bonus type created successfully");
                toast.success(successMessage);
                form.reset();
                onOpenChange(false);
                onBonusTypeCreated();
            } else {
                const errorMessage =
                    mode === "edit"
                        ? t("admin.bonusTypes.errorUpdatingBonusType", "Error updating bonus type")
                        : t("admin.bonusTypes.errorCreatingBonusType", "Error creating bonus type");
                toast.error(response.error || errorMessage);
            }
        } catch {
            const errorMessage =
                mode === "edit"
                    ? t("admin.bonusTypes.errorUpdatingBonusType", "Error updating bonus type")
                    : t("admin.bonusTypes.errorCreatingBonusType", "Error creating bonus type");
            toast.error(errorMessage);
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
            onOpenChange(true);
        }
    };

    const handleInteractOutside = (e: Event) => {
        if (form.formState.isDirty) {
            e.preventDefault();
            handleOpenChange(false);
        }
    };

    React.useEffect(() => {
        if (open) {
            form.reset({
                name: bonusTypeToEdit?.name ?? "",
                description: bonusTypeToEdit?.description ?? "",
                amount: bonusTypeToEdit?.amount ?? 0,
            });
        }
    }, [open, bonusTypeToEdit]);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="sm:max-w-[425px]"
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
                showCloseButton={false}
            >
                <DialogHeader>
                    <DialogTitle>
                        {mode === "edit"
                            ? t("admin.bonusTypes.editBonusType", "Edit Bonus Type")
                            : t("admin.bonusTypes.addBonusType", "Add Bonus Type")}
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <div className="grid gap-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t("admin.bonusTypes.name", "Name")} *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t("admin.bonusTypes.namePlaceholder", "Enter bonus type name")}
                                            {...field}
                                            disabled={isLoading}
                                            autoFocus
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
                                    <FormLabel>
                                        {t("admin.bonusTypes.description", "Description")}
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t(
                                                "admin.bonusTypes.descriptionPlaceholder",
                                                "Enter bonus type description (optional)"
                                            )}
                                            rows={3}
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
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t("admin.bonusTypes.amount", "Default Amount")} *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder={t("admin.bonusTypes.amountPlaceholder", "Enter default bonus amount")}
                                            {...field}
                                            value={field.value ?? ""}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                field.onChange(value === "" ? undefined : parseFloat(value));
                                            }}
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
                            onClick={() => handleOpenChange(false)}
                            disabled={isLoading}
                        >
                            {t("common.cancel", "Cancel")}
                        </Button>
                        <Button
                            onClick={form.handleSubmit(onSubmit)}
                            disabled={isLoading || !form.formState.isValid}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {mode === "edit"
                                        ? t("admin.bonusTypes.updating", "Updating...")
                                        : t("common.creating", "Creating...")}
                                </>
                            ) : mode === "edit" ? (
                                t("admin.bonusTypes.update", "Update")
                            ) : (
                                t("common.create", "Create")
                            )}
                        </Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default BonusTypeEditModal;
