import { memo, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { Users } from "lucide-react";
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import IdBadge from "@/app/components/id-badge";
import { OrgUser } from "@/types/general/user";
import { getColorFromString } from "@/utils/miscelanea";
import Tag from "@/app/components/tag/tag";
import OrgUserLabel from "@/app/components/labels/org-user-label";
import EmailLabel from "@/app/components/labels/email-label";
import PhoneLabel from "@/app/components/labels/phone-label";
import { useTableContextMenu } from "@/hooks/use-table-context-menu";

export type UsersTableColumnKey =
    | "id"
    | "name"
    | "email"
    | "phone"
    | "type"
    | "assigned_to"
    | "actions";

interface UsersTableProps {
    data: OrgUser[];
    isLoading?: boolean;
    searchQuery?: string;
    hiddenColumns?: UsersTableColumnKey[] | UsersTableColumnKey;
    renderActions?: (user: OrgUser) => ReactNode;
    onAssignClick?: (user: OrgUser) => void;
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const UsersTableComponent = ({
    data,
    isLoading = false,
    searchQuery = "",
    hiddenColumns,
    renderActions,
    onAssignClick,
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: UsersTableProps) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();
    const { wrapRowWithContextMenu } = useTableContextMenu<OrgUser>(renderActions);

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

    const getEntityType = (orgUser: OrgUser) => {
        if (orgUser.employee?.id) return <Tag text="Employee" color="blue" />;
        if (orgUser.client?.id) return <Tag text="Client" color="green" />;
        if (orgUser.supplier?.id) return <Tag text="Supplier" color="orange" />;
        return <span className="text-muted-foreground">-</span>;
    };

    const getAssignedEntity = (orgUser: OrgUser) => {
        const entity = orgUser.employee || orgUser.client || orgUser.supplier;
        if (!entity) return null;

        const isEmployee = !!orgUser.employee;
        const avatarClassName = isEmployee ? "h-6 w-6 rounded-full" : "h-6 w-6 rounded";
        const entityWithName = entity as { name?: string; photo_url?: string | null; email?: string };
        const fullName = `${entityWithName.name || ""}`.trim();
        const displayName = fullName || entityWithName.email || "-";
        const avatarFallback = fullName?.charAt(0) || entityWithName.email?.charAt(0) || "-";

        const handleViewEntity = () => {
            if (!orgId) return;
            if (orgUser.employee?.id) navigate(`/${orgId}/employees/${orgUser.employee.id}`);
            else if (orgUser.client?.id) navigate(`/${orgId}/clients/${orgUser.client.id}`);
            else if (orgUser.supplier?.id) navigate(`/${orgId}/suppliers/${orgUser.supplier.id}`);
        };

        return (
            <div className="flex items-center gap-2 group cursor-pointer" onClick={handleViewEntity}>
                <Avatar className={avatarClassName}>
                    <AvatarImage src={entityWithName.photo_url || ""} alt={displayName} className="object-cover" />
                    <AvatarFallback
                        className={`text-sm font-medium ${avatarClassName} text-white`}
                        style={{ backgroundColor: getColorFromString(displayName) }}
                    >
                        {avatarFallback}
                    </AvatarFallback>
                </Avatar>
                <span className="text-sm group-hover:underline">{displayName}</span>
            </div>
        );
    };

    const columns = useMemo<ColumnDef<OrgUser>[]>(
        () => [
            {
                id: "id",
                accessorKey: "id",
                header: t("common.id", "ID"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <IdBadge id={row.original.id} hideIcon customTooltip={t("common.copyId", "Copy ID")} />
                ),
            },
            {
                id: "name",
                header: t("admin.users.users.name", "Name"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => <OrgUserLabel data={row.original} />,
            },
            {
                id: "email",
                header: t("admin.users.users.email", "Email"),
                enableResizing: true,
                size: 200,
                cell: ({ row }) => <EmailLabel data={row.original.email} variant="black" link />,
            },
            {
                id: "phone",
                header: t("admin.users.users.phone", "Phone"),
                enableResizing: true,
                size: 150,
                cell: ({ row }) => <PhoneLabel data={row.original.phone} variant="black" link />,
            },
            {
                id: "type",
                header: t("admin.users.users.type", "Type"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => (
                    <div className="flex justify-start">{getEntityType(row.original)}</div>
                ),
            },
            {
                id: "assigned_to",
                header: t("admin.users.users.assignedTo", "Assigned To"),
                enableResizing: true,
                size: 200,
                cell: ({ row }) => {
                    const orgUser = row.original;
                    const assignedEntity = getAssignedEntity(orgUser);
                    return (
                        <div className="flex justify-start">
                            {assignedEntity ? (
                                assignedEntity
                            ) : (
                                <p
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onAssignClick?.(orgUser);
                                    }}
                                    className="hover:underline text-sm cursor-pointer flex items-center gap-0 text-blue-500 truncate"
                                >
                                    {t("admin.users.users.assign", "Assign")}
                                </p>
                            )}
                        </div>
                    );
                },
            },
            {
                id: "actions",
                enableResizing: false,
                size: 52,
                header: ({ header }) => (
                    <TableColumnHeader column={header.column} className="justify-center items-center flex" title="" />
                ),
                cell: ({ row }) => (
                    <div className="flex justify-center items-center" onClick={(e) => e.stopPropagation()}>
                        {renderActions ? renderActions(row.original) : null}
                    </div>
                ),
                meta: { sticky: "right" },
            },
        ],
        [t, renderActions, onAssignClick, navigate, orgId],
    );

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
                            <TableCellRaw className="h-96 text-center hover:bg-transparent" colSpan={columns.length}>
                                <div className="flex items-center justify-center space-y-4 flex-col">
                                    <Users className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">
                                            {searchQuery
                                                ? t("admin.users.users.noResultsFound", "No users found")
                                                : t("admin.users.users.noUsersTitle", "No users yet")}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {searchQuery
                                                ? t("admin.users.users.noResultsDescription", "No users match your search for '{{searchQuery}}'", { searchQuery })
                                                : t("admin.users.users.noUsersDescription", "No users have been added to this organization yet")}
                                        </p>
                                    </div>
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const user = row.original;
                        return wrapRowWithContextMenu(
                            user,
                            <TableRowRaw
                                key={row.id}
                                className="hover:bg-muted/50"
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

export const UsersTable = memo(UsersTableComponent);
export default UsersTable;
