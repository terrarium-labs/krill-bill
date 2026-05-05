import { useWorkOrder } from "@/app/work-orders/contexts/WorkOrderContext";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Status, StatusCategory } from "@/types/general/status-templates";
import React, { useMemo } from "react";
import { Check } from "lucide-react";
import { getColorClasses } from "@/utils/miscelanea";

// Default colors by category (using color names)
const defaultCategoryColors: Record<StatusCategory, string> = {
    not_started: 'yellow',
    active: 'green',
    done: 'blue',
    closed: 'red',
};

const categoryOrder: StatusCategory[] = ['not_started', 'active', 'done', 'closed'];

interface DisplayItem {
    id: string;
    label: string;
    color: string;
    state: 'complete' | 'current' | 'future';
    isExpanded: boolean;
}

export interface StatusItemState {
    state: 'complete' | 'current' | 'future';
    color: string;
}

interface WorkOrderStatusProgressSectionItemProps {
    color: string;
    state: 'complete' | 'current' | 'future';
}

const WorkOrderStatusProgressSectionItem: React.FC<WorkOrderStatusProgressSectionItemProps> = ({
    color,
    state,
}) => {
    return (
        <div
            className={cn(
                "relative flex items-center justify-center rounded-full transition-all shrink-0",
                state === 'complete'
                    ? `border-2 bg-${color}-100 border-${color}-200 dark:bg-${color}-900/20 dark:border-${color}-800`
                    : state === 'current'
                        ? `border-2 bg-${color}-100 border-${color}-200 dark:bg-${color}-900/20 dark:border-${color}-800`
                        : `border-4 ${getColorClasses("gray")} bg-transparent dark:bg-transparent`,
                "w-10 h-10"
            )}
        >
            {state === 'complete' && (
                <Check className={cn("h-5 w-5", getColorClasses(color, "background"))} />
            )}
            {state === 'current' && (
                <div
                    className={`w-5 h-5 rounded-full border-2 bg-background border-${color}-200 dark:bg-secondary-900 dark:border-${color}-800`}
                />
            )}
        </div>
    );
};

interface WorkOrderStatusProgressSectionProps {
    variant?: 'default' | 'detail' | 'category' | 'category-detail';
}

