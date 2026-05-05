import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
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
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { MultiSelectApiHierarchy } from '@/app/components/forms-elements/multi-select-api-hierarchy';
import { getClientInventory } from '@/api/clients/inventory/inventory';
import { postWorkOrderClientsInventories } from '@/api/field-service/work-orders/clients-inventories/clients-inventories';
import { promptUnsavedChanges } from '@/app/components/forms-elements/modal-unsaved';
import { Inventory } from '@/types/clients/inventory';

const formSchema = z.object({
    inventory_ids: z.array(z.string()).min(1, 'At least one inventory item is required'),
});

type FormInputs = z.infer<typeof formSchema>;

interface AddInventorytModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: string;
    workOrderId: string;
    clientId: string;
    locationId: string | null;
    onSuccess?: () => void;
}

const AddInventorytModal: React.FC<AddInventorytModalProps> = ({
    open,
    onOpenChange,
    orgId,
    workOrderId,
    clientId,
    locationId,
    onSuccess,
}) => {
    const { t } = useTranslation();
    const [submitting, setSubmitting] = useState(false);
    const [selectedInventoryData, setSelectedInventoryData] = useState<Inventory[]>([]);

    const form = useForm<FormInputs>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            inventory_ids: [],
        },
    });

    // Reset form when modal opens
    useEffect(() => {
        if (open) {
            form.reset({
                inventory_ids: [],
            });
            setSelectedInventoryData([]);
        }
    }, [open, form]);

    const onSubmit = async (data: FormInputs) => {
        if (!orgId || !workOrderId) return;

        setSubmitting(true);
        try {
            // For each inventory ID, create a work order item-client
            const promises = data.inventory_ids.map((inventoryId) =>
                postWorkOrderClientsInventories(orgId, workOrderId, {
                    client_inventory_id: inventoryId,
                })
            );

            const results = await Promise.all(promises);
            const hasError = results.some((result) => !result.success);

            if (!hasError) {
                toast.success(t('workOrders.inventoryItemsAddedSuccessfully', 'Inventory items added successfully'));
                form.reset();
                setSelectedInventoryData([]);
                onOpenChange(false);
                onSuccess?.();
            } else {
                toast.error(t('workOrders.errorAddingInventoryItems', 'Error adding inventory items'));
            }
        } catch (error) {
            console.error('Error adding inventory items:', error);
            toast.error(t('workOrders.errorAddingInventoryItems', 'Error adding inventory items'));
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
        <Dialog
            open={open}
            onOpenChange={handleOpenChange}
            key="add-items-client-modal"
        >
            <DialogContent
                className="max-w-md"
                showCloseButton={false}
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between gap-2 text-lg font-semibold mb-4">
                        <span>{t('workOrders.addInventoryItems', 'Add Inventory Items')}</span>
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(onSubmit)(e); }} className="space-y-4">
                        <div className="space-y-4 overflow-y-auto max-h-[60vh] px-2 scrollbar-hide">
                            {/* Inventory Selection */}
                            <FormField
                                control={form.control}
                                name="inventory_ids"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('workOrders.inventory', 'Inventory')} *</FormLabel>
                                        <FormControl>
                                            <MultiSelectApiHierarchy
                                                key={`inventory-${clientId}-${locationId || 'none'}`}
                                                fetchOptions={getClientInventory}
                                                fetchArgs={[
                                                    orgId,
                                                    clientId,
                                                    locationId || undefined,
                                                    undefined,
                                                ]}
                                                optionsKey="inventory"
                                                customValueKey={(item) => item.id}
                                                customLabelKey={(item) => (
                                                    <div className="flex items-center gap-2">
                                                        <span>{item.name}</span>
                                                        {item.item_name && (
                                                            <span className="text-muted-foreground text-xs">
                                                                ({item.item_name})
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                placeholder={t('workOrders.selectInventory', 'Select inventory...')}
                                                searchPlaceholder={t('workOrders.searchInventory', 'Search inventory...')}
                                                emptyText={t('workOrders.noInventory', 'No inventory found')}
                                                value={field.value || []}
                                                onChangeValue={(values) => field.onChange(values)}
                                                onChangeValueWithItem={(_values, itemsMap) => {
                                                    setSelectedInventoryData(Array.from(itemsMap.values()));
                                                }}
                                                defaultItems={selectedInventoryData}
                                                className="w-full truncate"
                                                disabled={submitting}
                                                isApiSearchable={true}
                                                parentKey="parent"
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
                                disabled={submitting}
                            >
                                {t('common.cancel', 'Cancel')}
                            </Button>
                            <Button 
                                type="button" 
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(onSubmit)(e); }}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {t('common.adding', 'Adding...')}
                                    </>
                                ) : (
                                    t('common.add', 'Add')
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default AddInventorytModal;
