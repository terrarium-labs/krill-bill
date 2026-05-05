import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';
import { useClient } from "@/app/dashboard/contexts/DashboardClientContext";
import { Loader2, Info, Calculator } from 'lucide-react';

import { useTranslation } from '@/hooks/useTranslation';
import { postClientLocation, patchClientLocation } from '@/api/clients/locations/locations';
import { Location } from '@/types/general/location';
import { CommutingRate } from '@/types/general/commuting-rates';
import { Workplace } from '@/types/general/workplaces';

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
import { DynamicIcon, IconName } from 'lucide-react/dynamic';
import { getCoordinates } from '@/api/mapbox/mapbox';
import { getDirections } from '@/api/mapbox/directions';
import { getWorkplaces } from '@/api/orgs/workplaces/workplaces';
import { MultiSelectApi } from '@/app/components/forms-elements/multi-select-api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { promptUnsavedChanges } from '@/app/components/forms-elements/modal-unsaved';
import { formatDecimal } from '@/utils/miscelanea';

interface NewLocationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onLocationCreated?: () => void;
    location?: Location | null;
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
    origin_workplace_id: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function calculateEstimatedCommuting(
    rate: CommutingRate,
    distanceKm: number,
): { total: number; fixed: number; distanceCost: number; effectiveDistanceCost: number; minApplied: boolean; hasTimeBillable: boolean } {
    let fixed = 0;
    let distanceCost = 0;

    if (rate.is_fixed_price && rate.fixed_price) {
        fixed = rate.fixed_price;
    }
    if (rate.is_price_per_km && rate.price_per_km && distanceKm > 0) {
        distanceCost = distanceKm * rate.price_per_km;
    }

    const minApplied = !!(rate.min_price && distanceCost > 0 && distanceCost < rate.min_price);
    const effectiveDistanceCost = minApplied ? rate.min_price! : distanceCost;
    const total = fixed + effectiveDistanceCost;

    return { total, fixed, distanceCost, effectiveDistanceCost, minApplied, hasTimeBillable: rate.is_travel_time_billable };
}

const EstimatedCommutingBreakdown: React.FC<{
    commutingRate: CommutingRate;
    distance: number;
    timeMinutes: number;
    t: (key: string, fallback: string) => string;
}> = ({ commutingRate, distance, timeMinutes, t }) => {
    const estimate = calculateEstimatedCommuting(commutingRate, distance);
    const parts: string[] = [];

    if (commutingRate.is_fixed_price && commutingRate.fixed_price) {
        parts.push(`${formatDecimal(estimate.fixed, { minFractionDigits: 2, maxFractionDigits: 2 })} €`);
    }
    if (commutingRate.is_price_per_km && commutingRate.price_per_km && distance > 0) {
        let kmPart = `${formatDecimal(distance, { minFractionDigits: 0, maxFractionDigits: 1 })} km × ${formatDecimal(commutingRate.price_per_km, { minFractionDigits: 2, maxFractionDigits: 2 })} €/km`;
        if (estimate.minApplied) {
            kmPart += ` (min. ${formatDecimal(commutingRate.min_price!, { minFractionDigits: 0, maxFractionDigits: 2 })} €)`;
        }
        parts.push(kmPart);
    }

    return (
        <div className="space-y-1">
            <div className="flex items-baseline gap-2">
                <span className="text-lg font-semibold">
                    {formatDecimal(estimate.total, { minFractionDigits: 2, maxFractionDigits: 2 })} €
                </span>
            </div>
            {parts.length > 0 && (
                <p className="text-xs text-muted-foreground">
                    {parts.join(' + ')}
                </p>
            )}
            {estimate.hasTimeBillable && (
                <p className="text-xs text-muted-foreground italic">
                    + {t('locations.travelTimeBillable', 'travel time billable')}
                    {timeMinutes > 0 && ` (${Math.floor(timeMinutes / 60)}h ${timeMinutes % 60}min)`}
                </p>
            )}
        </div>
    );
};

