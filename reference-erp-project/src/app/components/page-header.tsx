import React from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { safeNavigateBack } from "@/utils/miscelanea";
import { Origin } from "@/types/general/origin";
import IdBadge from "./id-badge";
import { useHandleOriginClick, TypeToName } from "@/utils/origin";
import TicketViewModal, { useTicketModal } from "@/app/tickets/components/ticket-view-modal";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { useDocsModal } from "@/app/components/modals/docs-modal";

interface PageHeaderProps {
  title?: string | React.ReactNode;
  icon?: React.ReactNode;
  description?: string | React.ReactNode;
  /** When set, an inline “View more” text action is shown after the description and opens this doc in the viewer. */
  docs?: { slug: string };
  /** Label for the docs link (defaults to “View documentation”). */
  docsLinkLabel?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  action?: React.ReactNode;
  beforeTextChildren?: React.ReactNode;
  className?: string;
  origin?: Origin;
  origins?: Origin[];
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  icon,
  description,
  docs,
  docsLinkLabel,
  showBackButton = true,
  onBack,
  action,
  beforeTextChildren,
  className,
  origin,
  origins: originsProp,
}) => {
  const { t } = useTranslation();
  const { openDocs } = useDocsModal();
  const navigate = useNavigate();
  const { orgId } = useParams<{ orgId: string }>();
  const { ticketModalOpen, selectedTicketId, setTicketModalOpen, openTicketModal } = useTicketModal();
  const handleOriginClick = useHandleOriginClick(openTicketModal);

  const origins = originsProp && originsProp.length > 0
    ? originsProp
    : origin ? [origin] : [];
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      safeNavigateBack(navigate, orgId || "orgs");
    }
  };

  const renderOrigins = () => {
    if (origins.length === 0) return null;

    if (origins.length === 1) {
      const o = origins[0];
      return (
        <>
          <IdBadge
            id={o.id}
            hideIcon={true}
            customTooltip={`${TypeToName(o.type)} ${o.name ? `(${o.name})` : ""}`}
            onClick={() => handleOriginClick(o)}
          />
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </>
      );
    }

    return (
      <>
        <HoverCard>
          <HoverCardTrigger asChild>
            <Badge
              variant="outline"
              className="font-mono font-medium text-muted-foreground hover:bg-muted/50 cursor-pointer bg-muted/25"
            >
              {origins.length} origins
            </Badge>
          </HoverCardTrigger>
          <HoverCardContent className="w-auto min-w-[140px] p-2" align="start">
            <div className="flex flex-col gap-1">
              {origins.map((o) => (
                <IdBadge
                  key={o.id}
                  id={o.id}
                  hideIcon={true}
                  customTooltip={`${TypeToName(o.type)} ${o.name ? `(${o.name})` : ""}`}
                  onClick={() => handleOriginClick(o)}
                />
              ))}
            </div>
          </HoverCardContent>
        </HoverCard>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </>
    );
  };

  return (
    <>
      <div
        className={`w-full max-w-full flex justify-between gap-6 md:gap-0  ${className}  `}
      >
        <div className={`flex flex-row items-center w-full gap-2`}>
          {showBackButton && (
            <Button
              onClick={handleBack}
              variant="ghost"
              size="sm"
              className="-ml-1 w-6 h-6 cursor-pointer hover:bg-transparent"
            >
              <ChevronLeft className="h-4! w-4!" />
            </Button>
          )}
          {icon && <div>{icon}</div>}
          {beforeTextChildren && <div className="mr-1">{beforeTextChildren}</div>}
          <div className="flex items-start flex-col  w-full">
            <div className="flex items-center gap-2">
              {renderOrigins()}
              <h1 className="text-xl font-semibold">{title}</h1>
            </div>
            {(description || docs?.slug) && (
              <div className="flex max-w-full flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-2 sm:gap-y-0.5">
                {description != null && description !== "" && (
                  <div className="text-xs md:text-sm text-muted-foreground line-clamp-2 md:line-clamp-1 min-w-0">
                    {description}
                  </div>
                )}
                {docs?.slug && (
                  <button
                    type="button"
                    onClick={() => openDocs({ slug: docs.slug })}
                    className="w-fit shrink-0 text-left text-xs font-medium text-primary underline-offset-4 transition-colors hover:underline md:text-sm"
                  >
                    {docsLinkLabel ??
                      t("pageHeader.viewDocumentationDocs", "View documentation")}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>

      <TicketViewModal
        open={ticketModalOpen}
        onOpenChange={setTicketModalOpen}
        orgId={orgId || ""}
        ticketId={selectedTicketId}
      />
    </>
  );
};

export default PageHeader;
