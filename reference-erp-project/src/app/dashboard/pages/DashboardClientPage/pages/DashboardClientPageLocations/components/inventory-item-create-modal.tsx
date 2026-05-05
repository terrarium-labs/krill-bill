import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';
import { Loader2, ChevronLeft, ChevronRight, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useTranslation } from '@/hooks/useTranslation';
import { postClientInventory } from '@/api/clients/inventory/inventory';
import { getOrgItems } from '@/api/items/items';
import { Inventory } from '@/types/clients/inventory';
import { getClientInventoryChecklists, deleteClientInventoryChecklist } from '@/api/clients/checklists/checklists';
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
import { ItemAvatar } from '@/app/components/avatars/item-avatar';
import { IconLabel } from '@/app/components/custom-labels';
import Tag from '@/app/components/tag/tag';
import { Badge } from '@/components/ui/badge';
import CustomActionsDropdown from '@/app/components/custom-actions-dropdown';
import FilesSection from '@/app/components/files/files-section';
import ChecklistViewModal, { type ChecklistViewItem } from "@/app/admin/pages/ChecklistsPage/components/checklist-view-modal";
import InventoryChecklistAddModal from './inventory-checklist-add-modal';

interface InventoryItemCreateModalProps {
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

type WizardStep = 'basic' | 'checklists' | 'files';

const STEPS: { id: WizardStep; label: string; translationKey: string }[] = [
    { id: 'basic', label: 'Basic Info', translationKey: 'inventory.steps.basicInfo' },
    { id: 'checklists', label: 'Checklists', translationKey: 'inventory.steps.checklists' },
    { id: 'files', label: 'Files', translationKey: 'inventory.steps.files' },
];

const InventoryItemCreateModal: React.FC<InventoryItemCreateModalProps> = ({
    open,
    onOpenChange,
    onInventorySaved,
    inventory,
    locationId,
}) => {
    const { t } = useTranslation();
    const { orgId, clientId } = useParams<{ orgId: string; clientId: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createdInventoryId, setCreatedInventoryId] = useState<string | undefined>(undefined);
    const [currentStep, setCurrentStep] = useState<WizardStep>('basic');
    const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(new Set());

    const [checklists, setChecklists] = useState<ChecklistViewItem[]>([]);
    const [loadingChecklists, setLoadingChecklists] = useState(false);
    const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
    const [viewModalChecklistId, setViewModalChecklistId] = useState<string | null>(null);
    const [filesCount, setFilesCount] = useState(0);

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

    // Reset form and state when modal opens
    useEffect(() => {
        if (open) {
            form.reset({
                item_id: [],
                name: '',
                is_service: false,
                description: '',
                serial_number: '',
                parent_id: [],
            });
            setCreatedInventoryId(undefined);
            setCurrentStep('basic');
            setCompletedSteps(new Set());
            setChecklists([]);
        }
    }, [open, inventory, form]);

    const fetchChecklists = useCallback(async () => {
        if (!orgId || !clientId || !createdInventoryId) return;
        setLoadingChecklists(true);
        try {
            const response = await getClientInventoryChecklists(orgId, clientId, createdInventoryId);
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
    }, [orgId, clientId, createdInventoryId]);

    useEffect(() => {
        if (createdInventoryId && currentStep === 'checklists') {
            fetchChecklists();
        }
    }, [createdInventoryId, currentStep, fetchChecklists]);

    const handleDeleteChecklist = async (checklistId: string) => {
        if (!orgId || !clientId || !createdInventoryId) return;
        try {
            const response = await deleteClientInventoryChecklist(orgId, clientId, createdInventoryId, { checklists_ids: [checklistId] });
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

    const onSubmitBasicInfo = async (values: FormValues) => {
        if (!orgId || !clientId) {
            toast.error(t('common.error', 'An error occurred'));
            return;
        }

        setIsSubmitting(true);
        try {
            const apiData = {
                item_id: values.item_id && values.item_id.length > 0 ? values.item_id[0] : undefined,
                name: values.name,
                is_service: values.is_service,
                description: values.description || undefined,
                serial_number: values.serial_number || undefined,
                location_id: locationId,
                parent_id: values.parent_id && values.parent_id.length > 0 ? values.parent_id[0] : undefined,
            };

            const response = await postClientInventory(orgId, clientId, apiData);

            if (response.success) {
                const res = response.success as any;
                const newId = res.client_inventory_id ?? res.inventory?.id ?? res.id ?? res.inventory_id;
                if (newId) {
                    setCreatedInventoryId(newId);
                }
                toast.success(t('inventory.itemCreated', 'Inventory item created successfully'));
                setCompletedSteps((prev) => new Set(prev).add('basic'));
                setCurrentStep('checklists');
            } else {
                toast.error(t('inventory.errorCreatingItem', 'Error creating inventory item'));
            }
        } catch (error) {
            console.error('Error saving inventory item:', error);
            toast.error(t('inventory.errorCreatingItem', 'Error creating inventory item'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = async (nextOpen: boolean) => {
        if (nextOpen) {
            onOpenChange(true);
            return;
        }
        if (createdInventoryId) {
            onInventorySaved?.();
            form.reset();
            onOpenChange(false);
            return;
        }
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
    };

    const handleNext = () => {
        const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
        if (currentIndex < STEPS.length - 1) {
            setCompletedSteps((prev) => new Set(prev).add(currentStep));
            setCurrentStep(STEPS[currentIndex + 1].id);
        }
    };

    const handlePrevious = () => {
        const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
        if (currentIndex > 0) {
            setCurrentStep(STEPS[currentIndex - 1].id);
        }
    };

    const handleFinish = () => {
        onInventorySaved?.();
        form.reset();
        onOpenChange(false);
    };

    const getCurrentStepIndex = () => STEPS.findIndex((s) => s.id === currentStep);
    const isLastStep = () => getCurrentStepIndex() === STEPS.length - 1;
    const isFirstStep = () => getCurrentStepIndex() === 0;

    const canGoNext = () => !!createdInventoryId;

    const hasCurrentStepInput = () => {
        switch (currentStep) {
            case 'checklists':
                return checklists.length > 0;
            case 'files':
                return filesCount > 0;
            default:
                return false;
        }
    };

    const handleSkipAll = () => {
        handleFinish();
    };

    const handleFilesChange = useCallback((files: unknown[]) => {
        setFilesCount(files?.length ?? 0);
    }, []);

    const dialogTitle = t('inventory.addItem', 'Add Inventory Item');

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="max-w-xl md:min-w-xl w-full max-h-[90vh] min-h-[90vh] overflow-hidden flex flex-col"
                showCloseButton={false}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between gap-2 text-lg font-semibold">
                        {dialogTitle}
                    </DialogTitle>
                </DialogHeader>

                {/* Step Indicator */}
                <div className="flex items-center justify-between gap-2 px-2 py-2">
                    {STEPS.map((step, index) => {
                        const isCompleted = completedSteps.has(step.id) || (step.id === 'basic' && !!createdInventoryId);
                        const isCurrent = step.id === currentStep;
                        const isAccessible = index === 0 || completedSteps.has(STEPS[index - 1].id) || (index > 0 && !!createdInventoryId);

                        return (
                            <div key={step.id} className="flex items-center flex-1">
                                <button
                                    type="button"
                                    onClick={() => isAccessible && setCurrentStep(step.id)}
                                    disabled={!isAccessible}
                                    className={cn(
                                        "flex items-center gap-2 text-xs font-medium transition-colors",
                                        isCurrent && "text-primary",
                                        isCompleted && !isCurrent && "text-muted-foreground",
                                        !isCompleted && !isCurrent && !isAccessible && "text-muted-foreground/50",
                                        !isCompleted && !isCurrent && isAccessible && "text-muted-foreground hover:text-foreground",
                                        isAccessible && "cursor-pointer",
                                        !isAccessible && "cursor-not-allowed"
                                    )}
                                >
                                    <div className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs",
                                        isCurrent && "bg-primary text-primary-foreground",
                                        isCompleted && !isCurrent && "bg-primary/20 text-primary",
                                        !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                                    )}>
                                        {isCompleted ? <Check className="h-3 w-3" /> : index + 1}
                                    </div>
                                    <span className="hidden sm:inline">{t(step.translationKey, step.label)}</span>
                                </button>
                                {index < STEPS.length - 1 && (
                                    <div className={cn(
                                        "h-[2px] flex-1 mx-1",
                                        isCompleted ? "bg-primary/50" : "bg-muted"
                                    )} />
                                )}
                            </div>
                        );
                    })}
                </div>

                <Form {...form}>
                    <div className="flex-1 overflow-y-auto scrollbar-hide px-2 -mx-2 min-h-0">
                        {/* Step 1: Basic Info */}
                        {currentStep === 'basic' && (
                            <div className="space-y-6 pb-4">
                                <div className="grid grid-cols-1 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('inventory.name', 'Name')} *</FormLabel>
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

                                    <FormField
                                        control={form.control}
                                        name="is_service"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('inventory.type', 'Type')} *</FormLabel>
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

                                    <FormField
                                        control={form.control}
                                        name="item_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('inventory.catalogItem', 'Catalog Item')}</FormLabel>
                                                <FormControl>
                                                    <MultiSelectApi
                                                        fetchOptions={getOrgItems}
                                                        fetchArgs={[orgId, undefined, undefined]}
                                                        optionsKey="items"
                                                        customValueKey={(item: any) => item.id}
                                                        customLabelKey={(item: any) => <ItemAvatar item={item} showItemCode={true} />}
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

                                    <FormField
                                        control={form.control}
                                        name="serial_number"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('inventory.serialNumber', 'Serial Number')}</FormLabel>
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

                                    <FormField
                                        control={form.control}
                                        name="parent_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('inventory.parentItem', 'Parent Item')}</FormLabel>
                                                <FormControl>
                                                    <MultiSelectApiHierarchy
                                                        fetchOptions={getClientInventory}
                                                        fetchArgs={[orgId, clientId, locationId, undefined]}
                                                        optionsKey="inventory"
                                                        customValueKey={(item: any) => item.id}
                                                        customLabelKey={(item: any) => (
                                                            <div className="flex items-center gap-2">
                                                                <IconLabel
                                                                    icon={item.icon || null}
                                                                    text={item.name}
                                                                    color={item.color}
                                                                    showEmptyColor={false}
                                                                />
                                                                <Tag
                                                                    text={
                                                                        item.is_service
                                                                            ? t('inventory.type.service', 'Service')
                                                                            : t('inventory.type.component', 'Component')
                                                                    }
                                                                    color={item.is_service ? 'blue' : 'gray'}
                                                                />
                                                            </div>
                                                        )}
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

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('inventory.description', 'Description')}</FormLabel>
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
                            </div>
                        )}

                        {/* Step 2: Checklists */}
                        {currentStep === 'checklists' && createdInventoryId && orgId && clientId && (
                            <div className="space-y-4 py-2 min-h-[200px]">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        {t('inventory.checklists', 'Checklists')}
                                        <Badge variant="secondary">{checklists.length}</Badge>
                                    </h3>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsChecklistModalOpen(true)}
                                    >
                                        <Plus className="h-4 w-4" />
                                        {t('inventory.addChecklist', 'Add')}
                                    </Button>
                                </div>
                                {loadingChecklists ? (
                                    <div className="flex items-center justify-center p-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : checklists.length === 0 ? (
                                    <div className="text-sm text-muted-foreground py-6 text-center">
                                        {t('inventory.noChecklists', 'No checklists added yet. Add checklist templates to get started.')}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {checklists.map((checklist) => (
                                            <div
                                                key={checklist.id}
                                                className="flex items-center justify-between gap-2 rounded-lg border p-4 cursor-pointer transition-colors hover:bg-muted/50"
                                                onClick={() => setViewModalChecklistId(checklist.id)}
                                            >
                                                <div className="flex-1 min-w-0 space-y-1">
                                                    <div className="font-medium">{checklist.name}</div>
                                                    {checklist.description && (
                                                        <div className="text-xs text-muted-foreground line-clamp-2">
                                                            {checklist.description}
                                                        </div>
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
                                    inventoryId={createdInventoryId}
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

                        {/* Step 3: Files */}
                        {currentStep === 'files' && createdInventoryId && (
                            <div className="py-2 min-h-[300px]">
                                <FilesSection
                                    key={`inventory-files-${createdInventoryId}`}
                                    entity_id={createdInventoryId}
                                    showBreadcrumbs={true}
                                    showSearch={true}
                                    showCreateFolder={false}
                                    showUpload={true}
                                    onFilesChange={handleFilesChange}
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex-col rounded-b-lg sm:flex-row gap-2 border-t pt-2 shrink-0">
                        <div className="flex gap-2 justify-between w-full">
                            <div className="flex gap-2">
                                {!isFirstStep() && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handlePrevious}
                                        disabled={isSubmitting}
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                        {t('common.previous', 'Previous')}
                                    </Button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleOpenChange(false)}
                                    disabled={isSubmitting}
                                >
                                    {createdInventoryId ? t('common.close', 'Close') : t('common.cancel', 'Cancel')}
                                </Button>
                                {currentStep === 'basic' && !createdInventoryId && (
                                    <Button
                                        type="submit"
                                        onClick={form.handleSubmit(onSubmitBasicInfo)}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                {t('common.creating', 'Creating...')}
                                            </>
                                        ) : (
                                            <>
                                                {t('inventory.createItem', 'Create Item')}
                                                <ChevronRight className="h-4 w-4 ml-1" />
                                            </>
                                        )}
                                    </Button>
                                )}
                                {currentStep !== 'basic' && !isLastStep() && (
                                    <Button
                                        type="button"
                                        onClick={handleNext}
                                        disabled={!canGoNext()}
                                    >
                                        {hasCurrentStepInput() ? t('common.next', 'Next') : t('common.skip', 'Skip')}
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                )}
                                {currentStep !== 'basic' && !isLastStep() && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={handleSkipAll}
                                        disabled={!canGoNext()}
                                    >
                                        {t('common.skipAll', 'Skip all')}
                                    </Button>
                                )}
                                {isLastStep() && (
                                    <Button type="button" onClick={handleFinish}>
                                        {t('common.finish', 'Finish')}
                                        <Check className="h-4 w-4 ml-1" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default InventoryItemCreateModal;
