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
import { CommutingRateClient } from "@/types/general/commuting-rates";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";
import ClientLabel from "@/app/components/labels/client-label";

type CommutingRateClientsTableProps = {
    clients: CommutingRateClient[];
    isLoading: boolean;
    searchQuery: string;
    onAddClient?: () => void;
    renderActions?: (client: CommutingRateClient) => ReactNode;
};

const CommutingRateClientsTableComponent = ({
    clients,
    isLoading,
    searchQuery,
    onAddClient,
    renderActions,
}: CommutingRateClientsTableProps) => {
    const { t } = useTranslation();

    const clientsWithId = clients.map(client => ({
        ...client,
        id: client.client.id,
    }));

    const { wrapRowWithContextMenu } = useTableContextMenu<CommutingRateClient & { id: string }>(renderActions);

    const columns = useMemo<ColumnDef<CommutingRateClient>[]>(() => [
        {
            accessorKey: "id",
            header: t("common.id", "ID"),
            enableResizing: true,
            size: 120,
            cell: ({ row }) => (
                <IdBadge
                    id={row.original.client.id}
                    hideIcon
                    customTooltip={t("common.copyId", "Copy ID")}
                />
            ),
        },
        {
            accessorKey: "client_name",
            header: t("commutingRates.clients.columns.name", "Client Name"),
            enableResizing: true,
            size: 180,
            cell: ({ row }) => {
                const client = row.original.client;
                return (
                    <ClientLabel
                        data={client}
                        className="font-medium"
                        link
                    />
                );
            },
        },
        {
            accessorKey: "number_of_locations",
            header: t("commutingRates.clients.columns.locations", "Locations"),
            enableResizing: true,
            size: 120,
            cell: ({ row }) => {
                const count = row.original.number_of_locations;
                return (
                    <span className="text-sm">
                        {count}
                    </span>
                );
            },
        },
        {
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
                <div className="flex justify-center items-center">
                    {renderActions && renderActions(row.original)}
                </div>
            ),
            meta: { sticky: "right" },
        },
    ], [t, renderActions]);

    return (
        <TableProvider data={clientsWithId} columns={columns} enableColumnResizing>
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
                                            ? t("commutingRates.clients.noResultsFound", "No results found")
                                            : t("commutingRates.clients.noClients", "No clients")}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {searchQuery
                                            ? t(
                                                  "commutingRates.clients.noResultsDescription",
                                                  'No results found for "{{searchQuery}}"',
                                                  { searchQuery }
                                              )
                                            : t(
                                                  "commutingRates.clients.noClientsDescription",
                                                  "No clients assigned to this commuting rate."
                                              )}
                                    </p>
                                </div>
                                {onAddClient && (
                                    <Button variant="outline" onClick={onAddClient}>
                                        <Plus className="h-4 w-4" />
                                        {t("commutingRates.clients.addClient", "Add client")}
                                    </Button>
                                )}
                            </div>
                        </TableCellRaw>
                    </TableRowRaw>
                }
            >
                {({ row }) => {
                    const client = row.original as CommutingRateClient & { id: string };
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
    );
};

export const CommutingRateClientsTable = memo(CommutingRateClientsTableComponent);
export default CommutingRateClientsTable;
