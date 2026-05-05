import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
    postTrainingCategory,
    patchTrainingCategory,
} from "@/api/trainings/categories";
import type { TrainingCategory } from "@/types/trainings/trainings";

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
import { promptUnsavedChanges } from "@/app/components/forms-elements/modal-unsaved";
import ColorPicker from "@/app/components/forms-elements/color-picker";

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    color: z.string().min(1, "Color is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface CategoryCreateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved?: () => void;
    category?: TrainingCategory | null;
    mode?: "create" | "edit";
}

const CategoryCreateModal = ({
    open,
    onOpenChange,
    onSaved,
    category = null,
    mode = "create",
}: CategoryCreateModalProps) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: "", description: "", color: "blue" },
    });

    useEffect(() => {
        if (open && category && mode === "edit") {
            form.reset({
                name: category.name,
                description: category.description ?? "",
                color: category.color ?? "blue",
            });
        } else if (open && mode === "create") {
            form.reset({ name: "", description: "", color: "blue" });
        }
    }, [open, category, mode, form]);

    const onSubmit = async (values: FormValues) => {
        if (!orgId) return;
        setIsLoading(true);
        try {
            const payload: Record<string, unknown> = {
                name: values.name.trim(),
            };
            if (values.description?.trim())
                payload.description = values.description.trim();
            if (values.color?.trim()) payload.color = values.color.trim();

            const response =
                mode === "edit" && category
                    ? await patchTrainingCategory(orgId, category.id, payload)
                    : await postTrainingCategory(orgId, payload);

            if (response.success) {
                toast.success(
                    mode === "edit"
                        ? t("trainings.categories.updatedSuccess", "Category updated")
                        : t("trainings.categories.createdSuccess", "Category created")
                );
                form.reset();
                onOpenChange(false);
                onSaved?.();
            } else {
                toast.error(
                    t("trainings.categories.error", "Error saving category")
                );
            }
        } catch {
            toast.error(t("common.error", "An error occurred"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenChange = async (newOpen: boolean) => {
        if (!newOpen && form.formState.isDirty) {
            const discard = await promptUnsavedChanges();
            if (discard) {
                form.reset();
                onOpenChange(false);
            }
        } else {
            if (!newOpen) form.reset();
            onOpenChange(newOpen);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="sm:max-w-md flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0"
                showCloseButton={false}
            >
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="flex min-h-0 flex-1 flex-col overflow-hidden"
                    >
                        <div className="shrink-0 px-6 pt-6 pb-2">
                            <DialogHeader>
                                <DialogTitle className="text-lg font-semibold">
                                    {mode === "edit"
                                        ? t(
                                              "trainings.categories.edit",
                                              "Edit Category"
                                          )
                                        : t(
                                              "trainings.categories.create",
                                              "New Category"
                                          )}
                                </DialogTitle>
                            </DialogHeader>
                        </div>

                        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t("trainings.categories.name", "Name")} *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t(
                                                "trainings.categories.namePlaceholder",
                                                "e.g. Compliance"
                                            )}
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
                                    <FormLabel>
                                        {t("trainings.categories.description", "Description")}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t("trainings.fields.optional", "Optional")}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />

                            <ColorPicker
                                form={form}
                                name="color"
                                label={t("trainings.categories.color", "Color")}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <DialogFooter className="shrink-0 gap-2 bg-background px-6 py-4 sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                disabled={isLoading}
                            >
                                {t("common.cancel", "Cancel")}
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t("common.saving", "Saving...")}
                                    </>
                                ) : mode === "edit" ? (
                                    t("common.save", "Save")
                                ) : (
                                    t("common.create", "Create")
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default CategoryCreateModal;
