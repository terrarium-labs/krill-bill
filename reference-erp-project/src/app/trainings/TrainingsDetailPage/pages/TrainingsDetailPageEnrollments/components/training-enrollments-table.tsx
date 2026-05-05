import { Fragment, memo, useMemo } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type {
    ColumnOrderState,
    ColumnSizingState,
    OnChangeFn,
    VisibilityState,
} from "@tanstack/react-table";
import { GraduationCap, Check, X, AlertTriangle, ChevronRight } from "lucide-react";
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
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";
import { cn } from "@/lib/utils";
import IdBadge from "@/app/components/id-badge";
import Tag from "@/app/components/tag/tag";
import DateLabel from "@/app/components/labels/date-label";
import EmployeeLabel from "@/app/components/labels/employee-label";
import ProgressLabel from "@/app/components/labels/progress-label";
import { Badge } from "@/components/ui/badge";
import type { Employee } from "@/types/employees/employees";
import type { TrainingEnrollment } from "@/types/trainings/trainings";

export type EnrollmentsTableColumnKey =
    | "id"
    | "employee"
    | "training_title"
    | "status"
    | "enrolled_at"
    | "completion_date"
    | "expires_at"
    | "attendance"
    | "score"
    | "progress"
    | "notes"
    | "actions";

const ALL_COLUMN_IDS: EnrollmentsTableColumnKey[] = [
    "id",
    "employee",
    "training_title",
    "status",
    "enrolled_at",
    "completion_date",
    "expires_at",
    "attendance",
    "score",
    "progress",
    "notes",
    "actions",
];

interface TrainingEnrollmentsTableProps {
    enrollments: TrainingEnrollment[];
    isLoading: boolean;
    hiddenColumns?: EnrollmentsTableColumnKey[] | EnrollmentsTableColumnKey;
    renderActions?: (enrollment: TrainingEnrollment) => ReactNode;
    onRowClick?: (enrollment: TrainingEnrollment) => void;
    clickableRows?: boolean;
    expandableRows?: boolean;
    expandedEnrollmentId?: string | null;
    onToggleExpandEnrollment?: (enrollment: TrainingEnrollment) => void;
    renderExpandedPanel?: (enrollment: TrainingEnrollment) => ReactNode;
    emptyTitle?: string;
    emptyDescription?: string;
    compact?: boolean;
    searchQuery?: string;
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const isExpired = (expiresAt: string | null | undefined): boolean => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
};

const isExpiringSoon = (expiresAt: string | null | undefined): boolean => {
    if (!expiresAt) return false;
    const expiry = new Date(expiresAt);
    const now = new Date();
    const thirtyDaysFromNow = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000,
    );
    return expiry > now && expiry <= thirtyDaysFromNow;
};

