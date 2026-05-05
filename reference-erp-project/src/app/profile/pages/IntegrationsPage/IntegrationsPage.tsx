import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { getMeIntegrations, postMeIntegrations, deleteMeIntegrations, postMeIntegrationDefault } from "@/api/me/integrations/integrations";
import PageHeader from "@/app/components/page-header";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { useIntegrations } from "./utils/integrations";
import { IntegrationType } from "@/types/miscelanea";
import { useParams } from "react-router";
import IntegrationsTable, { type ConnectedIntegration } from "./components/integrations-table";
import IntegrationDisconnectModal from "./components/integration-disconnect-modal";
import IntegrationAddModal from "./components/integration-add-modal";
import { useIntegrationsTablePreferences } from "@/hooks/use-integrations-table-preferences";
import { IntegrationColumnSelector } from "./components/integration-column-selector";

interface GoogleMetadata {
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

const IntegrationsPage = () => {
    const { t } = useTranslation();
    const integrationsList = useIntegrations();
    const { orgId } = useParams<{ orgId: string }>();

    const integrationInfo = integrationsList.reduce((acc, integration) => {
        acc[integration.id] = {
            name: integration.name,
            icon: integration.icon,
            iconBg: integration.iconBg,
        };
        return acc;
    }, {} as Record<IntegrationType, { name: string; icon: React.ReactNode; iconBg: string }>);

    const [integrations, setIntegrations] = useState<ConnectedIntegration[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
    const [integrationToDisconnect, setIntegrationToDisconnect] = useState<ConnectedIntegration | null>(null);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [defaultIntegrationId, setDefaultIntegrationId] = useState<string | null>(null);
    const [togglingDefaultId, setTogglingDefaultId] = useState<string | null>(null);

    const {
        columnVisibility,
        setColumnVisibility,
        columnOrder,
        setColumnOrder,
        columnSizing,
        setColumnSizing,
        resetPreferences,
    } = useIntegrationsTablePreferences();

    const handleColumnVisibilityChange = useCallback(
        (id: string, visible: boolean) =>
            setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
        [setColumnVisibility],
    );
    const handleColumnOrderChange = useCallback(
        (order: string[]) => setColumnOrder(order),
        [setColumnOrder],
    );

    const fetchIntegrations = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await getMeIntegrations();
            if (response.success) {
                const data = response.success;
                const items = data.integrations || [];
                const defaultId = data.default_integration_id ?? null;
                const mappedIntegrations: ConnectedIntegration[] = items.map(
                    (item: {
                        id: string;
                        type: IntegrationType;
                        email?: string;
                        created_at?: string;
                        connected_at?: string;
                        is_default?: boolean;
                        metadata?: GoogleMetadata | Record<string, unknown>;
                    }) => ({
                        id: item.id,
                        type: item.type,
                        connectedAt: item.created_at || item.connected_at || new Date().toISOString(),
                        isDefault: item.is_default ?? (defaultId !== null && item.id === defaultId),
                        metadata: item.metadata,
                    })
                );
                setIntegrations(mappedIntegrations);
                setDefaultIntegrationId(defaultId ?? (mappedIntegrations.find((i) => i.isDefault)?.id ?? null));
            } else if (response.error) {
                console.error("Error fetching integrations:", response.error);
            }
        } catch (error) {
            console.error("Error fetching integrations:", error);
            toast.error(t("integrations.fetchError", "Failed to load integrations"));
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchIntegrations();
    }, [fetchIntegrations]);

