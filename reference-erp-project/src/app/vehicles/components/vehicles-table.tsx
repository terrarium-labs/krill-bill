import { memo, useMemo, type ReactNode } from "react";
import { Truck, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Vehicle } from "@/types/general/vehicles";
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
import { Button } from "@/components/ui/button";
import TextLabel from "@/app/components/labels/text-label";
import Tag from "@/app/components/tag/tag";
import EmployeeLabel from "@/app/components/labels/employee-label";
import CountryLabel from "@/app/components/labels/country-label";
import LocationLabel from "@/app/components/labels/location-label";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";
import VehicleLabel from "@/app/components/labels/vehicle-label";
import WorkplaceLabel from "@/app/components/labels/workplace-label";

export type VehicleTableColumnKey =
    | "id"
    | "name"
    | "plate_number"
    | "vehicle_type"
    | "chassis_number"
    | "origin_city"
    | "origin_country"
    | "location"
    | "drivers"
    | "status"
    | "workplace"
    | "actions";

interface VehiclesTableProps {
    vehicles: Vehicle[];
    isLoading?: boolean;
    /** Structural column hiding (for embedding this table in sub-pages). Not saved to preferences. */
    hiddenColumns?: VehicleTableColumnKey[] | VehicleTableColumnKey;
    renderActions?: (vehicle: Vehicle) => ReactNode;
    onRowClick?: (vehicle: Vehicle) => void;
    clickableRows?: boolean;
    emptyStateTitle?: string;
    emptyStateDescription?: string;
    onEmptyStateAction?: () => void;
    emptyStateActionLabel?: string;
    searchQuery?: string;
    /** TanStack column visibility (from useVehiclesTablePreferences) */
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    /** TanStack column order */
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    /** TanStack column sizing */
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const VehiclesTableComponent = ({
    vehicles,
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
}: VehiclesTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<Vehicle>(renderActions);

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

    const columns = useMemo<ColumnDef<Vehicle>[]>(() => {
        const cols: ColumnDef<Vehicle>[] = [
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
                accessorKey: "name",
                header: t("vehicles.name", "Name"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => <TextLabel data={row.getValue("name")} />,
            },
            {
                accessorKey: "plate_number",
                header: t("vehicles.plateNumber", "Plate Number"),
                enableResizing: true,
                size: 130,
                cell: ({ row }) => (
                    <VehicleLabel data={row.original} hide={["icon", "name", "type"]} />
                ),
            },
            {
                accessorKey: "vehicle_type",
                header: t("vehicles.vehicleType", "Type"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const type = row.getValue("vehicle_type") as Vehicle["vehicle_type"];
                    return <Tag text={type} className="capitalize" />;
                },
            },
            {
                accessorKey: "chassis_number",
                header: t("vehicles.chassisNumber", "Chassis Number"),
                enableResizing: true,
                size: 150,
                cell: ({ row }) => <TextLabel data={row.getValue("chassis_number")} />,
            },
            {
                id: "location",
                header: t("vehicles.location", "Location"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => <LocationLabel data={row.original.location} link />,
            },
            {
                accessorKey: "origin_city",
                header: t("vehicles.originCity", "City"),
                enableResizing: true,
                size: 150,
                cell: ({ row }) => {
                    const vehicle = row.original;
                    const city = vehicle.origin_city || vehicle.workplace?.city || null;
                    return <TextLabel data={city} />;
                },
            },
            {
                accessorKey: "origin_country",
                header: t("vehicles.originCountry", "Country"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const vehicle = row.original;
                    const country = vehicle.origin_country || vehicle.workplace?.country || null;
                    return <CountryLabel data={country} />;
                },
            },
            {
                accessorKey: "workplace",
                header: t("vehicles.workplace", "Workplace"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => (
                    <div onClick={(e) => e.stopPropagation()}>
                        <WorkplaceLabel data={row.original.workplace} link />
                    </div>
                ),
            },
            {
                id: "drivers",
                header: t("vehicles.drivers", "Drivers"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => (
                    <EmployeeLabel data={row.original.active_employees} link />
                ),
            },
            {
                accessorKey: "status",
                header: t("common.status", "Status"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <Tag text={(row.getValue("status") as string).replaceAll("_", " ")} className="capitalize" />
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
        ? t("vehicles.noResultsFound", "No vehicles found")
        : t("vehicles.noVehiclesTitle", "No vehicles yet");

    const defaultEmptyDescription = searchQuery
        ? t("vehicles.noResultsDescription", "No vehicles match your search for '{{searchQuery}}'", { searchQuery })
        : t("vehicles.noVehiclesDescription", "Start by adding your first vehicle");

    return (
        <div className="w-full overflow-x-auto">
            <TableProvider
                data={vehicles}
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
                                    <Truck className="h-10 w-10 text-muted-foreground" />
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
                                            {emptyStateActionLabel || t("vehicles.addVehicle", "Add Vehicle")}
                                        </Button>
                                    )}
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const vehicle = row.original as Vehicle;
                        const rowContent = (
                            <TableRowRaw
                                key={row.id}
                                className={clickableRows ? "hover:bg-muted/50 cursor-pointer" : "hover:bg-muted/50"}
                                onClick={() => clickableRows && onRowClick && onRowClick(vehicle)}
                                data-state={row.getIsSelected() && "selected"}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} cell={cell} />
                                ))}
                            </TableRowRaw>
                        );
                        return wrapRowWithContextMenu(vehicle, rowContent);
                    }}
                </TableBody>
            </TableProvider>
        </div>
    );
};

export const VehiclesTable = memo(VehiclesTableComponent);
export default VehiclesTable;
