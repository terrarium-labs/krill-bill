import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { FileText, PenTool } from "lucide-react";
import { VerticalMenu, VerticalMenuItem } from "@/components/ui/vertical-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FilesSection from "@/app/components/files/files-section";
import { useClient } from "@/app/dashboard/contexts/DashboardClientContext";
import SigningRequestsTable from "@/app/signing-requests/components/signing-requests-table";
import type { SigningRequest } from "@/types/general/signing-requests";

const filesTabValues = ["files", "pending-signatures"] as const;
type FilesSubTab = (typeof filesTabValues)[number];

const DashboardClientPageFiles = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { client, pendingSignatures } = useClient();
  const pendingSignatureCount = pendingSignatures.length;

  const currentTab = searchParams.get("tab") || "files";
  const filesSubTab: FilesSubTab = filesTabValues.includes(currentTab as FilesSubTab)
    ? (currentTab as FilesSubTab)
    : "files";

  const handleFilesSubTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="flex gap-6">
      <VerticalMenu value={filesSubTab} onValueChange={handleFilesSubTabChange}>
        <VerticalMenuItem value="files" icon={<FileText className="h-4 w-4" />}>
          {t("clientsDetail.files", "Files")}
        </VerticalMenuItem>
        <VerticalMenuItem
          value="pending-signatures"
          icon={<PenTool className="h-4 w-4" />}
          badge={
            pendingSignatureCount > 0 ? (
              <Badge
                variant="default"
                className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] tabular-nums"
              >
                {pendingSignatureCount > 99 ? "99+" : pendingSignatureCount}
              </Badge>
            ) : undefined
          }
        >
          {t("clientsDetail.pendingSignatures", "Pending signatures")}
        </VerticalMenuItem>
      </VerticalMenu>
      <div className="min-w-0 flex-1">
        {filesSubTab === "files" ? (
          <FilesSection key={`client-files-${client?.id}`} entity_id={client?.id || ""} />
        ) : (
          <SigningRequestsTable
            signingRequests={pendingSignatures}
            hiddenColumns={["workflow_type", "number_of_signers", "created_at", "status", "progress"]}
            isLoading={false}
            clickableRows={false}
            renderActions={(_row: SigningRequest) => (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                aria-label={t("signingRequests.openSigning", "Open signing")}
                title={t("signingRequests.openSigning", "Open signing")}
                onClick={() => {
                  void 0;
                }}
              >
                <PenTool className="h-4 w-4" />
              </Button>
            )}
            emptyStateTitle={t(
              "signingRequests.emptyPendingTitle",
              "No pending signatures"
            )}
            emptyStateDescription={t(
              "signingRequests.emptyPendingDescription",
              "You have no documents waiting for your signature."
            )}
          />
        )}
      </div>
    </div>
  );
};

export default DashboardClientPageFiles;
