import { memo, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Mail } from "lucide-react";
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
import IdBadge from "@/app/components/id-badge";
import { Invitation } from "@/types/general/invitation";
import DateLabel from "@/app/components/labels/date-label";
import EmailLabel from "@/app/components/labels/email-label";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

export type InvitationsTableColumnKey =
    | "id"
    | "email"
    | "last_sent_at"
    | "created_at"
    | "actions";

interface InvitationsTableProps {
    data: Invitation[];
    isLoading?: boolean;
    searchQuery?: string;
    hiddenColumns?: InvitationsTableColumnKey[] | InvitationsTableColumnKey;
    renderActions?: (invitation: Invitation) => ReactNode;
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const InvitationsTableComponent = ({
    data,
    isLoading = false,
    searchQuery = "",
    hiddenColumns,
    renderActions,
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: InvitationsTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<Invitation>(renderActions);

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

    const columns = useMemo<ColumnDef<Invitation>[]>(
        () => {
            const cols: ColumnDef<Invitation>[] = [
                {
                    accessorKey: "id",
                    header: t("common.id", "ID"),
                    enableResizing: true,
                    size: 120,
                    cell: ({ row }) => (
                        <IdBadge id={row.original.id} hideIcon customTooltip={t("common.copyId", "Copy ID")} />
                    ),
                },
                {
                    accessorKey: "email",
                    header: t("admin.users.invitations.email", "Email"),
                    enableResizing: true,
                    size: 200,
                    cell: ({ row }) => <EmailLabel data={row.original.email} variant="black" link />,
                },
                {
                    id: "last_sent_at",
                    header: t("admin.users.invitations.lastSent", "Last Sent"),
                    enableResizing: true,
                    size: 160,
                    cell: ({ row }) => (
                        <DateLabel data={row.original.last_sent_at} options={{ hide: "seconds" }} />
                    ),
                },
                {
                    id: "created_at",
                    header: t("common.createdAt", "Created At"),
                    enableResizing: true,
                    size: 160,
                    cell: ({ row }) => (
                        <DateLabel data={row.original.created_at} options={{ hide: "seconds" }} />
                    ),
                },
            ];

            if (renderActions) {
                cols.push({
                    id: "actions",
                    enableResizing: false,
                    size: 52,
                    header: ({ header }) => (
                        <TableColumnHeader column={header.column} className="justify-center items-center flex" title="" />
                    ),
                    cell: ({ row }) => (
                        <div className="flex justify-center items-center" onClick={(e) => e.stopPropagation()}>
                            {renderActions(row.original)}
                        </div>
                    ),
                    meta: { sticky: "right" },
                });
            }

            return cols;
        },
        [t, renderActions],
    );

    return (
        <div className="w-full overflow-x-auto">
            <TableProvider
                data={data}
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
                            <TableCellRaw className="h-96 text-center hover:bg-transparent" colSpan={columns.length}>
                                <div className="flex items-center justify-center space-y-4 flex-col">
                                    <Mail className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">
                                            {searchQuery
                                                ? t("admin.users.invitations.noResultsFound", "No invitations found")
                                                : t("admin.users.invitations.noInvitationsTitle", "No pending invitations")}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {searchQuery
                                                ? t("admin.users.invitations.noResultsDescription", "No invitations match your search for '{{searchQuery}}'", { searchQuery })
                                                : t("admin.users.invitations.noInvitationsDescription", "All users have accepted their invitations or no invitations have been sent")}
                                        </p>
                                    </div>
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const invitation = row.original;
                        return wrapRowWithContextMenu(
                            invitation,
                            <TableRowRaw
                                key={row.id}
                                className="hover:bg-muted/50"
                                data-state={row.getIsSelected() && "selected"}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} cell={cell} />
                                ))}
                            </TableRowRaw>,
                        );
                    }}
                </TableBody>
            </TableProvider>
        </div>
    );
};

export const InvitationsTable = memo(InvitationsTableComponent);
export default InvitationsTable;
