import { useTranslation } from "@/hooks/useTranslation";
import { Ticket } from "@/types/field-service/tickets/tickets";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import PriorityLabel from "@/app/components/labels/priority-label";
import Tag from "@/app/components/tag/tag";
import ClientLabel from "@/app/components/labels/client-label";
import IdBadge from "@/app/components/id-badge";

export interface TicketDeleteModalProps {
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
                "tickets.deleteTicketConfirmation",
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
                    <span className="font-medium font-mono">
                        <IdBadge id={ticket.id} />
                    </span>
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
                {(ticket.contact_first_name || ticket.contact_last_name) && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">
                            {t("tickets.contactName", "Contact")}:
                        </span>
                        <span className="font-medium">
                            {`${ticket.contact_first_name || ""} ${ticket.contact_last_name || ""}`.trim()}
                        </span>
                    </div>
                )}
                {ticket.priority && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">
                            {t("tickets.priority.title", "Priority")}:
                        </span>
                        <span className="font-medium capitalize">
                            <PriorityLabel data={ticket.priority} />
                        </span>
                    </div>
                )}
                {ticket.status && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">
                            {t("tickets.status.title", "Status")}:
                        </span>
                        <span className="font-medium capitalize">
                            <Tag
                                text={ticket.status}
                                className="capitalize"
                            />
                        </span>
                    </div>
                )}
            </div>
        </DeleteModal>
    );
};

export default TicketDeleteModal;
