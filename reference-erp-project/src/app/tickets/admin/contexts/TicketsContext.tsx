import { createContext, useContext, useEffect, useState } from "react";
import { getOrgTicket } from "@/api/field-service/tickets/tickets";
import { useParams } from "react-router";
import { Loader2 } from "lucide-react";
import { Ticket } from "@/types/field-service/tickets/tickets";

interface TicketsContextType {
    ticket: Ticket;
    refreshTicket: () => void;
}

const TicketsContext = createContext<TicketsContextType | undefined>(undefined);

export const TicketsProvider = ({ children }: { children: React.ReactNode }) => {
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { ticketId, orgId } = useParams<{ ticketId: string, orgId: string }>();

    const fetchTicket = async (ticketId: string) => {
        if (!orgId) return;
        try {
            setIsLoading(true);
            const response = await getOrgTicket(orgId, ticketId);
            if (response.success) {
                setTicket(response.success.ticket);
            }
        } catch (error) {
            console.error("Error fetching ticket:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (orgId && ticketId) {
            fetchTicket(ticketId);
        }
    }, [orgId, ticketId]);

    if (isLoading || !ticket) {
        return <div className="flex justify-center items-center h-full">
            <Loader2 className="animate-spin w-8 h-8" />
        </div>;
    }

    const refreshTicket = () => {
        if (orgId && ticketId) {
            fetchTicket(ticketId);
        }
    };

    return (
        <TicketsContext.Provider
            value={{
                ticket,
                refreshTicket,
            }}
        >
            {children}
        </TicketsContext.Provider>
    );
};

export const useTicket = () => {
    const context = useContext(TicketsContext);
    if (context === undefined) {
        throw new Error("useTicket must be used within an TicketsContext");
    }
    return context;
};

