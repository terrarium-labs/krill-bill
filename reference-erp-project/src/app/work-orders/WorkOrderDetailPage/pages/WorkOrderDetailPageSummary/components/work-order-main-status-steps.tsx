import { useWorkOrder } from "@/app/work-orders/contexts/WorkOrderContext";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { StatusCategory } from "@/types/general/status-templates";
import React, { useMemo } from "react";
import { CircleCheck, CircleDot, CircleDashed } from "lucide-react";
import { getColorClasses } from "@/utils/miscelanea";

const categoryOrder: StatusCategory[] = ['not_started', 'active', 'done', 'closed'];

// Default colors by category
const defaultCategoryColors: Record<StatusCategory, string> = {
    not_started: 'yellow',
    active: 'green',
    done: 'blue',
    closed: 'red',
};

interface StepItem {
    id: string;
    category: StatusCategory;
    label: string;
    state: 'complete' | 'current' | 'future';
}

interface WorkOrderMainStatusStepsProps {
    variant?: 'default' | 'detail' | 'detail-single';
    hideCategory?: StatusCategory | StatusCategory[];
    colorVariant?: 'default' | 'category' | 'detail' | 'category-single' | 'detail-single' | 'category-all' | 'detail-all';
}

const WorkOrderMainStatusSteps: React.FC<WorkOrderMainStatusStepsProps> = ({
    variant = 'default',
    hideCategory,
    colorVariant = 'default',
}) => {
    const { t } = useTranslation();
    const { workOrder, statuses } = useWorkOrder();

    // Build step items - memoized for performance
    const stepItems = useMemo(() => {
        if (!workOrder || !statuses.length) {
            return [];
        }

        // Find the current status's category
        const currentStatusId = workOrder.status?.id;
        const currentStatusFull = statuses.find(s => s.id === currentStatusId) || workOrder.status;
        const currentCategory = currentStatusFull?.category;
        const currentCategoryIndex = currentCategory ? categoryOrder.indexOf(currentCategory) : -1;

        // Normalize hideCategory to an array
        const hiddenSteps = hideCategory 
            ? Array.isArray(hideCategory) 
                ? hideCategory 
                : [hideCategory]
            : [];

        const items: StepItem[] = [];

        categoryOrder.forEach((category) => {
            // Skip hidden steps
            if (hiddenSteps.includes(category)) {
                return;
            }

            const categoryIndex = categoryOrder.indexOf(category);
            const isCategoryComplete = categoryIndex < currentCategoryIndex;
            const isCategoryCurrent = categoryIndex === currentCategoryIndex;
            const isCategoryFuture = categoryIndex > currentCategoryIndex;

            let label: string;
            if ((variant === 'detail' || variant === 'detail-single') && isCategoryCurrent && currentStatusFull) {
                // In detail mode, show the actual status name for current category
                label = currentStatusFull.name;
            } else if (variant === 'detail') {
                // In detail-all-single mode, show status name if only one status in category
                const categoryStatuses = statuses.filter(s => s.category === category);
                if (categoryStatuses.length === 1) {
                    label = categoryStatuses[0].name;
                } else {
                    label = getCategoryLabel(category, t);
                }
            } else {
                // Otherwise, show the category label
                label = getCategoryLabel(category, t);
            }

            items.push({
                id: `category-${category}`,
                category,
                label,
                state: isCategoryComplete ? 'complete' : isCategoryFuture ? 'future' : 'current',
            });
        });

        return items;
    }, [workOrder, statuses, t, variant, hideCategory]);

    if (stepItems.length === 0) {
        return null;
    }

    // Get color classes based on state and colorVariant
    const getStateClasses = (item: StepItem): string => {
        const { state, category } = item;

        // Get current status full object
        const currentStatusId = workOrder?.status?.id;
        const currentStatusFull = statuses.find(s => s.id === currentStatusId);
        const currentCategory = currentStatusFull?.category;
        
        // Get statuses for this category
        const categoryStatuses = statuses.filter(s => s.category === category);
        const categoryColor = defaultCategoryColors[category];
        
        // Get current status colors (for "all" variants)
        const currentCategoryColor = currentCategory ? defaultCategoryColors[currentCategory] : categoryColor;
        const currentStatusColor = currentStatusFull?.color || currentCategoryColor;

        const shouldColorOnlyCurrent = 
            colorVariant === 'category-single' || 
            colorVariant === 'detail-single';

        // Future always uses secondary
        if (state === 'future') {
            return 'bg-secondary text-secondary-foreground border-secondary';
        }

        // Default variant - use primary for completed and current
        if (colorVariant === 'default') {
            return 'bg-primary text-primary-foreground border-primary';
        }

        // Single variants - only color current
        if (shouldColorOnlyCurrent) {
            if (state === 'current') {
                if (colorVariant === 'category-single') {
                    return getColorClasses(categoryColor);
                } else {
                    // detail-single
                    return getColorClasses(currentStatusColor);
                }
            } else {
                // completed in single mode uses secondary
                return 'bg-secondary text-secondary-foreground border-secondary';
            }
        }

        // "All" variants - use current status colors for both completed and current
        if (colorVariant === 'category-all') {
            // Use current status's category color for all completed and current
            if (state === 'complete' || state === 'current') {
                return getColorClasses(currentCategoryColor);
            }
        }

        if (colorVariant === 'detail-all') {
            // Use current status's own color for all completed and current
            if (state === 'complete' || state === 'current') {
                return getColorClasses(currentStatusColor);
            }
        }

        // Category variant - use each category's own color
        if (colorVariant === 'category') {
            return getColorClasses(categoryColor);
        }

        // Detail variant - use status colors for current, category for completed
        if (colorVariant === 'detail') {
            if (state === 'current') {
                return getColorClasses(currentStatusColor);
            } else if (state === 'complete') {
                // If only one status in category, use that status's color
                if (categoryStatuses.length === 1) {
                    return getColorClasses(categoryStatuses[0].color || categoryColor);
                }
                return getColorClasses(categoryColor);
            }
        }

        // Fallback to primary
        return 'bg-primary text-primary-foreground border-primary';
    };

    return (
        <div className="w-full">
            <div className="flex items-center h-8 relative">
                {stepItems.map((item, index) => {
                    const isFirst = index === 0;
                    const isLast = index === stepItems.length - 1;
                    const colors = getStateClasses(item);

                    return (
                        <React.Fragment key={item.id}>
                            {/* Step element */}
                            <div
                                className={cn(
                                    "relative flex items-center justify-center gap-2 h-full flex-1 text-sm font-medium transition-all border",
                                    colors,
                                    isFirst && "rounded-l-md",
                                    isLast && "rounded-r-md"
                                )}
                                style={{
                                    clipPath: isLast
                                        ? "polygon(0 0, 100% 0, 100% 100%, 0 100%)" // Last: flat rectangle (no arrow on right)
                                        : "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)", // Others: arrow on right
                                    marginLeft: isFirst ? '0' : '-12px',
                                    paddingLeft: '1rem',
                                    paddingRight: isLast ? '1rem' : 'calc(1rem + 12px)',
                                    zIndex: stepItems.length * 2 - index * 2,
                                }}
                            >
                                {/* Icon based on state and category */}
                                {item.state === 'complete' && (
                                    <CircleCheck className="h-4 w-4 shrink-0" />
                                )}
                                {item.state === 'current' && (
                                    (item.category === 'done' || item.category === 'closed') ? (
                                        <CircleCheck className="h-4 w-4 shrink-0" />
                                    ) : (
                                        <CircleDot className="h-4 w-4 shrink-0" />
                                    )
                                )}
                                {item.state === 'future' && (
                                    <CircleDashed className="h-4 w-4 shrink-0" />
                                )}
                                <span className="whitespace-nowrap">{item.label}</span>
                            </div>

                            {/* Separator between steps - identical to step but empty and narrow */}
                            {!isLast && (
                                <div
                                    className={cn(
                                        "relative flex items-center justify-center h-full text-sm font-medium transition-all",
                                        "bg-background",
                                        "border",
                                        "border-border"
                                    )}
                                    style={{
                                        width: '8px',
                                        minWidth: '8px',
                                        flexShrink: 0,
                                        clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)",
                                        marginLeft: '-12px',
                                        paddingLeft: '0',
                                        paddingRight: 'calc(12px)',
                                        zIndex: stepItems.length * 2 - index * 2 - 1,
                                    }}
                                />
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

export default WorkOrderMainStatusSteps;
