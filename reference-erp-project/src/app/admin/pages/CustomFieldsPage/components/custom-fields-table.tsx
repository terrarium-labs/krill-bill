import { useMemo, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Settings, Plus, CircleCheck, X } from "lucide-react";
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
import Tag from "@/app/components/tag/tag";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

export interface Field {
    id: string;
    table_name: string;
    data_type: string;
    enum_types?: string[];
    default_value?: string;
    name: string;
    description?: string;
    is_nullable: boolean;
    is_unique: boolean;
    is_multiple_values: boolean;
    is_shown_by_default: boolean;
    value?: string;
}

// Column keys for type-safe column visibility
export type CustomFieldsTableColumnKey =
    | "id"
    | "name"
    | "description"
    | "data_type"
    | "default_value"
    | "required"
    | "is_unique"
    | "is_multiple_values"
    | "actions";

interface CustomFieldsTableProps {
    fields: Field[];
    isLoading: boolean;
    onFieldClick?: (field: Field) => void;
    onAddField?: () => void;
    renderActions?: (field: Field) => ReactNode;
    hiddenColumns?: CustomFieldsTableColumnKey[];
}

const CustomFieldsTable = ({
    fields,
    isLoading,
    onFieldClick,
    onAddField,
    renderActions,
    hiddenColumns = [],
}: CustomFieldsTableProps) => {
    const { t } = useTranslation();

    const { wrapRowWithContextMenu } = useTableContextMenu<Field>(renderActions);

    // Get data type display name
    const getDataTypeDisplay = (dataType: string, enumTypes?: string[]) => {
        if (dataType === 'text' && enumTypes && enumTypes.length > 0) {
            return t("admin.customFields.field.multipleChoice", "Multiple Choice");
        }
        return dataType.charAt(0).toUpperCase() + dataType.slice(1);
    };

    // Table columns definition
    const columns: ColumnDef<Field>[] = useMemo(() => {
        const allColumns: ColumnDef<Field>[] = [
            {
                accessorKey: "id",
                header: t("common.id", "ID"),
                cell: ({ row }) => {
                    const field = row.original;
                    return (
                        <IdBadge id={field.id} hideIcon={true} customTooltip={t("common.copyId", "Copy ID")} />
                    );
                },
            },
            {
                accessorKey: "name",
                header: t("admin.customFields.field.name", "Field Name"),
                cell: ({ row }) => (
                    <div className="font-medium">
                        {row.getValue("name")}
                    </div>
                ),
            },
            {
                accessorKey: "description",
                header: t("admin.customFields.field.description", "Description"),
                cell: ({ row }) => (
                    <div className="text-sm max-w-xs truncate">
                        {row.getValue("description") || <span className="text-muted-foreground">-</span>}
                    </div>
                ),
            },
            {
                accessorKey: "data_type",
                header: t("admin.customFields.field.dataType", "Type"),
                cell: ({ row }) => {
                    const field = row.original;
                    return (
                        <Tag text={getDataTypeDisplay(field.data_type, field.enum_types)} />
                    );
                },
            },
            {
                accessorKey: "default_value",
                header: t("admin.customFields.field.defaultValue", "Default Value"),
                cell: ({ row }) => {
                    const defaultValue = row.getValue("default_value") as string;
                    return (
                        <div className="text-sm max-w-xs truncate">
                            {defaultValue || <span className="text-muted-foreground">-</span>}
                        </div>
                    );
                },
            },
            {
                accessorKey: "required",
                enableSorting: false,
                header: ({ header }) => (
                    <TableColumnHeader
                        column={header.column}
                        className="justify-center items-center flex"
                        title={t("admin.customFields.field.required", "Required")}
                    />
                ),
                cell: ({ row }) => {
                    const field = row.original;
                    return (
                        <div className="flex items-center text-center justify-center">
                            {!field.is_nullable ? <CircleCheck className="min-h-4 min-w-4 max-h-4 max-w-4 text-green-500" /> : <X className="min-h-4 min-w-4 max-h-4 max-w-4" />}
                        </div>
                    );
                },
            },
            {
                accessorKey: "is_unique",
                header: ({ header }) => (
                    <TableColumnHeader
                        column={header.column}
                        className="justify-center items-center flex"
                        title={t("admin.customFields.field.unique", "Unique")}
                    />
                ),
                cell: ({ row }) => {
                    const field = row.original;
                    return (
                        <div className="flex items-center text-center justify-center">
                            {field.is_unique ? <CircleCheck className="min-h-4 min-w-4 max-h-4 max-w-4 text-green-500" /> : <X className="min-h-4 min-w-4 max-h-4 max-w-4" />}
                        </div>
                    );
                },
                enableSorting: false,
            },
            {
                accessorKey: "is_multiple_values",
                header: ({ header }) => (
                    <TableColumnHeader
                        column={header.column}
                        className="justify-center items-center flex"
                        title={t("admin.customFields.field.multiple", "Multiple")}
                    />
                ),
                cell: ({ row }) => {
                    const field = row.original;
                    return (
                        <div className="flex items-center text-center justify-center">
                            {field.is_multiple_values ? <CircleCheck className="min-h-4 min-w-4 max-h-4 max-w-4 text-green-500" /> : <X className="min-h-4 min-w-4 max-h-4 max-w-4" />}
                        </div>
                    );
                },
                enableSorting: false,
            },
        ];

        if (renderActions) {
            allColumns.push({
                id: "actions",
                header: ({ header }) => (
                    <TableColumnHeader
                        column={header.column}
                        className="justify-center items-center flex"
                        title={''}
                    />
                ),
                cell: ({ row }) => {
                    const field = row.original;
                    return (
                        <div className="flex justify-center items-center">
                            {renderActions(field)}
                        </div>
                    );
                },
                meta: {
                    sticky: 'right',
                },
            });
        }

        // Filter out hidden columns
        return allColumns.filter(
            (column) =>
                !hiddenColumns.includes(
                    ((column as { accessorKey?: string; id?: string }).accessorKey ??
                        (column as { accessorKey?: string; id?: string }).id) as CustomFieldsTableColumnKey
                )
        );
    }, [t, hiddenColumns, renderActions]);

    return (
        <TableProvider data={fields} columns={columns}>
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
                                <Settings className="h-10 w-10 text-muted-foreground" />
                                <div className="flex flex-col items-center justify-center">
                                    <h3 className="text-lg font-medium">{t("admin.customFields.noFieldsTitle", "No fields yet")}</h3>
                                    <p className="text-muted-foreground">{t("admin.customFields.noFieldsDescription", "Start by adding your first custom field to this section")}</p>
                                </div>
                                {onAddField && (
                                    <Button variant="outline" onClick={onAddField}>
                                        <Plus className="h-4 w-4" />
                                        {t("common.addField", "Add Field")}
                                    </Button>
                                )}
                            </div>
                        </TableCellRaw>
                    </TableRowRaw>
                }
            >
                {({ row }) => {
                    const field = row.original as Field;
                    return wrapRowWithContextMenu(
                        field,
                        <TableRowRaw
                            key={row.id}
                            onClick={() => onFieldClick && onFieldClick(field)}
                            className="hover:bg-muted/50 cursor-pointer"
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

export default CustomFieldsTable;
