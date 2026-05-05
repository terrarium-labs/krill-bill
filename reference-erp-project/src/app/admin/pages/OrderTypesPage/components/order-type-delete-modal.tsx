import { useTranslation } from "@/hooks/useTranslation";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { OrderType } from "@/types/general/order-types";

interface OrderTypeDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orderType: OrderType | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const OrderTypeDeleteModal = ({
    open,
    onOpenChange,
    orderType,
    onConfirm,
    isDeleting,
}: OrderTypeDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t("admin.orderTypes.deleteType", "Delete Order Type")}
            description={
                <>
                    {t(
                        "admin.orderTypes.deleteConfirmation",
                        "Are you sure you want to delete this order type? This action cannot be undone."
                    )}
                    {orderType && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            <strong>{orderType.name}</strong>
                            {orderType.description && (
                                <p className="text-sm text-muted-foreground">
                                    {orderType.description}
                                </p>
                            )}
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default OrderTypeDeleteModal;
