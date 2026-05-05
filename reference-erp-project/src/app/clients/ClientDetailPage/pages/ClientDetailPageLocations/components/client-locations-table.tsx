import { memo, useMemo, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Plus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Location } from "@/types/general/location";
import { FlagComponent } from "@/app/components/flag-component";
import { COUNTRIES } from "@/utils/countries";
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
import Tag from "@/app/components/tag/tag";
import { DynamicIcon, IconName } from "lucide-react/dynamic";
import { formatDistance, formatTimeToTravel, formatDecimal } from "@/utils/miscelanea";
import IdBadge from "@/app/components/id-badge";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";
import WorkplaceLabel from "@/app/components/labels/workplace-label";
import CurrencyLabel from "@/app/components/labels/currency-label";
import TextLabel from "@/app/components/labels/text-label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type ClientLocationsTableProps = {
    locations: Location[];
    isLoading: boolean;
    searchQuery: string;
    onAddLocation?: () => void;
    onViewLocation?: (location: Location) => void;
    renderActions?: (location: Location) => ReactNode;
};

const ClientLocationsTableComponent = ({
    locations,
    isLoading,
    searchQuery,
    onAddLocation,
    onViewLocation,
    renderActions,
}: ClientLocationsTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<Location>(renderActions);

    const columns = useMemo<ColumnDef<Location>[]>(() => [
        {
            accessorKey: "id",
            header: t("common.id", "ID"),
            enableResizing: true,
            size: 120,
            cell: ({ row }) => (
                <IdBadge id={row.original.id} hideIcon={true} customTooltip={t("common.copyId", "Copy ID")} />
            ),
        },
        {
            accessorKey: "name",
            header: t("locations.name", "Name"),
            enableResizing: true,
            size: 180,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    {row.original.icon_url && (
                        <DynamicIcon name={row.original.icon_url as IconName} className="min-h-4 min-w-4 max-h-4 max-w-4" />
                    )}
                    <div className="font-medium text-sm">{row.getValue("name") || <span className="text-muted-foreground">-</span>}</div>
                </div>
            ),
        },
        {
            accessorKey: "status",
            header: t("locations.status", "Status"),
            enableResizing: true,
            size: 120,
            cell: ({ row }) => {
                const status = row.getValue("status") as string;
                return <Tag text={status} color={status === "active" ? "green" : "red"} className="capitalize" />;
            },
        },
        {
            accessorKey: "distance",
            header: t("locations.distance", "Distance"),
            enableResizing: true,
            size: 120,
            cell: ({ row }) => (
                <div className="text-sm">{formatDistance(row.getValue("distance") as number)}</div>
            ),
        },
        {
            accessorKey: "time_to_travel",
            header: t("locations.timeToTravel", "Time to Travel"),
            enableResizing: true,
            size: 130,
            cell: ({ row }) => (
                <div className="text-sm">{formatTimeToTravel(row.getValue("time_to_travel") as number)}</div>
            ),
        },
        {
            id: "origin_workplace",
            header: t("locations.origin", "Origin"),
            enableResizing: true,
            size: 150,
            cell: ({ row }) => <WorkplaceLabel data={row.original.origin_workplace} link />,
        },
        {
            id: "estimated_commuting",
            header: t("locations.estimatedCommuting", "Est. Commuting"),
            enableResizing: true,
            size: 150,
            cell: ({ row }) => {
                const location = row.original;
                const rate = location.commuting_rate;
                if (!rate) return <span className="text-muted-foreground">-</span>;
                let fixed = 0;
                let distanceCost = 0;
                if (rate.is_fixed_price && rate.fixed_price) fixed = rate.fixed_price;
                if (rate.is_price_per_km && rate.price_per_km && location.distance) {
                    distanceCost = location.distance * rate.price_per_km;
                }
                const minApplied = rate.min_price && distanceCost > 0 && distanceCost < rate.min_price;
                if (minApplied) distanceCost = rate.min_price!;
                const estimated = fixed + distanceCost;

                const parts: string[] = [];
                if (rate.is_fixed_price && rate.fixed_price) {
                    parts.push(`${formatDecimal(fixed, { minFractionDigits: 2, maxFractionDigits: 2 })} €`);
                }
                if (rate.is_price_per_km && rate.price_per_km && location.distance > 0) {
                    let kmPart = `${formatDecimal(location.distance, { minFractionDigits: 0, maxFractionDigits: 1 })} km × ${formatDecimal(rate.price_per_km, { minFractionDigits: 2, maxFractionDigits: 2 })} €/km`;
                    if (minApplied) {
                        kmPart += ` (min. ${formatDecimal(rate.min_price!, { minFractionDigits: 0, maxFractionDigits: 2 })} €)`;
                    }
                    parts.push(kmPart);
                }

                return (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 cursor-help">
                                <CurrencyLabel data={estimated} />
                                {rate.is_travel_time_billable && (
                                    <span className="text-xs text-muted-foreground italic">
                                        + {t("locations.time", "travel time")}
                                    </span>
                                )}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="border shadow-md p-3 max-w-xs">
                            <div className="space-y-1.5">
                                <p className="text-xs font-medium">{rate.name}</p>
                                <p className="text-sm font-semibold">
                                    {formatDecimal(estimated, { minFractionDigits: 2, maxFractionDigits: 2 })} €
                                </p>
                                {parts.length > 0 && (
                                    <p className="text-xs text-muted-foreground">{parts.join(" + ")}</p>
                                )}
                                {rate.is_travel_time_billable && (
                                    <p className="text-xs text-muted-foreground italic">
                                        + {t("locations.travelTimeBillable", "travel time billable")}
                                        {location.time_to_travel > 0 && ` (${formatTimeToTravel(location.time_to_travel)})`}
                                    </p>
                                )}
                            </div>
                        </TooltipContent>
                    </Tooltip>
                );
            },
        },
        {
            accessorKey: "address_line_1",
            header: t("locations.address", "Address"),
            enableResizing: true,
            size: 200,
            cell: ({ row }) => {
                const loc = row.original;
                const fullAddress = [loc.address_line_1, loc.address_line_2, loc.postal_code, loc.city]
                    .filter(Boolean)
                    .join(", ");
                return <TextLabel data={fullAddress} />;
            },
        },
        {
            accessorKey: "country",
            header: t("locations.country", "Country"),
            enableResizing: true,
            size: 150,
            cell: ({ row }) => {
                const countryCode = row.getValue("country") as string;
                if (!countryCode) return <div><span className="text-muted-foreground">-</span></div>;
                const country = COUNTRIES.find((c) => c.code === countryCode);
                if (!country) return <div>{countryCode}</div>;
                return (
                    <div className="flex items-center gap-2">
                        <FlagComponent country={country.code} countryName={country.name} />
                        <span>{country.name}</span>
                    </div>
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
        <TableProvider data={locations} columns={columns} enableColumnResizing>
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
                                <MapPin className="h-10 w-10 text-muted-foreground" />
                                <div className="flex flex-col items-center justify-center">
                                    <h3 className="text-lg font-medium">
                                        {searchQuery ? t("locations.noResultsFound", "No locations found") : t("locations.noLocationsTitle", "No locations yet")}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {searchQuery ? t("locations.noResultsDescription", "No locations match your search for '{{searchQuery}}'", { searchQuery }) : t("locations.noLocationsDescription", "Start by adding your first location")}
                                    </p>
                                </div>
                                {onAddLocation && (
                                    <Button variant="outline" onClick={onAddLocation}>
                                        <Plus className="h-4 w-4" />
                                        {t("locations.addLocation", "Add Location")}
                                    </Button>
                                )}
                            </div>
                        </TableCellRaw>
                    </TableRowRaw>
                }
            >
                {({ row }) => {
                    const location = row.original as Location;
                    return wrapRowWithContextMenu(
                        location,
                        <TableRowRaw
                            key={row.id}
                            className="hover:bg-muted/50 cursor-pointer"
                            onClick={() => onViewLocation?.(location)}
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

export const ClientLocationsTable = memo(ClientLocationsTableComponent);
export default ClientLocationsTable;
