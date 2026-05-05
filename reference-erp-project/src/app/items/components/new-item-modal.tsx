import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Settings } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { postOrgItems, patchOrgItem } from '@/api/items/items';
import { Item } from '@/types/items/items';
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
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from '@/components/ui/shadcn-io/tabs';
import { promptUnsavedChanges } from '@/app/components/forms-elements/modal-unsaved';
import { getOrgSections } from '@/api/orgs/sections/sections';
import CustomFieldsSection from '@/app/components/custom-fields-section';
import { MultiSelectApiHierarchy } from '@/app/components/forms-elements/multi-select-api-hierarchy';
import { getOrgsItemsHierarchies } from '@/api/orgs/hierachy/hierachy';
import { Textarea } from '@/components/ui/textarea';
import ItemSellPricesSection from './item-sell-prices-section';
import ItemBuyPricesSection from './item-buy-prices-section';
import GalleryPhotosItems, { PhotoItem } from './gallery-photos-items';
import { IconLabel } from '@/app/components/custom-labels';
import { ItemHierarchy } from '@/types/general/taxonomy';
import { postOrgItemPhotos, patchOrgItemPhotos, deleteOrgItemPhotos } from '@/api/items/photos/photos';

interface NewItemModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onItemCreated?: () => void;
    item?: Item | null; // For update mode
    mode: 'create' | 'update';
}



// Form input schema (what the form expects)
const formInputSchema = z.object({
    name: z
        .string()
        .min(1, 'Item name is required')
        .min(2, 'Item name must be at least 2 characters')
        .max(255, 'Item name must be less than 255 characters')
        .trim(),
    item_code: z
        .string()
        .max(100, 'Item code must be less than 100 characters')
        .trim()
        .optional(),
    type: z
        .enum(['item', 'bundle'])
        .optional(),
    description: z
        .string()
        .max(1000, 'Description must be less than 1000 characters')
        .optional(),
    measure: z
        .string()
        .optional(),
    barcode: z
        .string()
        .max(100, 'Barcode must be less than 100 characters')
        .optional(),
    // Financial fields
    pmc: z
        .string()
        .optional()
        .refine((val) => {
            if (!val) return true;
            const num = parseFloat(val);
            return !isNaN(num) && num >= 0;
        }, 'Must be a valid positive number'),
    is_pmc_fixed: z
        .boolean()
        .optional(),
    cost_calc_days: z
        .string()
        .optional()
        .refine((val) => {
            if (!val) return true;
            const num = parseInt(val);
            return !isNaN(num) && num >= 0 && num <= 365;
        }, 'Must be a valid number between 0 and 365'),
    // Taxonomy fields
    item_hierarchy_id: z
        .string()
        .nullable()
        .optional(),
    custom_fields: z.record(z.string(), z.any()).optional(),
    // Sell price fields
    sell_price_quantity: z.string().nullable().optional(),
    sell_price_currency: z.string().nullable().optional(),
    sell_margin: z.string().nullable().optional(),
    sell_billing_type: z.enum(['one-off', 'recurring']).nullable().optional(),
    sell_billing_period: z.enum(['daily', 'weekly', 'monthly', 'yearly']).nullable().optional(),
    sell_tax_included: z.boolean().optional(),
    sell_taxes: z.array(z.string()).nullable().optional(),
    sell_warranty_period: z.string().nullable().optional(),
    sell_warranty_unit: z.enum(['days', 'weeks', 'months', 'years']).nullable().optional(),
    sell_notes: z.string().nullable().optional(),
    sell_pricing_mode: z.enum(['margin_fixed', 'price_fixed']).optional(),
    // Buy price fields
    buy_price_quantity: z.string().nullable().optional(),
    buy_price_currency: z.string().nullable().optional(),
    buy_default_provider: z.string().nullable().optional(),
    buy_provider_barcode: z.string().nullable().optional(),
    buy_billing_type: z.enum(['one-off', 'recurring']).nullable().optional(),
    buy_billing_period: z.enum(['daily', 'weekly', 'monthly', 'yearly']).nullable().optional(),
    buy_tax_included: z.boolean().optional(),
    buy_taxes: z.array(z.string()).nullable().optional(),
    buy_warranty_period: z.string().nullable().optional(),
    buy_warranty_unit: z.enum(['days', 'weeks', 'months', 'years']).nullable().optional(),
    buy_notes: z.string().nullable().optional(),
})