const TrainingEnrollmentsTableComponent = ({
    enrollments,
    isLoading,
    hiddenColumns,
    renderActions,
    onRowClick,
    clickableRows,
    expandableRows,
    expandedEnrollmentId,
    onToggleExpandEnrollment,
    renderExpandedPanel,
    emptyTitle,
    emptyDescription,
    compact,
    searchQuery,
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: TrainingEnrollmentsTableProps) => {
    const { t } = useTranslation();

    const hiddenColumnsArray: EnrollmentsTableColumnKey[] = useMemo(() => {
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

    const visibleColumnCount = useMemo(
        () =>
            ALL_COLUMN_IDS.filter(
                (id) => effectiveColumnVisibility?.[id] !== false,
            ).length,
        [effectiveColumnVisibility],
    );

    const columns = useMemo<ColumnDef<TrainingEnrollment>[]>(() => {
        const cols: ColumnDef<TrainingEnrollment>[] = [
            {
                id: "id",
                header: t("common.id", "ID"),
                enableResizing: true,
                size: 120,
                cell: ({ row }: { row: { original: TrainingEnrollment } }) => (
                    <IdBadge
                        id={row.original.id}
                        hideIcon
                        customTooltip={t("common.copyId", "Copy ID")}
                    />
                ),
            },
            {
                id: "employee",
                header: t("trainings.enrollments.columns.employee", "Employee"),
                enableResizing: true,
                size: 180,
                cell: ({ row }: { row: { original: TrainingEnrollment } }) => {
                    const enrollment = row.original;
                    const isExpanded =
                        Boolean(expandableRows) &&
                        expandedEnrollmentId === enrollment.id;
                    return (
                        <div className="flex min-w-0 items-center gap-2">
                            {expandableRows ? (
                                <ChevronRight
                                    className={cn(
                                        "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                                        isExpanded && "rotate-90",
                                    )}
                                    aria-hidden
                                />
                            ) : null}
                            {enrollment.employee ? (
                                <EmployeeLabel
                                    data={
                                        enrollment.employee as unknown as Employee
                                    }
                                />
                            ) : (
                                <span className="text-muted-foreground text-xs">
                                    —
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                id: "training_title",
                header: t("trainings.columns.title", "Training"),
                enableResizing: true,
                size: 180,
                cell: ({ row }: { row: { original: TrainingEnrollment } }) =>
                    row.original.training ? (
                        <span className={cn("font-medium", compact && "text-xs")}>
                            {row.original.training.title}
                        </span>
                    ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                    ),
            },
            {
                id: "status",
                accessorKey: "status",
                header: t("trainings.enrollments.columns.status", "Status"),
                enableResizing: true,
                size: 120,
                cell: ({ row }: { row: { original: TrainingEnrollment } }) => (
                    <Tag
                        text={(row.original.status as string).replace(/_/g, " ")}
                        className="capitalize"
                    />
                ),
            },
            {
                id: "enrolled_at",
                accessorKey: "enrolled_at",
                header: t("trainings.enrollments.columns.enrolledAt", "Enrolled At"),
                enableResizing: true,
                size: 120,
                cell: ({ row }: { row: { original: TrainingEnrollment } }) => (
                    <DateLabel data={row.original.enrolled_at} />
                ),
            },
            {
                id: "completion_date",
                accessorKey: "completion_date",
                header: t(
                    "trainings.enrollments.columns.completionDate",
                    "Completed",
                ),
                enableResizing: true,
                size: 120,
                cell: ({ row }: { row: { original: TrainingEnrollment } }) => (
                    <DateLabel data={row.original.completion_date} />
                ),
            },
            {
                id: "expires_at",
                header: t("trainings.enrollments.columns.expiresAt", "Expires"),
                enableResizing: true,
                size: 120,
                cell: ({ row }: { row: { original: TrainingEnrollment } }) => {
                    const enrollment = row.original;
                    if (!enrollment.expires_at) {
                        return (
                            <span className="text-muted-foreground text-xs">—</span>
                        );
                    }
                    if (isExpired(enrollment.expires_at)) {
                        return (
                            <Badge variant="destructive" className="text-xs">
                                {t("trainings.expired", "Expired")}
                            </Badge>
                        );
                    }
                    if (isExpiringSoon(enrollment.expires_at)) {
                        return (
                            <Badge className="border-amber-500/40 bg-amber-500/10 text-xs text-amber-700 dark:text-amber-400">
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                <DateLabel data={enrollment.expires_at} />
                            </Badge>
                        );
                    }
                    return <DateLabel data={enrollment.expires_at} />;
                },
            },
            {
                id: "attendance",
                header: t("trainings.enrollments.columns.attendance", "Attendance"),
                enableResizing: true,
                size: 85,
                cell: ({ row }: { row: { original: TrainingEnrollment } }) => {
                    const enrollment = row.original;
                    return enrollment.attendance_confirmed ? (
                        <Check className="h-4 w-4 text-green-500" />
                    ) : (
                        <X className="h-4 w-4 text-red-500" />
                    );
                },
            },
            {
                id: "score",
                accessorKey: "score",
                header: t("trainings.enrollments.columns.score", "Score"),
                enableResizing: true,
                size: 100,
                cell: ({ row }: { row: { original: TrainingEnrollment } }) =>
                    row.original.score != null ? (
                        <span className={cn("text-sm", compact && "text-xs")}>
                            {row.original.score}%
                        </span>
                    ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                    ),
            },
            {
                id: "progress",
                header: t("trainings.enrollments.columns.progress", "Progress"),
                enableResizing: true,
                size: 120,
                cell: ({ row }: { row: { original: TrainingEnrollment } }) => {
                    const enrollment = row.original;
                    const totalFromApi = enrollment.total_sessions ?? 0;
                    const doneFromApi = enrollment.completed_sessions ?? 0;
                    if (totalFromApi > 0) {
                        return (
                            <ProgressLabel
                                data={[doneFromApi, totalFromApi]}
                                size="w-full"
                                variant="color"
                                className={cn(
                                    "max-w-[14rem] min-w-[9.5rem] cursor-default",
                                    compact && "min-w-[7rem]",
                                )}
                            />
                        );
                    }
                    const completions = enrollment.session_completions;
                    if (!completions || completions.length === 0) {
                        return (
                            <span className="text-muted-foreground text-xs">—</span>
                        );
                    }
                    const total = completions.length;
                    const done = completions.filter((c) => c.completed).length;
                    return (
                        <ProgressLabel
                            data={[done, total]}
                            size="w-full"
                            variant="color"
                            className={cn(
                                "max-w-[14rem] min-w-[9.5rem] cursor-default",
                                compact && "min-w-[7rem]",
                            )}
                        />
                    );
                },
            },
            {
                id: "notes",
                accessorKey: "notes",
                header: t("trainings.enrollments.columns.notes", "Notes"),
                enableResizing: true,
                size: 180,
                cell: ({ row }: { row: { original: TrainingEnrollment } }) =>
                    row.original.notes ? (
                        <span
                            className={cn(
                                "text-sm text-muted-foreground",
                                compact && "text-xs",
                            )}
                        >
                            {row.original.notes}
                        </span>
                    ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                    ),
            },
            {
                id: "actions",
                enableResizing: false,
                size: 52,
                header: "",
                cell: ({ row }: { row: { original: TrainingEnrollment } }) => (
                    <div
                        className="flex justify-center"
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                        }}
                    >
                        {renderActions?.(row.original)}
                    </div>
                ),
            },
        ];
        return cols;
    }, [
        t,
        renderActions,
        compact,
        expandableRows,
        expandedEnrollmentId,
    ]);

    const { wrapRowWithContextMenu } =
        useTableContextMenu<TrainingEnrollment>(renderActions);

    return (
        <div className="w-full overflow-x-auto">
            <TableProvider
                data={enrollments}
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
                        <TableHeaderGroup key={headerGroup.id} headerGroup={headerGroup}>
                            {({ header }) => <TableHead key={header.id} header={header} />}
                        </TableHeaderGroup>
                    )}
                </TableHeader>

                <TableBody
                    isLoading={isLoading}
                    loadingState={
                        <TableSkeleton columnCount={visibleColumnCount || 1} />
                    }
                    emptyState={
                        <TableRowRaw className="hover:bg-transparent">
                            <TableCellRaw
                                className="h-96 text-center hover:bg-transparent"
                                colSpan={visibleColumnCount || 1}
                            >
                                <div className="flex flex-col items-center justify-center space-y-4">
                                    <GraduationCap className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">
                                            {searchQuery?.trim()
                                                ? t(
                                                      "trainings.enrollments.empty.noResults",
                                                      'No enrollments match "{{query}}"',
                                                      { query: searchQuery.trim() },
                                                  )
                                                : (emptyTitle ??
                                                  t(
                                                      "trainings.enrollments.empty.title",
                                                      "No employees enrolled",
                                                  ))}
                                        </h3>
                                        {!searchQuery?.trim() && emptyDescription && (
                                            <p className="text-muted-foreground">
                                                {emptyDescription}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const enrollment = row.original as TrainingEnrollment;
                        const isExpanded =
                            expandableRows &&
                            expandedEnrollmentId === enrollment.id;
                        const expandColSpan = row.getVisibleCells().length;
                        const rowElement = (
                            <TableRowRaw
                                key={row.id}
                                aria-expanded={
                                    expandableRows ? isExpanded : undefined
                                }
                                className={cn(
                                    "hover:bg-muted/50",
                                    (clickableRows || expandableRows) &&
                                        "cursor-pointer",
                                    isExpanded && "bg-muted/50",
                                )}
                                onClick={() => {
                                    if (expandableRows && onToggleExpandEnrollment) {
                                        onToggleExpandEnrollment(enrollment);
                                    } else {
                                        onRowClick?.(enrollment);
                                    }
                                }}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} cell={cell} />
                                ))}
                            </TableRowRaw>
                        );
                        const menuWrapped = wrapRowWithContextMenu(
                            enrollment,
                            rowElement,
                        );
                        if (
                            !expandableRows ||
                            !renderExpandedPanel ||
                            !isExpanded
                        ) {
                            return (
                                <Fragment key={row.id}>{menuWrapped}</Fragment>
                            );
                        }
                        return (
                            <Fragment key={row.id}>
                                {menuWrapped}
                                <TableRowRaw className="border-b hover:bg-transparent">
                                    <TableCellRaw
                                        className="p-0 align-top"
                                        colSpan={expandColSpan}
                                    >
                                        <div className="border-t border-border bg-muted/20">
                                            {renderExpandedPanel(enrollment)}
                                        </div>
                                    </TableCellRaw>
                                </TableRowRaw>
                            </Fragment>
                        );
                    }}
                </TableBody>
            </TableProvider>
        </div>
    );
};

export const TrainingEnrollmentsTable = memo(TrainingEnrollmentsTableComponent);
export default TrainingEnrollmentsTable;
