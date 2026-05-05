import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { TicketWorkOrderType } from "@/types/field-service/ticket-work-order-types";

interface TicketWorkOrderTypeDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ticketWorkOrderType: TicketWorkOrderType | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const TicketWorkOrderTypeDeleteModal = ({
    open,
    onOpenChange,
    ticketWorkOrderType,
    onConfirm,
    isDeleting,
}: TicketWorkOrderTypeDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t(
                "admin.ticketWorkOrderTypes.deleteConfirmTitle",
                "Delete Ticket Work Order Type"
            )}
            description={
                <>
                    {t(
                        "admin.ticketWorkOrderTypes.deleteConfirmDescription",
                        "Are you sure you want to delete this ticket work order type? This action cannot be undone."
                    )}
                    {ticketWorkOrderType && (
                        <div className="mt-4 p-3 bg-muted rounded-md">
                            <p className="font-semibold">
                                {ticketWorkOrderType.name}
                            </p>
                            {ticketWorkOrderType.description && (
                                <p className="text-sm text-muted-foreground">
                                    {ticketWorkOrderType.description}
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

export default TicketWorkOrderTypeDeleteModal;