const NewLocationModal: React.FC<NewLocationModalProps> = ({
    open,
    onOpenChange,
    onLocationCreated,
    location,
    mode = 'create',
}) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const { client } = useClient();
    const clientId = client?.id ?? '';
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedWorkplaceId, setSelectedWorkplaceId] = useState<string[]>([]);
    const [selectedWorkplace, setSelectedWorkplace] = useState<Workplace | null>(null);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);
    const geocodeAbortRef = useRef<AbortController | null>(null);

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
            origin_workplace_id: '',
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
                    origin_workplace_id: location.origin_workplace?.id || '',
                });
                if (location.origin_workplace) {
                    setSelectedWorkplaceId([location.origin_workplace.id]);
                    setSelectedWorkplace(location.origin_workplace);
                } else {
                    setSelectedWorkplaceId([]);
                    setSelectedWorkplace(null);
                }
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
                    origin_workplace_id: '',
                });
                setSelectedWorkplaceId([]);
                setSelectedWorkplace(null);
            }
        }
    }, [open, location, mode, form]);

    const onSubmit = async (values: FormValues) => {
        if (!orgId || !clientId) {
            toast.error(t('common.error', 'An error occurred'));
            return;
        }

        setIsSubmitting(true);

        try {
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
                origin_workplace_id: values.origin_workplace_id || undefined,
            };

            let response;
            if (mode === 'update' && location?.id) {
                response = await patchClientLocation(orgId, clientId, location.id, apiData);
            } else {
                response = await postClientLocation(orgId, clientId, apiData);
            }

            if (response.success) {
                toast.success(
                    mode === 'update'
                        ? t('locations.locationUpdated', 'Location updated successfully')
                        : t('locations.locationCreated', 'Location created successfully')
                );
                onLocationCreated?.();
                onOpenChange(false);
            } else {
                toast.error(
                    mode === 'update'
                        ? t('locations.errorUpdatingLocation', 'Error updating location')
                        : t('locations.errorCreatingLocation', 'Error creating location')
                );
            }
        } catch (error) {
            toast.error(
                mode === 'update'
                    ? t('locations.errorUpdatingLocation', 'Error updating location')
                    : t('locations.errorCreatingLocation', 'Error creating location')
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

    const handleWorkplaceChange = useCallback((values: string[], items: Map<string, any>) => {
        setSelectedWorkplaceId(values);
        if (values.length > 0) {
            const item = items.get(values[0]);
            setSelectedWorkplace(item || null);
            form.setValue('origin_workplace_id', values[0], { shouldDirty: true });
        } else {
            setSelectedWorkplace(null);
            form.setValue('origin_workplace_id', '', { shouldDirty: true });
        }
    }, [form]);

    const geocodeWorkplace = useCallback(async (workplace: Workplace) => {
        geocodeAbortRef.current?.abort();
        const controller = new AbortController();
        geocodeAbortRef.current = controller;

        const addressParts = [
            workplace.address_line_1,
            workplace.city,
            workplace.postal_code,
            workplace.state_province,
            workplace.country,
        ].filter(Boolean);

        if (addressParts.length === 0) return null;

        try {
            const response = await getCoordinates(addressParts.join(', '));
            if (controller.signal.aborted) return null;

            if (response.success?.features?.[0]?.geometry?.coordinates) {
                const [lng, lat] = response.success.features[0].geometry.coordinates;
                return { lat, lng };
            }
        } catch {
            if (!controller.signal.aborted) return null;
        }
        return null;
    }, []);

    const fetchRouteAndFill = useCallback(async (
        origin: { lat: number; lng: number },
        dest: { lat: number; lng: number }
    ) => {
        setIsLoadingRoute(true);
        try {
            const result = await getDirections(
                [origin.lng, origin.lat],
                [dest.lng, dest.lat]
            );
            if (result?.routes?.[0]) {
                const route = result.routes[0];
                const distanceKm = (route.distance / 1000).toFixed(1);
                const durationMin = Math.round(route.duration / 60).toString();
                form.setValue('distance', distanceKm, { shouldDirty: true });
                form.setValue('time_to_travel', durationMin, { shouldDirty: true });
            }
        } catch {
            // keep existing values on error
        } finally {
            setIsLoadingRoute(false);
        }
    }, [form]);

    useEffect(() => {
        if (!selectedWorkplace) return;

        const lat = form.watch('latitude');
        const lng = form.watch('longitude');
        if (!lat || !lng) return;

        const destLat = parseFloat(lat);
        const destLng = parseFloat(lng);
        if (isNaN(destLat) || isNaN(destLng)) return;

        const calculate = async () => {
            const originCoords = await geocodeWorkplace(selectedWorkplace);
            if (originCoords) {
                await fetchRouteAndFill(originCoords, { lat: destLat, lng: destLng });
            }
        };

        calculate();
    }, [selectedWorkplace, form.watch('latitude'), form.watch('longitude'), geocodeWorkplace, fetchRouteAndFill]);

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
                            ? t('locations.editLocation', 'Edit Location')
                            : t('locations.addLocation', 'Add Location')}
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
                                            {t('locations.name', 'Name')} *
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder={t('locations.namePlaceholder', 'Enter location name')}
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
                                            {t('locations.status', 'Status')} *
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
                                        <FormLabel>{t('locations.icon', 'Icon')}</FormLabel>
                                        <FormControl>
                                            <IconPicker
                                                searchable={false}
                                                categorized={false}
                                                iconsList={[{
                                                    name: 'map-pin',
                                                    categories: [],
                                                    tags: [],
                                                }, {
                                                    name: 'building',
                                                    categories: [],
                                                    tags: [],
                                                }, {
                                                    name: 'house',
                                                    categories: [],
                                                    tags: [],
                                                }, {
                                                    name: 'store',
                                                    categories: [],
                                                    tags: [],
                                                }, {
                                                    name: 'warehouse',
                                                    categories: [],
                                                    tags: [],
                                                }, {
                                                    name: 'truck',
                                                    categories: [],
                                                    tags: [],
                                                }, {
                                                    name: 'factory',
                                                    categories: [],
                                                    tags: [],
                                                }, {
                                                    name: 'shopping-cart',
                                                    categories: [],
                                                    tags: [],
                                                }, {
                                                    name: 'printer',
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

                        {/* Address & Coordinates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start justify-start">
                            <FormField
                                control={form.control}
                                name="address_line_1"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>{t('locations.addressLine1', 'Address')} *</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder={t('locations.enterAddressLine1', 'Street address')}
                                                disabled={isSubmitting}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="address_line_2"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>{t('locations.addressLine2', 'Address Line 2')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder={t('locations.enterAddressLine2', 'Apartment, suite, etc.')}
                                                disabled={isSubmitting}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('locations.city', 'City')} *</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder={t('clients.enterCity', 'City')}
                                                disabled={isSubmitting}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="postal_code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('locations.postalCode', 'Postal Code')} *</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder={t('clients.enterPostalCode', 'Postal code')}
                                                disabled={isSubmitting}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="state_province"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('locations.stateProvince', 'State/Province')} *</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder={t('clients.enterStateProvince', 'State or province')}
                                                disabled={isSubmitting}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <CountriesInput
                                form={form}
                                name="country"
                                label={t('locations.country', 'Country') + ' *'}
                                defaultValue={'ES'}
                            />

                            <FormField
                                control={form.control}
                                name="latitude"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('locations.latitude', 'Latitude') + ' *'}</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="number"
                                                step="0.000001"
                                                placeholder={t('locations.enterLatitude', 'Latitude')}
                                                disabled={isSubmitting}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="longitude"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('locations.longitude', 'Longitude') + ' *'}</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="number"
                                                step="0.000001"
                                                placeholder={t('locations.enterLongitude', 'Longitude')}
                                                disabled={isSubmitting}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Commuting Section */}
                        <div className="space-y-4">
                            <Label className="text-sm font-semibold">
                                {t('locations.commuting', 'Commuting')}
                            </Label>

                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertTitle>{t('locations.commutingInfoTitle', 'Commuting Information')}</AlertTitle>
                                <AlertDescription>
                                    {t('locations.commutingInfoDescription', 'Distance and travel time are used to calculate commuting costs when traveling to this location. Select an origin workplace to auto-calculate these values.')}
                                </AlertDescription>
                            </Alert>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Origin Workplace */}
                                <div className="space-y-2 col-span-2">
                                    <Label>
                                        {t('locations.originWorkplace', 'Origin Workplace')}
                                    </Label>
                                    <MultiSelectApi
                                        fetchOptions={getWorkplaces}
                                        fetchArgs={[orgId || '']}
                                        optionsKey="workplaces"
                                        customValueKey={(item) => item.id}
                                        customLabelKey={(item) =>
                                            <div className="font-medium text-sm flex items-center gap-2">
                                                <DynamicIcon name={item.icon_url as any} className="h-4 w-4" />
                                                <span className="text-sm">{item.name}</span>
                                            </div>
                                        }
                                        value={selectedWorkplaceId}
                                        defaultItems={selectedWorkplace ? [selectedWorkplace] : undefined}
                                        onChangeValue={(values) => {
                                            setSelectedWorkplaceId(values);
                                            if (values.length === 0) {
                                                setSelectedWorkplace(null);
                                                form.setValue('origin_workplace_id', '', { shouldDirty: true });
                                            }
                                        }}
                                        onChangeValueWithItem={handleWorkplaceChange}
                                        maxCount={1}
                                        placeholder={t('locations.selectWorkplace', 'Select workplace...')}
                                        searchPlaceholder={t('common.search', 'Search...')}
                                        className="w-full"
                                    />
                                </div>

                                {/* Distance */}
                                <FormField
                                    control={form.control}
                                    name="distance"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('locations.distance', 'Distance (km)')}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    step="0.1"
                                                    placeholder={t('locations.enterDistance', 'Distance')}
                                                    disabled={isSubmitting || isLoadingRoute}
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
                                        <FormItem>
                                            <FormLabel>{t('locations.timeToTravel', 'Time to Travel (min)')}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    placeholder={t('locations.enterTimeToTravel', 'Minutes')}
                                                    disabled={isSubmitting || isLoadingRoute}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Estimated Commuting Price */}
                                {mode === 'update' && location?.commuting_rate && (
                                    <div className="col-span-2 rounded-lg border bg-muted/30 p-4 space-y-2">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <Calculator className="h-4 w-4" />
                                            {t('locations.estimatedCommutingPrice', 'Estimated Commuting Price')}
                                            <span className="text-xs text-muted-foreground font-normal">
                                                ({location.commuting_rate.name})
                                            </span>
                                        </div>
                                        <EstimatedCommutingBreakdown
                                            commutingRate={location.commuting_rate}
                                            distance={parseFloat(form.watch('distance') || '0')}
                                            timeMinutes={parseInt(form.watch('time_to_travel') || '0')}
                                            t={t}
                                        />
                                    </div>
                                )}
                            </div>

                            {isLoadingRoute && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    {t('locations.calculatingRoute', 'Calculating route...')}
                                </p>
                            )}
                        </div>

                        {/* Notes Section */}
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem className="col-span-2">
                                    <FormLabel>{t('locations.notes', 'Notes')}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t('locations.enterNotes', 'Notes')}
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
                                            ? t('locations.updatingLocation', 'Updating Location...')
                                            : t('locations.creatingLocation', 'Creating Location...')
                                        }
                                    </>
                                ) : (
                                    mode === 'update'
                                        ? t('locations.updateLocation', 'Update Location')
                                        : t('locations.createLocation', 'Create Location')
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default NewLocationModal;

