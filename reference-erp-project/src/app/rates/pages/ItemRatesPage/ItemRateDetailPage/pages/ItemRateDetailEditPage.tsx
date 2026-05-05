import { useState, useMemo, useCallback, useRef, useEffect, memo } from "react";
import { RateItemHierarchy } from "@/types/general/rates";
import { useRate } from "@/app/rates/contexts/RateContext";
import { useTranslation } from "@/hooks/useTranslation";
import { ChevronRight, Expand, Minimize, Package, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchBar from "@/app/components/search-bar";
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
import { cn } from "@/lib/utils";
import Tag from "@/app/components/tag/tag";
import IconLabel from "@/app/components/labels/icon-label";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
} from "@/components/ui/input-group";
import { useParams } from "react-router-dom";
import { patchOrgRateItemsHierarchiesMargins } from "@/api/orgs/rates/rates";
import { toast } from "sonner";
import ItemsInCategoryModal from "../../components/ItemsInCategoryModal";

// Hierarchical rate item hierarchy with children
interface HierarchicalRateItemHierarchy extends RateItemHierarchy {
    children?: HierarchicalRateItemHierarchy[];
}

// Flattened rate item hierarchy for table display
interface FlattenedRateItemHierarchy extends RateItemHierarchy {
    level: number;
    parentId?: string;
    hasChildren: boolean;
    isExpanded: boolean;
    childrenIds: string[];
    childrenCount: number;
}

interface ItemRateDetailEditPageProps {
    onSavingChange?: (isSaving: boolean) => void;
}

