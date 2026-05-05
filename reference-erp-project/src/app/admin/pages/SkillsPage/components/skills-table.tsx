import { memo, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Wrench } from "lucide-react";
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
    type ColumnOrderState,
    type ColumnSizingState,
    type VisibilityState,
} from "@/components/ui/shadcn-io/table";
import type { OnChangeFn } from "@tanstack/react-table";
import { TableRow as TableRowRaw, TableCell as TableCellRaw } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import IdBadge from "@/app/components/id-badge";
import { Skill } from "@/types/general/skills";
import TextLabel from "@/app/components/labels/text-label";
import TextLargeLabel from "@/app/components/labels/text-large-label";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";
import Tag from "@/app/components/tag/tag";

export type SkillTableColumnKey = "id" | "name" | "type" | "description" | "actions";

interface SkillsTableProps {
    data: Skill[];
    isLoading?: boolean;
    searchQuery?: string;
    hiddenColumns?: SkillTableColumnKey[] | SkillTableColumnKey;
    renderActions?: (skill: Skill) => ReactNode;
    onRowClick?: (skill: Skill) => void;
    clickableRows?: boolean;
    onEmptyStateAction?: () => void;
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const SkillsTableComponent = ({
    data,
    isLoading = false,
    searchQuery = "",
    hiddenColumns = [],
    renderActions,
    onRowClick,
    clickableRows = true,
    onEmptyStateAction,
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: SkillsTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<Skill>(renderActions);

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

    const columns = useMemo<ColumnDef<Skill>[]>(() => {
        const cols: ColumnDef<Skill>[] = [
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
                header: t("skills.columns.name", "Name"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => (
                    <TextLabel data={row.original.name} className="font-medium" />
                ),
            },
            {
                accessorKey: "type",
                header: t("skills.columns.type", "Type"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <Tag text={row.original.type} className="font-medium capitalize" />
                ),
            },
            {
                accessorKey: "description",
                header: t("skills.columns.description", "Description"),
                enableResizing: true,
                size: 200,
                cell: ({ row }) => {
                    const desc = row.original.description;
                    const descriptionText = typeof desc === 'string' ? desc : desc?.level_1 || '-';
                    return <TextLargeLabel data={descriptionText} />;
                },
            },
        ];

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
    }, [t, renderActions]);

    return (
        <div className="w-full overflow-x-auto">
            <TableProvider
                data={data}
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
                                    <Wrench className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">
                                            {searchQuery
                                                ? t("skills.noResultsFound", "No results found")
                                                : t("skills.noSkills", "No skills found")}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {searchQuery
                                                ? t("skills.noResultsDescription", 'No results found for "{{searchQuery}}"', { searchQuery })
                                                : t("skills.noSkillsDescription", "Start by creating your first skill")}
                                        </p>
                                    </div>
                                    {onEmptyStateAction && (
                                        <Button variant="outline" onClick={onEmptyStateAction}>
                                            <Plus className="h-4 w-4" />
                                            {t("skills.addSkill", "New skill")}
                                        </Button>
                                    )}
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const skill = row.original as Skill;
                        return wrapRowWithContextMenu(
                            skill,
                            <TableRowRaw
                                key={row.id}
                                className={clickableRows ? "hover:bg-muted/50 cursor-pointer" : "hover:bg-muted/50"}
                                onClick={() => clickableRows && onRowClick?.(skill)}
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

export const SkillsTable = memo(SkillsTableComponent);
export default SkillsTable;
