import { memo, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { GraduationCap, Plus, Check, X, Users, Info } from "lucide-react";
import {
    TableProvider,
    TableHeader,
    TableHeaderGroup,
    TableHead,
    TableBody,
    TableCell,
    TableColumnHeader,
    type ColumnDef,
    type ColumnOrderState,
    type ColumnSizingState,
    type VisibilityState,
} from "@/components/ui/shadcn-io/table";
import type { OnChangeFn } from "@tanstack/react-table";
import { TableRow as TableRowRaw, TableCell as TableCellRaw } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";
import { cn } from "@/lib/utils";
import Tag from "@/app/components/tag/tag";
import DateLabel from "@/app/components/labels/date-label";
import ProgressLabel from "@/app/components/labels/progress-label";
import TextLabel from "@/app/components/labels/text-label";
import { Button } from "@/components/ui/button";
import IdBadge from "@/app/components/id-badge";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Training } from "@/types/trainings/trainings";
import {
    DELIVERY_TYPE_META,
    TRAINING_STATUS_META,
    TRAINING_VISIBILITY_META,
} from "@/app/trainings/training-field-meta";
import {
    getTrainingCategoriesDisplay,
    getTrainingDeliveryTypes,
    getTrainingStatuses,
} from "@/app/trainings/training-normalize";

export type TrainingsTableColumnKey =
    | "id"
    | "title"
    | "category"
    | "delivery_type"
    | "status"
    | "visibility"
    | "start_date"
    | "end_date"
    | "is_mandatory"
    | "enrolled_count"
    | "provider"
    | "actions";

