import { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams } from "react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { TaxType } from "@/types/miscelanea";
import {
    WorkOrderBillableItem,
    WorkOrderBillableItemRequest,
    BillableItemsCalculations,
} from "@/types/field-service/work-orders/billable-items";
import {
    getWorkOrderBillableItems,
    patchWorkOrderBillableItems,
    deleteWorkOrderBillableItem,
} from "@/api/field-service/work-orders/billable-items/billable-items";
import { getOrgTaxes } from "@/api/orgs/taxes/taxes";
import { getWorkOrderIndirectCosts, postWorkOrderIndirectCostActivate } from "@/api/field-service/work-orders/indirect-costs/indirect-costs";
import { getWorkOrderBillableCommutings } from "@/api/field-service/work-orders/billable-commutings/billable-commutings";
import { IndirectCost, IndirectCostRange } from "@/types/financials/indirect-costs";
import { CommutingRate } from "@/types/general/commuting-rates";
import { Employee } from "@/types/employees/employees";
import { getWorkOrderInvoices } from "@/api/field-service/work-orders/invoices/invoices";
import { postSalesInvoice } from "@/api/sales-invoices/sales-invoices";
import { Invoice } from "@/types/invoices/invoices";

export interface IndirectCostLineItem {
    indirectCost: IndirectCost;
    enabled: boolean;
    applicableValue: number | null;
    amount: number;
}

export interface IndirectCostCalculations {
    lineItems: IndirectCostLineItem[];
    totalIndirectCosts: number;
    netMargin: number;
    netMarginPercentage: number | null;
}

export interface CommutingCalculations {
    subtotal: number;
    taxesByType: Record<string, number>;
    totalTaxes: number;
    total: number;
    totalCostPrice: number;
    netMargin: number;
}

export interface AssigneePrice {
    assignee: Employee | null;
    pvp: number;
    cost_price: number;
    min_quantity: number | null;
    step_quantity: number | null;
}

export interface BillableCommutingsData {
    commuting_rate: CommutingRate | null;
    assignees_prices: AssigneePrice[];
    taxes?: TaxType[];
    time_to_travel?: number;
    distance?: number;
}

export function getBillableMinutes(travelMinutes: number, minQuantity: number | null, stepQuantity: number | null): number {
    let billable = travelMinutes;
    if (minQuantity != null && minQuantity > 0 && billable < minQuantity) {
        billable = minQuantity;
    }
    if (stepQuantity != null && stepQuantity > 0) {
        billable = Math.ceil(billable / stepQuantity) * stepQuantity;
    }
    return billable;
}

function computeCommutingCalculations(data: BillableCommutingsData | null): CommutingCalculations {
    const empty: CommutingCalculations = { subtotal: 0, taxesByType: {}, totalTaxes: 0, total: 0, totalCostPrice: 0, netMargin: 0 };
    if (!data) return empty;

    const rate = data.commuting_rate;
    const distance = data.distance ?? 0;
    const timeToTravel = data.time_to_travel ?? 0;
    const assigneesPrices = data.assignees_prices ?? [];

    const isFixedPrice = rate?.is_fixed_price ?? false;
    const isPricePerKm = rate?.is_price_per_km ?? false;
    const isTravelTimeBillable = rate?.is_travel_time_billable ?? false;

    const fixedPriceComponent = isFixedPrice ? (rate?.fixed_price ?? 0) : 0;
    const pricePerKmVal = rate?.price_per_km ?? 0;
    const minPriceVal = rate?.min_price ?? 0;
    const perKmComponent = isPricePerKm ? Math.max(distance * pricePerKmVal, minPriceVal) : 0;

    const assigneePvpTotal = isTravelTimeBillable
        ? assigneesPrices.reduce((sum, ap) => {
            const billableHours = getBillableMinutes(timeToTravel, ap.min_quantity, ap.step_quantity) / 60;
            return sum + ap.pvp * billableHours;
        }, 0)
        : 0;
    const assigneeCostTotal = assigneesPrices.reduce((sum, ap) => {
        const billableHours = getBillableMinutes(timeToTravel, ap.min_quantity, ap.step_quantity) / 60;
        return sum + ap.cost_price * billableHours;
    }, 0);

    const subtotal = fixedPriceComponent + perKmComponent + assigneePvpTotal;
    const totalCostPrice = assigneeCostTotal;

    const selectedTaxes = data.taxes ?? [];
    const taxesByType = selectedTaxes.reduce((acc, tax) => {
        const taxAmount = subtotal * (tax.amount / 100) * (tax.is_negative ? -1 : 1);
        if (!acc[tax.type]) acc[tax.type] = 0;
        acc[tax.type] += taxAmount;
        return acc;
    }, {} as Record<string, number>);
    const totalTaxes = Object.values(taxesByType).reduce((sum, amount) => sum + amount, 0);
    const total = subtotal + totalTaxes;
    const netMargin = subtotal - totalCostPrice;

    return { subtotal, taxesByType, totalTaxes, total, totalCostPrice, netMargin };
}

