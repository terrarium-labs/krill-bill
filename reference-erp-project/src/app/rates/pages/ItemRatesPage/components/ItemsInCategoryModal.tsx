import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/useTranslation";
import { getOrgRateItems, patchOrgRateItemsHierarchiesItemsPrices } from "@/api/orgs/rates/rates";
import { Loader2, Package, Save } from "lucide-react";
import {
    TableProvider,
    TableHeader,
    TableHeaderGroup,
    TableHead,
    TableBody,
    TableCell,
    type ColumnDef,
} from "@/components/ui/shadcn-io/table";
import { TableRow as TableRowRaw, TableCell as TableCellRaw } from "@/components/ui/table";
import IdBadge from "@/app/components/id-badge";
import { Button } from "@/components/ui/button";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
} from "@/components/ui/input-group";
import { toast } from "sonner";
import SearchBar from "@/app/components/search-bar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { IconLabel } from "@/app/components/custom-labels";
import { Item } from "@/types/items/items";
import ItemLabel from "@/app/components/labels/item-label";
import { Separator } from "@/components/ui/separator";
import type { RateItemHierarchy } from "@/types/general/rates";
import {formatDecimal} from "@/utils/miscelanea";
import CurrencyLabel from "@/app/components/labels/currency-label";

interface ItemPrice {
    id: string;
    item_code: string;
    name: string;
    description: string;
    pmc: number | null;
    is_pmc_fixed: boolean;
    cost_calc_days: number | null;
    rate_price: {
        id: string;
        price_quantity: number;
        price_currency: string;
        margin: number;
        pricing_mode: "margin_fixed" | "price_fixed";
        billing_type: "one-off" | "recurring";
        billing_period?: "daily" | "weekly" | "monthly" | "yearly" | null;
        price_model: "flat-rate" | "graduated";
        tax_included: boolean;
        rate_id: string;
        rate_name: string;
        supplier_discount: number;
        supplier_pvp: number;
        item_hierarchy?: {
            id: string;
            name: string;
            icon?: string;
            color?: string;
        };
    } | null;
    default_price?: {
        id: string;
        price_quantity: number;
        price_currency: string;
        margin: number;
        billing_type: "one-off" | "recurring";
        billing_period?: "daily" | "weekly" | "monthly" | "yearly" | null;
        price_model: "flat-rate" | "graduated";
        tax_included: boolean;
        pricing_mode?: "margin_fixed" | "price_fixed";
    } | null;
}

interface ItemsInCategoryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: string;
    rateId: string;
    category: RateItemHierarchy;
}

interface PendingChange {
    item_id: string;
    margin: number | null;
    price_quantity: number | null;
    pricing_mode: "margin_fixed" | "price_fixed";
}

