import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { FileText, PenTool } from "lucide-react";
import { VerticalMenu, VerticalMenuItem, VerticalMenuSeparator } from "@/components/ui/vertical-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FilesSection from "@/app/components/files/files-section";
import { useEmployee } from "@/app/dashboard/contexts/DashboardEmployeeContext";
import SigningRequestsTable from "@/app/signing-requests/components/signing-requests-table";
import type { SigningRequest } from "@/types/general/signing-requests";
import DashboardEmployeeFilesTipsCard from "./components/dashboard-employee-files-tips-card";
import { useChatContext } from "@/app/chat/context/ChatContext";

const filesTabValues = ["files", "pending-signatures"] as const;
type FilesSubTab = (typeof filesTabValues)[number];

const DashboardEmployeePageFiles = () => {
    const { t } = useTranslation();
    const { autoSendMessage } = useChatContext();
    const [searchParams, setSearchParams] = useSearchParams();
    const { employee, pendingSignatures } = useEmployee();
    const pendingSignatureCount = pendingSignatures.length;

    const currentTab = searchParams.get("tab") || "files";
    const filesSubTab: FilesSubTab = filesTabValues.includes(currentTab as FilesSubTab)
        ? (currentTab as FilesSubTab)
        : "files";

    const handleFilesSubTabChange = (value: string) => {
        setSearchParams({ tab: value });
    };

    return (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-6">
            <aside className="w-full shrink-0 lg:w-auto lg:max-w-[min(100%,14rem)]">
                <VerticalMenu value={filesSubTab} onValueChange={handleFilesSubTabChange}>
                    <VerticalMenuItem value="files" icon={<FileText className="h-4 w-4" />}>
                        {t("employeesDetail.files", "Files")}
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
                        {t("employeesDetail.pendingSignatures", "Pending signatures")}
                    </VerticalMenuItem>
                    <VerticalMenuSeparator className="my-2" />
                    <div className="min-w-0 pt-1" role="presentation">
                        <DashboardEmployeeFilesTipsCard variant={filesSubTab} />
                    </div>
                </VerticalMenu>
            </aside>
            <div className="min-w-0 flex-1">
                {filesSubTab === "files" ? (
                    <FilesSection key={`employee-files-${employee?.id}`} entity_id={employee?.id || ""} />
                ) : (
                    <SigningRequestsTable
                        signingRequests={pendingSignatures}
                        hiddenColumns={["workflow_type", "number_of_signers", "created_at", "overall_status", "progress"]}
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
                                    autoSendMessage(t("signingRequests.openSigningMessage", "Hey charles get from my email all Signaturit pending requests for signing documents and display them as hyperlinks"));
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

export default DashboardEmployeePageFiles;