interface BillableItemsContextType {
    items: WorkOrderBillableItem[];
    taxes: TaxType[];
    calculations: BillableItemsCalculations;
    hasUnsavedChanges: boolean;
    isSaving: boolean;
    isLoading: boolean;
    updateItem: (order: number, field: keyof WorkOrderBillableItem, value: any) => void;
    updateItemMultiple: (order: number, updates: Partial<WorkOrderBillableItem>) => void;
    addItem: () => void;
    deleteItem: (order: number) => void;
    save: () => Promise<void>;
    indirectCosts: IndirectCost[];
    enabledIndirectCostIds: Set<string>;
    toggleIndirectCost: (id: string) => Promise<void>;
    indirectCostCalculations: IndirectCostCalculations;
    commutingCalculations: CommutingCalculations;
    setCommutingCalculations: (calcs: CommutingCalculations) => void;
    commutingData: BillableCommutingsData | null;
    isCommutingLoading: boolean;
    refetchCommutingData: () => Promise<void>;
    invoices: Invoice[];
    createInvoice: () => Promise<string | null>;
    isCreatingInvoice: boolean;
}

const BillableItemsContext = createContext<BillableItemsContextType | undefined>(undefined);

const getApplicableRange = (ranges: IndirectCostRange[], orderTotal: number): IndirectCostRange | null => {
    return ranges.find(range => {
        const inLowerBound = orderTotal >= range.from_quantity;
        const inUpperBound = range.to_quantity === null || orderTotal <= range.to_quantity;
        return inLowerBound && inUpperBound;
    }) || null;
};