// Processing schema (transforms strings to numbers for API)
const baseFormSchema = formInputSchema.transform((data) => {
    const transformed: any = {
        ...data,
        pmc: data.pmc && data.pmc !== '' ? parseFloat(data.pmc) : undefined,
        cost_calc_days: data.cost_calc_days && data.cost_calc_days !== '' ? parseInt(data.cost_calc_days) : undefined,
    };

    // Build prices array if sell price or buy price is provided
    transformed.prices = [];

    if (data.sell_price_quantity && data.sell_price_quantity !== '') {
        transformed.prices.push({
            type: 'sell',
            is_default: true,
            price_quantity: parseFloat(data.sell_price_quantity),
            price_currency: data.sell_price_currency || 'EUR',
            margin: data.sell_margin && data.sell_margin !== '' ? parseFloat(data.sell_margin) : null,
            billing_type: data.sell_billing_type || 'one-off',
            billing_period: data.sell_billing_period || null,
            price_model: 'flat-rate',
            pricing_mode: data.sell_pricing_mode || 'price_fixed',
            tax_included: data.sell_tax_included || false,
            taxes: data.sell_taxes || null,
            warranty_period: data.sell_warranty_period && data.sell_warranty_period !== '' ? parseInt(data.sell_warranty_period) : null,
            warranty_unit: data.sell_warranty_unit || null,
            notes: data.sell_notes || null,
            supplier_id: null,
            supplier_barcode: null,
        });
    }

    if (data.buy_price_quantity && data.buy_price_quantity !== '') {
        transformed.prices.push({
            type: 'buy',
            is_default: true,
            priority: 1,
            price_quantity: parseFloat(data.buy_price_quantity),
            price_currency: data.buy_price_currency || 'EUR',
            margin: null,
            billing_type: data.buy_billing_type || 'one-off',
            billing_period: data.buy_billing_period || null,
            price_model: 'flat-rate',
            tax_included: data.buy_tax_included || false,
            taxes: data.buy_taxes || null,
            warranty_period: data.buy_warranty_period && data.buy_warranty_period !== '' ? parseInt(data.buy_warranty_period) : null,
            warranty_unit: data.buy_warranty_unit || null,
            notes: data.buy_notes || null,
            supplier_id: data.buy_default_provider || null,
            supplier_barcode: data.buy_provider_barcode || null,
        });
    }

    if (transformed.prices.length === 0) {
        transformed.prices = undefined;
    }

    return transformed;
});

type FormValues = z.infer<typeof formInputSchema>;

