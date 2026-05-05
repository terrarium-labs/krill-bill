import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';
import { Loader2, Plus } from 'lucide-react';

import { useTranslation } from '@/hooks/useTranslation';
import { patchClientInventory } from '@/api/clients/inventory/inventory';
import { Inventory } from '@/types/clients/inventory';
import { getOrgItems } from '@/api/items/items';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { promptUnsavedChanges } from '@/app/components/forms-elements/modal-unsaved';
import { MultiSelectApi } from '@/app/components/forms-elements/multi-select-api';
import { MultiSelectApiHierarchy } from '@/app/components/forms-elements/multi-select-api-hierarchy';
import { getClientInventory } from '@/api/clients/inventory/inventory';
import { getClientInventoryChecklists, deleteClientInventoryChecklist } from '@/api/clients/checklists/checklists';
import { ItemAvatar } from '@/app/components/avatars/item-avatar';
import { IconLabel } from '@/app/components/custom-labels';
import Tag from '@/app/components/tag/tag';
import { Badge } from '@/components/ui/badge';
import CustomActionsDropdown from '@/app/components/custom-actions-dropdown';
import ChecklistViewModal, { type ChecklistViewItem } from "@/app/admin/pages/ChecklistsPage/components/checklist-view-modal";
import InventoryChecklistAddModal from './inventory-checklist-add-modal';

interface InventoryItemEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onInventorySaved?: () => void;
    inventory?: Inventory | null;
    locationId: string;
}