export const BillableItemsProvider = ({ children }: { children: React.ReactNode }) => {
    const { t } = useTranslation();
    const { orgId, workOrderId } = useParams<{ orgId: string; workOrderId: string }>();

    const [items, setItems] = useState<WorkOrderBillableItem[]>([]);
    const [originalItems, setOriginalItems] = useState<WorkOrderBillableItem[]>([]);
    const [taxes, setTaxes] = useState<TaxType[]>([]);
    const [indirectCosts, setIndirectCosts] = useState<IndirectCost[]>([]);
    const [enabledIndirectCostIds, setEnabledIndirectCostIds] = useState<Set<string>>(new Set());
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [commutingCalculations, setCommutingCalculations] = useState<CommutingCalculations>({
        subtotal: 0,
        taxesByType: {},
        totalTaxes: 0,
        total: 0,
        totalCostPrice: 0,
        netMargin: 0,
    });
    const [commutingData, setCommutingData] = useState<BillableCommutingsData | null>(null);
    const [isCommutingLoading, setIsCommutingLoading] = useState(true);
    const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

    const itemsRef = useRef<WorkOrderBillableItem[]>([]);

    useEffect(() => {
        itemsRef.current = items;
    }, [items]);

    const fetchItems = useCallback(async () => {
        if (!orgId || !workOrderId) return;
        try {
            const response = await getWorkOrderBillableItems(orgId, workOrderId);
            if (response.success) {
                const fetchedItems: WorkOrderBillableItem[] = (
                    response.success.items || []
                ).map((item: any, index: number) => ({
                    id: item.id || null,
                    item: item.item || null,
                    name: item.name || null,
                    description: item.description || null,
                    quantity: item.quantity ?? null,
                    price: item.price ?? null,
                    cost_price: item.cost_price ?? null,
                    discount: item.discount ?? null,
                    order: item.order ?? index,
                    taxes: item.taxes || [],
                    type: item.type ?? null,
                }));
                setItems(fetchedItems);
                setOriginalItems(fetchedItems);
                setHasUnsavedChanges(false);
            }
        } catch (error) {
            console.error("Error fetching billable items:", error);
        }
    }, [orgId, workOrderId]);

    const fetchTaxes = useCallback(async () => {
        if (!orgId) return;
        try {
            const response = await getOrgTaxes(orgId, true);
            if (response.success && response.success.taxes) {
                setTaxes(response.success.taxes);
            }
        } catch (error) {
            console.error("Error fetching taxes:", error);
        }
    }, [orgId]);

    const fetchIndirectCosts = useCallback(async () => {
        if (!orgId || !workOrderId) return;
        try {
            const response = await getWorkOrderIndirectCosts(orgId, workOrderId);
            if (response.success?.indirect_costs) {
                const costs: IndirectCost[] = response.success.indirect_costs;
                setIndirectCosts(costs);
                setEnabledIndirectCostIds(new Set(costs.filter((c) => c.is_active !== false).map((c) => c.id)));
            }
        } catch (error) {
            console.error("Error fetching indirect costs:", error);
        }
    }, [orgId, workOrderId]);

    const fetchCommutingData = useCallback(async () => {
        if (!orgId || !workOrderId) return;
        setIsCommutingLoading(true);
        try {
            const response = await getWorkOrderBillableCommutings(orgId, workOrderId);
            if (response.success) {
                const result: BillableCommutingsData = response.success;
                setCommutingData(result);
                setCommutingCalculations(computeCommutingCalculations(result));
            }
        } catch (error) {
            console.error("Error fetching commuting data:", error);
        } finally {
            setIsCommutingLoading(false);
        }
    }, [orgId, workOrderId]);

    const toggleIndirectCost = useCallback(async (id: string) => {
        if (!orgId || !workOrderId) return;

        // Optimistic update
        setEnabledIndirectCostIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });

        try {
            await postWorkOrderIndirectCostActivate(orgId, workOrderId, id);
        } catch (error) {
            console.error("Error toggling indirect cost:", error);
            // Revert on failure
            setEnabledIndirectCostIds((prev) => {
                const next = new Set(prev);
                if (next.has(id)) {
                    next.delete(id);
                } else {
                    next.add(id);
                }
                return next;
            });
            toast.error(t("workOrders.errorTogglingIndirectCost", "Error toggling indirect cost"));
        }
    }, [orgId, workOrderId, t]);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            await Promise.all([fetchItems(), fetchTaxes(), fetchIndirectCosts(), fetchCommutingData(), fetchInvoicesResume()]);
            setIsLoading(false);
        };
        if (orgId && workOrderId) {
            load();
        }
    }, [orgId, workOrderId, fetchItems, fetchTaxes, fetchIndirectCosts, fetchCommutingData]);

    const updateItem = (order: number, field: keyof WorkOrderBillableItem, value: any) => {
        setItems((prev) =>
            prev.map((item) =>
                item.order === order ? { ...item, [field]: value } : item
            )
        );
        setHasUnsavedChanges(true);
    };

    const updateItemMultiple = (order: number, updates: Partial<WorkOrderBillableItem>) => {
        setItems((prev) =>
            prev.map((item) =>
                item.order === order ? { ...item, ...updates } : item
            )
        );
        setHasUnsavedChanges(true);
    };

    const addItem = useCallback(() => {
        const newItem: WorkOrderBillableItem = {
            id: null,
            item: null,
            name: "",
            description: "",
            quantity: 1,
            price: 0,
            cost_price: null,
            discount: 0,
            order: itemsRef.current.length,
            taxes: [],
            type: 'material',
        };
        setItems((prev) => [...prev, newItem]);
        setHasUnsavedChanges(true);
    }, []);

    const deleteItem = (order: number) => {
        setItems((prev) => {
            const filtered = prev.filter((item) => item.order !== order);
            return filtered.map((item, index) => ({ ...item, order: index }));
        });
        setHasUnsavedChanges(true);
    };

    const save = async () => {
        if (!orgId || !workOrderId) return;

        setIsSaving(true);
        try {
            const currentItems = itemsRef.current;

            const deletedItems = originalItems.filter(
                (orig) => orig.id && !currentItems.find((item) => item.id === orig.id)
            );

            for (const item of deletedItems) {
                await deleteWorkOrderBillableItem(orgId, workOrderId, item.id!);
            }

            if (currentItems.length > 0) {
                const billableItems: WorkOrderBillableItemRequest[] = currentItems.map((item) => ({
                    id: item.id,
                    item_id: item.item?.id || null,
                    name: item.name,
                    description: item.description,
                    quantity: item.quantity,
                    price: item.price,
                    cost_price: item.cost_price,
                    discount: item.discount,
                    order: item.order,
                    taxes_ids: item.taxes?.map((tax) => tax.id) || [],
                    type: item.type ?? null,
                }));

                await patchWorkOrderBillableItems(orgId, workOrderId, { billable_items: billableItems });
            }

            await fetchItems();
            toast.success(t("workOrders.billableItemsSaved", "Billable items saved successfully"));
        } catch (error) {
            console.error("Error saving billable items:", error);
            toast.error(t("workOrders.errorSavingBillableItems", "Error saving billable items"));
        } finally {
            setIsSaving(false);
        }
    };

    const calculations: BillableItemsCalculations = (() => {
        const subtotal = items.reduce((sum, item) => {
            const quantity = item.quantity ?? 0;
            const price = item.price ?? 0;
            return sum + quantity * price;
        }, 0);

        const discountAmount = items.reduce((sum, item) => {
            const quantity = item.quantity ?? 0;
            const price = item.price ?? 0;
            const discount = item.discount ?? 0;
            return sum + quantity * price * (discount / 100);
        }, 0);

        const subtotalAfterDiscount = subtotal - discountAmount;

        const taxesByType = items.reduce((acc, item) => {
            const quantity = item.quantity ?? 0;
            const price = item.price ?? 0;
            const discount = item.discount ?? 0;
            const itemSubtotal = quantity * price;
            const itemDiscountAmount = itemSubtotal * (discount / 100);
            const itemSubtotalAfterDiscount = itemSubtotal - itemDiscountAmount;

            item.taxes?.forEach((tax) => {
                const taxAmount =
                    itemSubtotalAfterDiscount * (tax.amount / 100) * (tax.is_negative ? -1 : 1);
                if (!acc[tax.type]) {
                    acc[tax.type] = 0;
                }
                acc[tax.type] += taxAmount;
            });
            return acc;
        }, {} as Record<string, number>);

        const totalTaxes = Object.values(taxesByType).reduce((sum, amount) => sum + amount, 0);
        const total = subtotalAfterDiscount + totalTaxes;

        const totalCostPrice = items.reduce((sum, item) => {
            if (item.cost_price != null) {
                const quantity = item.quantity ?? 0;
                return sum + item.cost_price * quantity;
            }
            return sum;
        }, 0);

        const combinedSale = subtotalAfterDiscount + commutingCalculations.subtotal;
        const combinedCost = totalCostPrice + commutingCalculations.totalCostPrice;
        const hasCostPrices = items.some((item) => item.cost_price != null) || commutingCalculations.totalCostPrice > 0;
        const totalMargin =
            hasCostPrices && combinedSale > 0
                ? Math.round((1 - combinedCost / combinedSale) * 10000) / 100
                : null;

        return {
            subtotal,
            discountAmount,
            subtotalAfterDiscount,
            taxesByType,
            totalTaxes,
            total,
            totalCostPrice,
            totalMargin,
        };
    })();

    const indirectCostCalculations: IndirectCostCalculations = useMemo(() => {
        const orderTotal = calculations.subtotalAfterDiscount;

        const lineItems: IndirectCostLineItem[] = indirectCosts.map((cost) => {
            const range = getApplicableRange(cost.ranges, orderTotal);
            const applicableValue = range ? range.value : null;
            const amount =
                applicableValue !== null
                    ? cost.is_percentage
                        ? orderTotal * (applicableValue / 100)
                        : applicableValue
                    : 0;
            return {
                indirectCost: cost,
                enabled: enabledIndirectCostIds.has(cost.id),
                applicableValue,
                amount,
            };
        });

        const totalIndirectCosts = lineItems
            .filter((item) => item.enabled)
            .reduce((sum, item) => sum + item.amount, 0);

        const combinedSale = calculations.subtotalAfterDiscount + commutingCalculations.subtotal;
        const combinedCost = calculations.totalCostPrice + commutingCalculations.totalCostPrice;
        const netMargin = combinedSale - combinedCost - totalIndirectCosts;
        const netMarginPercentage =
            combinedSale > 0
                ? Math.round((netMargin / combinedSale) * 10000) / 100
                : null;

        return { lineItems, totalIndirectCosts, netMargin, netMarginPercentage };
    }, [indirectCosts, enabledIndirectCostIds, calculations, commutingCalculations]);

    const fetchInvoicesResume = useCallback(async () => {
        if (!orgId || !workOrderId) return;
        try {
            const response = await getWorkOrderInvoices(orgId, workOrderId);
            if (response.success) {
                const invoices: Invoice[] = response.success.invoices;
                setInvoices(invoices);
            }
        } catch (error) {
            console.error("Error fetching invoices resume:", error);
        }
    }, [orgId, workOrderId]);

    const createInvoice = useCallback(async (): Promise<string | null> => {
        if (!orgId || !workOrderId) return null;
        setIsCreatingInvoice(true);
        try {
            const response = await postSalesInvoice(orgId, {
                group_by_headers: true,
                origin_ids: [workOrderId],
            });
            if (response.success) {
                await fetchInvoicesResume();
                return response.success.invoice_id;
            }
            toast.error(t("salesInvoices.errorCreatingInvoice", "Error creating sales invoice"));
            return null;
        } catch (error) {
            console.error("Error creating sales invoice:", error);
            toast.error(t("salesInvoices.errorCreatingInvoice", "Error creating sales invoice"));
            return null;
        } finally {
            setIsCreatingInvoice(false);
        }
    }, [orgId, workOrderId, fetchInvoicesResume, t]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin w-6 h-6" />
            </div>
        );
    }

    return (
        <BillableItemsContext.Provider
            value={{
                items,
                taxes,
                calculations,
                hasUnsavedChanges,
                isSaving,
                isLoading,
                updateItem,
                updateItemMultiple,
                addItem,
                deleteItem,
                save,
                indirectCosts,
                enabledIndirectCostIds,
                toggleIndirectCost,
                indirectCostCalculations,
                commutingCalculations,
                setCommutingCalculations,
                commutingData,
                isCommutingLoading,
                refetchCommutingData: fetchCommutingData,
                invoices,
                createInvoice,
                isCreatingInvoice,
            }}
        >
            {children}
        </BillableItemsContext.Provider>
    );
};

export const useBillableItems = () => {
    const context = useContext(BillableItemsContext);
    if (context === undefined) {
        throw new Error("useBillableItems must be used within a BillableItemsProvider");
    }
    return context;
};
