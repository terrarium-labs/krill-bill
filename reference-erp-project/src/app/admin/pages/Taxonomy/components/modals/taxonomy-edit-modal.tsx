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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { postOrgsItemsHierarchies, patchOrgsItemsHierarchy, getOrgsItemsHierarchies } from "@/api/orgs/hierachy/hierachy";
import * as z from "zod";
import { promptUnsavedChanges } from "@/app/components/forms-elements/modal-unsaved";
import { ItemHierarchy } from "@/types/general/taxonomy";
import { MultiSelectApiHierarchy } from "@/app/components/forms-elements/multi-select-api-hierarchy";
import IconLabel from "@/app/components/labels/icon-label";
import ColorPicker from "@/app/components/forms-elements/color-picker";
import { IconPicker, IconName } from "@/components/ui/icon-picker";
import Tag from "@/app/components/tag/tag";
import IdBadge from "@/app/components/id-badge";

interface TaxonomyEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onTaxonomyCreatedOrUpdated: () => void;
    taxonomyToEdit?: ItemHierarchy | null;
    mode: 'create' | 'edit';
    renderActions?: () => React.ReactNode;
}

const TaxonomyEditModal = ({ open, onOpenChange, onTaxonomyCreatedOrUpdated, taxonomyToEdit, mode, renderActions }: TaxonomyEditModalProps) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [isLoading, setIsLoading] = useState(false);
    const isEditMode = mode === 'edit';

    const formSchema = z.object({
        name: z.string()
            .min(1, t("taxonomy.nameRequired", "Name is required"))
            .min(2, t("taxonomy.nameMinLength", "Name must be at least 2 characters"))
            .max(100, t("taxonomy.nameMaxLength", "Name must be less than 100 characters"))
            .trim(),
        type: z.enum(["family", "sub_family", "category"]),
        description: z.string()
            .max(500, t("taxonomy.descriptionMaxLength", "Description must be less than 500 characters"))
            .optional(),
        parent_id: z.string().nullable().optional(),
        margin: z.number()
            .min(0, t("taxonomy.marginMin", "Margin must be at least 0"))
            .max(100, t("taxonomy.marginMax", "Margin must be less than or equal to 100"))
            .nullable()
            .optional(),
        icon: z.string().optional(),
        color: z.string().optional(),
    });

    type FormValues = z.infer<typeof formSchema>;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: taxonomyToEdit?.name || "",
            type: taxonomyToEdit?.type || "category",
            description: taxonomyToEdit?.description || "",
            parent_id: taxonomyToEdit?.parent?.id || null,
            margin: taxonomyToEdit?.margin || null,
            icon: taxonomyToEdit?.icon || "",
            color: taxonomyToEdit?.color || "",
        },
    });

    const onSubmit = async (values: FormValues) => {
        if (!orgId) {
            toast.error("Organization ID is required");
            return;
        }

        setIsLoading(true);
        try {
            const payload: any = {
                name: values.name.trim(),
                type: values.type,
                description: values.description?.trim() || undefined,
                parent_id: values.parent_id || undefined,
                margin: values.margin !== null ? values.margin : undefined,
                icon: values.icon || undefined,
                color: values.color || undefined,
            };

            let response;
            if (isEditMode && taxonomyToEdit?.id) {
                response = await patchOrgsItemsHierarchy(orgId, taxonomyToEdit.id, payload);
            } else {
                response = await postOrgsItemsHierarchies(orgId, payload);
            }

            if (response.success) {
                const successMessage = isEditMode
                    ? t("taxonomy.taxonomyUpdated", "Item hierarchy updated successfully")
                    : t("taxonomy.taxonomyCreated", "Item hierarchy created successfully");
                toast.success(successMessage);
                form.reset();
                onOpenChange(false);
                onTaxonomyCreatedOrUpdated();
            } else {
                const errorMessage = isEditMode
                    ? t("taxonomy.errorUpdatingTaxonomy", "Error updating item hierarchy")
                    : t("taxonomy.errorCreatingTaxonomy", "Error creating item hierarchy");
                toast.error(response.error || errorMessage);
            }
        } catch (error) {
            const errorMessage = isEditMode
                ? t("taxonomy.errorUpdatingTaxonomy", "Error updating item hierarchy")
                : t("taxonomy.errorCreatingTaxonomy", "Error creating item hierarchy");
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

    // Reset form when modal opens/closes or when taxonomyToEdit changes
    React.useEffect(() => {
        if (open) {
            form.reset({
                name: taxonomyToEdit?.name || "",
                type: taxonomyToEdit?.type || "category",
                description: taxonomyToEdit?.description || "",
                parent_id: taxonomyToEdit?.parent?.id || null,
                margin: taxonomyToEdit?.margin || null,
                icon: taxonomyToEdit?.icon || "",
                color: taxonomyToEdit?.color || "",
            });
        }
    }, [open, form, taxonomyToEdit]);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="sm:max-w-[500px]"
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
                showCloseButton={false}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>
                            {isEditMode
                                ? t("taxonomy.editTaxonomy", "Edit Item Hierarchy")
                                : t("taxonomy.addHierarchy", "Add Item Hierarchy")
                            }
                        </span>
                        {isEditMode && taxonomyToEdit && (
                            <div className="flex items-center gap-2">
                                <IdBadge id={taxonomyToEdit.id} />
                                {renderActions && renderActions()}
                            </div>
                        )}
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
                                        {t("taxonomy.name", "Name")} *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t("taxonomy.namePlaceholder", "Enter hierarchy name")}
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
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t("taxonomy.type", "Type")} *
                                    </FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={isLoading}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder={t("taxonomy.selectType", "Select type")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="family">
                                                {t("taxonomy.type.family", "Family")}
                                            </SelectItem>
                                            <SelectItem value="sub_family">
                                                {t("taxonomy.type.sub_family", "Sub Family")}
                                            </SelectItem>
                                            <SelectItem value="category">
                                                {t("taxonomy.type.category", "Category")}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription className="text-xs text-muted-foreground">
                                        {t(
                                            "taxonomy.typeFieldDescription",
                                            "Family, sub-family, or category determines nesting and reporting.",
                                        )}
                                    </FormDescription>
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
                                        {t("taxonomy.description", "Description")}
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t("taxonomy.descriptionPlaceholder", "Enter hierarchy description (optional)")}
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
                            name="parent_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t("taxonomy.parentHierarchy", "Parent Hierarchy")}
                                    </FormLabel>
                                    <FormControl>
                                        <MultiSelectApiHierarchy
                                            className="w-full truncate"
                                            fetchOptions={getOrgsItemsHierarchies}
                                            fetchArgs={[orgId]}
                                            optionsKey="items_hierarchies"
                                            parentKey="parent"
                                            customValueKey={(item) => item.id}
                                            customLabelKey={(item) => (
                                                <div className="font-medium text-sm flex items-center gap-2">
                                                    <IconLabel data={{ icon: item.icon, text: item.name, color: item.color }} showEmptyColor={false} />
                                                    <Tag
                                                        className="capitalize"
                                                        text={t(`taxonomy.type.${item.type}`, item.type.replace("_", " ") as string)}
                                                    />
                                                </div>
                                            )}
                                            placeholder={t('taxonomy.selectParentHierarchy', 'Select parent hierarchy')}
                                            searchPlaceholder={t('taxonomy.searchHierarchies', 'Search hierarchies...')}
                                            emptyText={t('taxonomy.noHierarchies', 'No hierarchies found.')}
                                            disabled={isLoading}
                                            value={field.value ? [field.value] : []}
                                            onChangeValue={(values) => field.onChange(values[0] || null)}
                                            defaultItems={taxonomyToEdit?.parent ? [taxonomyToEdit.parent] : undefined}
                                            maxCount={1}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-xs text-muted-foreground">
                                        {t(
                                            "taxonomy.parentFieldDescription",
                                            "Leave empty for a root node; otherwise pick the parent family or sub-family.",
                                        )}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="margin"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t("taxonomy.margin", "Margin (%)")}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={100}
                                            step={0.01}
                                            placeholder={t("taxonomy.marginPlaceholder", "Enter margin percentage")}
                                            value={field.value ?? ""}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const n = value === "" ? null : parseFloat(value);
                                                field.onChange(n === null || Number.isFinite(n) ? n : null);
                                            }}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-xs text-muted-foreground">
                                        {t(
                                            "taxonomy.marginFieldDescription",
                                            "Default margin percentage applied to items under this node when relevant.",
                                        )}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="icon"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t("taxonomy.icon", "Icon")}
                                    </FormLabel>
                                    <FormControl>
                                        <IconPicker
                                            value={field.value as IconName}
                                            onValueChange={field.onChange}
                                            searchPlaceholder={t("taxonomy.searchIcon", "Search for an icon...")}
                                            triggerPlaceholder={t("taxonomy.selectIcon", "Select an icon")}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-xs text-muted-foreground">
                                        {t(
                                            "taxonomy.iconFieldDescription",
                                            "Shown next to the name in lists and filters.",
                                        )}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <ColorPicker
                            form={form}
                            name="color"
                            label={t("taxonomy.color", "Color")}
                            placeholder={t("taxonomy.selectColor", "Select a color")}
                            disabled={isLoading}
                        />
                        <FormDescription className="text-xs text-muted-foreground mt-[-8px] pt-0">
                            {t(
                                "taxonomy.colorFieldDescription",
                                "Accent color for chips and hierarchy visualization.",
                            )}
                        </FormDescription>
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
                                    {isEditMode
                                        ? t("taxonomy.updating", "Updating...")
                                        : t("common.creating", "Creating...")
                                    }
                                </>
                            ) : (
                                isEditMode
                                    ? t("taxonomy.update", "Update")
                                    : t("common.create", "Create")
                            )}
                        </Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default TaxonomyEditModal;

