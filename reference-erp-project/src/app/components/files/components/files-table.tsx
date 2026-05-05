import { useTranslation } from "react-i18next";
import { File as FileType } from "@/types/general/files";
import { Employee } from "@/types/employees/employees";
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
import { File as FileIcon, Folder, FileIcon as FileIconComponent } from "lucide-react";
import { formatDate } from "@/utils/miscelanea";
import { formatSize } from "@/utils/miscelanea";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";
import IdBadge from "@/app/components/id-badge";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";
import { memo, ReactNode, useMemo } from "react";

export type FilesTableColumnKey = "id" | "name" | "size" | "created_by" | "created_at" | "actions";

export interface FilesTableProps {
    files: FileType[];
    isLoading: boolean;
    searchQuery: string;
    showEdit?: boolean;
    showDelete?: boolean;
    /** Columns to hide from the table, accepts array or single string */
    hiddenColumns?: FilesTableColumnKey[] | FilesTableColumnKey;
    onFolderClick: (folder: FileType) => void;
    onEdit: (file: FileType) => void;
    onDelete: (file: FileType) => void;
    emptyState?: ReactNode;
}

const FilesTableComponent = ({
    files,
    isLoading,
    searchQuery,
    showEdit = true,
    showDelete = true,
    hiddenColumns = [],
    onFolderClick,
    onEdit,
    onDelete,
    emptyState,
}: FilesTableProps) => {
    const { t } = useTranslation();

    const renderActions = useMemo(
        () =>
            (file: FileType) =>
                (showEdit || showDelete) ? (
                    <div className="flex justify-center items-center">
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("common.edit", "Edit"),
                                    icon: "edit",
                                    onClick: () => onEdit(file),
                                    showOption: showEdit,
                                },
                                {
                                    label: t("common.delete", "Delete"),
                                    icon: "trash-2",
                                    onClick: () => onDelete(file),
                                    variant: "destructive",
                                    showOption: showDelete,
                                },
                            ]}
                        />
                    </div>
                ) : null,
        [t, showEdit, showDelete, onEdit, onDelete]
    );

    const { wrapRowWithContextMenu } = useTableContextMenu<FileType>(renderActions, files);

    const columns = useMemo<ColumnDef<FileType>[]>(() => {
        const hidden = Array.isArray(hiddenColumns) ? hiddenColumns : hiddenColumns ? [hiddenColumns] : [];
        const isColumnVisible = (key: FilesTableColumnKey) => !hidden.includes(key);

        const cols: ColumnDef<FileType>[] = [];

        if (isColumnVisible("id")) {
            cols.push({
                accessorKey: "id",
                header: t("common.id", "ID"),
                enableResizing: true,
                size: 120,
            cell: ({ row }) => {
                const file = row.original;
                return (
                    <IdBadge id={file.id} hideIcon={true} customTooltip={t("common.copyId", "Copy ID")} />
                );
            },
        });
        }

        if (isColumnVisible("name")) {
            cols.push({
                accessorKey: "name",
                header: t("files.name", "Name"),
                enableResizing: true,
                size: 200,
            cell: ({ row }) => {
                const file = row.original;
                const isDirectory = file.is_dir;
                return (
                    <div
                        className="min-w-[200px] font-medium text-sm flex items-center gap-2 cursor-pointer hover:underline line-clamp-1 truncate"
                        onClick={() => isDirectory ? onFolderClick(file) : window.open(file.url, "_blank")}
                    >
                        {isDirectory ? (
                            <Folder className="h-4 w-4 text-blue-500" />
                        ) : (
                            <FileIconComponent className="h-4 w-4 text-gray-500" />
                        )}
                        {file.name || <span className="text-muted-foreground">-</span>}
                    </div>
                );
            },
        });
        }

        if (isColumnVisible("size")) {
            cols.push({
                accessorKey: "size",
                header: t("files.size", "Size"),
                enableResizing: true,
                size: 100,
            cell: ({ row }) => {
                const file = row.original;
                if (file.is_dir) return <div><span className="text-muted-foreground">-</span></div>;
                return <div>{formatSize(file.size)}</div>;
            },
        });
        }

        if (isColumnVisible("created_by")) {
            cols.push({
                accessorKey: "created_by",
                header: t("files.createdBy", "Created By"),
                enableResizing: true,
                size: 150,
            cell: ({ row }) => {
                const file = row.original;
                return <EmployeeAvatar employee={file.created_by as Employee} className="font-medium" />;
            },
        });
        }

        if (isColumnVisible("created_at")) {
            cols.push({
                accessorKey: "created_at",
                header: t("common.createdAt", "Created At"),
                enableResizing: true,
                size: 120,
            cell: ({ row }) => {
                const file = row.original;
                return file.created_at ? <div className="text-sm">{formatDate(file.created_at, { showTime: true })}</div> : <span className="text-muted-foreground">-</span>;
            },
        });
        }

        if (isColumnVisible("actions") && (showEdit || showDelete)) {
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
                cell: ({ row }) => {
                    const file = row.original;
                    return renderActions(file);
                },
                meta: {
                    sticky: "right",
                },
            });
        }

        return cols;
    }, [t, showEdit, showDelete, hiddenColumns, onFolderClick, onEdit, onDelete, renderActions]);

    const defaultEmptyState = (
        <div className="flex flex-col items-center justify-center space-y-4">
            <FileIcon className="h-10 w-10 text-muted-foreground" />
            <div className="flex flex-col items-center justify-center">
                <h3 className="text-lg font-medium">
                    {searchQuery ? t("files.noResultsFound", "No files found") : t("files.noFilesTitle", "No files yet")}
                </h3>
                <p className="text-muted-foreground">
                    {searchQuery ? t("files.noResultsDescription", "No files match your search for '{{searchQuery}}'", { searchQuery }) : t("files.noFilesDescription", "Start by uploading your first file")}
                </p>
            </div>
            {emptyState}
        </div>
    );

    return (
        <div className="w-full overflow-x-auto">
        <TableProvider data={files} columns={columns} enableColumnResizing>
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
                            {defaultEmptyState}
                        </TableCellRaw>
                    </TableRowRaw>
                }
            >
                {({ row }) => {
                    const file = row.original as FileType;
                    const rowContent = (
                        <TableRowRaw
                            key={row.id}
                            className="hover:bg-muted/50"
                            data-state={row.getIsSelected() && "selected"}
                        >
                            {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id} cell={cell} />
                            ))}
                        </TableRowRaw>
                    );
                    return wrapRowWithContextMenu(file, rowContent);
                }}
            </TableBody>
        </TableProvider>
        </div>
    );
};

export const FilesTable = memo(FilesTableComponent);
export default FilesTable;
