import { useTranslation } from "react-i18next";
import DeleteModal from "@/app/components/modals/delete-modal";

export interface ApiKey {
    id: string;
    name: string;
    key?: string;
    display_key?: string;
    created_at: string;
    last_used?: string | null;
}

interface ApiKeyDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    apiKey: ApiKey | null;
    onConfirm: () => Promise<void>;
    isDeleting: boolean;
}

const ApiKeyDeleteModal = ({
    open,
    onOpenChange,
    apiKey,
    onConfirm,
    isDeleting,
}: ApiKeyDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t("apiKeys.deleteKey", "Delete API Key")}
            description={t(
                "apiKeys.deleteKeyConfirmation",
                "Are you sure you want to delete this API key? This action cannot be undone."
            )}
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        >
            {apiKey && (
                <div className="mt-3 p-3 bg-muted rounded-lg">
                    <strong>{apiKey.name}</strong>
                </div>
            )}
        </DeleteModal>
    );
};

export default ApiKeyDeleteModal;