interface TrainingsTableProps {
    trainings: Training[];
    isLoading: boolean;
    hiddenColumns?: TrainingsTableColumnKey[] | TrainingsTableColumnKey;
    renderActions?: (training: Training) => ReactNode;
    onRowClick?: (training: Training) => void;
    clickableRows?: boolean;
    searchQuery?: string;
    emptyTitle?: string;
    emptyDescription?: string;
    onEmptyStateAction?: () => void;
    compact?: boolean;
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const TrainingsTableComponent = ({
    trainings,
    isLoading,
    hiddenColumns,
    renderActions,
    onRowClick,
    clickableRows,
    searchQuery,
    emptyTitle,
    emptyDescription,
    onEmptyStateAction,
    compact,
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: TrainingsTableProps) => {
    const { t } = useTranslation();

    const hiddenColumnsArray = useMemo(() => {
        if (Array.isArray(hiddenColumns)) return hiddenColumns;
        return hiddenColumns ? [hiddenColumns] : [];
    }, [hiddenColumns]);

    const effectiveColumnVisibility = useMemo<VisibilityState | undefined>(() => {
        if (hiddenColumnsArray.length === 0) return columnVisibility;
        const structural = hiddenColumnsArray.reduce<VisibilityState>((acc, key) => {
            acc[key] = false;
            return acc;
        }, {});
        return { ...(columnVisibility ?? {}), ...structural };
    }, [columnVisibility, hiddenColumnsArray]);

    const columns = useMemo<ColumnDef<Training>[]>(() => {
        const cols: ColumnDef<Training>[] = [
            {
                accessorKey: "id",
                header: t("common.id", "ID"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <div onClick={(e) => e.stopPropagation()}>
                        <IdBadge
                            id={row.original.id}
                            hideIcon
                            customTooltip={t("common.copyId", "Copy ID")}
                        />
                    </div>
                ),
            },
            {
                accessorKey: "title",
                header: t("trainings.columns.title", "Title"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => (
                    <span className={cn("font-medium", compact && "text-xs")}>
                        {row.original.title}
                    </span>
                ),
            },
            {
                id: "category",
                header: t("trainings.columns.category", "Category"),
                enableResizing: true,
                size: 150,
                cell: ({ row }) => {
                    const cats = getTrainingCategoriesDisplay(row.original);
                    if (cats.length === 0) {
                        return <span className="text-muted-foreground text-xs">—</span>;
                    }
                    return (
                        <div className="flex flex-wrap gap-1">
                            {cats.map((cat) => (
                                <Tag
                                    key={cat.id}
                                    text={cat.name}
                                    color={cat.color ?? undefined}
                                />
                            ))}
                        </div>
                    );
                },
            },
            {
                accessorKey: "delivery_type",
                header: t("trainings.columns.deliveryType", "Type"),
                enableResizing: true,
                size: 130,
                cell: ({ row }) => (
                    <div className="flex flex-wrap gap-1">
                        {getTrainingDeliveryTypes(row.original).map((dt) => {
                            const { i18nKey, defaultLabel, tagColor } =
                                DELIVERY_TYPE_META[dt];
                            return (
                                <Tag
                                    key={dt}
                                    text={t(i18nKey, defaultLabel)}
                                    color={tagColor}
                                />
                            );
                        })}
                    </div>
                ),
            },
            {
                accessorKey: "status",
                header: t("trainings.columns.status", "Status"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <div className="flex flex-wrap gap-1">
                        {getTrainingStatuses(row.original).map((st) => {
                            const { i18nKey, defaultLabel, tagColor } =
                                TRAINING_STATUS_META[st];
                            return (
                                <Tag
                                    key={st}
                                    text={t(i18nKey, defaultLabel)}
                                    color={tagColor}
                                />
                            );
                        })}
                    </div>
                ),
            },
            {
                accessorKey: "visibility",
                header: () => (
                    <div className="flex items-center gap-1 min-w-0">
                        <span className="truncate">
                            {t("trainings.columns.visibility", "Visibility")}
                        </span>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    className="inline-flex rounded-sm text-muted-foreground hover:text-foreground shrink-0"
                                    aria-label={t(
                                        "trainings.visibility.tooltipAria",
                                        "About training visibility",
                                    )}
                                >
                                    <Info className="h-3.5 w-3.5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs text-left">
                                <p className="text-xs leading-relaxed">
                                    {t(
                                        "trainings.visibility.tooltip",
                                        "Public: all users in the organization can enroll. Private: only users you invite can enroll.",
                                    )}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                ),
                enableResizing: true,
                size: 130,
                cell: ({ row }) => {
                    const vis = row.original.visibility ?? "public";
                    const { i18nKey, defaultLabel, tagColor } =
                        TRAINING_VISIBILITY_META[vis];
                    return (
                        <Tag
                            text={t(i18nKey, defaultLabel)}
                            color={tagColor}
                        />
                    );
                },
            },
            {
                accessorKey: "start_date",
                header: t("trainings.columns.startDate", "Start Date"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => <DateLabel data={row.original.start_date} />,
            },
            {
                accessorKey: "end_date",
                header: t("trainings.columns.endDate", "End Date"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => <DateLabel data={row.original.end_date} />,
            },
            {
                accessorKey: "provider",
                header: t("trainings.columns.provider", "Provider"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => <TextLabel data={row.original.provider} />,
            },
            {
                accessorKey: "is_mandatory",
                header: t("trainings.columns.mandatory", "Mandatory"),
                enableResizing: true,
                size: 85,
                cell: ({ row }) =>
                    row.original.is_mandatory ? (
                        <Check
                            className={cn(
                                "text-green-500",
                                compact ? "h-3.5 w-3.5" : "h-4 w-4",
                            )}
                        />
                    ) : (
                        <X
                            className={cn(
                                "text-red-500",
                                compact ? "h-3.5 w-3.5" : "h-4 w-4",
                            )}
                        />
                    ),
            },
            {
                accessorKey: "enrolled_count",
                header: t("trainings.columns.enrolled", "Enrolled"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const n = row.original.enrolled_count ?? 0;
                    const max = row.original.max_participants;
                    if (max != null && max > 0) {
                        return (
                            <ProgressLabel
                                data={[n, max]}
                                size="w-full"
                                variant="color"
                                className={cn(
                                    "max-w-[14rem] min-w-[9.5rem] cursor-default",
                                    compact && "min-w-[7rem]",
                                )}
                            />
                        );
                    }
                    return (
                        <div className="flex items-center gap-2">
                            <Users
                                className={cn(
                                    "shrink-0",
                                    compact ? "h-3.5 w-3.5" : "h-4 w-4",
                                )}
                            />
                            <span
                                className={cn(
                                    "tabular-nums text-sm",
                                    compact && "text-xs",
                                )}
                            >
                                {n}
                            </span>
                        </div>
                    );
                },
            },
        ];

        if (renderActions) {
            cols.push({
                id: "actions",
                enableResizing: false,
                size: 52,
                header: ({ header }) => (
                    <TableColumnHeader
                        column={header.column}
                        className="justify-center items-center flex"
                        title=""
                    />
                ),
                cell: ({ row }) => (
                    <div
                        className="flex justify-center items-center"
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                        }}
                    >
                        {renderActions(row.original)}
                    </div>
                ),
                meta: { sticky: "right" },
            });
        }

        return cols;
    }, [t, compact, renderActions]);

    const { wrapRowWithContextMenu } = useTableContextMenu<Training>(renderActions);

    return (
        <div className="w-full overflow-x-auto">
            <TableProvider
                data={trainings}
                columns={columns}
                enableColumnResizing
                columnVisibility={effectiveColumnVisibility}
                onColumnVisibilityChange={onColumnVisibilityChange}
                columnOrder={columnOrder}
                onColumnOrderChange={onColumnOrderChange}
                columnSizing={columnSizing}
                onColumnSizingChange={onColumnSizingChange}
            >
                <TableHeader>
                    {({ headerGroup }) => (
                        <TableHeaderGroup headerGroup={headerGroup}>
                            {({ header }) => <TableHead header={header} />}
                        </TableHeaderGroup>
                    )}
                </TableHeader>

                <TableBody
                    isLoading={isLoading}
                    loadingState={<TableSkeleton columnCount={columns.length} />}
                    emptyState={
                        <TableRowRaw className="hover:bg-transparent">
                            <TableCellRaw
                                className="h-96 text-center hover:bg-transparent"
                                colSpan={columns.length}
                            >
                                <div className="flex items-center justify-center space-y-4 flex-col">
                                    <GraduationCap className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">
                                            {searchQuery
                                                ? t("trainings.empty.noResults", 'No results for "{{query}}"', { query: searchQuery })
                                                : (emptyTitle ?? t("trainings.empty.title", "No trainings yet"))}
                                        </h3>
                                        {emptyDescription && (
                                            <p className="text-muted-foreground">{emptyDescription}</p>
                                        )}
                                    </div>
                                    {onEmptyStateAction && (
                                        <Button variant="outline" onClick={onEmptyStateAction}>
                                            <Plus className="h-4 w-4" />
                                            {t("trainings.addTraining", "Add Training")}
                                        </Button>
                                    )}
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const training = row.original as Training;
                        const rowElement = (
                            <TableRowRaw
                                key={row.id}
                                className={cn(
                                    "hover:bg-muted/50",
                                    clickableRows && "cursor-pointer",
                                )}
                                onClick={() => onRowClick?.(training)}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} cell={cell} />
                                ))}
                            </TableRowRaw>
                        );
                        return wrapRowWithContextMenu(training, rowElement);
                    }}
                </TableBody>
            </TableProvider>
        </div>
    );
};

export const TrainingsTable = memo(TrainingsTableComponent);
export default TrainingsTable;
