import { useTranslation } from "react-i18next";
import { memo, useMemo, type ReactNode } from "react";
import { Warehouse, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import IdBadge from "@/app/components/id-badge";
import { formatDistance, formatTimeToTravel } from "@/utils/miscelanea";
import { StockLocation } from "@/types/items/stock";
import IconLabel from "@/app/components/labels/icon-label";
import TextLabel from "@/app/components/labels/text-label";
import Tag from "@/app/components/tag/tag";
import CountryLabel from "@/app/components/labels/country-label";
import TextLargeLabel from "@/app/components/labels/text-large-label";
import {
    TableBody,
    TableCell,
    TableColumnHeader,
    TableHead,
    TableHeader,
    TableHeaderGroup,
    TableProvider,
    type ColumnDef,
    type ColumnOrderState,
    type ColumnSizingState,
    type VisibilityState,
} from "@/components/ui/shadcn-io/table";
import type { OnChangeFn } from "@tanstack/react-table";
import { TableCell as TableCellRaw, TableRow as TableRowRaw } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import LocationLabel from "@/app/components/labels/location-label";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";
import { Vehicle } from "@/types/general/vehicles";
import VehicleLabel from "@/app/components/labels/vehicle-label";

export type WarehouseTableColumnKey =
    | "id"
    | "name"
    | "num_items"
    | "distance"
    | "time_to_travel"
    | "status"
    | "address"
    | "country"
    | "stock_rotation_type"
    | "vehicle"
    | "actions";

export interface WarehousesTableProps {
    locations: StockLocation[];
    isLoading: boolean;
    /** Structural column hiding (for embedding this table in sub-pages). Not saved to preferences. */
    hiddenColumns?: WarehouseTableColumnKey[] | WarehouseTableColumnKey;
    renderActions?: (location: StockLocation) => ReactNode;
    onRowClick?: (location: StockLocation) => void;
    clickableRows?: boolean;
    emptyStateTitle?: string;
    emptyStateDescription?: string;
    onEmptyStateAction?: () => void;
    emptyStateActionLabel?: string;
    /** TanStack column visibility (from useWarehousesTablePreferences) */
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    /** TanStack column order */
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    /** TanStack column sizing */
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const WarehousesTableComponent = ({
    locations,
    isLoading,
    hiddenColumns = [],
    renderActions,
    onRowClick,
    clickableRows = false,
    emptyStateTitle,
    emptyStateDescription,
    onEmptyStateAction,
    emptyStateActionLabel,
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: WarehousesTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<StockLocation>(renderActions);

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

    const columns = useMemo<ColumnDef<StockLocation>[]>(() => {
        const cols: ColumnDef<StockLocation>[] = [
            {
                accessorKey: "id",
                header: t("common.id", "ID"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <IdBadge
                        id={row.original.id}
                        hideIcon
                        customTooltip={t("common.copyId", "Copy ID")}
                    />
                ),
            },
            {
                accessorKey: "name",
                header: t("warehouses.name", "Name"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => (
                    <LocationLabel data={row.original} textClassName="font-medium" />
                ),
            },
            {
                accessorKey: "num_items",
                header: t("warehouses.numItems", "Items"),
                enableResizing: true,
                size: 100,
                cell: ({ row }) => {
                    const numItems = row.getValue("num_items") as number;
                    return (
                        <IconLabel
                            data={{ icon: "lucide:box", text: String(numItems || 0), color: "gray" }}
                            showIconColor={false}
                            textClassName="font-small"
                        />
                    );
                },
            },
            {
                accessorKey: "distance",
                header: t("warehouses.distance", "Distance"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <TextLabel data={formatDistance(row.getValue("distance") as number)} />
                ),
            },
            {
                accessorKey: "time_to_travel",
                header: t("warehouses.timeToTravel", "Travel Time"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <TextLabel data={formatTimeToTravel(row.getValue("time_to_travel") as number)} />
                ),
            },
            {
                accessorKey: "status",
                header: t("warehouses.status", "Status"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <Tag text={row.getValue("status") as string} className="capitalize" />
                ),
            },
            {
                id: "address",
                accessorKey: "address_line_1",
                header: t("warehouses.address", "Address"),
                enableResizing: true,
                size: 250,
                cell: ({ row }) => {
                    const loc = row.original;
                    const fullAddress = [
                        loc.address_line_1,
                        loc.address_line_2,
                        loc.city,
                        loc.state_province,
                        loc.postal_code,
                    ]
                        .filter(Boolean)
                        .join(", ");
                    return <TextLargeLabel data={fullAddress} maxWidth="max-w-[300px]" />;
                },
            },
            {
                accessorKey: "country",
                header: t("warehouses.country", "Country"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <CountryLabel data={row.getValue("country") as string} />
                ),
            },
            {
                accessorKey: "stock_rotation_type",
                header: t("warehouses.stockRotationType", "Policy"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const rotationType = row.getValue("stock_rotation_type") as string;
                    return rotationType ? (
                        <div className="uppercase">
                            <TextLabel data={rotationType} />
                        </div>
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    );
                },
            },
            {
                accessorKey: "vehicle",
                header: t("warehouses.vehicle", "Vehicle"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => {
                    const vehicle = row.getValue("vehicle") as Vehicle;
                    return (
                        <div onClick={(e) => e.stopPropagation()}>
                            <VehicleLabel data={vehicle} hide={["icon"]} link />
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

    return (
        <div className="w-full overflow-x-auto">
            <TableProvider
                data={locations}
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
                                    <Warehouse className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">
                                            {emptyStateTitle || t("warehouses.noWarehousesTitle", "No warehouses yet")}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {emptyStateDescription || t("warehouses.noWarehousesDescription", "Start by adding your first warehouse or storage location")}
                                        </p>
                                    </div>
                                    {onEmptyStateAction && (
                                        <Button variant="outline" onClick={onEmptyStateAction}>
                                            <Plus className="h-4 w-4" />
                                            {emptyStateActionLabel || t("warehouses.addWarehouse", "Add Warehouse")}
                                        </Button>
                                    )}
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const location = row.original as StockLocation;
                        const rowContent = (
                            <TableRowRaw
                                key={row.id}
                                className={
                                    clickableRows || onRowClick
                                        ? "hover:bg-muted/50 cursor-pointer"
                                        : "hover:bg-muted/50"
                                }
                                data-state={row.getIsSelected() && "selected"}
                                onClick={() => onRowClick?.(location)}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} cell={cell} />
                                ))}
                            </TableRowRaw>
                        );
                        return wrapRowWithContextMenu(location, rowContent);
                    }}
                </TableBody>
            </TableProvider>
        </div>
    );
};

export const WarehousesTable = memo(WarehousesTableComponent);
export default WarehousesTable;
