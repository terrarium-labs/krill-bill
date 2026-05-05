import { memo, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    TableProvider,
    TableHeader,
    TableHeaderGroup,
    TableHead,
    TableBody,
    TableCell,
    TableColumnHeader,
    type ColumnDef,
} from "@/components/ui/shadcn-io/table";
import {
    TableRow as TableRowRaw,
    TableCell as TableCellRaw,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import type { TrainingCategory } from "@/types/trainings/trainings";
import IdBadge from "@/app/components/id-badge";
import ColorLabel from "@/app/components/labels/color-label";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

export type CategoryTableColumnKey =
    | "id"
    | "name"
    | "description"
    | "color"
    | "actions";

interface TrainingCategoriesTableProps {
    categories: TrainingCategory[];
    isLoading: boolean;
    hiddenColumns?: CategoryTableColumnKey[] | CategoryTableColumnKey;
    renderActions?: (category: TrainingCategory) => ReactNode;
    onRowClick?: (category: TrainingCategory) => void;
    clickableRows?: boolean;
    onEmptyStateAction?: () => void;
    searchQuery?: string;
}

const TrainingCategoriesTableComponent = ({
    categories,
    isLoading,
    hiddenColumns = [],
    renderActions,
    onRowClick,
    clickableRows = false,
    onEmptyStateAction,
    searchQuery = "",
}: TrainingCategoriesTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } =
        useTableContextMenu<TrainingCategory>(renderActions);

    const hiddenColumnsArray = useMemo(() => {
        if (Array.isArray(hiddenColumns)) return hiddenColumns;
        return hiddenColumns ? [hiddenColumns] : [];
    }, [hiddenColumns]);

    const columns = useMemo<ColumnDef<TrainingCategory>[]>(() => {
        const isVisible = (key: CategoryTableColumnKey) =>
            !hiddenColumnsArray.includes(key);

        const cols: ColumnDef<TrainingCategory>[] = [];

        if (isVisible("id")) {
            cols.push({
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
            });
        }

        if (isVisible("name")) {
            cols.push({
                accessorKey: "name",
                header: t("trainings.categories.columns.name", "Name"),
                enableResizing: true,
                size: 200,
                cell: ({ row }) => (
                    <div className="font-medium">{row.original.name}</div>
                ),
            });
        }

        if (isVisible("description")) {
            cols.push({
                accessorKey: "description",
                header: t(
                    "trainings.categories.columns.description",
                    "Description"
                ),
                enableResizing: true,
                size: 250,
                cell: ({ row }) => (
                    <span className="text-muted-foreground">
                        {row.original.description || "—"}
                    </span>
                ),
            });
        }

        if (isVisible("color")) {
            cols.push({
                accessorKey: "color",
                header: t("trainings.categories.columns.color", "Color"),
                enableResizing: true,
                size: 100,
                cell: ({ row }) => {
                    const color = row.getValue("color") as string;
                    return color ? (
                        <ColorLabel data={color} />
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    );
                },
            });
        }

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
                    {renderActions?.(row.original)}
                </div>
            ),
            meta: { sticky: "right" },
        });

        return cols;
    }, [t, renderActions, hiddenColumnsArray]);

    return (
        <div className="w-full overflow-x-auto">
            <TableProvider
                data={categories}
                columns={columns}
                enableColumnResizing
            >
                <TableHeader>
                    {({ headerGroup }) => (
                        <TableHeaderGroup
                            key={headerGroup.id}
                            headerGroup={headerGroup}
                        >
                            {({ header }) => (
                                <TableHead key={header.id} header={header} />
                            )}
                        </TableHeaderGroup>
                    )}
                </TableHeader>
                <TableBody
                    isLoading={isLoading}
                    loadingState={
                        <TableSkeleton columnCount={columns.length} />
                    }
                    emptyState={
                        <TableRowRaw className="hover:bg-transparent">
                            <TableCellRaw
                                className="h-96 text-center hover:bg-transparent"
                                colSpan={columns.length}
                            >
                                <div className="flex items-center justify-center space-y-4 flex-col">
                                    <FolderOpen className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">
                                            {searchQuery
                                                ? t(
                                                      "trainings.categories.noResultsFound",
                                                      "No results found"
                                                  )
                                                : t(
                                                      "trainings.categories.empty.title",
                                                      "No categories yet"
                                                  )}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {searchQuery
                                                ? t(
                                                      "trainings.categories.noResultsDescription",
                                                      'No results found for "{{searchQuery}}"',
                                                      { searchQuery }
                                                  )
                                                : t(
                                                      "trainings.categories.empty.description",
                                                      "Create categories to organize your training courses."
                                                  )}
                                        </p>
                                    </div>
                                    {onEmptyStateAction && (
                                        <Button
                                            variant="outline"
                                            onClick={onEmptyStateAction}
                                        >
                                            <FolderOpen className="h-4 w-4" />
                                            {t(
                                                "trainings.categories.add",
                                                "Add Category"
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const category = row.original as TrainingCategory;
                        return wrapRowWithContextMenu(
                            category,
                            <TableRowRaw
                                key={row.id}
                                className={
                                    clickableRows
                                        ? "hover:bg-muted/50 cursor-pointer"
                                        : "hover:bg-muted/50"
                                }
                                onClick={() => onRowClick?.(category)}
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

export const TrainingCategoriesTable = memo(TrainingCategoriesTableComponent);
export default TrainingCategoriesTable;
