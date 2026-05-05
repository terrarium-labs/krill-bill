import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { postLocation, patchLocation } from '@/api/orgs/locations/locations';
import { StockLocation } from '@/types/items/stock';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CountriesInput from '@/app/components/forms-elements/countries-input';
import { Textarea } from '@/components/ui/textarea';
import { IconPicker } from '@/components/ui/icon-picker';
import { IconName } from 'lucide-react/dynamic';
import { getCoordinates } from '@/api/mapbox/mapbox';
import { promptUnsavedChanges } from '@/app/components/forms-elements/modal-unsaved';
import { MultiSelectApi } from '@/app/components/forms-elements/multi-select-api';
import { getOrgVehicles } from '@/api/orgs/vehicles/vehicles';
import VehicleLabel from '@/app/components/labels/vehicle-label';
import { Vehicle } from '@/types/general/vehicles';

interface WarehouseEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onLocationCreatedOrUpdated?: () => void;
    onLocationCreated?: () => void;
    location?: StockLocation | null;
    mode?: 'create' | 'update';
}

const formSchema = z.object({
    name: z
        .string()
        .min(1, 'Name is required')
        .min(2, 'Name must be at least 2 characters')
        .max(128, 'Name must be less than 128 characters')
        .trim(),
    status: z.enum(['active', 'inactive']),
    address_line_1: z
        .string()
        .min(1, 'Address line 1 is required')
        .max(255, 'Address line 1 must be less than 255 characters'),
    address_line_2: z
        .string()
        .max(255, 'Address line 2 must be less than 255 characters')
        .optional(),
    city: z
        .string()
        .min(1, 'City is required')
        .max(100, 'City must be less than 100 characters'),
    state_province: z
        .string()
        .min(1, 'State/Province is required')
        .max(100, 'State/Province must be less than 100 characters'),
    postal_code: z
        .string()
        .min(1, 'Postal code is required')
        .max(20, 'Postal code must be less than 20 characters'),
    country: z
        .string()
        .min(1, 'Country is required')
        .max(100, 'Country must be less than 100 characters'),
    notes: z
        .string()
        .max(500, 'Notes must be less than 500 characters')
        .optional(),
    distance: z
        .string()
        .optional()
        .refine((val) => {
            if (!val) return true;
            const num = parseFloat(val);
            return !isNaN(num) && num >= 0;
        }, 'Must be a valid number'),
    time_to_travel: z
        .string()
        .optional()
        .refine((val) => {
            if (!val) return true;
            const num = parseInt(val);
            return !isNaN(num) && num >= 0;
        }, 'Must be a valid number'),
    latitude: z
        .string()
        .min(1, 'Latitude is required')
        .refine((val) => {
            if (!val) return true;
            const num = parseFloat(val);
            return !isNaN(num) && num >= -90 && num <= 90;
        }, 'Must be a valid latitude between -90 and 90'),
    longitude: z
        .string()
        .min(1, 'Longitude is required')
        .refine((val) => {
            if (!val) return true;
            const num = parseFloat(val);
            return !isNaN(num) && num >= -180 && num <= 180;
        }, 'Must be a valid longitude between -180 and 180'),
    icon_url: z.string().optional(),
    stock_rotation_type: z.enum(['fifo', 'lifo', 'fefo', 'lefo', 'hifo', 'lofo']).optional(),
    vehicle_id: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const WarehouseEditModal: React.FC<WarehouseEditModalProps> = ({
    open,
    onOpenChange,
    onLocationCreatedOrUpdated,
    onLocationCreated,
    location,
    mode = 'create',
}) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedVehicleData, setSelectedVehicleData] = useState<Vehicle[]>([]);

    const notifyLocationSaved = () => {
        if (onLocationCreatedOrUpdated) {
            onLocationCreatedOrUpdated();
            return;
        }
        onLocationCreated?.();
    };

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            status: 'active',
            address_line_1: '',
            address_line_2: '',
            city: '',
            state_province: '',
            postal_code: '',
            country: 'ES',
            notes: '',
            distance: '',
            time_to_travel: '',
            latitude: '',
            longitude: '',
            icon_url: '',
            stock_rotation_type: 'fifo',
            vehicle_id: '',
        },
    });

    // Reset form when modal opens or location changes
    useEffect(() => {
        if (open) {
            if (mode === 'update' && location) {
                form.reset({
                    name: location.name || '',
                    status: location.status || 'active',
                    address_line_1: location.address_line_1 || '',
                    address_line_2: location.address_line_2 || '',
                    city: location.city || '',
                    state_province: location.state_province || '',
                    postal_code: location.postal_code || '',
                    country: location.country || '',
                    notes: location.notes || '',
                    distance: location.distance?.toString() || '',
                    time_to_travel: location.time_to_travel?.toString() || '',
                    latitude: location.latitude?.toString() || '',
                    longitude: location.longitude?.toString() || '',
                    icon_url: location.icon_url || '',
                    stock_rotation_type: location.stock_rotation_type || 'fifo',
                    vehicle_id: location.vehicle?.id || '',
                });
                setSelectedVehicleData(location.vehicle ? [location.vehicle] : []);
            } else {
                form.reset({
                    name: '',
                    status: 'active',
                    address_line_1: '',
                    address_line_2: '',
                    city: '',
                    state_province: '',
                    postal_code: '',
                    country: 'ES',
                    notes: '',
                    distance: '',
                    time_to_travel: '',
                    latitude: '',
                    longitude: '',
                    icon_url: '',
                    stock_rotation_type: 'fifo',
                    vehicle_id: '',
                });
                setSelectedVehicleData([]);
            }
        }
    }, [open, location, mode, form]);

    const onSubmit = async (values: FormValues) => {
        if (!orgId) {
            toast.error(t('common.error', 'An error occurred'));
            return;
        }

        setIsSubmitting(true);

        try {
            // Transform form values to API format
            const apiData = {
                name: values.name,
                status: values.status,
                address_line_1: values.address_line_1 || undefined,
                address_line_2: values.address_line_2 || undefined,
                city: values.city || undefined,
                state_province: values.state_province || undefined,
                postal_code: values.postal_code || undefined,
                country: values.country || undefined,
                notes: values.notes || undefined,
                distance: values.distance ? parseFloat(values.distance) : undefined,
                time_to_travel: values.time_to_travel ? parseInt(values.time_to_travel) : undefined,
                latitude: values.latitude ? parseFloat(values.latitude) : undefined,
                longitude: values.longitude ? parseFloat(values.longitude) : undefined,
                icon_url: values.icon_url || undefined,
                stock_rotation_type: values.stock_rotation_type || undefined,
                vehicle_id: values.vehicle_id || undefined,
            };

            let response;
            if (mode === 'update' && location?.id) {
                response = await patchLocation(orgId, location.id, apiData);
            } else {
                response = await postLocation(orgId, apiData);
            }

            if (response.success) {
                toast.success(
                    mode === 'update'
                        ? t('warehouses.locationUpdated', 'Location updated successfully')
                        : t('warehouses.locationCreated', 'Location created successfully')
                );
                notifyLocationSaved();
                onOpenChange(false);
            } else {
                toast.error(
                    mode === 'update'
                        ? t('warehouses.errorUpdatingLocation', 'Error updating location')
                        : t('warehouses.errorCreatingLocation', 'Error creating location')
                );
            }
        } catch (error) {
            toast.error(
                mode === 'update'
                    ? t('warehouses.errorUpdatingLocation', 'Error updating location')
                    : t('warehouses.errorCreatingLocation', 'Error creating location')
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const getCoordinatesFromAddress = async (address: string) => {
        const res = await getCoordinates(address);
        if (res.success) {
            form.setValue('latitude', res.success.features[0].geometry.coordinates[1].toString());
            form.setValue('longitude', res.success.features[0].geometry.coordinates[0].toString());
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (form.watch('address_line_1')) {
                const text = [
                    form.watch('address_line_1'),
                    form.watch('address_line_2'),
                    form.watch('city'),
                    form.watch('state_province'),
                    form.watch('postal_code'),
                    form.watch('country')].filter(Boolean).join(', ');

                getCoordinatesFromAddress(text);
            }
        }, 537);
        return () => {
            clearTimeout(timeout);
        };
    }, [form.watch('address_line_1')]);

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

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="max-w-3xl md:min-w-3xl"
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
                showCloseButton={false}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold mb-4">
                        {mode === 'update'
                            ? t('warehouses.editLocation', 'Edit Location')
                            : t('warehouses.addLocation', 'Add Location')}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <div className="space-y-6 overflow-y-auto max-h-[70vh] px-2 scrollbar-hide mb-16">
                        {/* Top Row: Name, Status, Icon - 3 columns */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start justify-start">
                            {/* Name */}
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('warehouses.name', 'Name')} *
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder={t('warehouses.namePlaceholder', 'Enter location name')}
                                                disabled={isSubmitting}
                                                autoFocus
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Status */}
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('warehouses.status', 'Status')} *
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="active">{t('common.active', 'Active')}</SelectItem>
                                                <SelectItem value="inactive">{t('common.inactive', 'Inactive')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Icon */}
                            <FormField
                                control={form.control}
                                name="icon_url"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('warehouses.icon', 'Icon')}</FormLabel>
                                        <FormControl>
                                            <IconPicker
                                                searchable={false}
                                                categorized={false}
                                                iconsList={[{
                                                    name: 'warehouse',
                                                    categories: [],
                                                    tags: [],
                                                }, {
                                                    name: 'building',
                                                    categories: [],
                                                    tags: [],
                                                }, {
                                                    name: 'factory',
                                                    categories: [],
                                                    tags: [],
                                                }, {
                                                    name: 'store',
                                                    categories: [],
                                                    tags: [],
                                                }, {
                                                    name: 'truck',
                                                    categories: [],
                                                    tags: [],
                                                }, {
                                                    name: 'map-pin',
                                                    categories: [],
                                                    tags: [],
                                                }, {
                                                    name: 'package',
                                                    categories: [],
                                                    tags: [],
                                                }, {
                                                    name: 'box',
                                                    categories: [],
                                                    tags: [],
                                                }]}
                                                value={field.value as IconName}
                                                onValueChange={(icon) => field.onChange(icon)}
                                                searchPlaceholder={t('common.searchIcon', 'Search icon...')}
                                                triggerPlaceholder={t('common.selectIcon', 'Select icon')}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Two Column Layout: Address | Other Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start justify-start">
                            {/* Left Column: Address Information */}
                            <div className="col-span-1 grid grid-cols-1 md:grid-cols-2 gap-4 items-start justify-start">
                                {/* Address Line 1 */}
                                <FormField
                                    control={form.control}
                                    name="address_line_1"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel>{t('warehouses.addressLine1', 'Address')} *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder={t('warehouses.enterAddressLine1', 'Street address')}
                                                    disabled={isSubmitting}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Address Line 2 */}
                                <FormField
                                    control={form.control}
                                    name="address_line_2"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel>{t('warehouses.addressLine2', 'Address Line 2')}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder={t('warehouses.enterAddressLine2', 'Apartment, suite, etc.')}
                                                    disabled={isSubmitting}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* City */}
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('warehouses.city', 'City')} *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder={t('warehouses.enterCity', 'City')}
                                                    disabled={isSubmitting}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Postal Code */}
                                <FormField
                                    control={form.control}
                                    name="postal_code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('warehouses.postalCode', 'Postal Code')} *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder={t('warehouses.enterPostalCode', 'Postal code')}
                                                    disabled={isSubmitting}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* State/Province */}
                                <FormField
                                    control={form.control}
                                    name="state_province"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('warehouses.stateProvince', 'State/Province')} *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder={t('warehouses.enterStateProvince', 'State or province')}
                                                    disabled={isSubmitting}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Country */}
                                <CountriesInput
                                    form={form}
                                    name="country"
                                    label={t('warehouses.country', 'Country') + ' *'}
                                    defaultValue={'ES'}
                                />
                            </div>

                            {/* Right Column: Other Information */}
                            <div className="col-span-1 grid grid-cols-1 md:grid-cols-2 gap-4 items-start justify-start">
                                {/* Distance */}
                                <FormField
                                    control={form.control}
                                    name="distance"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel>{t('warehouses.distance', 'Distance (km)')}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    step="0.1"
                                                    placeholder={t('warehouses.enterDistance', 'Distance')}
                                                    disabled={isSubmitting}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Time to Travel */}
                                <FormField
                                    control={form.control}
                                    name="time_to_travel"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel>{t('warehouses.timeToTravel', 'Time to Travel (min)')}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    placeholder={t('warehouses.enterTimeToTravel', 'Minutes')}
                                                    disabled={isSubmitting}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Latitude */}
                                <FormField
                                    control={form.control}
                                    name="latitude"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('warehouses.latitude', 'Latitude') + ' *'}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    step="0.000001"
                                                    placeholder={t('warehouses.enterLatitude', 'Latitude')}
                                                    disabled={isSubmitting}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Longitude */}
                                <FormField
                                    control={form.control}
                                    name="longitude"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('warehouses.longitude', 'Longitude') + ' *'}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    step="0.000001"
                                                    placeholder={t('warehouses.enterLongitude', 'Longitude')}
                                                    disabled={isSubmitting}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Warehouse-specific fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start justify-start">
                            {/* Stock Rotation Type */}
                            <FormField
                                control={form.control}
                                name="stock_rotation_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('warehouses.stockRotationType', 'Stock Rotation Type')}</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="fifo">{t('warehouses.fifo', 'FIFO - First In First Out')}</SelectItem>
                                                <SelectItem value="lifo">{t('warehouses.lifo', 'LIFO - Last In First Out')}</SelectItem>
                                                <SelectItem value="fefo">{t('warehouses.fefo', 'FEFO - First Expired First Out')}</SelectItem>
                                                <SelectItem value="lefo">{t('warehouses.lefo', 'LEFO - Last Expired First Out')}</SelectItem>
                                                <SelectItem value="hifo">{t('warehouses.hifo', 'HIFO - Highest In First Out')}</SelectItem>
                                                <SelectItem value="lofo">{t('warehouses.lofo', 'LOFO - Lowest In First Out')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Vehicle MultiSelectApi component */}
                            <FormField
                                control={form.control}
                                name="vehicle_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('warehouses.vehicle', 'Vehicle')}</FormLabel>
                                        <FormControl>
                                            <MultiSelectApi
                                                fetchOptions={getOrgVehicles}
                                                fetchArgs={[orgId || ""]}
                                                optionsKey="vehicles"
                                                customValueKey={(item: { id: string }) => item.id}
                                                customLabelKey={(item: Vehicle) => (
                                                    <VehicleLabel data={item} hide={["icon"]} className="max-w-xs truncate" />
                                                )}
                                                customSelectedLabelKey={(item: Vehicle) => (
                                                    <VehicleLabel data={item} hide={["icon"]} className="max-w-xs truncate" />
                                                )}
                                                value={field.value ? [field.value] : []}
                                                onChangeValue={(values) => field.onChange(values[0] || "")}
                                                onChangeValueWithItem={(_values, itemsMap) =>
                                                    setSelectedVehicleData(Array.from(itemsMap.values()))
                                                }
                                                defaultItems={selectedVehicleData}
                                                maxCount={1}
                                                className="w-full"
                                                disabled={isSubmitting}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Notes Section */}
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem className="col-span-2">
                                    <FormLabel>{t('warehouses.notes', 'Notes')}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t('warehouses.enterNotes', 'Notes')}
                                            {...field}
                                            disabled={isSubmitting}
                                            rows={3}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="flex-col sm:flex-row gap-2 fixed bottom-0 left-0 right-0 bg-background p-4">
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
                                        {mode === 'update'
                                            ? t('warehouses.updatingWarehouse', 'Updating Warehouse...')
                                            : t('warehouses.creatingWarehouse', 'Creating Warehouse...')
                                        }
                                    </>
                                ) : (
                                    mode === 'update'
                                        ? t('warehouses.updateWarehouse', 'Update Warehouse')
                                        : t('warehouses.createWarehouse', 'Create Warehouse')
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default WarehouseEditModal;

