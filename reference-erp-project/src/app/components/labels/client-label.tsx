import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ClientAvatar } from "@/app/components/avatars/client-avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BasicClient, Client } from "@/types/clients/client";

interface ClientLabelProps {
    data: BasicClient | Client | (BasicClient | Client)[] | null | undefined;
    className?: string;
    link?: boolean | string;
    variant?: "default" | "icon";
    options?: {
        showNameExtra?: boolean;
        showEmail?: boolean;
        showLocation?: boolean;
        textClassName?: string;
    };
}

/**
 * ClientLabel component - Displays one or multiple clients with their avatars
 * 
 * @param data - Can be a single Client, an array of Clients, null, or undefined
 * @param className - Optional custom class name to pass to ClientAvatar (only affects single client display)
 * @param link - If true, navigates to client detail page. If string, appends it as sub-route (e.g., "orders")
 * @param variant - "default" shows name for single client, "icon" always shows overlapping avatar style
 * @param options - Optional options to pass to ClientAvatar
 * 
 * Behavior:
 * - If null/undefined/empty array: displays "-"
 * - If variant="default":
 *   - Single client: displays the client with name
 *   - Multiple clients: displays up to 3 avatars (overlapping) and a "+N" badge for the rest
 * - If variant="icon": always displays in overlapping avatar style (without name)
 */
const ClientLabel: React.FC<ClientLabelProps> = ({ data, className, link = false, variant = "default", options }) => {
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();

    const handleClick = (clientId: string) => {
        if (link && orgId) {
            const basePath = `/${orgId}/clients/${clientId}`;
            const subRoute = typeof link === 'string' ? `/${link}` : '';
            navigate(`${basePath}${subRoute}`);
        }
    };

    // Handle null, undefined, or empty cases
    if (!data || (Array.isArray(data) && data.length === 0)) {
        return <span className="text-muted-foreground">-</span>;
    }

    // Normalize data to array for icon variant
    const clients = Array.isArray(data) ? data : [data];

    // Handle single client (not in array) - only for default variant
    if (variant === "default" && !Array.isArray(data)) {
        return (
            <div
                className={`flex items-center gap-1 ${link ? 'cursor-pointer hover:bg-primary/10 -mx-2 -my-1 px-2 py-1 rounded transition-all group hover:opacity-80' : ''}`}
                onClick={link ? () => handleClick(data.id) : undefined}
            >
                <ClientAvatar
                    client={data}
                    showName={true}
                    showNameExtra={options?.showNameExtra ?? false}
                    showEmail={options?.showEmail ?? false}
                    showLocation={options?.showLocation ?? false}
                    className={className}
                    textClassName={options?.textClassName ?? ""}
                />
            </div>
        );
    }

    // Handle array with single client - only for default variant
    if (variant === "default" && clients.length === 1) {
        return (
            <div
                className={`flex items-center gap-1 ${link ? 'cursor-pointer hover:bg-primary/10 -mx-2 -my-1 px-2 py-1 rounded transition-all group hover:opacity-80' : ''}`}
                onClick={link ? () => handleClick(clients[0].id) : undefined}
            >
                <ClientAvatar
                    client={clients[0]}
                    showName={true}
                    showNameExtra={options?.showNameExtra ?? false}
                    showEmail={options?.showEmail ?? false}
                    showLocation={options?.showLocation ?? false}
                    className={className}
                    textClassName={options?.textClassName ?? ""}
                />
            </div>
        );
    }

    // Handle multiple clients (or icon variant)
    const visibleClients = clients.slice(0, 3);
    const remainingClients = clients.slice(3);
    const remainingNames = remainingClients.map(client => {
        return client.trade_name || client.client_name || client.email || 'Unknown';
    }).join(', ');

    return (
        <div className="flex items-center gap-1">
            {visibleClients.map((client, index) => (
                <div
                    key={client.id}
                    style={{ marginLeft: index > 0 ? "-8px" : "0" }}
                >
                    <ClientAvatar
                        client={client}
                        showName={false}
                        textClassName={options?.textClassName ?? ""}
                    />
                </div>
            ))}
            {clients.length > 3 && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium ml-[-8px] cursor-pointer hover:opacity-80">
                                +{clients.length - 3}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <div className="max-w-xs">
                                {remainingNames}
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
    );
};

export default ClientLabel;
