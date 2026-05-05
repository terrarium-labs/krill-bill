import { useMemo, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Plus, ListChecks } from "lucide-react";
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
import { TicketWorkOrderType } from "@/types/field-service/ticket-work-order-types";
import ColorLabel from "@/app/components/labels/color-label";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";
import TextLargeLabel from "@/app/components/labels/text-large-label";
import TextLabel from "@/app/components/labels/text-label";

type TicketWorkOrderTypeTableColumnKey = "id" | "name" | "description" | "color" | "actions";

interface TicketWorkOrderTypesTableProps {
    data: TicketWorkOrderType[];
    isLoading?: boolean;
    hiddenColumns?: TicketWorkOrderTypeTableColumnKey[];
    renderActions?: (type: TicketWorkOrderType) => ReactNode;
    onRowClick?: (type: TicketWorkOrderType) => void;
    clickableRows?: boolean;
    onEmptyStateAction?: () => void;
}

const TicketWorkOrderTypesTable = ({
    data,
    isLoading = false,
    hiddenColumns = [],
    renderActions,
    onRowClick,
    clickableRows = false,
    onEmptyStateAction,
}: TicketWorkOrderTypesTableProps) => {
    const { t } = useTranslation();

    const { wrapRowWithContextMenu } = useTableContextMenu<TicketWorkOrderType>(renderActions);

    const columns: ColumnDef<TicketWorkOrderType>[] = useMemo(
        () => {
            const allColumns: ColumnDef<TicketWorkOrderType>[] = [
                {
                    accessorKey: "id",
                    header: t("common.id", "ID"),
                    cell: ({ row }: { row: { original: TicketWorkOrderType } }) => {
                        const type = row.original;
                        return (
                            <IdBadge
                                id={type.id}
                                hideIcon={true}
                                customTooltip={t("common.copyId", "Copy ID")}
                            />
                        );
                    },
                },
                {
                    accessorKey: "name",
                    header: t("admin.ticketWorkOrderTypes.columns.name", "Name"),
                    cell: ({ row }: { row: { original: TicketWorkOrderType } }) => {
                        const type = row.original;
                        return <TextLabel data={type.name} className="font-medium" />;
                    },
                },
                {
                    accessorKey: "description",
                    header: t("admin.ticketWorkOrderTypes.columns.description", "Description"),
                    cell: ({ row }: { row: { original: TicketWorkOrderType } }) => {
                        const description = row.original.description;
                        return <TextLargeLabel data={description} />;
                    },
                },
                {
                    accessorKey: "color",
                    header: t("admin.ticketWorkOrderTypes.columns.color", "Color"),
                    cell: ({ row }: { row: { original: TicketWorkOrderType } }) => {
                        const color = row.original.color;
                        if (!color) return <span>-</span>;
                        return <ColorLabel data={color || "blue"} />;
                    },
                },
                {
                    id: "actions",
                    header: ({ header }) => (
                        <TableColumnHeader
                            column={header.column}
                            className="justify-center items-center flex"
                            title={''}
                        />
                    ),
                    cell: ({ row }: { row: { original: TicketWorkOrderType } }) => {
                        const type = row.original;
                        return (
                            <div className="flex justify-center items-center">
                                {renderActions ? renderActions(type) : null}
                            </div>
                        );
                    },
                    meta: {
                        sticky: 'right',
                    },
                },
            ];

            return allColumns.filter((column) => {
                const key = ((column as { accessorKey?: string }).accessorKey || column.id) as TicketWorkOrderTypeTableColumnKey;
                return !hiddenColumns.includes(key);
            });
        },
        [t, hiddenColumns, renderActions]
    );

    const handleRowClickInternal = (type: TicketWorkOrderType) => {
        if (clickableRows && onRowClick) {
            onRowClick(type);
        }
    };

    return (
        <TableProvider data={data} columns={columns}>
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
                                <ListChecks className="h-10 w-10 text-muted-foreground" />
                                <div className="flex flex-col items-center justify-center">
                                    <h3 className="text-lg font-medium">
                                        {t("admin.ticketWorkOrderTypes.noTypes", "No ticket work order types found")}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {t("admin.ticketWorkOrderTypes.getStarted", "Get started by creating a new type")}
                                    </p>
                                </div>
                                {onEmptyStateAction && (
                                    <Button onClick={onEmptyStateAction} variant="outline">
                                        <Plus className="h-4 w-4 mr-2" />
                                        {t("admin.ticketWorkOrderTypes.addType", "New Type")}
                                    </Button>
                                )}
                            </div>
                        </TableCellRaw>
                    </TableRowRaw>
                }
            >
                {({ row }) => {
                    const type = row.original as TicketWorkOrderType;
                    return wrapRowWithContextMenu(
                        type,
                        <TableRowRaw
                            key={row.id}
                            className={clickableRows ? "hover:bg-muted/50 cursor-pointer" : "hover:bg-muted/50"}
                            onClick={() => handleRowClickInternal(type)}
                            data-state={row.getIsSelected() && 'selected'}
                        >
                            {row.getVisibleCells().map((cell) => (
                                <TableCell
                                    key={cell.id}
                                    cell={cell}
                                />
                            ))}
                        </TableRowRaw>
                    );
                }}
            </TableBody>
        </TableProvider>
    );
};

export default TicketWorkOrderTypesTable;