const ItemRateDetailEditPage = ({ onSavingChange }: ItemRateDetailEditPageProps) => {
    const { t } = useTranslation();
    const { rate } = useRate();
    const { orgId, rateId } = useParams<{ orgId: string, rateId: string }>();
    const [rateItemsHierarchies] = useState<RateItemHierarchy[]>(rate?.item_hierarchies || []);
    const [searchQuery, setSearchQuery] = useState("");

    const pendingChanges = useRef<Map<string, number>>(new Map());

    const saveMargins = async (placebo: boolean = false) => {
        if (!orgId || !rateId) return;

        try {
            const margins = Array.from(pendingChanges.current.entries()).map(([item_hierarchy_id, margin]) => ({
                item_hierarchy_id,
                margin,
            }));
            const response = await patchOrgRateItemsHierarchiesMargins(orgId, rateId, { margins });
            if (response.success) {
                if (placebo) {
                    toast.success(t("rates.marginsSavedSuccess", "Margins saved successfully"))
                } else {
                    onSavingChange?.(false);
                }
            } else {
                toast.error(t("rates.errorSavingMargins", "Error saving margins"))
            }
        } catch (error) {
            console.error("Error saving margins:", error);
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if (pendingChanges.current.size > 0) {
                saveMargins();
            }
        }, 3737);
        return () => clearInterval(interval);
    }, []);

    const calculateDiscountRate = (rateMargin: number | null, margin: number | null) => {
        if (rateMargin === null || margin === null) return 0;
        let discountRate = 0;
        if (rateMargin >= margin) {
            discountRate = 0;
        } else {
            discountRate = ((1 - rateMargin / margin) * 100);
        }
        return discountRate > 100 ? 100 : parseFloat(discountRate.toFixed(2));
    };

    const initialValuesMap = useMemo(() => {
        const map = new Map<string, { rate_margin: number | null; discount_rate: number | null }>();
        (rate?.item_hierarchies || []).forEach((item) => {
            const rateMargin = item.rate_margin ?? item.margin ?? 0;
            const discountRate = calculateDiscountRate(rateMargin, item.margin ?? 0);
            map.set(item.id, {
                rate_margin: rateMargin,
                discount_rate: discountRate,
            });
        });
        return map;
    }, [rate?.item_hierarchies]);

    // Convert flat rate item hierarchies array to hierarchical structure
    const buildHierarchy = useCallback((items: RateItemHierarchy[]): HierarchicalRateItemHierarchy[] => {
        const itemsMap = new Map<string, HierarchicalRateItemHierarchy>();
        const rootItems: HierarchicalRateItemHierarchy[] = [];

        // First pass: create map of all items
        items.forEach((item) => {
            itemsMap.set(item.id, { ...item, children: [] });
        });

        // Second pass: build hierarchy
        items.forEach((item) => {
            const hierarchicalItem = itemsMap.get(item.id)!;

            if (item.parent?.id && itemsMap.has(item.parent.id)) {
                // Item has a parent - add to parent's children
                const parent = itemsMap.get(item.parent.id)!;
                if (!parent.children) {
                    parent.children = [];
                }
                parent.children.push(hierarchicalItem);
            } else {
                // No parent or parent not found - add to root
                rootItems.push(hierarchicalItem);
            }
        });

        return rootItems;
    }, []);

    // Build hierarchical structure
    const hierarchicalRateItemHierarchies = useMemo(() => {
        return buildHierarchy(rateItemsHierarchies);
    }, [rateItemsHierarchies, buildHierarchy]);

    // Get all parent IDs for default expansion
    const getAllParentIds = useCallback((items: HierarchicalRateItemHierarchy[]): Set<string> => {
        const parentIds = new Set<string>();

        const collectParentIds = (items: HierarchicalRateItemHierarchy[]) => {
            items.forEach((item) => {
                if (item.children && item.children.length > 0) {
                    parentIds.add(item.id);
                    collectParentIds(item.children);
                }
            });
        };

        collectParentIds(items);
        return parentIds;
    }, []);

    // Initialize expandedItems with all parent IDs (default all expanded)
    const [expandedItems, setExpandedItems] = useState<Set<string>>(() =>
        getAllParentIds(buildHierarchy(rate?.item_hierarchies || []))
    );
    const [expandAllToggled, setExpandAllToggled] = useState<boolean>(true);

    // Items modal state
    const [itemsModalOpen, setItemsModalOpen] = useState(false);
    const [selectedHierarchy, setSelectedHierarchy] = useState<FlattenedRateItemHierarchy | null>(null);

    // Flatten hierarchical data for table display
    const flattenedData = useMemo(() => {
        const result: FlattenedRateItemHierarchy[] = [];

        const addItemsRecursively = (
            items: HierarchicalRateItemHierarchy[],
            level: number,
            parentId?: string
        ) => {
            items.forEach((item) => {
                const hasChildren = Boolean(item.children && item.children.length > 0);
                const flatItem: FlattenedRateItemHierarchy = {
                    ...item,
                    level,
                    parentId,
                    hasChildren,
                    isExpanded: expandedItems.has(item.id),
                    childrenIds: item.children?.map((child) => child.id) || [],
                    childrenCount: item.children?.length || 0,
                };
                result.push(flatItem);

                // Add children if item is expanded
                if (expandedItems.has(item.id) && hasChildren) {
                    addItemsRecursively(item.children!, level + 1, item.id);
                }
            });
        };

        addItemsRecursively(hierarchicalRateItemHierarchies, 0);
        return result;
    }, [hierarchicalRateItemHierarchies, expandedItems]);

    // Filter data based on search query
    const filteredData = useMemo(() => {
        if (!searchQuery.trim()) {
            return flattenedData;
        }

        const query = searchQuery.toLowerCase();
        return flattenedData.filter((item) => {
            return (
                item.name.toLowerCase().includes(query) ||
                (item.description && item.description.toLowerCase().includes(query)) ||
                item.type.toLowerCase().includes(query)
            );
        });
    }, [flattenedData, searchQuery]);

    // Toggle expand/collapse
    const toggleExpanded = useCallback(
        (itemId: string, event: React.MouseEvent) => {
            event.stopPropagation();

            setExpandedItems((prev) => {
                const newSet = new Set(prev);
                if (newSet.has(itemId)) {
                    newSet.delete(itemId);
                } else {
                    newSet.add(itemId);
                }
                return newSet;
            });
        },
        []
    );

    // Collapse all items
    const collapseAll = useCallback(() => {
        setExpandedItems(new Set());
    }, []);

    // Expand all items
    const expandAll = useCallback(() => {
        setExpandedItems(getAllParentIds(hierarchicalRateItemHierarchies));
    }, [hierarchicalRateItemHierarchies, getAllParentIds]);


    // Handle rate margin change - DOM-based logic
    const handleRateMarginChange = useCallback((itemId: string, defaultMargin: number | null) => {
        const marginInput = document.querySelector(`input[data-item-id="${itemId}"][data-field="rate_margin"]`) as HTMLInputElement;
        const discountInput = document.querySelector(`input[data-item-id="${itemId}"][data-field="discount_rate"]`) as HTMLInputElement;

        if (!marginInput || !discountInput) return;

        const rateMargin = marginInput.value ? parseFloat(marginInput.value) : 0;

        // Calculate discount based on rate_margin (only if defaultMargin exists)
        if (defaultMargin) {
            // Formula: discount = (1 - rate_margin/margin) * 100
            if (rateMargin >= defaultMargin) {
                // If rate_margin >= margin, discount is 0
                discountInput.value = "0";
            } else {
                // Calculate discount percentage
                const discount = ((1 - rateMargin / defaultMargin) * 100);
                discountInput.value = discount.toFixed(2);
            }
        }

        pendingChanges.current.set(itemId, rateMargin);
    }, []);

    // Handle discount change - DOM-based logic
    const handleDiscountChange = useCallback((itemId: string, defaultMargin: number | null) => {
        const marginInput = document.querySelector(`input[data-item-id="${itemId}"][data-field="rate_margin"]`) as HTMLInputElement;
        const discountInput = document.querySelector(`input[data-item-id="${itemId}"][data-field="discount_rate"]`) as HTMLInputElement;

        if (!marginInput || !discountInput) return;

        const discount = discountInput.value ? parseFloat(discountInput.value) : 0;

        // Calculate new rate_margin based on discount (only if defaultMargin exists)
        let newRateMargin = 0;
        if (defaultMargin) {
            // Formula: rate_margin = margin * (1 - discount/100)
            newRateMargin = defaultMargin * (1 - discount / 100);
            marginInput.value = newRateMargin.toFixed(2);
        } else {
            // If no default margin, just use the current margin input value
            newRateMargin = marginInput.value ? parseFloat(marginInput.value) : 0;
        }

        pendingChanges.current.set(itemId, newRateMargin);
    }, []);

    // Memoized name cell renderer
    const NameCell = useCallback(({ row }: { row: any }) => {
        const item: FlattenedRateItemHierarchy = row.original;
        const indent = item.level * 24; // 24px per level

        return (
            <div
                className="flex items-center gap-2 h-6"
                style={{ paddingLeft: `${indent}px` }}
            >
                {item.hasChildren && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="p-0 h-auto w-auto"
                        onClick={(e) => toggleExpanded(item.id, e)}
                    >
                        <ChevronRight
                            className={cn(
                                "h-4 w-4 transition-all duration-300",
                                item.isExpanded ? "rotate-90" : "rotate-0"
                            )}
                        />
                    </Button>
                )}

                <IconLabel data={{icon: item.icon, text: item.name, color: item.color}} showEmptyColor={false} />
            </div>
        );
    }, [toggleExpanded]);

    // Handle row click to open items modal
    const handleRowClick = useCallback((item: FlattenedRateItemHierarchy, event: React.MouseEvent) => {
        // Don't open modal if clicking on input fields or buttons
        const target = event.target as HTMLElement;
        if (
            target.tagName === 'INPUT' ||
            target.tagName === 'BUTTON' ||
            target.closest('button') ||
            target.closest('input')
        ) {
            return;
        }

        setSelectedHierarchy(item);
        setItemsModalOpen(true);
    }, []);

    // Define table columns
    const columns: ColumnDef<FlattenedRateItemHierarchy>[] = useMemo(
        () => [
            {
                accessorKey: "id",
                header: t("common.id", "ID"),
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <IdBadge id={item.id} hideIcon={true} customTooltip={t("common.copyId", "Copy ID")} />
                    );
                },
            },
            {
                accessorKey: "name",
                header: t("taxonomy.columns.name", "Name"),
                cell: NameCell,
            },
            {
                accessorKey: "type",
                header: t("taxonomy.columns.type", "Type"),
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <Tag text={item.type.replace("_", " ")} className="capitalize" />
                    );
                },
            },

            {
                accessorKey: "num_items_hierarchy",
                header: t("taxonomy.columns.itemsHierarchy", "Items"),
                cell: ({ row }) => {
                    const item = row.original;
                    const directItems = item.num_items_hierarchy || 0;
                    const totalItems = item.num_items_total || 0;
                    const displayText = directItems === totalItems
                        ? directItems
                        : `${directItems} (${totalItems})`;
                    return (
                        <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            <span
                                className="text-sm"
                                title={`Direct: ${directItems} | Total (incl. sub-categories): ${totalItems}`}
                            >
                                {displayText}
                            </span>
                        </div>
                    );
                },
            },
            {
                accessorKey: "margin",
                header: t("taxonomy.columns.margin", "Default Margin"),
                cell: ({ row }) => {
                    const item = row.original;
                    if (item.margin === null) {
                        return <span className="text-muted-foreground">-</span>;
                    }
                    return (
                        <span className="text-sm">
                            {item.margin}%
                        </span>
                    );
                },
            },
            {
                accessorKey: "rate_margin",
                header: t("rates.columns.rateMargin", "Rate Margin"),
                meta: {
                    className: "border-l pl-4"
                },
                cell: ({ row }) => {
                    const item = row.original;
                    const defaultValue = pendingChanges.current.get(item.id) || initialValuesMap.get(item.id)?.rate_margin;

                    return (
                        <InputGroup className="w-32 h-7">
                            <InputGroupInput
                                key={`margin-${item.id}`}
                                type="number"
                                defaultValue={defaultValue ?? ""}
                                data-item-id={item.id}
                                data-field="rate_margin"
                                min="0"
                                step="0.01"
                                className="h-7"
                                onChange={() => handleRateMarginChange(item.id, item.margin)}
                            />
                            <InputGroupAddon align="inline-end">
                                <InputGroupText>%</InputGroupText>
                            </InputGroupAddon>
                        </InputGroup>
                    );
                },
            },

            {
                accessorKey: "discount_rate",
                header: t("rates.columns.discountRate", "Discount Rate"),
                cell: ({ row }) => {
                    const item = row.original;
                    const defaultValue = calculateDiscountRate(item.rate_margin, item.margin) || initialValuesMap.get(item.id)?.discount_rate;

                    return (
                        <InputGroup className="w-32 h-7">
                            <InputGroupInput
                                key={`discount-${item.id}`}
                                type="number"
                                defaultValue={defaultValue ?? ""}
                                data-item-id={item.id}
                                data-field="discount_rate"
                                min="0"
                                max="100"
                                step="0.01"
                                className="h-7"
                                placeholder="0"
                                onChange={() => handleDiscountChange(item.id, item.margin)}
                            />
                            <InputGroupAddon align="inline-end">
                                <InputGroupText>%</InputGroupText>
                            </InputGroupAddon>
                        </InputGroup>
                    );
                },
            },
        ],
        [t, NameCell, initialValuesMap, handleRateMarginChange, handleDiscountChange, pendingChanges]
    );

    return (
        <div className="space-y-6">
            {/* Search and Expand/Collapse Controls */}
            <div className="flex gap-4 items-center justify-between">
                {/* Search Bar */}
                <div className="flex-1">
                    <SearchBar
                        value={searchQuery}
                        isLoading={false}
                        onChange={(query) => setSearchQuery(query)}
                        onSearch={() => { }}
                        placeholder={t(
                            "rates.searchPlaceholder",
                            "Search rate item hierarchies..."
                        )}
                    />
                </div>

                {/* Expand/Collapse Controls */}
                <div className="flex gap-2 items-center">
                    {flattenedData.length > 0 && flattenedData.some(item => item.hasChildren) && (
                        <>
                            {expandAllToggled && (
                                <Button
                                    variant="outline"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        collapseAll();
                                        setExpandAllToggled(false);
                                    }}
                                    className="flex items-center gap-2"
                                >
                                    <Minimize className="h-4 w-4" />
                                    {t("common.collapse_all", "Collapse all")}
                                </Button>
                            )}
                            {!expandAllToggled && (
                                <Button
                                    variant="outline"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        expandAll();
                                        setExpandAllToggled(true);
                                    }}
                                    className="flex items-center gap-2"
                                >
                                    <Expand className="h-4 w-4" />
                                    {t("common.expand_all", "Expand all")}
                                </Button>
                            )}
                        </>
                    )}
                    <Button
                        onClick={(e) => {
                            e.preventDefault();
                            saveMargins(true);
                        }}
                        className="flex items-center gap-2"
                    >
                        <Save className="h-4 w-4" />
                        {t("common.save", "Save")}
                    </Button>
                </div>
            </div>

            {/* Rate Item Hierarchies Table */}
            <TableProvider data={filteredData} columns={columns}>
                <TableHeader>
                    {({ headerGroup }) => (
                        <TableHeaderGroup key={headerGroup.id} headerGroup={headerGroup}>
                            {({ header }) => <TableHead key={header.id} header={header} />}
                        </TableHeaderGroup>
                    )}
                </TableHeader>
                <TableBody
                    isLoading={false}
                    emptyState={
                        <TableRowRaw className="hover:bg-transparent">
                            <TableCellRaw className="h-96 text-center hover:bg-transparent" colSpan={columns.length}>
                                <div className="flex items-center justify-center space-y-4 flex-col">
                                    <Package className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">
                                            {searchQuery
                                                ? t("rates.noResultsFound", "No results found")
                                                : t("rates.noHierarchies", "No rate item hierarchies found")}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {searchQuery
                                                ? t(
                                                    "rates.noResultsDescription",
                                                    'No results found for "{{searchQuery}}"',
                                                    { searchQuery }
                                                )
                                                : t(
                                                    "rates.noHierarchiesDescription",
                                                    "This rate has no item hierarchies assigned."
                                                )}
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
                            className="hover:bg-muted/50 cursor-pointer"
                            data-state={row.getIsSelected() && 'selected'}
                            onClick={(e) => handleRowClick(row.original as FlattenedRateItemHierarchy, e)}
                        >
                            {row.getVisibleCells().map((cell) => (
                                <TableCell
                                    key={cell.id}
                                    cell={cell}
                                />
                            ))}
                        </TableRowRaw>
                    )}
                </TableBody>
            </TableProvider>

            {/* Items in Category Modal */}
            {orgId && rateId && selectedHierarchy && (
                <ItemsInCategoryModal
                    open={itemsModalOpen}
                    onOpenChange={setItemsModalOpen}
                    orgId={orgId}
                    rateId={rateId}
                    category={selectedHierarchy}
                />
            )}
        </div>
    );
};

export default memo(ItemRateDetailEditPage);