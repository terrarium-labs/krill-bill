import { memo, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { DynamicIcon } from "lucide-react/dynamic";
import { MapPin, Plus, Users } from "lucide-react";
import { useNavigate } from "react-router";
import { FlagComponent } from "@/app/components/flag-component";
import { COUNTRIES } from "@/utils/countries";
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
import { Workplace } from "@/types/general/workplaces";
import IdBadge from "@/app/components/id-badge";
import PhoneLabel from "@/app/components/labels/phone-label";
import TextLabel from "@/app/components/labels/text-label";
import { Button } from "@/components/ui/button";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

export type WorkplaceTableColumnKey =
    | "id"
    | "name"
    | "num_employees"
    | "address_line_1"
    | "country"
    | "phone"
    | "timezone"
    | "actions";

export interface WorkplacesTableProps {
    workplaces: Workplace[];
    isLoading: boolean;
    searchQuery?: string;
    onAddWorkplace: () => void;
    renderActions?: (workplace: Workplace) => ReactNode;
    hiddenColumns?: WorkplaceTableColumnKey[] | WorkplaceTableColumnKey;
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const WorkplacesTableComponent = ({
    workplaces,
    isLoading,
    searchQuery = "",
    onAddWorkplace,
    renderActions,
    hiddenColumns,
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: WorkplacesTableProps) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { wrapRowWithContextMenu } = useTableContextMenu<Workplace>(renderActions);

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

    const columns = useMemo<ColumnDef<Workplace>[]>(
        () => {
            const cols: ColumnDef<Workplace>[] = [
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
                    header: t("admin.workplaces.columns.name", "Name"),
                    enableResizing: true,
                    size: 180,
                    cell: ({ row }) => {
                        const workplace = row.original;
                        return (
                            <div className="flex items-center gap-3">
                                {workplace.icon_url && (
                                    <DynamicIcon name={workplace.icon_url as any} className="h-4 w-4" />
                                )}
                                <div className="font-medium">{workplace.name}</div>
                            </div>
                        );
                    },
                },
                {
                    accessorKey: "num_employees",
                    header: t("admin.workplaces.columns.num_employees", "Employees"),
                    enableResizing: true,
                    size: 100,
                    cell: ({ row }) => (
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {row.original.num_employees || 0}
                        </div>
                    ),
                },
                {
                    accessorKey: "address_line_1",
                    header: t("admin.workplaces.columns.address", "Address"),
                    enableResizing: true,
                    size: 250,
                    cell: ({ row }) => {
                        const workplace = row.original;
                        const fullAddress = [
                            workplace.address_line_1,
                            workplace.address_line_2,
                            workplace.city,
                            workplace.state_province,
                            workplace.postal_code,
                        ]
                            .filter(Boolean)
                            .join(", ");
                        return <TextLabel data={fullAddress} />;
                    },
                },
                {
                    accessorKey: "country",
                    header: t("admin.workplaces.columns.country", "Country"),
                    enableResizing: true,
                    size: 150,
                    cell: ({ row }) => {
                        const countryCode = row.original.country;
                        if (!countryCode) return <span className="text-muted-foreground">-</span>;
                        const country = COUNTRIES.find((c) => c.code === countryCode);
                        if (!country) return <span>{countryCode}</span>;
                        return (
                            <div className="flex items-center gap-2">
                                <FlagComponent country={country.code} countryName={country.name} />
                                <span>{country.name}</span>
                            </div>
                        );
                    },
                },
                {
                    accessorKey: "phone",
                    header: t("admin.workplaces.columns.phone", "Phone"),
                    enableResizing: true,
                    size: 150,
                    cell: ({ row }) => <PhoneLabel data={row.original.phone} variant="black" link />,
                },
                {
                    accessorKey: "timezone",
                    header: t("admin.workplaces.columns.timezone", "Timezone"),
                    enableResizing: true,
                    size: 180,
                    cell: ({ row }) => (
                        <span>{row.original.timezone || <span className="text-muted-foreground">-</span>}</span>
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
                data={workplaces}
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
                                    <MapPin className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">
                                            {searchQuery
                                                ? t("admin.workplaces.noResultsFound", "No workplaces found")
                                                : t("admin.workplaces.noWorkplaces", "No workplaces yet")}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {searchQuery
                                                ? t("admin.workplaces.noResultsDescription", "No workplaces match your search for '{{searchQuery}}'", { searchQuery })
                                                : t("admin.workplaces.noWorkplacesDescription", "Start by adding your first workplace")}
                                        </p>
                                    </div>
                                    <Button variant="outline" onClick={onAddWorkplace}>
                                        <Plus className="h-4 w-4" />
                                        {t("admin.workplaces.addWorkplace", "Add workplace")}
                                    </Button>
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const workplace = row.original;
                        return wrapRowWithContextMenu(
                            workplace,
                            <TableRowRaw
                                key={row.id}
                                className="hover:bg-muted/50 cursor-pointer"
                                onClick={() => navigate(`${workplace.id}`)}
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

export const WorkplacesTable = memo(WorkplacesTableComponent);
export default WorkplacesTable;
