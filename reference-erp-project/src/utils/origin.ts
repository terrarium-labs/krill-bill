import { Origin } from "@/types/general/origin";
import { OriginType } from "@/types/general/origin";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router";

export const getOriginUrl = (origin: Origin, orgId: string): string | null => {
    switch (origin.type as OriginType) {
        // case "ticket":
        //     return `/${orgId}/tickets/${origin.id}`;
        case "order":
            return `/${orgId}/purchases/orders/${origin.id}`;
        case "work_order":
            return `/${orgId}/work-orders/${origin.id}`;
        case "location":
            return `/${orgId}/locations/${origin.id}`;
        // case "inventory":
        //     return `/${orgId}/inventory/${origin.id}`;
        default:
            toast.error("Unable to navigate to origin type: " + origin.type);
            return null;
    }
};

export const TypeToName = (type: OriginType): string => {
    switch (type) {
        case "ticket":
            return "Ticket";
        case "order":
            return "Order";
        case "work_order":
            return "Work Order";
        case "location":
            return "Location";
        default:
            return type.charAt(0).toUpperCase() + type.slice(1);
    }
};

export const useNavigateToOrigin = () => {
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();

    return (origin: Origin, openInNewTab: boolean = false) => {
        if (!orgId) {
            toast.error("Organization ID not found");
            return;
        }

        const url = getOriginUrl(origin, orgId);
        if (!url) return;

        if (openInNewTab) {
            window.open(url, "_blank");
        } else {
            navigate(url);
        }
    };
};

/**
 * Hook to handle origin clicks - opens ticket modal for ticket origins, navigates for others
 * @param openTicketModal - Function from useTicketModal() to open the ticket modal
 * @returns A function that handles origin clicks
 */
export const useHandleOriginClick = (openTicketModal: (ticketId: string) => void) => {
    const navigateToOrigin = useNavigateToOrigin();

    return (origin: Origin | null | undefined) => {
        if (!origin) return;

        // If it's a ticket origin, open the modal
        if (origin.type === "ticket") {
            openTicketModal(origin.id);
        } else {
            // Otherwise, use the normal navigation
            navigateToOrigin(origin);
        }
    };
};