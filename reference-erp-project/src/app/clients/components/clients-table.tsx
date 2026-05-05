import { memo, useMemo, type ReactNode } from "react";
import { Users, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Client } from "@/types/clients/client";
import {
    TableProvider,
    TableHeader,
    TableHeaderGroup,
    TableHead,
    TableBody,
    TableCell,
    type ColumnDef,
    TableColumnHeader,
    type ColumnOrderState,
    type ColumnSizingState,
    type VisibilityState,
} from "@/components/ui/shadcn-io/table";
import type { OnChangeFn } from "@tanstack/react-table";
import { TableRow as TableRowRaw, TableCell as TableCellRaw } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import IdBadge from "@/app/components/id-badge";
import { Button } from "@/components/ui/button";
import ClientLabel from "@/app/components/labels/client-label";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";
import EmailLabel from "@/app/components/labels/email-label";
import PhoneLabel from "@/app/components/labels/phone-label";
import TextLabel from "@/app/components/labels/text-label";
import CountryLabel from "@/app/components/labels/country-label";
import DateLabel from "@/app/components/labels/date-label";

export type ClientTableColumnKey =
    | "id"
    | "trade_name"
    | "client_name"
    | "tax_code"
    | "email"
    | "phone"
    | "city"
    | "country"
    | "created_at"
    | "actions";

interface ClientsTableProps {
    clients: Client[];
    isLoading?: boolean;
    /** Structural column hiding (for embedding this table in sub-pages). Not saved to preferences. */
    hiddenColumns?: ClientTableColumnKey[] | ClientTableColumnKey;
    renderActions?: (client: Client) => ReactNode;
    onRowClick?: (client: Client) => void;
    clickableRows?: boolean;
    emptyStateTitle?: string;
    emptyStateDescription?: string;
    onEmptyStateAction?: () => void;
    emptyStateActionLabel?: string;
    searchQuery?: string;
    /** TanStack column visibility (from useClientsTablePreferences) */
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    /** TanStack column order */
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    /** TanStack column sizing */
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const ClientsTableComponent = ({
    clients,
    isLoading = false,
    hiddenColumns = [],
    renderActions,
    onRowClick,
    clickableRows = true,
    emptyStateTitle,
    emptyStateDescription,
    onEmptyStateAction,
    emptyStateActionLabel,
    searchQuery = "",
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: ClientsTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<Client>(renderActions);

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

    const columns = useMemo<ColumnDef<Client>[]>(() => {
        const cols: ColumnDef<Client>[] = [
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
                accessorKey: "trade_name",
                header: t("clients.tradeName", "Trade Name"),
                enableResizing: true,
                size: 200,
                cell: ({ row }) => <ClientLabel data={row.original} className="font-medium" />,
            },
            {
                accessorKey: "client_name",
                header: t("clients.clientName", "Client Name"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => <TextLabel data={row.getValue("client_name")} />,
            },
            {
                accessorKey: "tax_code",
                header: t("clients.taxCode", "Tax Code"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => <TextLabel data={row.getValue("tax_code")} />,
            },
            {
                accessorKey: "email",
                header: t("clients.email", "Email"),
                enableResizing: true,
                size: 200,
                cell: ({ row }) => (
                    <div onClick={(e) => e.stopPropagation()}>
                        <EmailLabel data={row.getValue("email")} variant="black" link />
                    </div>
                ),
            },
            {
                accessorKey: "phone",
                header: t("clients.phone", "Phone"),
                enableResizing: true,
                size: 150,
                cell: ({ row }) => (
                    <div onClick={(e) => e.stopPropagation()}>
                        <PhoneLabel data={row.getValue("phone")} variant="black" link />
                    </div>
                ),
            },
            {
                accessorKey: "city",
                header: t("clients.city", "City"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => <TextLabel data={row.getValue("city")} />,
            },
            {
                accessorKey: "country",
                header: t("clients.country", "Country"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => <CountryLabel data={row.getValue("country") as string} />,
            },
            {
                id: "created_at",
                header: t("common.createdAt", "Created At"),
                enableResizing: true,
                size: 150,
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
                    <TableColumnHeader
                        column={header.column}
                        className="justify-center items-center flex"
                        title=""
                    />
                ),
                cell: ({ row }) => (
                    <div
                        className="flex justify-center items-center"
                        onClick={(e) => e.stopPropagation()}
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
        ? t("clients.noResultsFound", "No clients found")
        : t("clients.noClientsTitle", "No clients yet");

    const defaultEmptyDescription = searchQuery
        ? t("clients.noResultsDescription", "No clients match your search for '{{searchQuery}}'", { searchQuery })
        : t("clients.noClientsDescription", "Start by adding your first client");

    return (
        <div className="w-full overflow-x-auto">
            <TableProvider
                data={clients}
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
                                    <Users className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">
                                            {emptyStateTitle || defaultEmptyTitle}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {emptyStateDescription || defaultEmptyDescription}
                                        </p>
                                    </div>
                                    {onEmptyStateAction && (
                                        <Button variant="outline" onClick={onEmptyStateAction}>
                                            <Plus className="h-4 w-4" />
                                            {emptyStateActionLabel || t("clients.addClient", "Add Client")}
                                        </Button>
                                    )}
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const client = row.original as Client;
                        const rowContent = (
                            <TableRowRaw
                                key={row.id}
                                className={
                                    clickableRows
                                        ? "hover:bg-muted/50 cursor-pointer"
                                        : "hover:bg-muted/50"
                                }
                                onClick={() => clickableRows && onRowClick?.(client)}
                                data-state={row.getIsSelected() && "selected"}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} cell={cell} />
                                ))}
                            </TableRowRaw>
                        );
                        return wrapRowWithContextMenu(client, rowContent);
                    }}
                </TableBody>
            </TableProvider>
        </div>
    );
};

export const ClientsTable = memo(ClientsTableComponent);
export default ClientsTable;