    const handleConnect = async (type: IntegrationType) => {
        setIsConnecting(true);
        try {
            const redirect_uri = window.location.origin + "/oauth/callback";

            const response = await postMeIntegrations({
                type,
                redirect_uri,
                org_id: orgId,
                is_default: false,
            });

            if (response.success) {
                const data = response.success;

                if (data.oauth_url || data.redirect_url || data.url) {
                    window.location.href = data.oauth_url || data.redirect_url || data.url;
                    return;
                }

                const newIntegration: ConnectedIntegration = {
                    id: data.id || `${type}_${Date.now()}`,
                    type,
                    connectedAt: data.created_at || data.connected_at || new Date().toISOString(),
                };

                setIntegrations((prev) => [...prev, newIntegration]);
                setIsModalOpen(false);
                toast.success(
                    t("integrations.connectSuccess", "{{name}} connected successfully", {
                        name: integrationInfo[type].name,
                    })
                );
            } else if (response.error) {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error("Error connecting integration:", error);
            toast.error(t("integrations.connectError", "Failed to connect integration"));
        } finally {
            setIsConnecting(false);
        }
    };

    const handleSetDefault = async (integration: ConnectedIntegration) => {
        setTogglingDefaultId(integration.id);
        try {
            const response = await postMeIntegrationDefault(integration.id);
            if (response.success) {
                setDefaultIntegrationId(integration.id);
                setIntegrations((prev) =>
                    prev.map((i) => ({ ...i, isDefault: i.id === integration.id }))
                );
                toast.success(
                    t("integrations.setDefaultSuccess", "{{name}} set as default", {
                        name: integrationInfo[integration.type].name,
                    })
                );
            } else if (response.error) {
                toast.error(t("integrations.setDefaultError", "Failed to set as default"));
            }
        } catch {
            toast.error(t("integrations.setDefaultError", "Failed to set as default"));
        } finally {
            setTogglingDefaultId(null);
        }
    };

    const handleDisconnectConfirm = (integration: ConnectedIntegration) => {
        setIntegrationToDisconnect(integration);
        setDisconnectModalOpen(true);
    };

    const handleDisconnect = async () => {
        if (!integrationToDisconnect) return;

        setIsDisconnecting(true);
        try {
            const response = await deleteMeIntegrations(integrationToDisconnect.id);

            if (response.success) {
                setIntegrations((prev) => prev.filter((i) => i.id !== integrationToDisconnect.id));
                if (defaultIntegrationId === integrationToDisconnect.id) {
                    setDefaultIntegrationId(null);
                }
                toast.success(
                    t("integrations.disconnectSuccess", "{{name}} disconnected successfully", {
                        name: integrationInfo[integrationToDisconnect.type].name,
                    })
                );
            } else if (response.error) {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error("Error disconnecting integration:", error);
            toast.error(t("integrations.disconnectError", "Failed to disconnect integration"));
        } finally {
            setIsDisconnecting(false);
            setDisconnectModalOpen(false);
            setIntegrationToDisconnect(null);
        }
    };

    return (
        <>
            <PageHeader
                title={t("integrations.title", "Integrations")}
                description={t("integrations.description", "Connect external services to enhance your workflow")}
                showBackButton={true}
                docs={{ slug: "pd_mod_integrations" }}
                action={
                    <IntegrationAddModal
                        open={isModalOpen}
                        onOpenChange={setIsModalOpen}
                        onConnect={handleConnect}
                        isConnecting={isConnecting}
                    />
                }
            />

            <div className="flex justify-end">
                <IntegrationColumnSelector
                    columnVisibility={columnVisibility}
                    columnOrder={columnOrder}
                    onColumnVisibilityChange={handleColumnVisibilityChange}
                    onColumnOrderChange={handleColumnOrderChange}
                    onReset={resetPreferences}
                />
            </div>

            <IntegrationsTable
                integrations={integrations}
                isLoading={isLoading}
                integrationInfo={integrationInfo}
                onDisconnect={handleDisconnectConfirm}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
                columnOrder={columnOrder}
                onColumnOrderChange={setColumnOrder}
                columnSizing={columnSizing}
                onColumnSizingChange={setColumnSizing}
                renderActions={(integration) => (
                    <CustomActionsDropdown
                        items={[
                            {
                                label: t("integrations.setAsDefault", "Set as default"),
                                icon: "star",
                                onClick: () => handleSetDefault(integration),
                            },
                            {
                                label: t("integrations.disconnect", "Disconnect"),
                                icon: "unlink",
                                onClick: () => handleDisconnectConfirm(integration),
                                variant: "destructive",
                            },
                        ]}
                    />
                )}
                defaultIntegrationId={defaultIntegrationId}
                togglingDefaultId={togglingDefaultId}
                onSetDefault={handleSetDefault}
                emptyStateAction={
                    <IntegrationAddModal
                        open={isModalOpen}
                        onOpenChange={setIsModalOpen}
                        onConnect={handleConnect}
                        isConnecting={isConnecting}
                        buttonVariant="outline"
                    />
                }
            />

            <IntegrationDisconnectModal
                open={disconnectModalOpen}
                onOpenChange={(open) => {
                    setDisconnectModalOpen(open);
                    if (!open) setIntegrationToDisconnect(null);
                }}
                integration={integrationToDisconnect}
                integrationInfo={integrationInfo}
                onConfirm={handleDisconnect}
                isDisconnecting={isDisconnecting}
            />
        </>
    );
};

export default IntegrationsPage;
