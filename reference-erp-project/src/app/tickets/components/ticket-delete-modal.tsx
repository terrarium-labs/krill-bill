import { useTranslation } from "react-i18next";
import { Ticket } from "@/types/field-service/tickets/tickets";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import LocationLabel from "@/app/components/labels/location-label";
import ClientLabel from "@/app/components/labels/client-label";
import PriorityLabel from "@/app/components/labels/priority-label";
import Tag from "@/app/components/tag/tag";
import { formatDate } from "@/utils/miscelanea";

interface TicketDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticket: Ticket | null;
    onConfirm: () => Promise<void>;
    isDeleting: boolean;
}

export const TicketDeleteModal = ({
    isOpen,
    onClose,
    ticket,
    onConfirm,
    isDeleting,
}: TicketDeleteModalProps) => {
    const { t } = useTranslation();

    if (!ticket) return null;

    return (
        <DeleteModal
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            title={t("tickets.deleteTicket", "Delete Ticket")}
            description={t(
                "tickets.deleteTicketDescription",
                "Are you sure you want to delete this ticket? This action cannot be undone."
            )}
            onConfirm={onConfirm}
            isDeleting={isDeleting}
            contentClassName="max-w-md"
        >
            <div className="space-y-2 p-3 rounded-md bg-muted/50 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">
                        {t("common.id", "ID")}:
                    </span>
                    <span className="font-medium">{ticket.id}</span>
                </div>
                {ticket.client && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">
                            {t("tickets.client", "Client")}:
                        </span>
                        <span className="font-medium">
                            <ClientLabel data={ticket.client} />
                        </span>
                    </div>
                )}
                {ticket.location && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">
                            {t("tickets.location", "Location")}:
                        </span>
                        <span className="font-medium">
                            <LocationLabel data={ticket.location} />
                        </span>
                    </div>
                )}
                <div className="flex justify-between">
                    <span className="text-muted-foreground">
                        {t("tickets.priority.title", "Priority")}:
                    </span>
                    <span className="font-medium capitalize">
                        <PriorityLabel
                            data={ticket.priority}
                            variant="steps"
                        />
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">
                        {t("tickets.status.title", "Status")}:
                    </span>
                    <span className="font-medium capitalize">
                        <Tag text={ticket.status} className="capitalize" />
                    </span>
                </div>
                {ticket.created_at && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">
                            {t("tickets.createdAt", "Created At")}:
                        </span>
                        <span className="font-medium">
                            {formatDate(ticket.created_at)}
                        </span>
                    </div>
                )}
            </div>
        </DeleteModal>
    );
};

export default TicketDeleteModal;
