import { memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link2, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { getMeIntegrationStatus } from "@/api/me/integrations/integrations";
import Tag from "@/app/components/tag/tag";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { IntegrationType } from "@/types/miscelanea";

export interface GoogleMetadata {
    resourceName?: string;
    etag?: string;
    displayName?: string;
    givenName?: string;
    familyName?: string;
    emailAddresses?: Array<{ value: string; type: string | null }>;
    primaryEmail?: string;
    photos?: Array<{ url: string; default: boolean }>;
    photoUrl?: string;
}

export interface ConnectedIntegration {
    id: string;
    type: IntegrationType;
    connectedAt: string;
    isDefault?: boolean;
    metadata?: GoogleMetadata | Record<string, unknown>;
}

type IntegrationInfo = Record<IntegrationType, { name: string; icon: React.ReactNode; iconBg: string }>;
type TestStatus = "idle" | "loading" | "success" | "failed";

export type IntegrationsTableColumnKey =
    | "id"
    | "type"
    | "identity"
    | "connectedAt"
    | "status"
    | "default"
    | "actions";

const IdentityCell = ({ integration }: { integration: ConnectedIntegration }) => {
    const { t } = useTranslation();

    const renderGoogleIdentity = (metadata: GoogleMetadata) => {
        const primaryEmail = metadata.primaryEmail;
        const photoUrl = metadata.photoUrl;
        const displayName = metadata.displayName;
        const emailAddresses = metadata.emailAddresses || [];
        const secondaryEmails = emailAddresses
            .filter((email) => email.value !== primaryEmail)
            .map((email) => email.value);
        const initials = displayName
            ? displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
            : primaryEmail?.slice(0, 2).toUpperCase() || "?";

        return (
            <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                    {photoUrl ? <AvatarImage src={photoUrl} alt={displayName || primaryEmail || ""} /> : null}
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm truncate">{primaryEmail}</span>
                {secondaryEmails.length > 0 && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="cursor-pointer">
                                <Tag text={`+${secondaryEmails.length - 1}`} color="gray" className="text-xs font-normal" />
                            </span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="start" className="max-w-[300px]">
                            <div className="text-sm">
                                <p className="font-medium mb-1">{t("integrations.secondaryEmails", "Secondary emails")}</p>
                                <ul className="space-y-0.5 text-xs">
                                    {secondaryEmails.map((email) => (
                                        <li key={email} className="truncate">{email}</li>
                                    ))}
                                </ul>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
        );
    };

    switch (integration.type) {
        case "google_mail":
        case "google_calendar":
            if (integration.metadata && "primaryEmail" in integration.metadata) {
                return renderGoogleIdentity(integration.metadata as GoogleMetadata);
            }
            return <span className="text-muted-foreground text-sm">-</span>;
        default:
            return <span className="text-muted-foreground text-sm">-</span>;
    }
};

const TestButton = ({ integrationId }: { integrationId: string }) => {
    const { t } = useTranslation();
    const [status, setStatus] = useState<TestStatus>("idle");

    const handleTest = async () => {
        setStatus("loading");
        try {
            const response = await getMeIntegrationStatus(integrationId);
            setStatus(response.success ? "success" : "failed");
        } catch {
            setStatus("failed");
        }
    };

    if (status === "loading") {
        return (
            <Button variant="outline" size="sm" disabled className="h-6">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t("integrations.testing", "Testing...")}
            </Button>
        );
    }
    if (status === "success") return <Tag text={t("integrations.success", "Success")} color="green" icon="check" />;
    if (status === "failed") return <Tag text={t("integrations.failed", "Failed")} color="red" icon="x" />;
    return (
        <Button variant="outline" size="sm" onClick={handleTest} className="h-6">
            {t("integrations.test", "Test")}
        </Button>
    );
};

interface IntegrationsTableProps {
    integrations: ConnectedIntegration[];
    isLoading: boolean;
    integrationInfo: IntegrationInfo;
    onDisconnect: (integration: ConnectedIntegration) => void;
    renderActions?: (integration: ConnectedIntegration) => React.ReactNode;
    defaultIntegrationId?: string | null;
    togglingDefaultId?: string | null;
    onSetDefault?: (integration: ConnectedIntegration) => void;
    emptyStateAction?: React.ReactNode;
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    columnOrder?: ColumnOrderState;
    onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
    columnSizing?: ColumnSizingState;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
}

const IntegrationsTableComponent = ({
    integrations,
    isLoading,
    integrationInfo,
    onDisconnect,
    renderActions,
    defaultIntegrationId = null,
    togglingDefaultId = null,
    onSetDefault,
    emptyStateAction,
    columnVisibility,
    onColumnVisibilityChange,
    columnOrder,
    onColumnOrderChange,
    columnSizing,
    onColumnSizingChange,
}: IntegrationsTableProps) => {
    const { t } = useTranslation();

    const columns = useMemo<ColumnDef<ConnectedIntegration>[]>(() => [
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
            accessorKey: "type",
            header: t("integrations.service", "Service"),
            enableResizing: true,
            size: 180,
            cell: ({ row }) => {
                const integration = row.original;
                const info = integrationInfo[integration.type];
                return (
                    <div className="flex items-center gap-3">
                        <div className={`rounded-sm p-1 ${info.iconBg}`}>{info.icon}</div>
                        <span className="font-medium">{info.name}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: "identity",
            header: t("integrations.identity", "Identity"),
            enableResizing: true,
            size: 200,
            cell: ({ row }) => <IdentityCell integration={row.original} />,
        },
        {
            accessorKey: "connectedAt",
            header: t("integrations.connectedOn", "Connected"),
            enableResizing: true,
            size: 120,
            cell: ({ row }) => (
                <div className="text-sm">{formatDate(row.getValue("connectedAt") as string)}</div>
            ),
        },
        {
            accessorKey: "status",
            header: t("integrations.status", "Status"),
            enableResizing: true,
            size: 120,
            cell: ({ row }) => <TestButton integrationId={row.original.id} />,
        },
        {
            id: "default",
            header: t("integrations.default", "Default"),
            enableResizing: true,
            size: 80,
            cell: ({ row }) => {
                const integration = row.original;
                const isDefault = integration.id === defaultIntegrationId || integration.isDefault;
                const isToggling = togglingDefaultId === integration.id;
                const canSetDefault = onSetDefault && !isToggling && !isDefault;
                const handleClick = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (canSetDefault) onSetDefault(integration);
                };
                return (
                    <div
                        className={`flex justify-start items-center ${canSetDefault ? "cursor-pointer" : ""}`}
                        onClick={handleClick}
                        role={canSetDefault ? "button" : undefined}
                        tabIndex={canSetDefault ? 0 : undefined}
                        onKeyDown={
                            canSetDefault
                                ? (e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                          e.preventDefault();
                                          onSetDefault(integration);
                                      }
                                  }
                                : undefined
                        }
                    >
                        <Switch checked={isDefault} disabled={true} className="pointer-events-none" />
                    </div>
                );
            },
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
                const integration = row.original;
                return (
                    <div className="flex justify-center items-center" onClick={(e) => e.stopPropagation()}>
                        {renderActions ? (
                            renderActions(integration)
                        ) : (
                            <CustomActionsDropdown
                                items={[
                                    {
                                        label: t("integrations.disconnect", "Disconnect"),
                                        icon: "unlink",
                                        onClick: () => onDisconnect(integration),
                                        variant: "destructive",
                                    },
                                ]}
                            />
                        )}
                    </div>
                );
            },
            meta: { sticky: "right" },
        },
    ], [t, integrationInfo, defaultIntegrationId, togglingDefaultId, onSetDefault, renderActions, onDisconnect]);

    return (
        <div className="w-full overflow-x-auto">
            <TableProvider
                data={integrations}
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
                                    <Link2 className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">
                                            {t("integrations.noIntegrations", "No integrations connected")}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {t("integrations.noIntegrationsDescription", "Connect your email and calendar services to sync your data")}
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

export const IntegrationsTable = memo(IntegrationsTableComponent);
export default IntegrationsTable;
