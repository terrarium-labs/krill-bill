import { memo, useMemo, type ReactNode } from "react";
import { FileSignature, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SigningRequest } from "@/types/general/signing-requests";
import { getSigningRequestProgressCounts } from "@/app/signing-requests/utils/signing-request-progress";
import ProgressLabel from "@/app/components/labels/progress-label";
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
import { Boxes, GitPullRequestCreateArrow } from "lucide-react";
import { TableRow as TableRowRaw, TableCell as TableCellRaw } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import IdBadge from "@/app/components/id-badge";
import TextLabel from "@/app/components/labels/text-label";
import DateLabel from "@/app/components/labels/date-label";
import Tag from "@/app/components/tag/tag";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";
import { cn } from "@/lib/utils";

export type SigningRequestsTableColumnKey =
    | "id"
    | "name"
    | "progress"
    | "overall_status"
    | "status"
    | "description"
    | "workflow_type"
    | "number_of_signers"
    | "created_at"
    | "updated_at"
    | "actions";

interface SigningRequestsTableProps {
    signingRequests: SigningRequest[];
    isLoading?: boolean;
    /** Structural column hiding (for embedding this table in sub-pages). Not saved to preferences. */
    hiddenColumns?: SigningRequestsTableColumnKey[] | SigningRequestsTableColumnKey;
    renderActions?: (row: SigningRequest) => ReactNode;
    onRowClick?: (row: SigningRequest) => void;
    clickableRows?: boolean;
    emptyStateTitle?: string;
    emptyStateDescription?: string;
    searchQuery?: string;
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const SigningRequestsTableComponent = ({
    signingRequests,
    isLoading = false,
    hiddenColumns = [],
    renderActions,
    onRowClick,
    clickableRows = true,
    emptyStateTitle,
    emptyStateDescription,
    searchQuery = "",
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: SigningRequestsTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<SigningRequest>(renderActions);

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

    const columns = useMemo<ColumnDef<SigningRequest>[]>(() => {
        const cols: ColumnDef<SigningRequest>[] = [
            {
                accessorKey: "id",
                header: t("common.id", "ID"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <IdBadge
                        id={row.original.id}
                        hideIcon={true}
                        customTooltip={t("common.copyId", "Copy ID")}
                    />
                ),
            },
            {
                accessorKey: "name",
                header: t("signingRequests.name", "Name"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => (
                    <TextLabel data={row.original.name} className="font-medium" />
                ),
            },
            {
                accessorKey: "workflow_type",
                header: t("signingRequests.workflowType", "Workflow"),
                enableResizing: true,
                size: 130,
                cell: ({ row }) => {
                    if (row.original.workflow_type === "parallel") {
                        return (
                            <div className="flex items-center gap-2">
                                <GitPullRequestCreateArrow className="h-4 w-4 shrink-0" />
                                <span className="text-sm tabular-nums">
                                    {t("signingRequests.workflowType.parallel", "Parallel")}
                                </span>
                            </div>
                        );
                    }
                    return (
                        <div className="flex items-center gap-2">
                            <Boxes className="h-4 w-4 shrink-0" />
                            <span className="text-sm tabular-nums">
                                {t("signingRequests.workflowType.bulk", "Bulk")}
                            </span>
                        </div>
                    );
                },
            },
            {
                id: "progress",
                header: t("signingRequests.columnProgress", "Signatures"),
                enableResizing: true,
                size: 200,
                cell: ({ row }) => {
                    const item = row.original;
                    const { total, completed, errors } = getSigningRequestProgressCounts(item);
                    if (total === 0) {
                        return <span className="text-xs text-muted-foreground">—</span>;
                    }
                    return (
                        <ProgressLabel
                            data={[completed, total, errors]}
                            size="w-full"
                            variant="color"
                            className="min-w-[9.5rem] max-w-[14rem] cursor-default"
                        />
                    );
                },
            },
            {
                accessorKey: "overall_status",
                header: t("signingRequests.overallStatus", "Status"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <Tag text={row.original.overall_status} className="capitalize" />
                ),
            },
            {
                accessorKey: "description",
                header: t("common.description", "Description"),
                enableResizing: true,
                size: 200,
                cell: ({ row }) => (
                    <TextLabel data={row.original.description || "—"} />
                ),
            },
            {
                accessorKey: "number_of_signers",
                header: t("signingRequests.numberOfSigners", "Signers"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const count = row.original.number_of_signers ?? 0;
                    return (
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 shrink-0" />
                            <span
                                className="text-sm tabular-nums"
                                title={t("signingRequests.signersCountTooltip", "{{count}} signers", { count })}
                            >
                                {count}
                            </span>
                        </div>
                    );
                },
            },
            {
                accessorKey: "created_at",
                header: t("common.createdAt", "Created"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => <DateLabel data={row.original.created_at} />,
            },
            {
                accessorKey: "updated_at",
                header: t("common.updatedAt", "Updated"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => <DateLabel data={row.original.updated_at} />,
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
                        onClick={(e) => e.stopPropagation()}
                        className="flex justify-center items-center"
                    >
                        {renderActions(row.original)}
                    </div>
                ),
                meta: { sticky: "right" },
            });
        }

        return cols;
    }, [t, renderActions]);

    const defaultEmptyTitle = searchQuery
        ? t("signingRequests.noResults", "No signing requests found")
        : t("signingRequests.emptyTitle", "No signing requests yet");

    const defaultEmptyDescription = searchQuery
        ? t("signingRequests.noResultsDescription", 'No results for "{{searchQuery}}"', { searchQuery })
        : t("signingRequests.emptyDescription", "Create a signing request to collect signatures on your documents.");

    return (
        <div className="w-full overflow-x-auto">
            <TableProvider
                data={signingRequests}
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
                    loadingState={<TableSkeleton columnCount={columns.length} />}
                    emptyState={
                        <TableRowRaw className="hover:bg-transparent">
                            <TableCellRaw
                                className="h-96 text-center hover:bg-transparent"
                                colSpan={columns.length}
                            >
                                <div className="flex items-center justify-center space-y-4 flex-col">
                                    <FileSignature className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">
                                            {emptyStateTitle || defaultEmptyTitle}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {emptyStateDescription || defaultEmptyDescription}
                                        </p>
                                    </div>
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const item = row.original as SigningRequest;
                        const rowContent = (
                            <TableRowRaw
                                key={row.id}
                                className={cn(
                                    "hover:bg-muted/50",
                                    clickableRows && "cursor-pointer",
                                )}
                                onClick={() => clickableRows && onRowClick && onRowClick(item)}
                                data-state={row.getIsSelected() && "selected"}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} cell={cell} />
                                ))}
                            </TableRowRaw>
                        );
                        return wrapRowWithContextMenu(item, rowContent);
                    }}
                </TableBody>
            </TableProvider>
        </div>
    );
};

export const SigningRequestsTable = memo(SigningRequestsTableComponent);
export default SigningRequestsTable;
