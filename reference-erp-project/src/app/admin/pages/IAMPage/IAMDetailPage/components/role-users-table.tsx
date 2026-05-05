import { memo, useMemo, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Users } from "lucide-react";
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
import { OrgUser } from "@/types/general/user";
import Tag from "@/app/components/tag/tag";
import OrgUserLabel from "@/app/components/labels/org-user-label";
import EmailLabel from "@/app/components/labels/email-label";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

type RoleUsersTableColumnKey = "id" | "name" | "email" | "type" | "actions";

interface RoleUsersTableProps {
    data: OrgUser[];
    isLoading?: boolean;
    hiddenColumns?: RoleUsersTableColumnKey[];
    renderActions?: (user: OrgUser) => ReactNode;
    onRowClick?: (user: OrgUser) => void;
    clickableRows?: boolean;
    onEmptyStateAction?: () => void;
    searchQuery?: string;
}

const RoleUsersTableComponent = ({
    data,
    isLoading = false,
    hiddenColumns = [],
    renderActions,
    onRowClick,
    clickableRows = false,
    onEmptyStateAction,
    searchQuery = "",
}: RoleUsersTableProps) => {
    const { t } = useTranslation();
    const { wrapRowWithContextMenu } = useTableContextMenu<OrgUser>(renderActions);

    const columns = useMemo<ColumnDef<OrgUser>[]>(() => {
        const allColumns: ColumnDef<OrgUser>[] = [
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
                header: t("admin.iam.users.columns.name", "Name"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => <OrgUserLabel data={row.original} />,
            },
            {
                accessorKey: "email",
                header: t("admin.iam.users.columns.email", "Email"),
                enableResizing: true,
                size: 200,
                cell: ({ row }) => <EmailLabel data={row.original.email} variant="black" link />,
            },
            {
                accessorKey: "type",
                header: t("admin.iam.users.columns.type", "Type"),
                enableResizing: true,
                size: 150,
                cell: ({ row }) => {
                    const orgUser = row.original;
                    const types: string[] = [];
                    if (orgUser.employee) types.push(t("admin.iam.users.type.employee", "Employee"));
                    if (orgUser.client) types.push(t("admin.iam.users.type.client", "Client"));
                    if (orgUser.supplier) types.push(t("admin.iam.users.type.supplier", "Supplier"));
                    return (
                        <div className="flex gap-1">
                            {types.length > 0 ? (
                                types.map((type, index) => <Tag text={type} key={index} />)
                            ) : (
                                <span className="text-muted-foreground">-</span>
                            )}
                        </div>
                    );
                },
            },
        ];

        if (renderActions) {
            allColumns.push({
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
                cell: ({ row }) => renderActions(row.original),
                meta: { sticky: "right" },
            });
        }

        return allColumns.filter((col) => {
            const key = ("accessorKey" in col ? col.accessorKey : col.id) as RoleUsersTableColumnKey;
            return !hiddenColumns.includes(key);
        });
    }, [t, renderActions, hiddenColumns]);

    return (
        <TableProvider data={data} columns={columns} enableColumnResizing>
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
                                <Users className="h-10 w-10 text-muted-foreground" />
                                <div className="flex flex-col items-center justify-center">
                                    <h3 className="text-lg font-medium">
                                        {searchQuery
                                            ? t("admin.iam.users.noResultsFound", "No results found")
                                            : t("admin.iam.users.noUsers", "No users")}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {searchQuery
                                            ? t(
                                                "admin.iam.users.noResultsDescription",
                                                'No results found for "{{searchQuery}}"',
                                                { searchQuery }
                                              )
                                            : t(
                                                "admin.iam.users.noUsersDescription",
                                                "No users assigned to this role."
                                              )}
                                    </p>
                                </div>
                                {!searchQuery && onEmptyStateAction && (
                                    <Button variant="outline" onClick={onEmptyStateAction}>
                                        <Plus className="h-4 w-4" />
                                        {t("admin.iam.users.addUser", "Add user")}
                                    </Button>
                                )}
                            </div>
                        </TableCellRaw>
                    </TableRowRaw>
                }
            >
                {({ row }) => {
                    const user = row.original as OrgUser;
                    const rowContent = (
                        <TableRowRaw
                            key={row.id}
                            className={clickableRows ? "hover:bg-muted/50 cursor-pointer" : "hover:bg-muted/50"}
                            data-state={row.getIsSelected() && "selected"}
                            onClick={clickableRows && onRowClick ? () => onRowClick(user) : undefined}
                        >
                            {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id} cell={cell} />
                            ))}
                        </TableRowRaw>
                    );
                    return wrapRowWithContextMenu(user, rowContent);
                }}
            </TableBody>
        </TableProvider>
    );
};

export const RoleUsersTable = memo(RoleUsersTableComponent);
export default RoleUsersTable;