const formSchema = z.object({
    item_id: z.array(z.string()).optional(),
    name: z
        .string()
        .min(1, 'Name is required')
        .min(2, 'Name must be at least 2 characters')
        .max(128, 'Name must be less than 128 characters')
        .trim(),
    is_service: z.boolean().optional(),
    description: z
        .string()
        .max(500, 'Description must be less than 500 characters')
        .optional(),
    serial_number: z
        .string()
        .max(100, 'Serial number must be less than 100 characters')
        .optional(),
    parent_id: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const InventoryItemEditModal: React.FC<InventoryItemEditModalProps> = ({
    open,
    onOpenChange,
    onInventorySaved,
    inventory,
    locationId,
}) => {
    const { t } = useTranslation();
    const { orgId, clientId } = useParams<{ orgId: string; clientId: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [checklists, setChecklists] = useState<ChecklistViewItem[]>([]);
    const [loadingChecklists, setLoadingChecklists] = useState(false);
    const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
    const [viewModalChecklistId, setViewModalChecklistId] = useState<string | null>(null);

    const fetchChecklists = useCallback(async () => {
        if (!orgId || !clientId || !inventory?.id) return;
        setLoadingChecklists(true);
        try {
            const response = await getClientInventoryChecklists(orgId, clientId, inventory.id);
            const rawList = response.success?.checklists ?? response.success?.items ?? [];
            if (response.success && Array.isArray(rawList)) {
                setChecklists((rawList as any[]).map((c: any) => ({
                    id: c.id,
                    name: c.name ?? c.data?.name ?? 'Checklist',
                    description: c.description ?? c.data?.description,
                    data: c.data,
                    completed: c.completed,
                })));
            }
        } catch (error) {
            console.error('Error fetching checklists:', error);
        } finally {
            setLoadingChecklists(false);
        }
    }, [orgId, clientId, inventory?.id]);

    const handleDeleteChecklist = async (checklistId: string) => {
        if (!orgId || !clientId || !inventory?.id) return;
        try {
            const response = await deleteClientInventoryChecklist(orgId, clientId, inventory.id, { checklists_ids: [checklistId] });
            if (response.success) {
                toast.success(t('inventory.checklist.deletedSuccessfully', 'Checklist removed successfully'));
                fetchChecklists();
            } else {
                toast.error(t('inventory.checklist.errorDeleting', 'Error removing checklist'));
            }
        } catch (error) {
            console.error('Error deleting checklist:', error);
            toast.error(t('inventory.checklist.errorDeleting', 'Error removing checklist'));
        }
    };

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            item_id: [],
            name: '',
            is_service: false,
            description: '',
            serial_number: '',
            parent_id: [],
        },
    });

    // Reset form when modal opens or inventory changes
    useEffect(() => {
        if (open) {
            if (inventory) {
                form.reset({
                    item_id: inventory.item ? [inventory.item.id] : [],
                    name: inventory.name || '',
                    is_service: inventory.is_service || false,
                    description: inventory.description || '',
                    serial_number: inventory.serial_number || '',
                    parent_id: inventory.parent?.id ? [inventory.parent.id] : [],
                });
            } else {
                form.reset({
                    item_id: [],
                    name: '',
                    is_service: false,
                    description: '',
                    serial_number: '',
                    parent_id: [],
                });
            }
        }
    }, [open, inventory, form]);

    useEffect(() => {
        if (open && inventory?.id) {
            fetchChecklists();
        }
    }, [open, inventory?.id, fetchChecklists]);

    const onSubmit = async (values: FormValues) => {
        if (!orgId || !clientId) {
            toast.error(t('common.error', 'An error occurred'));
            return;
        }

        setIsSubmitting(true);

        try {
            // Transform form values to API format
            const apiData = {
                item_id: values.item_id && values.item_id.length > 0 ? values.item_id[0] : undefined,
                name: values.name,
                is_service: values.is_service,
                description: values.description || undefined,
                serial_number: values.serial_number || undefined,
                location_id: locationId,
                parent_id: values.parent_id && values.parent_id.length > 0 ? values.parent_id[0] : undefined,
            };

            let response;
            response = await patchClientInventory(orgId, clientId, inventory?.id as string, apiData);


            if (response.success) {
                toast.success(
                    t('inventory.itemUpdated', 'Inventory item updated successfully')
                );
                onInventorySaved?.();
                onOpenChange(false);
            } else {
                toast.error(
                    t('inventory.errorUpdatingItem', 'Error updating inventory item')
                );
            }
        } catch (error) {
            console.error('Error saving inventory item:', error);
            toast.error(
                t('inventory.errorUpdatingItem', 'Error updating inventory item')
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = async (open: boolean) => {
        if (form.formState.isDirty) {
            const discard = await promptUnsavedChanges();
            if (discard) {
                onOpenChange(false);
            }
        } else {
            onOpenChange(open);
        }
    };

    const dialogTitle = t('inventory.editItem', 'Edit Inventory Item');

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-xl md:min-w-xl" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold mb-4">
                        {dialogTitle}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <div className="space-y-6 overflow-y-auto max-h-[70vh] px-2 scrollbar-hide mb-14 pb-4">
                        {/* Basic Information */}
                        <div className="grid grid-cols-1 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('inventory.name', 'Name')} *
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder={t('inventory.enterName', 'Enter item name')}
                                                disabled={isSubmitting}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Type - Service or Component */}
                            <FormField
                                control={form.control}
                                name="is_service"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('inventory.type', 'Type')} *
                                        </FormLabel>
                                        <Select
                                            onValueChange={(value) => field.onChange(value === 'true')}
                                            value={field.value ? 'true' : 'false'}
                                            disabled={isSubmitting}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder={t('inventory.selectType', 'Select type...')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="false">
                                                    {t('inventory.type.component', 'Component')}
                                                </SelectItem>
                                                <SelectItem value="true">
                                                    {t('inventory.type.service', 'Service')}
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Catalog Item */}
                            <FormField
                                control={form.control}
                                name="item_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('inventory.catalogItem', 'Catalog Item')}
                                        </FormLabel>
                                        <FormControl>
                                            <MultiSelectApi
                                                fetchOptions={getOrgItems}
                                                fetchArgs={[orgId, undefined, undefined]}
                                                optionsKey="items"
                                                customValueKey={(item) => item.id}
                                                customLabelKey={(item) => <ItemAvatar item={item} showItemCode={true} />}
                                                placeholder={t('inventory.selectCatalogItem', 'Select catalog item...')}
                                                searchPlaceholder={t('inventory.searchCatalogItem', 'Search catalog items...')}
                                                emptyText={t('inventory.noCatalogItems', 'No catalog items found')}
                                                defaultItems={inventory?.item ? [inventory.item] : undefined}
                                                value={field.value || []}
                                                onChangeValue={field.onChange}
                                                disabled={isSubmitting}
                                                isApiSearchable={true}
                                                className="w-full truncate"
                                                maxCount={1}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            {t('inventory.catalogItemDescription', 'Select the catalog item this inventory item is based on')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Serial Number */}
                            <FormField
                                control={form.control}
                                name="serial_number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('inventory.serialNumber', 'Serial Number')}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder={t('inventory.enterSerialNumber', 'Enter serial number')}
                                                disabled={isSubmitting}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Parent Item */}
                            <FormField
                                control={form.control}
                                name="parent_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('inventory.parentItem', 'Parent Item')}
                                        </FormLabel>
                                        <FormControl>
                                            <MultiSelectApiHierarchy
                                                fetchOptions={getClientInventory}
                                                fetchArgs={[orgId, clientId, locationId, undefined]}
                                                optionsKey="inventory"
                                                customValueKey={(item) => item.id}
                                                customLabelKey={(item) =>
                                                    <div className="flex items-center gap-2">
                                                        <IconLabel icon={item.icon || null} text={item.name} color={item.color} showEmptyColor={false} />
                                                        <Tag
                                                            text={item.is_service ? t("inventory.type.service", "Service") : t("inventory.type.component", "Component")}
                                                            color={item.is_service ? "blue" : "gray"}
                                                        />
                                                    </div>
                                                }
                                                placeholder={t('inventory.selectParent', 'Select parent item...')}
                                                searchPlaceholder={t('inventory.searchParent', 'Search parent...')}
                                                emptyText={t('inventory.noItems', 'No items found')}
                                                defaultItems={inventory?.parent ? [inventory.parent] : undefined}
                                                value={field.value || []}
                                                onChangeValue={field.onChange}
                                                disabled={isSubmitting}
                                                maxCount={1}
                                                isApiSearchable={true}
                                                className="w-full truncate"
                                                parentKey="parent"
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            {t('inventory.parentItemDescription', 'Select the parent item for this inventory item')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Description */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t('inventory.description', 'Description')}
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t('inventory.enterDescription', 'Enter item description')}
                                            {...field}
                                            disabled={isSubmitting}
                                            rows={3}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Checklists - 2 columns grid with Add and Delete */}
                        {inventory?.id && orgId && clientId && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-sm flex items-center gap-2">
                                        {t('inventory.checklists', 'Checklists')}
                                        <Badge variant="secondary">{checklists.length}</Badge>
                                    </h4>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsChecklistModalOpen(true)}
                                        disabled={isSubmitting}
                                    >
                                        <Plus className="h-4 w-4" />
                                        {t('inventory.addChecklist', 'Add')}
                                    </Button>
                                </div>
                                {loadingChecklists ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : checklists.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">-</p>
                                ) : (
                                    <div className="space-y-2">
                                        {checklists.map((checklist) => (
                                            <div
                                                key={checklist.id}
                                                className="flex items-center justify-between gap-2 rounded-lg border p-4 cursor-pointer transition-colors hover:bg-muted/50"
                                                onClick={() => setViewModalChecklistId(checklist.id)}
                                            >
                                                <div className="flex-1 min-w-0 space-y-1">
                                                    <div className="font-medium text-sm">{checklist.name}</div>
                                                    {checklist.description && (
                                                        <div className="text-xs text-muted-foreground line-clamp-2">{checklist.description}</div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                                                    <CustomActionsDropdown
                                                        items={[
                                                            {
                                                                label: t('common.view', 'View'),
                                                                icon: 'eye',
                                                                onClick: () => setViewModalChecklistId(checklist.id),
                                                            },
                                                            {
                                                                label: t('common.actions.delete', 'Delete'),
                                                                icon: 'trash-2',
                                                                onClick: () => handleDeleteChecklist(checklist.id),
                                                                variant: 'destructive',
                                                            },
                                                        ]}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <InventoryChecklistAddModal
                                    open={isChecklistModalOpen}
                                    onOpenChange={setIsChecklistModalOpen}
                                    orgId={orgId}
                                    clientId={clientId}
                                    inventoryId={inventory.id}
                                    onChecklistUpdated={fetchChecklists}
                                />
                                <ChecklistViewModal
                                    open={!!viewModalChecklistId}
                                    onOpenChange={(open) => !open && setViewModalChecklistId(null)}
                                    checklist={viewModalChecklistId ? checklists.find((c) => c.id === viewModalChecklistId) ?? null : null}
                                    renderActions={(checklist) => (
                                        <CustomActionsDropdown
                                            items={[
                                                {
                                                    label: t('common.actions.delete', 'Delete'),
                                                    icon: 'trash-2',
                                                    onClick: () => {
                                                        handleDeleteChecklist(checklist.id);
                                                        setViewModalChecklistId(null);
                                                    },
                                                    variant: 'destructive',
                                                },
                                            ]}
                                        />
                                    )}
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-2 fixed bottom-0 left-0 right-0 bg-background p-4 rounded-b-lg">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button
                            type="submit"
                            onClick={form.handleSubmit(onSubmit)}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {t('inventory.updatingItem', 'Updating Item...')}
                                </>
                            ) : (
                                t('inventory.updateItem', 'Update Item')
                            )}
                        </Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default InventoryItemEditModal;
