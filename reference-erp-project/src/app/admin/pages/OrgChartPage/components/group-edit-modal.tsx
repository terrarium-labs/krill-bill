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
    FormDescription,
    FormField,
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
import { Loader2, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { postOrgGroup, patchOrgGroup, getOrgGroups } from "@/api/orgs/groups/groups";
import { getOrgEmployees } from "@/api/employees/employees";
import * as z from "zod";
import { promptUnsavedChanges } from "@/app/components/forms-elements/modal-unsaved";
import { Group } from "@/types/general/groups";
import { MultiSelectApi } from "@/app/components/forms-elements/multi-select-api";
import { MultiSelectApiHierarchy } from "@/app/components/forms-elements/multi-select-api-hierarchy";
import { IconPicker, IconName } from "@/components/ui/icon-picker";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";
import Tag from "@/app/components/tag/tag";

interface GroupEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onGroupCreated: () => void;
    groupToEdit?: Group | null;
    mode?: 'create' | 'edit';
}

// Get type color for Tag component
const getTypeColor = (type: string) => {
    switch (type) {
        case "area":
            return "blue";
        case "department":
            return "green";
        case "section":
            return "purple";
        default:
            return "gray";
    }
};

const GroupEditModal = ({ open, onOpenChange, onGroupCreated, groupToEdit, mode = 'create' }: GroupEditModalProps) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [isLoading, setIsLoading] = useState(false);

    const formSchema = z.object({
        name: z.string()
            .min(1, t("groups.nameRequired", "Name is required"))
            .min(2, t("groups.nameMinLength", "Name must be at least 2 characters"))
            .max(100, t("groups.nameMaxLength", "Name must be less than 100 characters"))
            .trim(),
        type: z.enum(["area", "department", "section"]),
        description: z.string()
            .max(500, t("groups.descriptionMaxLength", "Description must be less than 500 characters"))
            .optional(),
        parent_id: z.string().nullable().optional(),
        responsible_id: z.string().nullable().optional(),
        icon_name: z.string().optional(),
    });

    type FormValues = z.infer<typeof formSchema>;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: groupToEdit?.name || "",
            type: groupToEdit?.type || "department",
            description: groupToEdit?.description || "",
            parent_id: groupToEdit?.parent?.id || null,
            responsible_id: groupToEdit?.responsible?.id || null,
            icon_name: groupToEdit?.icon_url || "",
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
                description: values.description?.trim() || null,
                parent_id: values.parent_id || null,
                responsible_id: values.responsible_id || null,
                icon_url: values.icon_name || null,
            };

            let response;
            if (mode === 'edit' && groupToEdit?.id) {
                response = await patchOrgGroup(orgId, groupToEdit.id, payload);
            } else {
                response = await postOrgGroup(orgId, payload);
            }

            if (response.success) {
                const successMessage = mode === 'edit'
                    ? t("groups.groupUpdated", "Group updated successfully")
                    : t("groups.groupCreated", "Group created successfully");
                toast.success(successMessage);
                form.reset();
                onOpenChange(false);
                onGroupCreated();
            } else {
                const errorMessage = mode === 'edit'
                    ? t("groups.errorUpdatingGroup", "Error updating group")
                    : t("groups.errorCreatingGroup", "Error creating group");
                toast.error(response.error || errorMessage);
            }
        } catch (error) {
            const errorMessage = mode === 'edit'
                ? t("groups.errorUpdatingGroup", "Error updating group")
                : t("groups.errorCreatingGroup", "Error creating group");
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

    // Reset form when modal opens/closes or when groupToEdit changes
    React.useEffect(() => {
        if (open) {
            form.reset({
                name: groupToEdit?.name || "",
                type: groupToEdit?.type || "department",
                description: groupToEdit?.description || "",
                parent_id: groupToEdit?.parent?.id || null,
                responsible_id: groupToEdit?.responsible?.id || null,
                icon_name: groupToEdit?.icon_url || "",
            });
        }
    }, [open, form, groupToEdit]);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="sm:max-w-[500px]"
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
                showCloseButton={false}
            >
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'edit'
                            ? t("groups.editGroup", "Edit Group")
                            : t("groups.addGroup", "Add Group")
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
                                        {t("groups.name", "Name")} *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t("groups.namePlaceholder", "Enter group name")}
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
                                        {t("groups.type", "Type")} *
                                    </FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={isLoading}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder={t("groups.selectType", "Select type")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="area">
                                                {t("groups.type.area", "Area")}
                                            </SelectItem>
                                            <SelectItem value="department">
                                                {t("groups.type.department", "Department")}
                                            </SelectItem>
                                            <SelectItem value="section">
                                                {t("groups.type.section", "Section")}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription className="text-xs text-muted-foreground">
                                        {t(
                                            "admin.groups.typeFieldDescription",
                                            "Defines how this node is categorized in the hierarchy.",
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
                                        {t("groups.description", "Description")}
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t("groups.descriptionPlaceholder", "Enter group description (optional)")}
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
                                        {t("groups.parentGroup", "Parent Group")}
                                    </FormLabel>
                                    <FormControl>
                                        <MultiSelectApiHierarchy
                                            className="w-full truncate"
                                            fetchOptions={getOrgGroups}
                                            fetchArgs={[orgId]}
                                            optionsKey="groups"
                                            parentKey="parent"
                                            customValueKey={(item) => item.id}
                                            customLabelKey={(item) => (
                                                <div className="font-medium text-sm flex items-center gap-2">
                                                    <span className="text-sm font-medium">{item.name}</span>
                                                    <Tag
                                                        className="capitalize"
                                                        text={t(`groups.type.${item.type}`, item.type as string)}
                                                        color={getTypeColor(item.type)}
                                                    />
                                                </div>
                                            )}
                                            placeholder={t('groups.selectParentGroup', 'Select parent group')}
                                            searchPlaceholder={t('groups.searchGroups', 'Search groups...')}
                                            emptyText={t('groups.noGroups', 'No groups found.')}
                                            disabled={isLoading}
                                            value={field.value ? [field.value] : []}
                                            onChangeValue={(values) => field.onChange(values[0] || null)}
                                            defaultItems={groupToEdit?.parent ? [groupToEdit.parent] : undefined}
                                            maxCount={1}
                                        />
                                    </FormControl>
                                    <p className="text-xs text-muted-foreground">
                                        {t(
                                            "admin.groups.parentGroupFieldDescription",
                                            "Optional parent node; leave empty for a top-level group.",
                                        )}
                                    </p>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="responsible_id"
                            render={({ field }) => {
                                const hasValue = field.value != null && field.value !== "";
                                return (
                                    <FormItem>
                                        <FormLabel className="inline-flex items-center gap-1.5">
                                            {t("groups.responsible", "Responsible")}
                                            {hasValue && (
                                                <button
                                                    type="button"
                                                    className="inline-flex p-0 leading-none text-muted-foreground/70 hover:text-destructive cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-0"
                                                    onClick={() => field.onChange(null)}
                                                    disabled={isLoading}
                                                    title={t("common.clear", "Clear")}
                                                >
                                                    <Trash2 className="h-3 w-3 shrink-0" />
                                                </button>
                                            )}
                                        </FormLabel>
                                        <FormControl>
                                            <MultiSelectApi
                                                className="w-full truncate"
                                                fetchOptions={getOrgEmployees}
                                                fetchArgs={[orgId, undefined, undefined, undefined, undefined, undefined, undefined]}
                                                optionsKey="employees"
                                                enableParams="hidden"
                                                defaultParams="employees"
                                                customValueKey={(item) => item.id}
                                                customLabelKey={(item) => <EmployeeAvatar employee={item} showJobTitle />}
                                                placeholder={t('groups.selectResponsible', 'Select responsible')}
                                                searchPlaceholder={t('groups.searchEmployees', 'Search employees...')}
                                                emptyText={t('groups.noEmployees', 'No employees found.')}
                                                disabled={isLoading}
                                                value={field.value ? [field.value] : []}
                                                onChangeValue={(values) => field.onChange(values[0] || null)}
                                                defaultItems={groupToEdit?.responsible ? [groupToEdit.responsible] : undefined}
                                                maxCount={1}
                                            />
                                        </FormControl>
                                        <p className="text-xs text-muted-foreground">
                                            {t(
                                                "admin.groups.responsibleFieldDescription",
                                                "Optional person accountable for this group (shown on the chart).",
                                            )}
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                );
                            }}
                        />

                        <FormField
                            control={form.control}
                            name="icon_name"
                            render={({ field }) => {
                                const hasValue = field.value != null && field.value !== "";
                                return (
                                    <FormItem>
                                        <FormLabel className="inline-flex items-center gap-1.5">
                                            {t("groups.icon", "Icon")}
                                            {hasValue && (
                                                <button
                                                    type="button"
                                                    className="inline-flex p-0 leading-none text-muted-foreground/70 hover:text-destructive cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-0"
                                                    onClick={() => field.onChange("")}
                                                    disabled={isLoading}
                                                    title={t("common.clear", "Clear")}
                                                >
                                                    <Trash2 className="h-3 w-3 shrink-0" />
                                                </button>
                                            )}
                                        </FormLabel>
                                        <FormControl>
                                            <IconPicker
                                                value={field.value as IconName}
                                                onValueChange={field.onChange}
                                                searchPlaceholder={t("groups.searchIcon", "Search for an icon...")}
                                                triggerPlaceholder={t("groups.selectIcon", "Select an icon")}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <p className="text-xs text-muted-foreground">
                                            {t(
                                                "admin.groups.iconFieldDescription",
                                                "Optional icon displayed next to this group in the UI.",
                                            )}
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                );
                            }}
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
                                    {mode === 'edit'
                                        ? t("groups.updating", "Updating...")
                                        : t("common.creating", "Creating...")
                                    }
                                </>
                            ) : (
                                mode === 'edit'
                                    ? t("groups.update", "Update")
                                    : t("common.create", "Create")
                            )}
                        </Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default GroupEditModal;

