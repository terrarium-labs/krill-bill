import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatDate } from "@/utils/miscelanea";
import { getOrgTicket, patchOrgTicket } from "@/api/field-service/tickets/tickets";
import ClientAvatar from "@/app/components/avatars/client-avatar";
import EmployeeAvatar from "@/app/components/avatars/employee-avatar";
import { Calendar, ClipboardPaste, X, Loader2, RefreshCw, Clock, ChevronLeft } from "lucide-react";
import { TicketDetailViewSkeleton } from "./ticket-detail-view-skeleton";
import IdBadge from "@/app/components/id-badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import PriorityLabel from "@/app/components/labels/priority-label";
import LocationLabel from "@/app/components/labels/location-label";
import EmployeeLabel from "@/app/components/labels/employee-label";
import { IconInfoItem } from "@/app/components/custom-labels";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from "@/components/ui/shadcn-io/tabs";
import ThreadSection from "@/app/components/thread-section";
import TicketInsightsCard from "@/app/tickets/components/ticket-insights-card";
import FilesSection from "@/app/components/files/files-section";
import EventsTimeline from "@/app/components/events-timeline";
import { useChatContext } from "@/app/chat/context/ChatContext";
import Tag from "@/app/components/tag/tag";
import { toast } from "sonner";
import { Ticket } from "@/types/field-service/tickets/tickets";

interface TicketDetailViewProps {
    ticketId: string;
    onCountdownEnd?: () => void;
    onEditClick?: () => void;
}

