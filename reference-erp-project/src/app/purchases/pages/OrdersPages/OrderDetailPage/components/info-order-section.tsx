import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useOrder } from "../../contexts/OrderContext";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MultiSelectApi } from "@/app/components/forms-elements/multi-select-api";
import { MultiSelectApiHierarchy } from "@/app/components/forms-elements/multi-select-api-hierarchy";
import { DateTimePicker } from "@/app/components/forms-elements/date-time-picker";
import { getSuppliers } from "@/api/suppliers/suppliers";
import { getLocations } from "@/api/orgs/locations/locations";
import { getOrgOrderTypes } from "@/api/orgs/order-types/order-types";
import { SupplierAvatar } from "@/app/components/avatars/supplier-avatar";
import { DynamicIcon, IconName } from "lucide-react/dynamic";
import { useParams } from "react-router-dom";
import { Supplier } from "@/types/suppliers/supplier";
import { Location } from "@/types/general/location";
import { OrderType } from "@/types/general/order-types";

interface InfoOrderSectionProps {
    isReadOnly?: boolean;
}

const InfoOrderSection = ({ isReadOnly = false }: InfoOrderSectionProps) => {
    const { t } = useTranslation();
    const { order, setData } = useOrder();
    const { orgId } = useParams<{ orgId: string }>();

    const form = useForm({
        defaultValues: {
            order_date: order.order_date ? new Date(order.order_date) : undefined,
            supplier_id: order.supplier?.id || '',
            supplier_reference: order.supplier_reference || '',
            internal_reference: order.internal_reference || '',
            location_id: order.location?.id || '',
            order_type_id: order.order_type?.id || '',
            due_date: order.due_date ? new Date(order.due_date) : undefined,
            notes: order.notes || '',
        },
    });

    // Watch form changes and update context (only if not read-only)
    useEffect(() => {
        if (isReadOnly) return;

        const subscription = form.watch((values) => {
            const updates: any = {};

            if (values.order_date !== undefined) {
                updates.order_date = values.order_date instanceof Date ? values.order_date.toISOString() : values.order_date;
            }
            if (values.supplier_id) {
                updates.supplier = { id: values.supplier_id } as Supplier;
            }
            if (values.supplier_reference !== undefined) {
                updates.supplier_reference = values.supplier_reference;
            }
            if (values.internal_reference !== undefined) {
                updates.internal_reference = values.internal_reference;
            }
            if (values.location_id) {
                updates.location = { id: values.location_id } as Location;
            }
            if (values.order_type_id) {
                updates.order_type = { id: values.order_type_id } as OrderType;
            }
            if (values.due_date !== undefined) {
                updates.due_date = values.due_date instanceof Date ? values.due_date.toISOString() : values.due_date;
            }
            if (values.notes !== undefined) {
                updates.notes = values.notes;
            }

            if (Object.keys(updates).length > 0) {
                setData(updates);
            }
        });

        return () => subscription.unsubscribe();
    }, [form, setData, isReadOnly]);

    const handleSupplierChange = (values: string[]) => {
        if (values.length > 0) {
            form.setValue('supplier_id', values[0]);
        }
    };

    const handleLocationChange = (values: string[]) => {
        if (values.length > 0) {
            form.setValue('location_id', values[0]);
        }
    };

    const handleOrderTypeChange = (values: string[]) => {
        if (values.length > 0) {
            form.setValue('order_type_id', values[0]);
        }
    };

    return (
        <div className="space-y-6 py-8">
            <Form {...form}>
                {/* Visible Fields - 4 Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Order Date */}
                    <DateTimePicker
                        form={form}
                        name="order_date"
                        showMonthYearPicker={true}
                        label={t('orders.orderDate', 'Order Date')}
                        placeholder={t('orders.selectOrderDate', 'Select order date')}
                        showTime={false}
                        className="w-full disabled:opacity-80 disabled:cursor-not-allowed"
                        disabled={isReadOnly}
                    />

                    {/* Supplier */}
                    <FormField
                        control={form.control}
                        name="supplier_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    {t('orders.supplier', 'Supplier')}
                                </FormLabel>
                                <FormControl>
                                    <MultiSelectApi
                                        fetchOptions={getSuppliers}
                                        fetchArgs={[orgId || ""]}
                                        optionsKey="suppliers"
                                        customValueKey={(item: any) => item.id}
                                        customLabelKey={(item: any) => <SupplierAvatar supplier={item as Supplier} showNameExtra={true} />}
                                        placeholder={t('orders.selectSupplier', 'Select supplier')}
                                        searchPlaceholder={t('orders.searchSupplier', 'Search suppliers...')}
                                        emptyText={t('orders.noSuppliersFound', 'No suppliers found')}
                                        onChangeValue={handleSupplierChange}
                                        value={field.value ? [field.value] : []}
                                        defaultItems={order.supplier ? [order.supplier] : undefined}
                                        maxCount={1}
                                        className="w-full truncate disabled:opacity-80 disabled:cursor-not-allowed"
                                        disabled={isReadOnly}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Supplier Reference */}
                    <FormField
                        control={form.control}
                        name="supplier_reference"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    {t('orders.supplierReference', 'Supplier Reference')}
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        placeholder={t('orders.supplierReferencePlaceholder', 'Enter supplier reference')}
                                        className="w-full disabled:opacity-80"
                                        disabled={isReadOnly}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {/* Order Type */}
                    <FormField
                        control={form.control}
                        name="order_type_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    {t('orders.orderType', 'Order Type')}
                                </FormLabel>
                                <FormControl>
                                    <MultiSelectApiHierarchy
                                        fetchOptions={getOrgOrderTypes}
                                        fetchArgs={[orgId || ""]}
                                        optionsKey="order_types"
                                        parentKey="parent_type"
                                        customValueKey={(item: any) => item.id}
                                        customLabelKey={(item: any) => item.name}
                                        placeholder={t('orders.selectOrderType', 'Select order type')}
                                        searchPlaceholder={t('orders.searchOrderType', 'Search order types...')}
                                        emptyText={t('orders.noOrderTypesFound', 'No order types found')}
                                        onChangeValue={handleOrderTypeChange}
                                        value={field.value ? [field.value] : []}
                                        defaultItems={order.order_type ? [order.order_type] : undefined}
                                        maxCount={1}
                                        className="w-full truncate disabled:opacity-80 disabled:cursor-not-allowed"
                                        disabled={isReadOnly}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Advanced Options Accordion */}
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="advanced-options">
                        <AccordionTrigger className="p-0">
                            {t('orders.advancedOptions', 'Advanced Options')}
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 px-2">
                                {/* Delivery Location */}
                                <FormField
                                    control={form.control}
                                    name="location_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {t('orders.location', 'Delivery Location')}
                                            </FormLabel>
                                            <FormControl>
                                                <MultiSelectApi
                                                    fetchOptions={getLocations}
                                                    fetchArgs={[orgId || ""]}
                                                    optionsKey="locations"
                                                    customValueKey={(location: any) => location.id}
                                                    customLabelKey={(location: any) =>
                                                        <div className="flex items-center gap-2">
                                                            {location.icon_url && (
                                                                <DynamicIcon
                                                                    name={location.icon_url as IconName}
                                                                    className="h-4 w-4 text-foreground"
                                                                />
                                                            )}
                                                            <span>{location.name}</span>
                                                        </div>
                                                    }
                                                    placeholder={t('orders.selectLocation', 'Select location')}
                                                    searchPlaceholder={t('orders.searchLocation', 'Search locations...')}
                                                    emptyText={t('orders.noLocationsFound', 'No locations found')}
                                                    onChangeValue={handleLocationChange}
                                                    value={field.value ? [field.value] : []}
                                                    defaultItems={order.location ? [order.location] : undefined}
                                                    maxCount={1}
                                                    className="w-full truncate disabled:opacity-80 disabled:cursor-not-allowed"
                                                    disabled={isReadOnly}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Internal Reference */}
                                <FormField
                                    control={form.control}
                                    name="internal_reference"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {t('orders.internalReference', 'Internal Reference')}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder={t('orders.internalReferencePlaceholder', 'Enter internal reference')}
                                                    className="w-full disabled:opacity-80 disabled:cursor-not-allowed"
                                                    disabled={isReadOnly}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Due Date */}
                                <DateTimePicker
                                    form={form}
                                    name="due_date"
                                    showMonthYearPicker={true}
                                    label={t('orders.dueDate', 'Due Date')}
                                    placeholder={t('orders.selectDueDate', 'Select due date')}
                                    showTime={false}
                                    className="w-full disabled:opacity-80 disabled:cursor-not-allowed"
                                    disabled={isReadOnly}
                                />

                                {/* Notes - Full Width */}
                                <FormField
                                    control={form.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2 lg:col-span-4">
                                            <FormLabel>
                                                {t('orders.notes', 'Notes')}
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    {...field}
                                                    placeholder={t('orders.notesPlaceholder', 'Enter any additional notes...')}
                                                    className="w-full min-h-[100px] disabled:opacity-80 disabled:cursor-not-allowed"
                                                    disabled={isReadOnly}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </Form>
        </div>
    );
};

export default InfoOrderSection;

