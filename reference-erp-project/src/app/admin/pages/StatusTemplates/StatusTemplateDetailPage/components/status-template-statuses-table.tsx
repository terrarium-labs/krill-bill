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
import { Status, StatusCategory } from "@/types/general/status-templates";
import Tag from "@/app/components/tag/tag";
import ColorLabel from "@/app/components/labels/color-label";
import TextLargeLabel from "@/app/components/labels/text-large-label";
import TextLabel from "@/app/components/labels/text-label";

type StatusTableColumnKey = "id" | "number" | "name" | "description" | "category" | "position" | "color" | "actions";

interface StatusTemplateStatusesTableProps {
    data: Status[];
    category?: StatusCategory;
    isLoading?: boolean;
    hiddenColumns?: StatusTableColumnKey[];
    renderActions?: (status: Status) => ReactNode;
    onRowClick?: (status: Status) => void;
    clickableRows?: boolean;
    onEmptyStateAction?: () => void;
}

const StatusTemplateStatusesTable = ({
    data,
    category,
    isLoading = false,
    hiddenColumns = [],
    renderActions,
    onRowClick,
    clickableRows = false,
    onEmptyStateAction,
}: StatusTemplateStatusesTableProps) => {
    const { t } = useTranslation();

    // Filter data by category and sort by position
    const sortedData = useMemo(() => {
        const filteredData = category 
            ? data.filter(status => status.category === category)
            : data;
        
        return [...filteredData].sort((a, b) => {
            const posA = a.position !== null ? a.position : Infinity;
            const posB = b.position !== null ? b.position : Infinity;
            return posA - posB;
        });
    }, [data, category]);

    const columns: ColumnDef<Status>[] = useMemo(
        () => {
            const allColumns: ColumnDef<Status>[] = [
                {
                    accessorKey: "id",
                    header: t("common.id", "ID"),
                    size: 80,
                    cell: ({ row }: { row: { original: Status } }) => {
                        const status = row.original;
                        return (
                            <IdBadge
                                id={status.id}
                                hideIcon={true}
                                customTooltip={t("common.copyId", "Copy ID")}
                            />
                        );
                    },
                    meta: {
                        className: "w-[80px]",
                    },
                },
                {
                    id: "number",
                    header: () => <div className="text-center">Nº</div>,
                    size: 60,
                    cell: ({ row, table }: { row: {id: string; original: Status; index: number }; table: any }) => {
                        // Use the index within the filtered/sorted data
                        const index = table.getRowModel().rows.findIndex((r: any) => r.id === row.id);
                        return (
                            <div className="text-center font-medium">
                                {index !== -1 ? index + 1 : "-"}
                            </div>
                        );
                    },
                    meta: {
                        className: "w-[60px]",
                    },
                },
                {
                    accessorKey: "name",
                    header: t("statusTemplates.columns.statusName", "Status Name"),
                    size: 200,
                    cell: ({ row }: { row: { original: Status } }) => {
                        const status = row.original;
                        return <TextLabel data={status.name} className="font-medium" />;
                    },
                    meta: {
                        className: "w-[200px]",
                    },
                },
                {
                    accessorKey: "description",
                    header: t("statusTemplates.columns.description", "Description"),
                    size: 300,
                    cell: ({ row }: { row: { original: Status } }) => {
                        const description = row.original.description;
                        return <TextLargeLabel data={description} />;
                    },
                    meta: {
                        className: "w-[300px]",
                    },
                },
                {
                    accessorKey: "category",
                    header: t("statusTemplates.columns.category", "Category"),
                    size: 140,
                    cell: ({ row }: { row: { original: Status } }) => {
                        const category = row.original.category;
                        if (!category) return <span>-</span>;
                        return <Tag text={category} className="capitalize" />;
                    },
                    meta: {
                        className: "w-[140px]",
                    },
                },
                {
                    accessorKey: "color",
                    header: t("statusTemplates.columns.color", "Color"),
                    size: 140,
                    cell: ({ row }: { row: { original: Status } }) => {
                        const color = row.original.color;
                        if (!color) return <span>-</span>;
                        return <ColorLabel data={color || "blue"} />;
                    },
                    meta: {
                        className: "w-[140px]",
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
                    size: 60,
                    cell: ({ row }: { row: { original: Status } }) => {
                        const status = row.original;
                        return renderActions ? renderActions(status) : null;
                    },
                    meta: {
                        sticky: 'right',
                        className: "w-[60px]",
                    },
                },
            ];

            return allColumns.filter((column) => {
                const key = ((column as { accessorKey?: string }).accessorKey || column.id) as StatusTableColumnKey;
                return !hiddenColumns.includes(key);
            });
        },
        [t, hiddenColumns, renderActions]
    );

    const handleRowClickInternal = (status: Status) => {
        if (clickableRows && onRowClick) {
            onRowClick(status);
        }
    };

    return (
        <TableProvider data={sortedData} columns={columns} className="table-fixed">
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
                                        {t("statusTemplates.noStatuses", "No statuses found")}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {t("statusTemplates.getStartedStatuses", "Get started by creating a new status")}
                                    </p>
                                </div>
                                {onEmptyStateAction && (
                                    <Button onClick={onEmptyStateAction} variant="outline">
                                        <Plus className="h-4 w-4 mr-2" />
                                        {t("statusTemplates.editTemplate", "Edit Template")}
                                    </Button>
                                )}
                            </div>
                        </TableCellRaw>
                    </TableRowRaw>
                }
            >
                {({ row }) => (
                    <TableRowRaw
                        key={row.id}
                        className={clickableRows ? "hover:bg-muted/50 cursor-pointer" : "hover:bg-muted/50"}
                        onClick={() => handleRowClickInternal(row.original as Status)}
                        data-state={row.getIsSelected() && 'selected'}
                    >
                        {row.getVisibleCells().map((cell) => (
                            <TableCell
                                key={cell.id}
                                cell={cell}
                            />
                        ))}
                    </TableRowRaw>
                )}
            </TableBody>
        </TableProvider>
    );
};

export default StatusTemplateStatusesTable;
