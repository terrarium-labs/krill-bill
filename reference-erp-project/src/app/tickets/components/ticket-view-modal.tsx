import React, { useState, useEffect } from "react";
import { Loader2, Calendar, Lock } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { getOrgTicket } from "@/api/field-service/tickets/tickets";
import { Ticket } from "@/types/field-service/tickets/tickets";
import { formatDate } from "@/utils/miscelanea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import IdBadge from "@/app/components/id-badge";
import PriorityLabel from "@/app/components/labels/priority-label";
import Tag from "@/app/components/tag/tag";
import { ClientAvatar } from "@/app/components/avatars/client-avatar";
import LocationLabel from "@/app/components/labels/location-label";
import EmployeeLabel from "@/app/components/labels/employee-label";
import { IconInfoItem } from "@/app/components/custom-labels";
import ThreadSection from "@/app/components/thread-section";
import FilesSection from "@/app/components/files/files-section";
import EventsTimeline from "@/app/components/events-timeline";
import TicketInsightsCard from "@/app/tickets/components/ticket-insights-card";
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from "@/components/ui/shadcn-io/tabs";

/**
 * Hook to manage ticket modal state
 * @returns An object with ticketModalOpen state, selectedTicketId, setTicketModalOpen, and openTicketModal functions
 */
export function useTicketModal() {
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const openTicketModal = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setTicketModalOpen(true);
  };

  return {
    ticketModalOpen,
    selectedTicketId,
    setTicketModalOpen,
    openTicketModal,
  };
}

interface TicketViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  ticketId: string | null;
  /** Render custom action buttons in the header (Edit, Delete, Close, Generate Order, etc.) */
  renderActions?: (ticketId: string) => React.ReactNode;
}

const TicketViewModal: React.FC<TicketViewModalProps> = ({
  open,
  onOpenChange,
  orgId,
  ticketId,
  renderActions,
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [activeTab, setActiveTab] = useState<string>("description");

  // Fetch ticket data when modal opens
  const fetchTicket = async () => {
    if (!orgId || !ticketId) return;

    setIsLoading(true);
    try {
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
    if (open && ticketId) {
      fetchTicket();
    } else {
      setTicket(null);
    }
  }, [open, orgId, ticketId]);

  // Set default tab based on ticket resolution
  useEffect(() => {
    if (ticket) {
      // Default to resolution if it exists, otherwise description
      if (ticket.resolution) {
        setActiveTab("resolution");
      } else {
        setActiveTab("description");
      }
    }
  }, [ticket]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const contactName = ticket?.contact_first_name || ticket?.contact_last_name
    ? `${ticket?.contact_first_name || ''} ${ticket?.contact_last_name || ''}`.trim()
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full md:max-w-5xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 text-lg font-semibold">
            <span>{t("tickets.viewTicket", "Ticket Details")}</span>
            {ticket && (
              <div className="flex items-center gap-2">
                {ticket.locked_by && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-accent/50 border border-border">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    <EmployeeLabel data={ticket.locked_by.employee} />
                  </div>
                )}
                <IdBadge id={ticket.id} />
                {renderActions?.(ticket.id)}
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading && !ticket ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : ticket ? (
          <>
            <div className="space-y-6 overflow-y-auto max-h-[70vh] px-2 scrollbar-hide mb-6">
              {/* Client Avatar */}
              <div className="flex items-start justify-between gap-4">
                <ClientAvatar
                  client={ticket.client}
                  showNameExtra={true}
                  showEmail={true}
                  size="xl"
                />
              </div>

              {/* Tags - Priority, Status, Type */}
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
                <span>{t("tickets.created", "Created")}: {formatDate(ticket.created_at, { showTime: true })}</span>
                {ticket.closed_at && (
                  <>
                    <span className="mx-2">•</span>
                    <span>{t("tickets.closed", "Closed")}: {formatDate(ticket.closed_at, { showTime: true })}</span>
                  </>
                )}
              </div>

              {/* AI Insights Card */}
              {ticket.ai_insights && <TicketInsightsCard data={ticket} />}

              {/* Contact & Related Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Information */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-muted-foreground">
                    {t("tickets.contactInformation", "Contact Information")}
                  </h4>
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
                  <h4 className="text-sm font-semibold text-muted-foreground">
                    {t("tickets.relatedInformation", "Related Information")}
                  </h4>
                  <div className="space-y-4">
                    <IconInfoItem
                      icon="map-pin"
                      label={t("tickets.location", "Location")}
                    >
                      {ticket.location ? (
                        <LocationLabel data={ticket.location} />
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
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
                      {ticket.supervisors ? (
                        <EmployeeLabel data={ticket.supervisors} />
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </IconInfoItem>
                  </div>
                </div>
              </div>

              {/* Tabs: Resolution (if exists), Description, Messages, Files */}
              <div className="pt-6 border-border">
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                  <TabsList className="w-full justify-start border-b-2 border-border bg-background" activeClassName="border-b-2 border-primary -mb-1.5">
                    {ticket.resolution && (
                      <TabsTrigger className="py-0" value="resolution">
                        {t("tickets.resolution", "Resolution")}
                      </TabsTrigger>
                    )}
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
                    {ticket.resolution && (
                      <TabsContent value="resolution" transition={{ duration: 0 }}>
                        <div className="mt-2 space-y-2">
                          {ticket.resolution ? (
                            <p className="text-sm whitespace-pre-wrap">{ticket.resolution}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              {t("tickets.noResolution", "No resolution provided")}
                            </p>
                          )}
                        </div>
                      </TabsContent>
                    )}
                    <TabsContent value="description" transition={{ duration: 0 }}>
                      <div className="mt-2 space-y-2">
                        {ticket.description ? (
                          <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {t("tickets.noDescription", "No description provided")}
                          </p>
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="messages" transition={{ duration: 0 }}>
                      <div className="mt-2 w-full max-h-[calc(70vh-10rem)] overflow-y-auto overflow-x-hidden">
                        <ThreadSection entityId={ticket.id} />
                      </div>
                    </TabsContent>
                    <TabsContent value="timeline" transition={{ duration: 0 }}>
                      <div className="mt-2 w-full h-[calc(70vh-10rem)]">
                        <EventsTimeline entityId={ticket.id} showSearchbar="sticky" showTitle={false} />
                      </div>
                    </TabsContent>
                    <TabsContent value="files" transition={{ duration: 0 }}>
                      <div className="mt-2">
                        <FilesSection
                          key={`ticket-files-${ticket.id}`}
                          entity_id={ticket.id}
                        />
                      </div>
                    </TabsContent>
                  </TabsContents>
                </Tabs>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">
              {t("tickets.notFound", "Ticket not found")}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TicketViewModal;