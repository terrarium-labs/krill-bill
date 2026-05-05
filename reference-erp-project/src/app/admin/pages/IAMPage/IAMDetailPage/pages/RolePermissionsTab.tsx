import { Button } from "@/components/ui/button";
import {
    Plus,
    Loader2,
    Shield,
    Users,
    Building2,
    Package,
    TrendingUp,
    Clock,
    FileText,
    MessageSquare,
    Settings,
    Calendar,
    Briefcase,
    Truck,
    MapPin,
    Layers,
    Database,
    Key,
    UserCog,
    ChartBar,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import SearchBar from "@/app/components/search-bar";
import { useRole } from "../../context/RoleContext";
import { useState, useMemo } from "react";
import { Permission } from "@/types/general/roles";
import { Switch } from "@/components/ui/switch";
import Tag from "@/app/components/tag/tag";
import { postOrgRolePermissionsAllowed } from "@/api/orgs/roles/permissions/permissions";
import { useParams } from "react-router";
import { toast } from "sonner";
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
import IdBadge from "@/app/components/id-badge";

// Row type that can be either a service separator or a permission
type TableRow =
    | { type: 'service'; service_name: string; count: number }
    | { type: 'permission'; permission: Permission; service_name: string };

const RolePermissionsTab = () => {
    const { t } = useTranslation();
    const { role, setRole } = useRole();
    const { orgId, roleId } = useParams();
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    if (!role) return null;

    // Get service icon
    const getServiceIcon = (serviceName: string) => {
        const name = serviceName.toLowerCase();
        if (name.includes('employee') || name.includes('user')) return Users;
        if (name.includes('client')) return Briefcase;
        if (name.includes('org') || name.includes('organization')) return Building2;
        if (name.includes('item') || name.includes('product') || name.includes('stock')) return Package;
        if (name.includes('supplier')) return Truck;
        if (name.includes('absence') || name.includes('leave')) return Calendar;
        if (name.includes('time') || name.includes('timesheet')) return Clock;
        if (name.includes('rate') || name.includes('price') || name.includes('payment')) return TrendingUp;
        if (name.includes('chat') || name.includes('message')) return MessageSquare;
        if (name.includes('news') || name.includes('article')) return FileText;
        if (name.includes('location') || name.includes('workplace')) return MapPin;
        if (name.includes('role') || name.includes('permission') || name.includes('iam')) return UserCog;
        if (name.includes('field') || name.includes('section')) return Layers;
        if (name.includes('api') || name.includes('key')) return Key;
        if (name.includes('report') || name.includes('analytics')) return ChartBar;
        if (name.includes('setting') || name.includes('config')) return Settings;
        if (name.includes('file') || name.includes('document')) return FileText;
        if (name.includes('data') || name.includes('database')) return Database;
        return Shield;
    };

    // Filter permissions based on search query
    const filteredServices = useMemo(() => {
        if (!searchQuery) return role.permissions;

        const query = searchQuery.toLowerCase();
        return role.permissions
            .map(service => ({
                ...service,
                permissions: service.permissions.filter(permission =>
                    permission.name.toLowerCase().includes(query) ||
                    permission.description.toLowerCase().includes(query) ||
                    permission.endpoint_path.toLowerCase().includes(query) ||
                    service.service_name.toLowerCase().includes(query)
                )
            }))
            .filter(service => service.permissions.length > 0);
    }, [role.permissions, searchQuery]);

    // Flatten data with service separators
    const tableData = useMemo(() => {
        const rows: TableRow[] = [];
        filteredServices.forEach(service => {
            // Add service separator row
            rows.push({
                type: 'service',
                service_name: service.service_name,
                count: service.permissions.length
            });
            // Add permission rows
            service.permissions.forEach(permission => {
                rows.push({
                    type: 'permission',
                    permission,
                    service_name: service.service_name
                });
            });
        });
        return rows;
    }, [filteredServices]);

    // Handle search
    const handleSearch = async (query: string) => {
        setIsSearching(true);
        setSearchQuery(query);
        // Simulate search delay
        setTimeout(() => setIsSearching(false), 300);
    };

    // Handle permission toggle
    const handlePermissionToggle = async (permission: Permission, newValue: boolean) => {
        if (!orgId || !roleId) return;

        // Store previous state for rollback
        const previousRole = role;

        // Update state optimistically (immediately)
        const updatedPermissions = role.permissions.map(service => ({
            ...service,
            permissions: service.permissions.map(p =>
                p.id === permission.id ? { ...p, is_allowed: newValue } : p
            )
        }));

        // Calculate new num_permissions count
        const numPermissions = updatedPermissions
            .flatMap(service => service.permissions)
            .filter(p => p.is_allowed)
            .length;

        setRole({
            ...role,
            permissions: updatedPermissions,
            num_permissions: numPermissions
        });

        try {
            // Get all currently allowed permission IDs
            const currentAllowedIds = role.permissions
                .flatMap(service => service.permissions)
                .filter(p => p.is_allowed)
                .map(p => p.id);

            // Create new list with the toggled permission
            let newAllowedIds: string[];
            if (newValue) {
                // Add permission
                newAllowedIds = [...currentAllowedIds, permission.id];
            } else {
                // Remove permission
                newAllowedIds = currentAllowedIds.filter(id => id !== permission.id);
            }

            // Update permissions
            const response = await postOrgRolePermissionsAllowed(orgId, roleId, {
                permissions_ids: newAllowedIds
            });

            if (response.success) {
                toast.success(
                    newValue
                        ? t("admin.iam.permissions.permissionEnabled", "Permission enabled successfully")
                        : t("admin.iam.permissions.permissionDisabled", "Permission disabled successfully")
                );
            } else {
                // Revert on failure
                setRole(previousRole);
                toast.error(
                    response.error || t("admin.iam.permissions.errorUpdatingPermission", "Failed to update permission")
                );
            }
        } catch (error) {
            // Revert on error
            setRole(previousRole);
            console.error("Error updating permission:", error);
            toast.error(t("admin.iam.permissions.errorUpdatingPermission", "Failed to update permission"));
        }
    };

    // Handle bulk service toggle
    const handleServiceToggle = async (serviceName: string, newValue: boolean) => {
        if (!orgId || !roleId) return;

        // Find the service
        const service = role.permissions.find(s => s.service_name === serviceName);
        if (!service) return;

        // Store previous state for rollback
        const previousRole = role;

        // Update state optimistically (immediately)
        const updatedPermissions = role.permissions.map(s =>
            s.service_name === serviceName
                ? {
                    ...s,
                    permissions: s.permissions.map(p => ({ ...p, is_allowed: newValue }))
                }
                : s
        );

        // Calculate new num_permissions count
        const numPermissions = updatedPermissions
            .flatMap(s => s.permissions)
            .filter(p => p.is_allowed)
            .length;

        setRole({
            ...role,
            permissions: updatedPermissions,
            num_permissions: numPermissions
        });

        try {
            // Get all currently allowed permission IDs
            const currentAllowedIds = role.permissions
                .flatMap(s => s.permissions)
                .filter(p => p.is_allowed)
                .map(p => p.id);

            // Get all permission IDs from this service
            const servicePermissionIds = service.permissions.map(p => p.id);

            // Create new list with all service permissions toggled
            let newAllowedIds: string[];
            if (newValue) {
                // Add all service permissions
                newAllowedIds = [...new Set([...currentAllowedIds, ...servicePermissionIds])];
            } else {
                // Remove all service permissions
                newAllowedIds = currentAllowedIds.filter(id => !servicePermissionIds.includes(id));
            }

            // Update permissions
            const response = await postOrgRolePermissionsAllowed(orgId, roleId, {
                permissions_ids: newAllowedIds
            });

            if (response.success) {
                toast.success(
                    newValue
                        ? t("admin.iam.permissions.serviceEnabled", `All permissions for ${serviceName} enabled`)
                        : t("admin.iam.permissions.serviceDisabled", `All permissions for ${serviceName} disabled`)
                );
            } else {
                // Revert on failure
                setRole(previousRole);
                toast.error(
                    response.error || t("admin.iam.permissions.errorUpdatingService", "Failed to update service permissions")
                );
            }
        } catch (error) {
            // Revert on error
            setRole(previousRole);
            console.error("Error updating service permissions:", error);
            toast.error(t("admin.iam.permissions.errorUpdatingService", "Failed to update service permissions"));
        }
    };

    // Table columns definition
    const columns: ColumnDef<TableRow>[] = [
        {
            accessorKey: "id",
            header: t("common.id", "ID"),
            cell: ({ row }) => {
                const data = row.original;
                if (data.type === 'service') return null;
                return (
                    <IdBadge id={data.permission.id} hideIcon={true} customTooltip={t("common.copyId", "Copy ID")} />
                );
            },
        },
        {
            accessorKey: "name",
            header: t("admin.iam.permissions.name", "Name"),
            cell: ({ row }) => {
                const data = row.original;
                if (data.type === 'service') return null;
                return <div className="font-medium text-sm">{data.permission.name}</div>;
            },
        },
        {
            accessorKey: "method",
            header: t("admin.iam.permissions.method", "Method"),
            cell: ({ row }) => {
                const data = row.original;
                if (data.type === 'service') return null;
                return (
                    <Tag
                        text={data.permission.endpoint_method}
                        className="uppercase"
                    />
                );
            },
        },
        {
            accessorKey: "endpoint",
            header: t("admin.iam.permissions.endpoint", "Endpoint"),
            cell: ({ row }) => {
                const data = row.original;
                if (data.type === 'service') return null;
                return <div className="font-mono text-xs">{data.permission.endpoint_path}</div>;
            },
        },
        {
            accessorKey: "custom",
            header: ({ header }) => (
                <TableColumnHeader
                    column={header.column}
                    className="justify-center items-center flex"
                    title={t("admin.iam.permissions.custom", "Custom")}
                />
            ),
            cell: ({ row }) => {
                const data = row.original;
                if (data.type === 'service') return null;
                return (
                    <div className="flex justify-center">
                        {data.permission.is_custom && (
                            <Tag text={t("admin.iam.permissions.custom", "Custom")} color="purple" />
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: "description",
            header: t("admin.iam.permissions.description", "Description"),
            cell: ({ row }) => {
                const data = row.original;
                if (data.type === 'service') return null;
                return <div className="text-sm text-muted-foreground">{data.permission.description}</div>;
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
            cell: ({ row }) => {
                const data = row.original;
                if (data.type === 'service') return null;
                const permission = data.permission;
                return (
                    <div className="flex items-center justify-center">
                        <Switch
                            checked={permission.is_allowed}
                            onCheckedChange={(checked) => handlePermissionToggle(permission, checked)}
                        />
                    </div>
                );
            },
            meta: {
                sticky: 'right',
            },
        },
    ];

    return (
        <div className="mt-4 space-y-6">
            <div className="flex gap-4 w-full">
                <SearchBar
                    className="w-full"
                    value={searchQuery}
                    isLoading={isSearching}
                    onChange={handleSearch}
                    onSearch={handleSearch}
                    placeholder={t("admin.iam.permissions.searchPlaceholder", "Search permissions...")}
                />
                <Button>
                    <Plus className="h-4 w-4" />
                    {t("admin.iam.permissions.addPermission", "Add Custom Permission")}
                </Button>
            </div>

            {/* Permissions Table */}
            <TableProvider data={tableData} columns={columns}>
                <TableHeader>
                    {({ headerGroup }) => (
                        <TableHeaderGroup key={headerGroup.id} headerGroup={headerGroup}>
                            {({ header }) => <TableHead key={header.id} header={header} />}
                        </TableHeaderGroup>
                    )}
                </TableHeader>
                <TableBody
                    isLoading={false}
                    loadingState={
                        <TableRowRaw className="hover:bg-transparent">
                            <TableCellRaw className="h-96 text-center hover:bg-transparent" colSpan={columns.length}>
                                <div className="flex items-center justify-center space-y-2 flex-col">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                    emptyState={
                        <TableRowRaw className="hover:bg-transparent">
                            <TableCellRaw className="h-96 text-center hover:bg-transparent" colSpan={columns.length}>
                                <div className="flex items-center justify-center space-y-4 flex-col">
                                    <Shield className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">
                                            {searchQuery
                                                ? t("admin.iam.permissions.noResultsFound", "No permissions found")
                                                : t("admin.iam.permissions.noPermissionsTitle", "No permissions yet")
                                            }
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {searchQuery
                                                ? t("admin.iam.permissions.noResultsDescription", "No permissions match your search for '{{searchQuery}}'", { searchQuery })
                                                : t("admin.iam.permissions.noPermissionsDescription", "Permissions will appear here")
                                            }
                                        </p>
                                    </div>
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => {
                        const data = row.original as TableRow;
                        const isServiceRow = data.type === 'service';

                        if (isServiceRow) {
                            // Get the service to check if all permissions are enabled
                            const service = role.permissions.find(s => s.service_name === data.service_name);
                            const allEnabled = service?.permissions.every(p => p.is_allowed) || false;
                            const ServiceIcon = getServiceIcon(data.service_name);

                            return (
                                <TableRowRaw
                                    key={row.id}
                                    className="bg-muted/50 hover:bg-muted/50"
                                >
                                    <TableCellRaw colSpan={columns.length - 1}>
                                        <div className="font-semibold text-sm flex items-center gap-2 py-2">
                                            <ServiceIcon className="h-4 w-4 shrink-0" />
                                            {data.service_name}
                                            <span className="text-xs text-muted-foreground font-normal">
                                                ({data.count} {t("admin.iam.permissions.permissions", "permissions")})
                                            </span>
                                        </div>
                                    </TableCellRaw>
                                    <TableCellRaw className="sticky right-0 bg-muted/50">
                                        <div className="flex items-center justify-center">
                                            <Switch
                                                checked={allEnabled}
                                                onCheckedChange={(checked) => handleServiceToggle(data.service_name, checked)}
                                            />
                                        </div>
                                    </TableCellRaw>
                                </TableRowRaw>
                            );
                        }

                        return (
                            <TableRowRaw
                                key={row.id}
                                className="hover:bg-muted/50"
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
        </div>
    );
};

export default RolePermissionsTab;