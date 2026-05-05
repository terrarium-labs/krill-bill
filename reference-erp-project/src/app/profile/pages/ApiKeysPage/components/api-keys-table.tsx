import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Key } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { formatDate } from "@/utils/miscelanea";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import IdBadge from "@/app/components/id-badge";
import { ApiKey } from "./api-key-delete-modal";

export type ApiKeyTableColumnKey =
    | "id"
    | "name"
    | "display_key"
    | "created_at"
    | "actions";

interface ApiKeysTableProps {
    apiKeys: ApiKey[];
    isLoading: boolean;
    onDelete: (apiKey: ApiKey) => void;
    emptyStateAction?: React.ReactNode;
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const ApiKeysTableComponent = ({
    apiKeys,
    isLoading,
    onDelete,
    emptyStateAction,
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: ApiKeysTableProps) => {
    const { t } = useTranslation();

    const columns = useMemo<ColumnDef<ApiKey>[]>(() => [
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
            header: t("common.name", "Name"),
            enableResizing: true,
            size: 180,
            cell: ({ row }) => (
                <div className="font-medium">{row.getValue("name")}</div>
            ),
        },
        {
            accessorKey: "display_key",
            header: t("apiKeys.displayKey", "API Key"),
            enableResizing: true,
            size: 200,
            cell: ({ row }) => {
                const displayKey = row.getValue("display_key") as string;
                return (
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono text-xs">
                            {displayKey || "***"}
                        </Badge>
                    </div>
                );
            },
        },
        {
            accessorKey: "created_at",
            header: t("apiKeys.created", "Created"),
            enableResizing: true,
            size: 120,
            cell: ({ row }) => (
                <div className="text-sm">{formatDate(row.getValue("created_at") as string)}</div>
            ),
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
            cell: ({ row }) => {
                const apiKey = row.original;
                return (
                    <div className="flex justify-center items-center">
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("common.delete", "Delete"),
                                    icon: "trash-2",
                                    onClick: () => onDelete(apiKey),
                                    variant: "destructive",
                                },
                            ]}
                        />
                    </div>
                );
            },
            meta: { sticky: "right" },
        },
    ], [t, onDelete]);

    return (
        <div className="w-full overflow-x-auto">
            <TableProvider
                data={apiKeys}
                columns={columns}
                enableColumnResizing
                columnVisibility={columnVisibility}
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
                                    <Key className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">{t("apiKeys.noApiKeys", "No API Keys")}</h3>
                                        <p className="text-muted-foreground">
                                            {t("apiKeys.noApiKeysDescription", "Create your first API key and connect API")}
                                        </p>
                                    </div>
                                    {emptyStateAction}
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => (
                        <TableRowRaw
                            key={row.id}
                            className="hover:bg-muted/50 cursor-pointer"
                            data-state={row.getIsSelected() && "selected"}
                        >
                            {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id} cell={cell} />
                            ))}
                        </TableRowRaw>
                    )}
                </TableBody>
            </TableProvider>
        </div>
    );
};

export const ApiKeysTable = memo(ApiKeysTableComponent);
export default ApiKeysTable;