const TicketDetailView = ({
    ticketId,
    onCountdownEnd,
    onEditClick,
}: TicketDetailViewProps) => {
    const { t } = useTranslation();
    const { autoSendMessage } = useChatContext();

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [countdown, setCountdown] = useState<string>('5:00');
    const [ticketLoadedAt, setTicketLoadedAt] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<string>("description");
    const [isClosingOrReopening, setIsClosingOrReopening] = useState(false);
    const { orgId } = useParams<{ orgId: string }>();
    const countdownEndCalledRef = useRef<boolean>(false);

    const fetchTicket = async () => {
        if (!orgId || !ticketId) return;
        const response = await getOrgTicket(orgId, ticketId);
        if (response.success) {
            setTicket(response.success.ticket);
            setTicketLoadedAt(Date.now()); // Reset countdown timer
            countdownEndCalledRef.current = false; // Reset callback flag
        }
    };

    useEffect(() => {
        if (orgId && ticketId) {
            countdownEndCalledRef.current = false; // Reset on ticket change
            fetchTicket();
        }
    }, [orgId, ticketId]);

    // Dynamic countdown timer - starts from ticket load time
    useEffect(() => {
        if (!ticketLoadedAt) {
            setCountdown('5:00');
            return;
        }

        const updateCountdown = () => {
            const now = Date.now();
            const fiveMinutesInMs = 5 * 60 * 1000;
            const unlockTime = ticketLoadedAt + fiveMinutesInMs;
            const remainingMs = unlockTime - now;

            if (remainingMs <= 0) {
                setCountdown('0:00');
                // Call the callback to unselect the ticket (only once)
                if (onCountdownEnd && !countdownEndCalledRef.current) {
                    countdownEndCalledRef.current = true;
                    onCountdownEnd();
                }
                return;
            }

            const remainingSeconds = Math.floor(remainingMs / 1000);
            const minutes = Math.floor(remainingSeconds / 60);
            const seconds = remainingSeconds % 60;
            setCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        };

        // Update immediately
        updateCountdown();

        // Update every second
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [ticketLoadedAt]);

    if (!ticket) {
        return <TicketDetailViewSkeleton />;
    }

    if (ticket.locked_by?.employee) {
        return <div className="flex flex-col items-center gap-2 justify-center h-[calc(100vh-10rem)]">
            <div className="flex flex-col items-center gap-2">
                <EmployeeAvatar employee={ticket.locked_by?.employee} size="xl" showName={false} />
                <span className="text-sm text-muted-foreground max-w-64 text-center">
                    This ticket is locked by {ticket.locked_by?.employee.first_name} {ticket.locked_by?.employee.last_name} since {formatDate(ticket.locked_by?.locked_at, { showTime: true })}
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCountdownEnd}
                >
                    <ChevronLeft className="h-4 w-4" />
                    {t("common.goBack", "Go Back")}
                </Button>
            </div>
        </div>;
    }

    const contactName = ticket.contact_first_name || ticket.contact_last_name
        ? `${ticket.contact_first_name || ''} ${ticket.contact_last_name || ''}`.trim()
        : null;

    return (
        <Card className="shadow-none border-none py-1 px-2">
            <CardHeader className="space-y-3 px-0 pt-0">
                {/* Title with ID Badge and Actions */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <ClientAvatar client={ticket.client} showNameExtra={true} showEmail={true} size="xl" />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Countdown and Refresh */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                    {t("tickets.endsIn", "Unlock in")}:
                                </span>
                                <span className="text-sm font-semibold font-mono">
                                    {countdown}
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={fetchTicket}
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="h-4 w-px bg-border mr-2" />
                        <IdBadge id={ticket.id} />
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={isClosingOrReopening}
                            onClick={async () => {
                                if (!orgId || !ticket.id) return;
                                const newStatus = ticket.status === "closed" ? "in_progress" : "closed";
                                setIsClosingOrReopening(true);
                                try {
                                    const response = await patchOrgTicket(orgId, ticket.id, { status: newStatus });
                                    if (response.success) {
                                        await fetchTicket();
                                        toast.success(
                                            newStatus === "closed"
                                                ? t("tickets.ticketClosed", "Ticket closed")
                                                : t("tickets.ticketReopened", "Ticket re-opened")
                                        );
                                    } else {
                                        toast.error(t("tickets.errorUpdatingTicket", "Error updating ticket"));
                                    }
                                } catch {
                                    toast.error(t("tickets.errorUpdatingTicket", "Error updating ticket"));
                                } finally {
                                    setIsClosingOrReopening(false);
                                }
                            }}
                        >
                            {isClosingOrReopening ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : ticket.status === "closed" ? (
                                <RefreshCw className="h-4 w-4 mr-2" />
                            ) : (
                                <X className="h-4 w-4 mr-2" />
                            )}
                            {ticket.status === "closed"
                                ? t("tickets.reopenTicket", "Re-open ticket")
                                : t("tickets.closeTicket", "Close")}
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => { autoSendMessage("@Steve" + t("tickets.generateOrderMessage", " Generame una WorkOrder desde el ticket #") + ticket.id); }}
                        >
                            <ClipboardPaste className="h-4 w-4 mr-2" />
                            {t("tickets.generateOrder", "Generate Order")}
                        </Button>
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("tickets.actions.edit", "Edit"),
                                    icon: "edit",
                                    onClick: () => onEditClick?.(),
                                },
                            ]}
                        />
                    </div>
                </div>

                {/* Tags - Priority and Status */}
                <div className="flex flex-wrap gap-2">
                    {ticket.priority && (
                        <PriorityLabel data={ticket.priority} variant="steps" />
                    )}
                    {ticket.status && (
                        <Tag text={ticket.status.replace("_", " ")} className="capitalize" />
                    )}
                    {ticket.type && (
                        <Tag text={ticket.type.name} color={ticket.type.color || ""} />
                    )}
                </div>

                {/* Date Info */}
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground pb-4 border-b">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(ticket.created_at, { showTime: true })}</span>
                    {ticket.closed_at && (
                        <>
                            <span className="mx-2">•</span>
                            <span>{t("tickets.closedAt", "Closed")}: {formatDate(ticket.closed_at, { showTime: true })}</span>
                        </>
                    )}
                </div>
            </CardHeader>

            {/* Details Section */}
            <CardContent className="px-0 space-y-4">
                {/* AI Insights Card */}
                {ticket.ai_insights && <TicketInsightsCard data={ticket} />}

                {/* Contact & Client Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Contact Information */}
                    <div className="space-y-4">
                        <p className="text-xs text-muted-foreground font-semibold">
                            {t("tickets.contactInformation", "Contact Information")}
                        </p>
                        <div className="space-y-4">
                            <IconInfoItem
                                icon="user"
                                label={t("tickets.contactName", "Contact Name")}
                                value={contactName}
                            />
                            <IconInfoItem
                                icon="mail"
                                label={t("tickets.contactEmail", "Contact Email")}
                                value={ticket.contact_email}
                                copyable
                                link
                                linkValue={ticket.contact_email ? `mailto:${ticket.contact_email}` : undefined}
                            />
                            <IconInfoItem
                                icon="phone"
                                label={t("tickets.contactPhone", "Contact Phone")}
                                value={ticket.contact_phone}
                                copyable
                                link
                                linkValue={ticket.contact_phone ? `tel:${ticket.contact_phone}` : undefined}
                            />
                        </div>
                    </div>

                    {/* Related Information */}
                    <div className="space-y-4">
                        <p className="text-xs text-muted-foreground font-semibold">
                            {t("tickets.relatedInformation", "Related Information")}
                        </p>
                        <div className="space-y-4">
                            <IconInfoItem
                                icon="map-pin"
                                label={t("tickets.location", "Location")}
                            >
                                {ticket.location ? (<LocationLabel data={ticket.location} />) : undefined}
                            </IconInfoItem>
                            <IconInfoItem
                                icon="package"
                                label={t("tickets.inventory", "Inventory")}
                                value={ticket.inventory?.name}
                            />
                            <IconInfoItem
                                icon="user"
                                label={t("tickets.supervisor", "Supervisor")}
                            >
                                <EmployeeLabel data={ticket.supervisors} />
                            </IconInfoItem>
                        </div>
                    </div>
                </div>

                {/* Description, Messages, and Files Tabs */}
                <div className="pt-6 border-border">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList
                            className="w-full justify-start border-b-2 border-border bg-background mb-4"
                            activeClassName='border-b-2 border-primary -mb-1.5'
                        >
                            <TabsTrigger className="py-0" value="description">
                                {t("tickets.description", "Description")}
                            </TabsTrigger>
                            <TabsTrigger className="py-0" value="messages">
                                {t("tickets.messages", "Messages")}
                            </TabsTrigger>
                            <TabsTrigger className="py-0" value="timeline">
                                {t("tickets.timeline", "Timeline")}
                            </TabsTrigger>
                            <TabsTrigger className="py-0" value="files">
                                {t("tickets.files", "Files")}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContents transition={{ duration: 0 }}>
                            <TabsContent value="description" transition={{ duration: 0 }}>
                                <div className="space-y-2">
                                    {ticket.description ? (
                                        <p className="text-sm font-normal text-foreground whitespace-pre-wrap">
                                            {ticket.description}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            {t("tickets.noDescription", "No description provided")}
                                        </p>
                                    )}
                                </div>
                                {/* Resolution Section (if closed) */}
                                {ticket.resolution && (
                                    <div className="pt-6 border-t border-border space-y-2">
                                        <p className="text-xs text-muted-foreground font-semibold">
                                            {t("tickets.resolution", "Resolution")}
                                        </p>
                                        <p className="text-sm font-normal text-foreground whitespace-pre-wrap">
                                            {ticket.resolution}
                                        </p>
                                    </div>
                                )}
                            </TabsContent>
                            <TabsContent value="messages" transition={{ duration: 0 }}>
                                <div className="w-full max-h-[calc(70vh-10rem)] overflow-y-auto overflow-x-hidden">
                                    <ThreadSection entityId={ticket.id} />
                                </div>
                            </TabsContent>
                            <TabsContent value="timeline" transition={{ duration: 0 }}>
                                <div className="w-full h-[calc(70vh-10rem)]">
                                    <EventsTimeline entityId={ticket.id} showSearchbar="sticky" showTitle={false} />
                                </div>
                            </TabsContent>
                            <TabsContent value="files" transition={{ duration: 0 }}>
                                <FilesSection
                                    key={`ticket-files-${ticket.id}`}
                                    entity_id={ticket.id}
                                />
                            </TabsContent>
                        </TabsContents>
                    </Tabs>
                </div>
            </CardContent>
        </Card>
    );
};

export default TicketDetailView;
