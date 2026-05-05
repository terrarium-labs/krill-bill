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
    FormDescription,
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
import { postOrgJobTitle, patchOrgJobTitle } from "@/api/orgs/job-titles/job-titles";
import * as z from "zod";
import { promptUnsavedChanges } from "@/app/components/forms-elements/modal-unsaved";

interface JobTitleEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onJobTitleCreated: () => void;
    jobTitleToEdit?: any;
    mode?: 'create' | 'edit';
}

const JobTitleEditModal = ({ open, onOpenChange, onJobTitleCreated, jobTitleToEdit, mode = 'create' }: JobTitleEditModalProps) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [isLoading, setIsLoading] = useState(false);

    const formSchema = z.object({
        name: z.string()
            .min(1, t("admin.jobTitles.nameRequired", "Name is required"))
            .min(2, t("admin.jobTitles.nameMinLength", "Name must be at least 2 characters"))
            .max(100, t("admin.jobTitles.nameMaxLength", "Name must be less than 100 characters"))
            .trim(),
        description: z.string()
            .max(500, t("admin.jobTitles.descriptionMaxLength", "Description must be less than 500 characters"))
            .optional(),
        pmc: z.number().min(0, t("admin.jobTitles.pmcMinValue", "PMC must be positive")).optional().nullable(),
        pvp: z.number().min(0, t("admin.jobTitles.pvpMinValue", "PVP must be positive")).optional().nullable(),
    });

    type FormValues = z.infer<typeof formSchema>;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: jobTitleToEdit?.name || "",
            description: jobTitleToEdit?.description || "",
            pmc: jobTitleToEdit?.pmc || null,
            pvp: jobTitleToEdit?.pvp || null,
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
            if (mode === 'edit' && jobTitleToEdit?.id) {
                response = await patchOrgJobTitle(orgId, jobTitleToEdit.id, {
                    name: values.name.trim(),
                    description: values.description?.trim() || undefined,
                    pmc: values.pmc || undefined,
                    pvp: values.pvp || undefined,
                });
            } else {
                response = await postOrgJobTitle(orgId, {
                    name: values.name.trim(),
                    description: values.description?.trim() || undefined,
                    pmc: values.pmc || undefined,
                    pvp: values.pvp || undefined,
                });
            }

            if (response.success) {
                const successMessage = mode === 'edit'
                    ? t("admin.jobTitles.jobTitleUpdated", "Job title updated successfully")
                    : t("admin.jobTitles.jobTitleCreated", "Job title created successfully");
                toast.success(successMessage);
                form.reset();
                onOpenChange(false);
                onJobTitleCreated();
            } else {
                const errorMessage = mode === 'edit'
                    ? t("admin.jobTitles.errorUpdatingJobTitle", "Error updating job title")
                    : t("admin.jobTitles.errorCreatingJobTitle", "Error creating job title");
                toast.error(response.error || errorMessage);
            }
        } catch (error) {
            const errorMessage = mode === 'edit'
                ? t("admin.jobTitles.errorUpdatingJobTitle", "Error updating job title")
                : t("admin.jobTitles.errorCreatingJobTitle", "Error creating job title");
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
                    if (mode === 'create') {
                        form.reset();
                    }
                    onOpenChange(false);
                }
            } else {
                if (mode === 'create') {
                    form.reset();
                }
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

    // Reset form when modal opens/closes or when jobTitleToEdit changes
    React.useEffect(() => {
        if (open) {
            form.reset({
                name: jobTitleToEdit?.name || "",
                description: jobTitleToEdit?.description || "",
                pmc: jobTitleToEdit?.pmc || null,
                pvp: jobTitleToEdit?.pvp || null,
            });
        }
    }, [open, form, jobTitleToEdit]);

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
                        {mode === 'edit'
                            ? t("admin.jobTitles.editJobTitle", "Edit Job Title")
                            : t("admin.jobTitles.addJobTitle", "Add Job Title")
                        }
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
                                        {t("admin.jobTitles.name", "Name")} *
                                    </FormLabel>
                                        <FormControl>
                                        <Input
                                            placeholder={t("admin.jobTitles.namePlaceholder", "Enter job title name")}
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
                                        {t("admin.jobTitles.description", "Description")}
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t("admin.jobTitles.descriptionPlaceholder", "Enter job title description")}
                                            rows={3}
                                            {...field}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="pmc"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t("admin.jobTitles.pmc", "PMC")}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder={t("admin.jobTitles.pmcPlaceholder", "Enter PMC...")}
                                                {...field}
                                                value={field.value ?? ""}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    field.onChange(value === "" ? null : parseFloat(value));
                                                }}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-xs text-muted-foreground">
                                            {t(
                                                "admin.jobTitles.pmcDescription",
                                                "Internal cost reference.",
                                            )}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="pvp"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t("admin.jobTitles.pvp", "PVP")}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder={t("admin.jobTitles.pvpPlaceholder", "Enter PVP...")}
                                                {...field}
                                                value={field.value ?? ""}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    field.onChange(value === "" ? null : parseFloat(value));
                                                }}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-xs text-muted-foreground">
                                            {t(
                                                "admin.jobTitles.pvpDescription",
                                                "Client or list price for this role.",
                                            )}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

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
                                    {mode === 'edit'
                                        ? t("admin.jobTitles.updating", "Updating...")
                                        : t("common.creating", "Creating...")
                                    }
                                </>
                            ) : (
                                mode === 'edit'
                                    ? t("admin.jobTitles.update", "Update")
                                    : t("common.create", "Create")
                            )}
                        </Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default JobTitleEditModal;