const ItemsInCategoryModal = ({
    open,
    onOpenChange,
    orgId,
    rateId,
    category,
}: ItemsInCategoryModalProps) => {
    const { t } = useTranslation();
    const [items, setItems] = useState<ItemPrice[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [pricingModes, setPricingModes] = useState<Map<string, "margin_fixed" | "price_fixed">>(new Map());
    const pendingChanges = useRef<Map<string, PendingChange>>(new Map());

    // Fetch items
    const fetchItems = useCallback(async () => {
        if (!open) return;

        setIsLoading(true);
        try {
            const response = await getOrgRateItems(orgId, rateId, category.id, searchQuery);
            if (response.success && response.success.items) {
                setItems(response.success.items);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("rates.errorFetchingItems", "Error fetching items"));
            }
        } catch (error) {
            console.error("Error fetching items:", error);
            toast.error(t("rates.errorFetchingItems", "Error fetching items"));
        } finally {
            setIsLoading(false);
        }
    }, [open, orgId, rateId, category.id, searchQuery, t]);

    // Load more items
    const loadMoreItems = async () => {
        if (!nextPageToken || loadingMore) return;

        setLoadingMore(true);
        try {
            const response = await getOrgRateItems(orgId, rateId, category.id, searchQuery, nextPageToken);
            if (response.success && response.success.items) {
                setItems(prev => [...prev, ...response.success.items]);
                setNextPageToken(response.success.next_page_token || null);
            }
        } catch (error) {
            console.error("Error loading more items:", error);
            toast.error(t("rates.errorFetchingItems", "Error fetching items"));
        } finally {
            setLoadingMore(false);
        }
    };

    // Calculate PVP based on PMC and margin
    const calculatePVP = useCallback((pmc: number | null, margin: number): number => {
        if (!pmc || pmc === 0) return 0;
        const pvp = pmc * (1 + margin / 100);
        return parseFloat(pvp.toFixed(2));
    }, []);

    // Calculate discount rate based on PVP difference (clamped between 0 and 100)
    const calculateDiscountRate = useCallback((ratePVP: number | null, defaultPVP: number | null) => {
        if (!ratePVP || !defaultPVP || defaultPVP === 0) return 0;
        const discountRate = ((defaultPVP - ratePVP) / defaultPVP) * 100;
        // Clamp between 0 and 100 (discount can never be negative)
        return Math.max(0, Math.min(100, parseFloat(discountRate.toFixed(2))));
    }, []);

    // Initial values map for margins and discounts
    const initialValuesMap = useMemo(() => {
        const map = new Map<string, { margin: number | null; discount_rate: number | null; pvp: number | null; pricing_mode: "margin_fixed" | "price_fixed" }>();
        items.forEach((item) => {
            // Check if there's a pending change for this item (highest priority)
            const pendingChange = pendingChanges.current.get(item.id);

            if (pendingChange) {
                // Use pending change values
                const defaultPVP = item.default_price?.price_quantity ?? 0;
                const discountRate = calculateDiscountRate(pendingChange.price_quantity ?? 0, defaultPVP);

                map.set(item.id, {
                    margin: pendingChange.margin,
                    discount_rate: discountRate,
                    pvp: pendingChange.price_quantity,
                    pricing_mode: pendingChange.pricing_mode,
                });
            } else {
                // Margin Priority: rate_price -> category margin -> default_price
                const margin = item.rate_price?.margin ?? category.rate_margin ?? item.default_price?.margin ?? 0;

                // PVP Priority: rate_price -> calculate from margin and PMC
                const pmc = item.pmc || 0;
                const ratePVP = item.rate_price?.price_quantity ?? (pmc > 0 ? calculatePVP(pmc, margin) : 0);

                // Default PVP from default_price
                const defaultPVP = item.default_price?.price_quantity ?? 0;

                // Discount: Calculate between Default PVP and Rate PVP
                const discountRate = calculateDiscountRate(ratePVP, defaultPVP);

                // Pricing Mode Priority: rate_price -> default_price -> "margin_fixed"
                const pricingMode = item.rate_price?.pricing_mode ?? item.default_price?.pricing_mode ?? "margin_fixed";

                map.set(item.id, {
                    margin: margin,
                    discount_rate: discountRate,
                    pvp: ratePVP,
                    pricing_mode: pricingMode,
                });
            }
        });
        return map;
    }, [items, calculateDiscountRate, calculatePVP, category.rate_margin]);

    // Initial load and initialize pricing modes
    useEffect(() => {
        if (open) {
            fetchItems();
            // Clear pending changes when opening modal
            pendingChanges.current.clear();
        } else {
            // Save pending changes before closing modal
            if (pendingChanges.current.size > 0) {
                saveChanges(false);
            }
        }
    }, [open]);

    // Initialize pricing modes when items are loaded
    useEffect(() => {
        setPricingModes(prev => {
            const modes = new Map(prev); // Preserve existing modes
            items.forEach(item => {
                // Only set if not already in map (preserve user changes)
                if (!modes.has(item.id)) {
                    // Check pending changes first, then rate_price, then default_price
                    const pendingChange = pendingChanges.current.get(item.id);
                    const pricingMode = pendingChange?.pricing_mode ?? item.rate_price?.pricing_mode ?? item.default_price?.pricing_mode ?? "margin_fixed";
                    modes.set(item.id, pricingMode);
                }
            });
            return modes;
        });
    }, [items]);

    // Handle margin change - DOM-based logic
    const handleMarginChange = useCallback((itemId: string, defaultPVP: number | null) => {
        const marginInput = document.querySelector(`input[data-item-id="${itemId}"][data-field="margin"]`) as HTMLInputElement;
        const discountInput = document.querySelector(`input[data-item-id="${itemId}"][data-field="discount_rate"]`) as HTMLInputElement;
        const pvpInput = document.querySelector(`input[data-item-id="${itemId}"][data-field="pvp"]`) as HTMLInputElement;

        if (!marginInput || !discountInput || !pvpInput) return;

        const margin = marginInput.value ? parseFloat(marginInput.value) : 0;

        // Calculate and update PVP based on margin
        const item = items.find(i => i.id === itemId);
        if (item) {
            const pmc = item.pmc || 0;
            const newPVP = calculatePVP(pmc, margin);
            pvpInput.value = newPVP.toFixed(2);

            // Calculate discount based on PVP difference (clamped 0-100)
            if (defaultPVP && defaultPVP > 0) {
                const discount = ((defaultPVP - newPVP) / defaultPVP) * 100;
                const clampedDiscount = Math.max(0, Math.min(100, discount));
                discountInput.value = clampedDiscount.toFixed(2);
            } else {
                discountInput.value = "0";
            }

            const change: PendingChange = {
                item_id: itemId,
                margin: margin,
                price_quantity: newPVP,
                pricing_mode: item.rate_price?.pricing_mode || "margin_fixed",
            };
            pendingChanges.current.set(itemId, change);
        }
    }, [items]);

    // Handle discount change - DOM-based logic
    const handleDiscountChange = useCallback((itemId: string, defaultPVP: number | null) => {
        const marginInput = document.querySelector(`input[data-item-id="${itemId}"][data-field="margin"]`) as HTMLInputElement;
        const discountInput = document.querySelector(`input[data-item-id="${itemId}"][data-field="discount_rate"]`) as HTMLInputElement;
        const pvpInput = document.querySelector(`input[data-item-id="${itemId}"][data-field="pvp"]`) as HTMLInputElement;

        if (!marginInput || !discountInput || !pvpInput) return;

        const discount = discountInput.value ? parseFloat(discountInput.value) : 0;

        // Calculate new PVP based on discount
        let newPVP = 0;
        if (defaultPVP && defaultPVP > 0) {
            // Formula: newPVP = defaultPVP * (1 - discount/100)
            newPVP = defaultPVP * (1 - discount / 100);
            pvpInput.value = newPVP.toFixed(2);
        }

        // Calculate new margin based on new PVP
        const item = items.find(i => i.id === itemId);
        if (item) {
            const pmc = item.pmc || 0;
            let newMargin = 0;

            if (pmc > 0 && newPVP > 0) {
                newMargin = ((newPVP / pmc - 1) * 100);
                marginInput.value = newMargin.toFixed(2);
            }

            const change: PendingChange = {
                item_id: itemId,
                margin: newMargin,
                price_quantity: newPVP,
                pricing_mode: item.rate_price?.pricing_mode || "margin_fixed",
            };
            pendingChanges.current.set(itemId, change);
        }
    }, [items]);

    // Handle PVP change (when pricing_mode is price_fixed) - DOM-based logic
    const handlePVPChange = useCallback((itemId: string, pmc: number | null, defaultPVP: number | null) => {
        const pvpInput = document.querySelector(`input[data-item-id="${itemId}"][data-field="pvp"]`) as HTMLInputElement;
        const marginInput = document.querySelector(`input[data-item-id="${itemId}"][data-field="margin"]`) as HTMLInputElement;
        const discountInput = document.querySelector(`input[data-item-id="${itemId}"][data-field="discount_rate"]`) as HTMLInputElement;

        if (!pvpInput || !marginInput) return;

        const pvp = pvpInput.value ? parseFloat(pvpInput.value) : 0;

        // Calculate margin based on PVP
        let margin = 0;
        if (pmc && pmc > 0) {
            margin = ((pvp / pmc - 1) * 100);
            marginInput.value = margin.toFixed(2);
        }

        // Calculate discount based on PVP difference (clamped 0-100)
        if (discountInput && defaultPVP && defaultPVP > 0) {
            const discount = ((defaultPVP - pvp) / defaultPVP) * 100;
            const clampedDiscount = Math.max(0, Math.min(100, discount));
            discountInput.value = clampedDiscount.toFixed(2);
        }

        // Store pending change
        const item = items.find(i => i.id === itemId);
        if (item) {
            const change: PendingChange = {
                item_id: itemId,
                margin: margin,
                price_quantity: pvp,
                pricing_mode: item.rate_price?.pricing_mode || "price_fixed",
            };
            pendingChanges.current.set(itemId, change);
        }
    }, [items]);


    // Handle pricing mode change
    const handlePricingModeChange = useCallback((itemId: string, value: "margin_fixed" | "price_fixed", item: ItemPrice) => {
        // Update the pricing mode state
        setPricingModes(prev => {
            const newModes = new Map(prev);
            newModes.set(itemId, value);
            return newModes;
        });

        const existingChange = pendingChanges.current.get(itemId);

        const change: PendingChange = {
            item_id: itemId,
            margin: existingChange?.margin ?? item.rate_price?.margin ?? null,
            price_quantity: existingChange?.price_quantity ?? item.rate_price?.price_quantity ?? null,
            pricing_mode: value,
        };
        pendingChanges.current.set(itemId, change);
    }, []);

    // Save changes (auto-save or manual)
    const saveChanges = async (showToast: boolean = false) => {
        if (pendingChanges.current.size === 0) {
            return;
        }

        setIsSaving(true);
        try {
            const prices = Array.from(pendingChanges.current.values()).map(change => {
                // Find the item to get default_price values
                const item = items.find(i => i.id === change.item_id);
                const defaultPrice = item?.default_price;
                const ratePrice = item?.rate_price;

                return {
                    item_id: change.item_id,
                    margin: change.margin,
                    price_quantity: change.price_quantity,
                    pricing_mode: change.pricing_mode,
                    // Use values from default_price or rate_price, with fallbacks
                    price_currency: ratePrice?.price_currency || defaultPrice?.price_currency || "EUR",
                    billing_type: ratePrice?.billing_type || defaultPrice?.billing_type || "one-off",
                    billing_period: ratePrice?.billing_period || defaultPrice?.billing_period || null,
                    price_model: ratePrice?.price_model || defaultPrice?.price_model || "flat-rate",
                    tax_included: ratePrice?.tax_included ?? defaultPrice?.tax_included ?? true,
                };
            });

            const response = await patchOrgRateItemsHierarchiesItemsPrices(
                orgId,
                rateId,
                category.id,
                { prices }
            );

            if (response.success) {
                if (showToast) {
                    toast.success(t("rates.pricesSavedSuccess", "Prices saved successfully"));
                }
                pendingChanges.current.clear();
                // Don't refresh items to avoid resetting state
            } else {
                toast.error(t("rates.errorSavingPrices", "Error saving prices"));
            }
        } catch (error) {
            console.error("Error saving prices:", error);
            toast.error(t("rates.errorSavingPrices", "Error saving prices"));
        } finally {
            setIsSaving(false);
        }
    };

    // Auto-save every 3.7 seconds (same as ReteDetailEditPage)
    useEffect(() => {
        if (!open) return;

        const interval = setInterval(() => {
            if (pendingChanges.current.size > 0) {
                saveChanges(false);
            }
        }, 3737);

        return () => clearInterval(interval);
    }, [open]);

    // Filter items based on search
    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return items;

        const query = searchQuery.toLowerCase();
        return items.filter(item =>
            item.name.toLowerCase().includes(query) ||
            item.item_code.toLowerCase().includes(query) ||
            (item.description && item.description.toLowerCase().includes(query))
        );
    }, [items, searchQuery]);

    // Table columns
    const columns: ColumnDef<ItemPrice>[] = useMemo(
        () => [
            {
                accessorKey: "id",
                header: t("common.id", "ID"),
                cell: ({ row }) => (
                    <IdBadge id={row.original.id} hideIcon={true} customTooltip={t("common.copyId", "Copy ID")} />
                ),
            },

            {
                accessorKey: "name",
                header: t("items.name", "Name"),
                cell: ({ row }) => (
                    <ItemLabel data={row.original as unknown as Item} link />
                ),
            },
            {
                accessorKey: "item_code",
                header: t("items.itemCode", "Item Code"),
                cell: ({ row }) => (
                    <IdBadge id={row.original.item_code} hideIcon={true} customTooltip={t("common.copyId", "Copy ID")} />
                ),
            },
            {
                accessorKey: "pmc",
                header: t("items.pmc", "PMC"),
                cell: ({ row }) => {
                    const item = row.original;
                    const pmc = item.pmc;

                    if (!pmc || pmc === 0) {
                        return <span className="text-muted-foreground">-</span>;
                    }

                    // Get billing info for period suffix
                    const billingType = item.rate_price?.billing_type || item.default_price?.billing_type;
                    const billingPeriod = item.rate_price?.billing_period || item.default_price?.billing_period;
                    const periodSuffix = billingType === "recurring" && billingPeriod
                        ? `/${t(`common.billingPeriod.${billingPeriod}`, billingPeriod)}`
                        : "";

                    return (
                        <div className="text-sm font-medium">
                            <CurrencyLabel data={pmc} />{periodSuffix}
                        </div>
                    );
                },
            },
            {
                accessorKey: "default_margin",
                header: t("rates.defaultMargin", "Default Margin"),
                cell: ({ row }) => {
                    const item = row.original;
                    const defaultMargin = item.default_price?.margin;

                    if (defaultMargin === null || defaultMargin === undefined) {
                        return <span className="text-muted-foreground text-sm">-</span>;
                    }

                    return <div className="text-sm font-medium">{formatDecimal(defaultMargin)} %</div>;
                },
            },
            {
                accessorKey: "default_pvp",
                header: t("rates.defaultPVP", "Default PVP"),
                cell: ({ row }) => {
                    const item = row.original;
                    const defaultPVP = item.default_price?.price_quantity;

                    if (!defaultPVP || defaultPVP === 0) {
                        return <span className="text-muted-foreground">-</span>;
                    }

                    // Get billing info for period suffix
                    const billingType = item.default_price?.billing_type;
                    const billingPeriod = item.default_price?.billing_period;
                    const periodSuffix = billingType === "recurring" && billingPeriod
                        ? `/${t(`common.billingPeriod.${billingPeriod}`, billingPeriod)}`
                        : "";

                    return (
                        <div className="text-sm font-medium">
                            <CurrencyLabel data={defaultPVP} />{periodSuffix}
                        </div>
                    );
                },
            },
            {
                accessorKey: "discount",
                header: t("rates.discount", "Discount Rate"),
                meta: {
                    className: "border-l pl-4"
                },
                cell: ({ row }) => {
                    const item = row.original;
                    const defaultPVP = item.default_price?.price_quantity || null;
                    const defaultValue = initialValuesMap.get(item.id)?.discount_rate;

                    return (
                        <InputGroup className="w-24 h-7!">
                            <InputGroupInput
                                key={`discount-${item.id}-${items.length}`}
                                type="number"
                                defaultValue={defaultValue ?? ""}
                                data-item-id={item.id}
                                data-field="discount_rate"
                                min="0"
                                max="100"
                                step="0.01"
                                className="h-7"
                                placeholder="0"
                                onChange={() => handleDiscountChange(item.id, defaultPVP)}
                            />
                            <InputGroupAddon align="inline-end">
                                <InputGroupText>%</InputGroupText>
                            </InputGroupAddon>
                        </InputGroup>
                    );
                },
            },
            {
                accessorKey: "pricing_mode",
                header: t("rates.pricingMode", "Price Type"),
                cell: ({ row }) => {
                    const item = row.original;
                    // Priority: pricingModes state -> initialValuesMap -> rate_price -> default_price -> "margin_fixed"
                    const currentPricingMode = pricingModes.get(item.id) || initialValuesMap.get(item.id)?.pricing_mode || "margin_fixed";

                    return (
                        <Select
                            value={currentPricingMode}
                            onValueChange={(value) => handlePricingModeChange(item.id, value as "margin_fixed" | "price_fixed", item)}
                        >
                            <SelectTrigger className="w-32 h-7!">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="margin_fixed">
                                    {t("rates.marginFixed", "Margin")}
                                </SelectItem>
                                <SelectItem value="price_fixed">
                                    {t("rates.priceFixed", "Price")}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    );
                },
            },
            {
                accessorKey: "margin",
                header: t("rates.margin", "Margin"),
                cell: ({ row }) => {
                    const item = row.original;
                    const defaultPVP = item.default_price?.price_quantity || null;
                    const defaultValue = initialValuesMap.get(item.id)?.margin;
                    const currentPricingMode = pricingModes.get(item.id) || item.rate_price?.pricing_mode || "margin_fixed";
                    const isDisabled = currentPricingMode !== "margin_fixed";

                    return (
                        <InputGroup className="w-24 h-7!">
                            <InputGroupInput
                                key={`margin-${item.id}-${items.length}`}
                                type="number"
                                defaultValue={defaultValue ?? ""}
                                data-item-id={item.id}
                                data-field="margin"
                                min="0"
                                step="0.01"
                                className="h-7"
                                disabled={isDisabled}
                                onChange={() => handleMarginChange(item.id, defaultPVP)}
                            />
                            <InputGroupAddon align="inline-end">
                                <InputGroupText>%</InputGroupText>
                            </InputGroupAddon>
                        </InputGroup>
                    );
                },
            },
            {
                accessorKey: "price_quantity",
                header: t("rates.pvp", "PVP"),
                cell: ({ row }) => {
                    const item = row.original;
                    const pvp = initialValuesMap.get(item.id)?.pvp || 0;
                    const currentPricingMode = pricingModes.get(item.id) || item.rate_price?.pricing_mode || "margin_fixed";
                    const isDisabled = currentPricingMode !== "price_fixed";
                    const pmc = item.pmc || null;
                    const defaultPVP = item.default_price?.price_quantity || null;

                    // Get billing info for period suffix
                    const billingType = item.rate_price?.billing_type || item.default_price?.billing_type;
                    const billingPeriod = item.rate_price?.billing_period || item.default_price?.billing_period;
                    const periodSuffix = billingType === "recurring" && billingPeriod
                        ? `/${t(`common.billingPeriod.${billingPeriod}`, billingPeriod)}`
                        : "";

                    return (
                        <div className="flex items-center gap-2">
                            <InputGroup className="w-28 h-7!">
                                <InputGroupAddon align="inline-start">
                                    <InputGroupText>€</InputGroupText>
                                </InputGroupAddon>
                                <InputGroupInput
                                    key={`pvp-${item.id}-${items.length}`}
                                    type="number"
                                    defaultValue={pvp > 0 ? pvp.toFixed(2) : "0.00"}
                                    data-item-id={item.id}
                                    data-field="pvp"
                                    min="0"
                                    step="0.01"
                                    className="h-7"
                                    disabled={isDisabled}
                                    onChange={() => handlePVPChange(item.id, pmc, defaultPVP)}
                                />
                            </InputGroup>
                            {periodSuffix && (
                                <span className="text-xs text-muted-foreground">{periodSuffix}</span>
                            )}
                        </div>
                    );
                },
            },
        ],
        [t, handleMarginChange, handleDiscountChange, handlePVPChange, handlePricingModeChange, pricingModes, initialValuesMap]
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="min-h-[90vh] max-h-[90vh] w-full md:max-w-420 flex flex-col" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between gap-2">
                        <IconLabel
                            icon={category.icon}
                            color={category.color}
                            text={category.name}
                            showEmptyColor={false}
                            size="md"
                        />
                        <IdBadge id={category.id} hideIcon={true} customTooltip={t("common.copyId", "Copy ID")} />
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 overflow-y-auto scrollbar-hide px-2">
                    {/* Category Information */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <h4 className="font-medium text-sm">{t('rates.categoryMargin', 'Category Margin')}</h4>
                            {category.rate_margin !== null && category.rate_margin !== undefined ? (
                                <div className="text-sm font-medium">
                                    {formatDecimal(category.rate_margin)} %
                                </div>
                            ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                            )}
                        </div>

                        <div className="space-y-1">
                            <h4 className="font-medium text-sm">{t('rates.numberOfItems', 'Number of Items')}</h4>
                            <div className="flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                <span
                                    className="text-sm"
                                    title={`Direct: ${category.num_items_hierarchy || 0} | Total (incl. sub-categories): ${category.num_items_total || 0}`}
                                >
                                    {(category.num_items_hierarchy || 0) === (category.num_items_total || 0)
                                        ? category.num_items_hierarchy || 0
                                        : `${category.num_items_hierarchy || 0} (${category.num_items_total || 0})`
                                    }
                                </span>
                            </div>
                            {(category.num_items_hierarchy || 0) !== (category.num_items_total || 0) && (
                                <p className="text-xs text-muted-foreground">
                                    Direct: {category.num_items_hierarchy || 0} | Total (incl. sub-categories): {category.num_items_total || 0}
                                </p>
                            )}
                        </div>
                    </div>

                    <Separator className="my-4" />
                </div>

                {/* Search and Actions */}
                <div className="flex gap-2 items-center py-4">
                    <SearchBar
                        value={searchQuery}
                        isLoading={false}
                        onChange={(query) => setSearchQuery(query)}
                        onSearch={() => { }}
                        placeholder={t("rates.searchItems", "Search items...")}
                        className="flex-1"
                    />
                    <Button
                        onClick={() => saveChanges(true)}
                        className="flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t("common.saving", "Saving...")}
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                {t("common.save", "Save")}
                            </>
                        )}
                    </Button>
                </div>

                {/* Items Table */}
                <div className="flex-1 overflow-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-96">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <TableProvider data={filteredItems} columns={columns}>
                            <TableHeader>
                                {({ headerGroup }) => (
                                    <TableHeaderGroup key={headerGroup.id} headerGroup={headerGroup}>
                                        {({ header }) => <TableHead key={header.id} header={header} />}
                                    </TableHeaderGroup>
                                )}
                            </TableHeader>
                            <TableBody
                                emptyState={
                                    <TableRowRaw className="hover:bg-transparent">
                                        <TableCellRaw className="h-64 text-center hover:bg-transparent" colSpan={columns.length}>
                                            <div className="flex items-center justify-center space-y-4 flex-col">
                                                <Package className="h-10 w-10 text-muted-foreground" />
                                                <div className="flex flex-col items-center justify-center">
                                                    <h3 className="text-lg font-medium">
                                                        {searchQuery
                                                            ? t("rates.noItemsFound", "No items found")
                                                            : t("rates.noItemsInCategory", "No items in this category")}
                                                    </h3>
                                                    <p className="text-muted-foreground">
                                                        {searchQuery
                                                            ? t("rates.noItemsFoundDescription", `No items match "${searchQuery}"`)
                                                            : t("rates.noItemsInCategoryDescription", "This category has no items")}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCellRaw>
                                    </TableRowRaw>
                                }
                            >
                                {({ row }) => (
                                    <TableRowRaw
                                        key={row.id}
                                        className="hover:bg-muted/50"
                                        data-state={row.getIsSelected() && 'selected'}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} cell={cell} />
                                        ))}
                                    </TableRowRaw>
                                )}
                            </TableBody>
                        </TableProvider>
                    )}

                    {/* Load More Button */}
                    {nextPageToken && (
                        <div className="flex justify-center mt-4 pb-4">
                            <Button
                                variant="outline"
                                onClick={loadMoreItems}
                                disabled={loadingMore}
                                className="min-w-32"
                            >
                                {loadingMore ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {t("common.loading", "Loading...")}
                                    </>
                                ) : (
                                    t("common.loadMore", "Load More")
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ItemsInCategoryModal;

