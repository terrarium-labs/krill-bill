import { memo, useMemo, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    TableProvider,
    TableHeader,
    TableHeaderGroup,
    TableHead,
    TableBody,
    TableCell,
    type ColumnDef,
    TableColumnHeader,
} from "@/components/ui/shadcn-io/table";
import { TableRow as TableRowRaw, TableCell as TableCellRaw } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import IdBadge from "@/app/components/id-badge";
import { RateClient } from "@/types/general/rates";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";
import ClientLabel from "@/app/components/labels/client-label";

export type ItemRateClientsTableColumnKey =
    | "id"
    | "client_name"
    | "actions";

export interface ItemRateClientsTableProps {
    clients: RateClient[];
    isLoading: boolean;
    searchQuery: string;
    onAddClient?: () => void;
    hiddenColumns?: ItemRateClientsTableColumnKey[];
    renderActions?: (client: RateClient) => ReactNode;
}

const ItemRateClientsTableComponent = ({
    clients,
    isLoading,
    searchQuery,
    onAddClient,
    hiddenColumns = [],
    renderActions,
}: ItemRateClientsTableProps) => {
    const { t } = useTranslation();

    const { wrapRowWithContextMenu } = useTableContextMenu<RateClient>(renderActions);

    const columns = useMemo(() => {
        const allColumns: ColumnDef<RateClient>[] = [
            {
                accessorKey: "id",
                header: t("common.id", "ID"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const client = row.original;
                    return (
                        <IdBadge
                            id={client.id}
                            hideIcon={true}
                            customTooltip={t("common.copyId", "Copy ID")}
                        />
                    );
                },
            },
            {
                accessorKey: "client_name",
                header: t("rates.clients.columns.name", "Client Name"),
                enableResizing: true,
                size: 240,
                cell: ({ row }) => {
                    const client = row.original;
                    return (
                        <ClientLabel data={client} className="font-medium" link />
                    );
                },
            },
        ];

        if (renderActions) {
            allColumns.push({
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
                cell: ({ row }) => {
                    const client = row.original;
                    return (
                        <div className="flex justify-center items-center">
                            {renderActions(client)}
                        </div>
                    );
                },
                meta: {
                    sticky: "right",
                },
            });
        }

        return allColumns.filter((col) => {
            const columnId = ("accessorKey" in col ? col.accessorKey : col.id) as ItemRateClientsTableColumnKey;
            return !hiddenColumns.includes(columnId);
        });
    }, [t, hiddenColumns, renderActions]);

    return (
        <div className="w-full overflow-x-auto">
            <TableProvider data={clients} columns={columns} enableColumnResizing>
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
                                            {searchQuery
                                                ? t("rates.clients.noResultsFound", "No results found")
                                                : t("rates.clients.noClients", "No clients")}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {searchQuery
                                                ? t(
                                                      "rates.clients.noResultsDescription",
                                                      'No results found for "{{searchQuery}}"',
                                                      { searchQuery }
                                                  )
                                                : t(
                                                      "rates.clients.noClientsDescription",
                                                      "No clients assigned to this rate."
                                                  )}
                                        </p>
                                    </div>
                                    {onAddClient && (
                                        <Button variant="outline" onClick={onAddClient}>
                                            <Plus className="h-4 w-4" />
                                            {t("rates.clients.addClient", "Add client")}
                                        </Button>
                                    )}
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const client = row.original as RateClient;
                        return wrapRowWithContextMenu(
                            client,
                            <TableRowRaw
                                key={row.id}
                                className="hover:bg-muted/50 cursor-pointer"
                                data-state={row.getIsSelected() && "selected"}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} cell={cell} />
                                ))}
                            </TableRowRaw>
                        );
                    }}
                </TableBody>
            </TableProvider>
        </div>
    );
};

export const ItemRateClientsTable = memo(ItemRateClientsTableComponent);
export default ItemRateClientsTable;