const NewItemModal: React.FC<NewItemModalProps> = ({
    open,
    onOpenChange,
    onItemCreated,
    item = null,
    mode = 'create',
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [sections, setSections] = useState<any[]>([]);
    const [photos, setPhotos] = useState<PhotoItem[]>([]);
    const [lastHierarchyItem, setLastHierarchyItem] = useState<ItemHierarchy | null>(null);
    const [photosToDelete, setPhotosToDelete] = useState<string[]>([]);
    const [photosReordered, setPhotosReordered] = useState(false);

    const navigate = useNavigate();
    const form = useForm<FormValues>({
        resolver: zodResolver(formInputSchema),
        defaultValues: {
            name: '',
            item_code: '',
            type: 'item',
            description: '',
            measure: 'uts',
            barcode: '',
            pmc: '',
            is_pmc_fixed: false,
            cost_calc_days: '30',
            item_hierarchy_id: null,
            custom_fields: {},
            // Sell price defaults
            sell_price_quantity: '',
            sell_price_currency: 'EUR',
            sell_margin: '',
            sell_billing_type: 'one-off',
            sell_billing_period: null,
            sell_tax_included: true,
            sell_taxes: [],
            sell_warranty_period: '',
            sell_warranty_unit: null,
            sell_notes: '',
            sell_pricing_mode: 'price_fixed',
            // Buy price defaults
            buy_price_quantity: '',
            buy_price_currency: 'EUR',
            buy_default_provider: '',
            buy_provider_barcode: '',
            buy_billing_type: 'one-off',
            buy_billing_period: null,
            buy_tax_included: true,
            buy_taxes: [],
            buy_warranty_period: '',
            buy_warranty_unit: null,
            buy_notes: '',
        },
    });

    // Helper function to populate form with item data
    const populateFormWithItemData = (itemData: Item) => {
        console.log('itemData', itemData);
        // Reset form with basic data first
        // itemhierarchy contaix all element order by hierarchy order using parent.id and id and pick the last one

        // Algorithm to order itemHierarchy by parent-child relationships
        const orderHierarchyByParent = (hierarchyArray: ItemHierarchy[]): ItemHierarchy[] => {
            if (!hierarchyArray || hierarchyArray.length === 0) return [];

            const ordered: ItemHierarchy[] = [];
            const remaining = [...hierarchyArray];

            // Helper function to find and add children recursively
            const addItemAndChildren = (parentId: string | null) => {
                // Find all items with the specified parent
                const items = remaining.filter(item =>
                    parentId === null
                        ? item.parent === null
                        : item.parent?.id === parentId
                );

                // Add each item and recursively add its children
                items.forEach(item => {
                    const index = remaining.indexOf(item);
                    if (index > -1) {
                        remaining.splice(index, 1);
                        ordered.push(item);
                        // Recursively add children of this item
                        addItemAndChildren(item.id);
                    }
                });
            };

            // Start with root items (parent === null)
            addItemAndChildren(null);

            // Handle any remaining items (in case of orphaned or circular references)
            while (remaining.length > 0) {
                const item = remaining.shift();
                if (item) ordered.push(item);
            }

            return ordered;
        };

        const orderedHierarchy = itemData.item_hierarchy && itemData.item_hierarchy !== null
            ? orderHierarchyByParent(itemData.item_hierarchy)
            : [];

        // Get the last item in the ordered hierarchy (the most specific/deepest level)
        setLastHierarchyItem(orderedHierarchy.length > 0
            ? orderedHierarchy[orderedHierarchy.length - 1]
            : null);

        form.reset({
            name: itemData.name || '',
            item_code: itemData.item_code || '',
            type: 'item',
            description: itemData.description || '',
            measure: itemData.measure || 'uts',
            barcode: itemData.barcode || '',
            pmc: itemData.pmc?.toString() || '',
            is_pmc_fixed: itemData.is_pmc_fixed ?? false,
            cost_calc_days: itemData.cost_calc_days?.toString() || '',
            item_hierarchy_id: orderedHierarchy.length > 0
                ? orderedHierarchy[orderedHierarchy.length - 1]?.id || null
                : null,
            custom_fields: {},
            // Populate sell price from the first sell price in the array
            sell_price_quantity: itemData.prices?.find(p => p.type === 'sell')?.price_quantity?.toString() || '',
            sell_price_currency: itemData.prices?.find(p => p.type === 'sell')?.price_currency || 'EUR',
            sell_margin: itemData.prices?.find(p => p.type === 'sell')?.margin?.toString() || '',
            sell_billing_type: itemData.prices?.find(p => p.type === 'sell')?.billing_type || 'one-off',
            sell_billing_period: itemData.prices?.find(p => p.type === 'sell')?.billing_period || null,
            sell_tax_included: itemData.prices?.find(p => p.type === 'sell')?.tax_included || true,
            sell_taxes: itemData.prices?.find(p => p.type === 'sell')?.taxes || null,
            sell_warranty_period: itemData.prices?.find(p => p.type === 'sell')?.warranty_period?.toString() || '',
            sell_warranty_unit: itemData.prices?.find(p => p.type === 'sell')?.warranty_unit || null,
            sell_notes: itemData.prices?.find(p => p.type === 'sell')?.notes || '',
            sell_pricing_mode: (itemData.prices?.find(p => p.type === 'sell')?.pricing_mode as any) || 'price_fixed',
            // Populate buy price from the first buy price in the array
            buy_price_quantity: itemData.prices?.find(p => p.type === 'buy')?.price_quantity?.toString() || '',
            buy_price_currency: itemData.prices?.find(p => p.type === 'buy')?.price_currency || 'EUR',
            buy_default_provider: itemData.prices?.find(p => p.type === 'buy')?.supplier_id || '',
            buy_provider_barcode: itemData.prices?.find(p => p.type === 'buy')?.supplier_barcode || '',
            buy_billing_type: itemData.prices?.find(p => p.type === 'buy')?.billing_type || 'one-off',
            buy_billing_period: itemData.prices?.find(p => p.type === 'buy')?.billing_period || null,
            buy_tax_included: itemData.prices?.find(p => p.type === 'buy')?.tax_included || true,
            buy_taxes: itemData.prices?.find(p => p.type === 'buy')?.taxes || null,
            buy_warranty_period: itemData.prices?.find(p => p.type === 'buy')?.warranty_period?.toString() || '',
            buy_warranty_unit: itemData.prices?.find(p => p.type === 'buy')?.warranty_unit || null,
            buy_notes: itemData.prices?.find(p => p.type === 'buy')?.notes || '',
        });

        itemData.sections?.forEach((section) => {
            section.fields?.forEach((field) => {
                const fieldPath = `custom_fields.${field.id}` as any;
                let value = field.value;

                // Convert date/datetime strings to Date objects
                if ((field.data_type === 'date' || field.data_type === 'datetime') && value) {
                    if (typeof value === 'string') {
                        value = new Date(value);
                    }
                }

                form.setValue(fieldPath, value);
            });
        });
    };

    // Function to validate custom fields
    const validateCustomFields = (customFields: Record<string, any> = {}, allSections: any[]): { isValid: boolean; errors: Record<string, string> } => {
        const errors: Record<string, string> = {};
        let isValid = true;

        // Get all fields from all sections
        const allFields = allSections.flatMap(section => section.fields || []);

        allFields.forEach((field: any) => {
            if (!field.is_shown_by_default) return;

            const fieldName = `custom_fields.${field.id}`;
            const value = customFields[field.id];
            const isRequired = !field.is_nullable;

            // Check if required field is empty
            if (isRequired) {
                if (value === undefined || value === null || value === '' ||
                    (Array.isArray(value) && value.length === 0)) {
                    errors[fieldName] = `${field.name} is required`;
                    isValid = false;
                }
            }

            // Type-specific validation - only if value is provided
            if (value !== undefined && value !== null && value !== '') {
                switch (field.data_type) {
                    case 'integer':
                        // Check if value is a string that can't be parsed as integer
                        if (typeof value === 'string' && isNaN(parseInt(value))) {
                            errors[fieldName] = `${field.name} must be a valid integer`;
                            isValid = false;
                        } else if (typeof value === 'number' && !Number.isInteger(value)) {
                            errors[fieldName] = `${field.name} must be a valid integer`;
                            isValid = false;
                        }
                        break;
                    case 'float':
                        // Check if value is a string that can't be parsed as float
                        if (typeof value === 'string' && isNaN(parseFloat(value))) {
                            errors[fieldName] = `${field.name} must be a valid number`;
                            isValid = false;
                        } else if (typeof value === 'number' && isNaN(value)) {
                            errors[fieldName] = `${field.name} must be a valid number`;
                            isValid = false;
                        }
                        break;
                    case 'text':
                        if (field.enum_types && field.enum_types.length > 0) {
                            if (field.is_multiple_values) {
                                if (!Array.isArray(value) || !value.every(v => field.enum_types.includes(v))) {
                                    errors[fieldName] = `${field.name} contains invalid selections`;
                                    isValid = false;
                                }
                            } else {
                                if (!field.enum_types.includes(value)) {
                                    errors[fieldName] = `${field.name} must be one of the available options`;
                                    isValid = false;
                                }
                            }
                        }
                        break;
                }
            }
        });

        return { isValid, errors };
    };

    // Helper function to upload photos
    const uploadPhotos = async (itemId: string) => {
        if (!orgId || photos.length === 0) return;
        try {
            // Filter only new photos that have files
            const newPhotos = photos.filter(photo => photo.file);
            for (let i = 0; i < newPhotos.length; i++) {
                const photo = newPhotos[i];
                if (!photo.file) continue;
                try {
                    await postOrgItemPhotos(
                        orgId,
                        itemId,
                        photo.name,
                        photo.file?.type || '',
                        photo.file?.size || 0,
                        photo.file
                    );
                } catch (error) {
                    console.error(`Error uploading photo ${photo.name}`);
                    toast.error(`Error uploading ${photo.name}`);
                }
            }
        } catch (error) {
            console.error('Error uploading photos');
            toast.error('Some photos failed to upload');
        }
    };

    // Helper function to delete photos
    const deletePhotos = async (itemId: string) => {
        if (!orgId || photosToDelete.length === 0) return;
        try {
            for (const photoId of photosToDelete) {
                try {
                    await deleteOrgItemPhotos(orgId, itemId, photoId);
                } catch (error) {
                    console.error(`Error deleting photo ${photoId}`);
                    toast.error(`Error deleting photo`);
                }
            }
        } catch (error) {
            console.error('Error deleting photos');
            toast.error('Some photos failed to delete');
        }
    };

    // Helper function to reorder photos
    const reorderPhotos = async (itemId: string) => {
        if (!orgId || !photosReordered) return;
        try {
            // Only include existing photos with IDs
            const existingPhotos = photos.filter(photo => photo.id);
            if (existingPhotos.length === 0) return;

            const payload = {
                item_photos: existingPhotos.map((photo) => ({
                    id: photo.id,
                    position: photo.position ?? photo.order,
                })),
            };

            await patchOrgItemPhotos(orgId, itemId, payload);
        } catch (error) {
            console.error('Error reordering photos');
            toast.error('Failed to reorder photos');
        }
    };

    // Handle photo deletion
    const handlePhotoDelete = (photoId: string) => {
        setPhotosToDelete(prev => [...prev, photoId]);
    };

    // Handle photo reordering
    const handlePhotoReorder = (reorderedPhotos: PhotoItem[]) => {
        setPhotos(reorderedPhotos);
        setPhotosReordered(true);
    };

    const onSubmit = async (values: FormValues) => {
        if (!orgId) {
            toast.error('Organization ID is required');
            return;
        }

        // Validate custom fields before submission
        const customFieldsValidation = validateCustomFields(values.custom_fields, sections);
        if (!customFieldsValidation.isValid) {
            // Set form errors for invalid custom fields
            Object.entries(customFieldsValidation.errors).forEach(([fieldName, error]) => {
                form.setError(fieldName as any, { type: 'manual', message: error });
            });
            toast.error('Please fix the errors in custom fields before submitting');
            return;
        }

        // Transform and validate the data using the processing schema
        const transformResult = baseFormSchema.safeParse(values);
        if (!transformResult.success) {
            toast.error('Please check your input values');
            return;
        }

        setIsLoading(true);
        try {
            // Prepare the payload - separate custom fields from regular fields
            const { custom_fields, ...regularFields } = transformResult.data;

            // Prepare custom fields for submission
            let fieldsPayload = {};
            if (custom_fields && Object.keys(custom_fields).length > 0) {
                // Filter out empty custom field values and convert Date objects to ISO strings
                fieldsPayload = Object.fromEntries(
                    Object.entries(custom_fields)
                        .filter(([_, value]) => {
                            // Keep the value if it's not null, undefined, or empty string
                            if (value === null || value === undefined || value === '') return false;
                            // For arrays (multi-select), keep if not empty
                            if (Array.isArray(value)) return value.length > 0;
                            // For booleans, always keep (false is a valid value)
                            if (typeof value === 'boolean') return true;
                            // For numbers, keep (0 is a valid value)
                            if (typeof value === 'number') return true;
                            // For Date objects, keep
                            if (value instanceof Date) return true;
                            return true;
                        })
                        .map(([key, value]) => {
                            // Convert Date objects to ISO strings for API
                            if (value instanceof Date) {
                                return [key, value.toISOString()];
                            }
                            return [key, value];
                        })
                );
            }

            // Combine regular fields with custom fields
            const finalPayload = {
                ...regularFields,
                ...(Object.keys(fieldsPayload).length > 0 && { fields: fieldsPayload })
            };

            // Avoid empty strings for fields that are not required change for null
            Object.keys(finalPayload).forEach(key => {
                if (finalPayload[key] === '') {
                    finalPayload[key] = null;
                }
            });

            console.log(`${mode === 'update' ? 'Updating' : 'Creating'} item data:`, finalPayload);

            let response;
            if (mode === 'update' && item?.id) {
                response = await patchOrgItem(orgId, item.id, finalPayload);
            } else {
                response = await postOrgItems(orgId, finalPayload);
            }

            if (response.success) {
                const successMessage = mode === 'update'
                    ? t('items.itemUpdatedSuccess', 'Item updated successfully')
                    : t('items.itemCreatedSuccess', 'Item created successfully');
                toast.success(successMessage);

                const itemId = mode === 'create' ? response.success.item_id : item?.id;

                if (itemId) {
                    // Handle photos for both create and update modes
                    // 1. Delete photos marked for deletion
                    if (mode === 'update') {
                        await deletePhotos(itemId);
                    }

                    // 2. Upload new photos
                    await uploadPhotos(itemId);

                    // 3. Reorder existing photos if needed
                    if (mode === 'update') {
                        await reorderPhotos(itemId);
                    }
                }

                form.reset();
                setPhotos([]); // Clear photos state
                setPhotosToDelete([]); // Clear deletion queue
                setPhotosReordered(false); // Reset reorder flag
                onOpenChange(false);
                if (onItemCreated) {
                    onItemCreated();
                }
            } else {
                const errorMessage = mode === 'update'
                    ? t('items.patchItemError', 'Failed to update item')
                    : t('items.postItemError', 'Failed to create item');
                toast.error(response.error || errorMessage);
            }
        } catch (error) {
            console.error(`Error ${mode === 'update' ? 'updating' : 'creating'} item:`, error);
            const errorMessage = mode === 'update'
                ? t('items.patchItemError', 'Failed to update item')
                : t('items.postItemError', 'Failed to create item');
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenChange = async (open: boolean) => {
        if (!open) {
            if (form.formState.isDirty || photosToDelete.length > 0 || photosReordered) {
                const discard = await promptUnsavedChanges();
                if (discard) {
                    form.reset();
                    setPhotos([]);
                    setPhotosToDelete([]);
                    setPhotosReordered(false);
                    onOpenChange(false);
                }
            } else {
                form.reset();
                setPhotos([]);
                setPhotosToDelete([]);
                setPhotosReordered(false);
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

    const fetchSections = async () => {
        const response = await getOrgSections(orgId || "", "Items");
        if (response.success) {
            setSections(response.success.sections);
        }
    };

    // Helper functions to filter sections
    const getBasicSection = () => sections.find(section => section.handler === 'basic');
    const getOtherSections = () => sections.filter(section =>
        section.handler !== 'basic' && section.handler !== 'financials'
    );

    // Reset form when modal opens/closes
    useEffect(() => {
        if (open) {
            fetchSections();
            if (mode === 'update' && item) {
                // Add a small delay to ensure sections are loaded first
                setTimeout(() => {
                    populateFormWithItemData(item);
                }, 137);
            } else {
                form.reset();
                setPhotos([]);
                setPhotosToDelete([]);
                setPhotosReordered(false);
            }
        }
    }, [open, form, mode, item]);

    // Measure options with display names
    const measureOptions = [
        { value: 'uts', label: t('items.measure.uts', 'Units') },
        { value: 'pcs', label: t('items.measure.pcs', 'Pieces (pcs)') },
        { value: 'hrs', label: t('items.measure.hrs', 'Hours (hrs)') },
        { value: 'cm', label: t('items.measure.cm', 'Centimeters (cm)') },
        { value: 'm', label: t('items.measure.m', 'Meters (m)') },
        { value: 'kg', label: t('items.measure.kg', 'Kilograms (kg)') },
        { value: 'g', label: t('items.measure.g', 'Grams (g)') },
        { value: 'l', label: t('items.measure.l', 'Liters (L)') },
        { value: 'ml', label: t('items.measure.ml', 'Milliliters (mL)') },
    ];

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="max-w-3xl md:min-w-3xl"
                showCloseButton={false}
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold mb-4">
                        {mode === 'update'
                            ? t('items.updateItem', 'Update Item')
                            : t('items.createNewItem', 'Create New Item')
                        }
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <div className="space-y-6 overflow-y-auto max-h-[70vh] px-2 scrollbar-hide mb-16">
                        {/* Required Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start justify-start">
                            <GalleryPhotosItems
                                existingPhotos={useMemo(() => item?.photos || [], [item?.photos])}
                                onChange={setPhotos}
                                onReorder={handlePhotoReorder}
                                onDelete={handlePhotoDelete}
                            />
                            <div className='flex flex-col gap-4'>
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel>
                                                {t('items.name', 'Name')} *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder={t('items.enterName', 'Item name')}
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
                                        <FormItem className="col-span-2">
                                            <FormLabel>
                                                {t('items.description', 'Description')}
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder={t('items.enterDescription', 'Item description')}
                                                    {...field}
                                                    disabled={isLoading}
                                                    rows={4}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                        </div>

                        <Tabs defaultValue="basic">
                            <TabsList className="w-full justify-start border-b-2 border-border bg-background mb-4" activeClassName='border-b-2 border-primary -mb-1.5'>
                                <TabsTrigger className="py-0" value="basic">{t('items.basicInformation', 'Basic')}</TabsTrigger>
                                {mode === 'create' && (
                                    <>
                                        <TabsTrigger className="py-0" value="sell-prices">{t('items.sellPrice', 'Sell Price')}</TabsTrigger>
                                        <TabsTrigger className="py-0" value="buy-prices">{t('items.buyPrice', 'Buy Price')}</TabsTrigger>
                                    </>
                                )}
                                {getOtherSections().map((section) => (
                                    <TabsTrigger key={section.id} className="py-0" value={section.id}>
                                        {section.title}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            <TabsContents className='p-1'>
                                <TabsContent value="basic">
                                    {/* Basic Information */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start justify-start">
                                        {/* PMC Configuration */}
                                        <FormField
                                            control={form.control}
                                            name="is_pmc_fixed"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 col-span-1">
                                                    <div className="space-y-0.5">
                                                        <FormLabel>
                                                            {t('items.isFixedPmc', 'Fixed Cost Price')}
                                                        </FormLabel>
                                                        <FormDescription>
                                                            {t('items.isFixedPmcDescription', 'Check if this item has a fixed cost price (not automatically calculated)')}
                                                        </FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value ?? false}
                                                            onCheckedChange={field.onChange}
                                                            disabled={isLoading}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        {form.watch('is_pmc_fixed') ? (
                                            // Show Price/Cost when PMC is fixed
                                            <FormField
                                                control={form.control}
                                                name="pmc"
                                                render={({ field }) => (
                                                    <FormItem className="col-span-1">
                                                        <FormLabel>
                                                            {t('items.priceCost', 'Cost Price')}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                placeholder={t('items.enterPriceCost', 'Enter cost price')}
                                                                {...field}
                                                                disabled={isLoading}
                                                            />
                                                        </FormControl>
                                                        <FormDescription>
                                                            {t('items.priceCostDescription', 'The fixed cost price for this item.')}
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        ) : (
                                            // Show Calculation Window when PMC is calculated
                                            <FormField
                                                control={form.control}
                                                name="cost_calc_days"
                                                render={({ field }) => (
                                                    <FormItem className="col-span-1">
                                                        <FormLabel>
                                                            {t('items.calculationWindow', 'Calculation Window (days)')}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max="365"
                                                                placeholder={t('items.enterCalculationWindow', 'Number of days')}
                                                                {...field}
                                                                disabled={isLoading}
                                                            />
                                                        </FormControl>
                                                        <FormDescription>
                                                            {t('items.calculationWindowDescription', 'Number of days to calculate a weighted median of purchases to determine the cost price')}
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                        <div className="flex items-center justify-between gap-2 col-span-2">
                                            <h3 className="text-sm font-bold my-4 text-muted-foreground border-b border-border pb-2 flex-1">{t('items.categorization', 'Categorization')}</h3>
                                        </div>


                                        <FormField
                                            control={form.control}
                                            name="item_hierarchy_id"
                                            render={({ field }) => (
                                                <FormItem className="col-span-2">
                                                    <FormLabel>
                                                        {t('items.itemHierarchy', 'Item Hierarchy')}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <MultiSelectApiHierarchy
                                                            className="w-full col-span-2"
                                                            fetchOptions={getOrgsItemsHierarchies}
                                                            fetchArgs={[orgId || '']}
                                                            optionsKey="items_hierarchies"
                                                            defaultItems={lastHierarchyItem ? [lastHierarchyItem] : undefined}
                                                            parentKey="parent"
                                                            customValueKey={(item) => item.id}
                                                            customLabelKey={(item) => <IconLabel icon={item.icon || null} text={item.name} color={item.color} showEmptyColor={false} />}
                                                            placeholder={t('items.selectHierarchy', 'Select hierarchy')}
                                                            searchPlaceholder={t('items.searchHierarchies', 'Search hierarchies...')}
                                                            value={field.value ? [field.value] : []}
                                                            onChangeValue={(value) => field.onChange(value[0] || null)}
                                                            disabled={isLoading}
                                                            maxCount={1}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />


                                        <div className="flex items-center justify-between gap-2 col-span-2">
                                            <h3 className="text-sm font-bold my-4 text-muted-foreground border-b border-border pb-2 flex-1">{t('items.logistics', 'Logistics')}</h3>
                                        </div>
                                        {/* Item Code */}
                                        <FormField
                                            control={form.control}
                                            name="item_code"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {t('items.itemCode', 'SKU')}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder={t('items.enterItemCode', 'Internal SKU')}
                                                            {...field}
                                                            disabled={isLoading}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        {/* Measure */}
                                        <FormField
                                            control={form.control}
                                            name="measure"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {t('items.measure', 'Measure')}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder={t('items.selectMeasure', 'Select measure')} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {measureOptions.map((measure) => (
                                                                    <SelectItem key={measure.value} value={measure.value}>
                                                                        {measure.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="barcode"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {t('items.barcode', 'Barcode')}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder={t('items.enterBarcode', 'Barcode')}
                                                            {...field}
                                                            disabled={isLoading}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        {t('items.barcodeDescription', 'Internal barcode of the item')}
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Custom Fields for Basic Section */}
                                    {getBasicSection() && getBasicSection()?.fields && getBasicSection()?.fields.length > 0 && (
                                        <div className="mt-4">
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className="text-sm font-bold mb-4 text-muted-foreground border-b border-border pb-2 flex-1">{t('items.customFields', 'Custom Fields')}</h3>
                                                <Button variant="ghost" size="icon" onClick={() => navigate(`/${orgId}/admin/fields/items`)}>
                                                    <Settings className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </div>
                                            <CustomFieldsSection
                                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                                fields={getBasicSection()?.fields || []}
                                                form={form}
                                                disabled={isLoading}
                                            />
                                        </div>
                                    )}
                                </TabsContent>

                                {mode === 'create' && (<TabsContent value="sell-prices">
                                    <div className="space-y-6">
                                        <ItemSellPricesSection
                                            form={form}
                                            isLoading={isLoading}
                                            orgId={orgId as string}
                                        />
                                    </div>
                                </TabsContent>)}

                                {mode === 'create' && (
                                    <TabsContent value="buy-prices">
                                        <div className="space-y-6">
                                            <ItemBuyPricesSection
                                                form={form}
                                                isLoading={isLoading}
                                                orgId={orgId as string}
                                            />
                                        </div>
                                    </TabsContent>
                                )}

                                {getOtherSections().map((section) => (
                                    <TabsContent key={section.id} value={section.id}>
                                        <div className="space-y-6">
                                            {section.fields && section.fields.length > 0 ? (
                                                <div className="mt-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <h3 className="text-sm font-bold mb-4 text-muted-foreground border-b border-border pb-2 flex-1">{t('items.customFields', 'Custom Fields')}</h3>
                                                        <Button variant="ghost" size="icon" onClick={() => navigate(`/${orgId}/admin/fields/items`)}>
                                                            <Settings className="h-4 w-4 text-muted-foreground" />
                                                        </Button>
                                                    </div>
                                                    <CustomFieldsSection
                                                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                                        fields={section.fields}
                                                        form={form}
                                                        disabled={isLoading}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="text-center py-8">
                                                    <p className="text-muted-foreground text-sm">
                                                        {t('items.noFieldsInSection', 'No fields configured for this section yet.')}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                ))}
                            </TabsContents>
                        </Tabs>

                        <DialogFooter className="flex-col sm:flex-row gap-2 fixed bottom-0 left-0 right-0 bg-background p-4 rounded-b-lg">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                disabled={isLoading}
                            >
                                {t('common.cancel', 'Cancel')}
                            </Button>
                            <Button
                                type="submit"
                                onClick={form.handleSubmit(onSubmit)}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {mode === 'update'
                                            ? t('items.updatingItem', 'Updating Item...')
                                            : t('items.creatingItem', 'Creating Item...')
                                        }
                                    </>
                                ) : (
                                    mode === 'update'
                                        ? t('items.updateItem', 'Update Item')
                                        : t('items.createItem', 'Create Item')
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default NewItemModal;

