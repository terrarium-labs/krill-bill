import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import PageHeader from "@/app/components/page-header";
import ApiKeyAddModal from "./components/api-key-add-modal";
import ApiKeyViewModal from "./components/api-key-view-modal";
import ApiKeysTable from "./components/api-keys-table";
import ApiKeyDeleteModal, { type ApiKey } from "./components/api-key-delete-modal";
import { getMeApiKeys, postMeApiKeys, deleteMeApiKey } from "@/api/me/api-keys/api-keys";
import { useApiKeysTablePreferences } from "@/hooks/use-api-keys-table-preferences";
import { ApiKeyColumnSelector } from "./components/api-key-column-selector";

const ApiKeysPage = () => {
    const { t } = useTranslation();

    const [isLoading, setIsLoading] = useState(true);
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isTokenOpen, setIsTokenOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newToken, setNewToken] = useState("");
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [apiKeyToDelete, setApiKeyToDelete] = useState<ApiKey | null>(null);
    const [deletingApiKey, setDeletingApiKey] = useState(false);

    const {
        columnVisibility,
        setColumnVisibility,
        columnOrder,
        setColumnOrder,
        columnSizing,
        setColumnSizing,
        resetPreferences,
    } = useApiKeysTablePreferences();

    const handleColumnVisibilityChange = useCallback(
        (id: string, visible: boolean) =>
            setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
        [setColumnVisibility],
    );
    const handleColumnOrderChange = useCallback(
        (order: string[]) => setColumnOrder(order),
        [setColumnOrder],
    );

    const fetchApiKeys = async () => {
        setIsLoading(true);
        try {
            const res = await getMeApiKeys();

            if (res.success) {
                if (res.success.api_keys) {
                    setApiKeys(res.success.api_keys);
                } else if (Array.isArray(res.success)) {
                    setApiKeys(res.success);
                } else {
                    console.error("Unexpected response structure:", res.success);
                    setApiKeys([]);
                }
            } else if (res.error) {
                console.error("API Error:", res.error);
                toast.error(t("apiKeys.loadError", "Error loading API keys"));
            }
        } catch (error) {
            console.error("Catch Error:", error);
            toast.error(t("apiKeys.loadError", "Error loading API keys"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchApiKeys();
    }, []);

    const handleCreateKey = async (name: string) => {
        setIsCreating(true);
        try {
            const response = await postMeApiKeys({ name });

            if (response.success) {
                if (response.success.api_key && response.success.api_key.key) {
                    setNewToken(response.success.api_key.key);
                } else if (response.success.key) {
                    setNewToken(response.success.key);
                } else if (response.success.api_key && response.success.api_key.token) {
                    setNewToken(response.success.api_key.token);
                } else {
                    console.error("Unexpected response structure:", response.success);
                    toast.error(t("apiKeys.createErrorUnexpected", "Error creating API key"));
                }

                setIsTokenOpen(true);
                setIsCreateOpen(false);
                fetchApiKeys();
                toast.success(t("apiKeys.createSuccess", "API key created successfully"));
            } else if (response.error) {
                console.error("API Error:", response.error);
                toast.error(t("apiKeys.createError", "Error creating API key"));
            }
        } catch (error) {
            console.error("Catch Error:", error);
            toast.error(t("apiKeys.createError", "Error creating API key"));
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteConfirm = (apiKey: ApiKey) => {
        setApiKeyToDelete(apiKey);
        setDeleteModalOpen(true);
    };

    const handleDeleteKey = async () => {
        if (!apiKeyToDelete) return;

        setDeletingApiKey(true);
        try {
            const response = await deleteMeApiKey(apiKeyToDelete.id);

            if (response.success) {
                toast.success(t("apiKeys.deleteSuccess", "API key deleted successfully"));
                setApiKeys((prev) => prev.filter((key) => key.id !== apiKeyToDelete.id));
            } else if (response.error) {
                console.error("API Error:", response.error);
                toast.error(t("apiKeys.deleteError", "Error deleting API key"));
            }
        } catch (error) {
            console.error("Catch Error:", error);
            toast.error(t("apiKeys.deleteError", "Error deleting API key"));
        } finally {
            setDeletingApiKey(false);
            setDeleteModalOpen(false);
            setApiKeyToDelete(null);
        }
    };

    return (
        <>
            <PageHeader
                title={t("apiKeys.title", "API Keys")}
                description={t("apiKeys.description", "Manage your API keys")}
                docs={{ slug: "pd_mod_api_keys" }}
                action={
                    <ApiKeyAddModal
                        open={isCreateOpen}
                        onOpenChange={setIsCreateOpen}
                        onCreateKey={handleCreateKey}
                        isCreating={isCreating}
                    />
                }
            />

            <div className="flex justify-end">
                <ApiKeyColumnSelector
                    columnVisibility={columnVisibility}
                    columnOrder={columnOrder}
                    onColumnVisibilityChange={handleColumnVisibilityChange}
                    onColumnOrderChange={handleColumnOrderChange}
                    onReset={resetPreferences}
                />
            </div>

            <ApiKeysTable
                apiKeys={apiKeys}
                isLoading={isLoading}
                onDelete={handleDeleteConfirm}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
                columnOrder={columnOrder}
                onColumnOrderChange={setColumnOrder}
                columnSizing={columnSizing}
                onColumnSizingChange={setColumnSizing}
                emptyStateAction={
                    <ApiKeyAddModal
                        open={isCreateOpen}
                        onOpenChange={setIsCreateOpen}
                        onCreateKey={handleCreateKey}
                        isCreating={isCreating}
                    />
                }
            />

            <ApiKeyViewModal
                open={isTokenOpen}
                onOpenChange={setIsTokenOpen}
                token={newToken}
                onClose={() => setNewToken("")}
            />

            <ApiKeyDeleteModal
                open={deleteModalOpen}
                onOpenChange={(open) => {
                    setDeleteModalOpen(open);
                    if (!open) setApiKeyToDelete(null);
                }}
                apiKey={apiKeyToDelete}
                onConfirm={handleDeleteKey}
                isDeleting={deletingApiKey}
            />
        </>
    );
};

export default ApiKeysPage;
