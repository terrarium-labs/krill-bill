import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { Client } from "@/types/clients/client";

interface ClientDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    client: Client | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const ClientDeleteModal = ({
    open,
    onOpenChange,
    client,
    onConfirm,
    isDeleting,
}: ClientDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t("clients.deleteClient", "Delete Client")}
            description={
                <>
                    {t(
                        "clients.deleteClientConfirmation",
                        "Are you sure you want to delete this client? This action cannot be undone."
                    )}
                    {client && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            <strong>{client.trade_name}</strong>
                            {client.client_name && ` (${client.client_name})`}
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default ClientDeleteModal;