const WorkOrderStatusProgressSection = ({ variant = 'default' }: WorkOrderStatusProgressSectionProps) => {
    const { t } = useTranslation();
    const { workOrder, statuses } = useWorkOrder();

    // Build display items - memoized for performance
    const displayItems = useMemo(() => {
        if (!workOrder || !statuses.length) {
            return [];
        }

        // Find the full status object from statuses array by matching ID
        const currentStatusId = workOrder.status?.id;
        const currentStatusFull = statuses.find(s => s.id === currentStatusId) || workOrder.status;
        const currentCategory = currentStatusFull?.category;
        const currentCategoryIndex = currentCategory ? categoryOrder.indexOf(currentCategory) : -1;

        // Group statuses by category
        const statusesByCategory: Record<StatusCategory, Status[]> = {
            not_started: [],
            active: [],
            done: [],
            closed: [],
        };

        statuses.forEach((status) => {
            if (status.category) {
                statusesByCategory[status.category].push(status);
            }
        });

        const items: DisplayItem[] = [];

        categoryOrder.forEach((category) => {
            const categoryStatuses = statusesByCategory[category];
            if (categoryStatuses.length === 0) return;

            const categoryIndex = categoryOrder.indexOf(category);
            const isCategoryComplete = categoryIndex < currentCategoryIndex;
            const isCategoryCurrent = categoryIndex === currentCategoryIndex;
            const isCategoryFuture = categoryIndex > currentCategoryIndex;

            // Get category color from first status or use default
            const categoryColor = categoryStatuses[0]?.color || defaultCategoryColors[category];

            if (variant === 'detail') {
                // Always expand all categories: show all statuses for all categories
                categoryStatuses.forEach((status) => {
                    const statusColor = status.color || categoryColor;

                    let state: 'complete' | 'current' | 'future';
                    if (isCategoryComplete) {
                        // If category is complete, all statuses in it are complete
                        state = 'complete';
                    } else if (isCategoryFuture) {
                        // If category is future, all statuses in it are future
                        state = 'future';
                    } else if (status.id === currentStatusId) {
                        // Current status
                        state = 'current';
                    } else {
                        // For current category, compare positions
                        const statusPosition = status.position || 0;
                        const currentPosition = currentStatusFull?.position || 0;
                        state = statusPosition < currentPosition ? 'complete' : 'future';
                    }

                    items.push({
                        id: status.id,
                        label: status.name,
                        color: statusColor,
                        state,
                        isExpanded: true,
                    });
                });
            } else if (variant === 'category') {
                // Never expand: always show category item with category label
                items.push({
                    id: `category-${category}`,
                    label: getCategoryLabel(category, t),
                    color: categoryColor,
                    state: isCategoryComplete ? 'complete' : isCategoryFuture ? 'future' : 'current',
                    isExpanded: false,
                });
            } else if (variant === 'category-detail') {
                // Never expand, but for current category show status label
                const isCurrent = isCategoryCurrent;
                const label = isCurrent && currentStatusFull
                    ? currentStatusFull.name
                    : getCategoryLabel(category, t);

                items.push({
                    id: `category-${category}`,
                    label,
                    color: categoryColor,
                    state: isCategoryComplete ? 'complete' : isCategoryFuture ? 'future' : 'current',
                    isExpanded: false,
                });
            } else {
                // Default variant: expand current category only
                if (isCategoryCurrent && categoryStatuses.length > 0) {
                    // Expanded: show all statuses in this category
                    categoryStatuses.forEach((status) => {
                        const statusColor = status.color || categoryColor;

                        let state: 'complete' | 'current' | 'future';
                        if (status.id === currentStatusId) {
                            state = 'current';
                        } else {
                            const statusPosition = status.position || 0;
                            const currentPosition = currentStatusFull?.position || 0;
                            state = statusPosition < currentPosition ? 'complete' : 'future';
                        }

                        items.push({
                            id: status.id,
                            label: status.name,
                            color: statusColor,
                            state,
                            isExpanded: true,
                        });
                    });
                } else {
                    // Collapsed: show single item for the category
                    const label = categoryStatuses.length === 1
                        ? categoryStatuses[0].name
                        : getCategoryLabel(category, t);

                    items.push({
                        id: `category-${category}`,
                        label,
                        color: categoryColor,
                        state: isCategoryComplete ? 'complete' : isCategoryFuture ? 'future' : 'current',
                        isExpanded: false,
                    });
                }
            }
        });

        return items;
    }, [workOrder, statuses, t, variant]);

    if (displayItems.length === 0) {
        return null;
    }

    return (
        <div className="w-full">
            {/* Row 1: Circles and Lines */}
            <div className="flex items-center gap-2">
                {displayItems.map((item, index) => {
                    const isLast = index === displayItems.length - 1;

                    // Determine line color: colored if current item is complete, otherwise gray
                    const lineColor = item.state === 'complete' ? item.color : undefined;

                    return (
                        <React.Fragment key={item.id}>
                            <WorkOrderStatusProgressSectionItem
                                color={item.color}
                                state={item.state}
                            />
                            {!isLast && (
                                <div
                                    className={cn(
                                        "h-0.5 flex-1 min-w-[20px]",
                                        lineColor
                                            ? `border-1 bg-${lineColor}-100 border-${lineColor}-200 dark:bg-${lineColor}-900/20 dark:border-${lineColor}-800`
                                            : 'border-1 bg-gray-100 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800'
                                    )}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Row 2: Labels */}
            <div className="flex items-start gap-2 mt-2">
                {displayItems.map((item, index) => {
                    const isLast = index === displayItems.length - 1;
                    const isFirst = index === 0;

                    return (
                        <React.Fragment key={`label-${item.id}`}>
                            {/* Label container - same width as circle (w-10 = 40px) */}
                            <div className={cn(
                                "w-10 flex shrink-0",
                                isFirst ? "justify-start" : isLast ? "justify-end" : "justify-center"
                            )}>
                                <span
                                    className={cn(
                                        "text-xs font-medium whitespace-nowrap",
                                        item.state === 'current' ? getColorClasses(item.color, "background") : "text-muted-foreground"
                                    )}
                                >
                                    {item.label}
                                </span>
                            </div>
                            {/* Spacer to match line width */}
                            {!isLast && (
                                <div className="flex-1 min-w-[20px]" />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

// Helper function to get category label
const getCategoryLabel = (category: StatusCategory, t: (key: string, fallback: string) => string): string => {
    switch (category) {
        case 'not_started':
            return t('workOrders.statusCategory.notStarted', 'Not Started');
        case 'active':
            return t('workOrders.statusCategory.active', 'Active');
        case 'done':
            return t('workOrders.statusCategory.done', 'Done');
        case 'closed':
            return t('workOrders.statusCategory.closed', 'Closed');
        default:
            return category;
    }
};

export default WorkOrderStatusProgressSection;