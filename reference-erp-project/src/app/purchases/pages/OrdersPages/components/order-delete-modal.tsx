import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";

interface OrderDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isLoading?: boolean;
}

export const OrderDeleteModal = ({
    open,
    onOpenChange,
    onConfirm,
    isLoading = false,
}: OrderDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t("orders.deleteOrderTitle", "Delete Order")}
            description={t(
                "orders.deleteOrderDescription",
                "Are you sure you want to delete this draft order? This action cannot be undone."
            )}
            cancelText={t("common.goBack", "Go Back")}
            onConfirm={onConfirm}
            isDeleting={isLoading}
        />
    );
};
