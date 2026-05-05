import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Bell, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/app/components/page-header";
import IdBadge from "@/app/components/id-badge";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { useSigningRequest } from "@/app/signing-requests/contexts/SigningRequestContext";
import SigningRequestDetailsSection from "./components/signing-request-details-section";
import SigningRequestSignersSection from "./components/signing-request-signers-section";
import SigningRequestDeleteModal from "../../components/signing-request-delete-modal";
import { deleteSigningRequest } from "@/api/orgs/signing-requests/signing-requests";
import Tag from "@/app/components/tag/tag";

const SigningRequestDetailPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();
    const { signingRequest } = useSigningRequest();

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteConfirm = () => {
        setDeleteModalOpen(true);
    };

    const handleSendReminders = () => {
        toast.info(
            t(
                "signingRequests.detail.remindersPlaceholderToast",
                "Reminder notifications are not wired yet — this will notify pending signers when the integration is ready."
            )
        );
    };

    const handleDelete = async () => {
        if (!orgId || !signingRequest) return;
        setIsDeleting(true);
        try {
            const response = await deleteSigningRequest(orgId, signingRequest.id);
            if (response.success) {
                toast.success(t("signingRequests.deleted", "Signing request deleted"));
                setDeleteModalOpen(false);
                navigate(`/${orgId}/signing-requests`, { replace: true });
            } else {
                toast.error(t("signingRequests.errorDeleting", "Could not delete signing request"));
            }
        } catch {
            toast.error(t("signingRequests.errorDeleting", "Could not delete signing request"));
        } finally {
            setIsDeleting(false);
        }
    };

    const description =
        signingRequest.description?.trim() ||
        t(
            "signingRequests.detail.headerFallbackDescription",
            "Review documents, evidence, and signer progress."
        );

    return (
        <div className="mx-full max-w-420 space-y-6 px-4 pb-10 pt-6 md:px-6">
            <PageHeader
                beforeTextChildren={
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-muted/40 transition-colors hover:bg-muted">
                        <FileSignature className="h-6 w-6 text-primary" aria-hidden />
                    </div>
                }
                title={signingRequest.name}
                description={description}
                showBackButton
                action={
                    <div className="flex items-center gap-2">
                        <Tag text={signingRequest.overall_status} />
                        <IdBadge id={signingRequest.id} className="h-6 px-4 text-xs" />
                        <Button
                            type="button"
                            variant="outline"
                            className="gap-2"
                            onClick={handleSendReminders}
                        >
                            <Bell className="h-4 w-4 shrink-0" aria-hidden />
                            {t("signingRequests.detail.sendReminders", "Send reminders")}
                        </Button>
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("common.delete", "Delete"),
                                    icon: "trash-2",
                                    onClick: handleDeleteConfirm,
                                    variant: "destructive",
                                },
                            ]}
                        />
                    </div>
                }
            />

            <SigningRequestDeleteModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                signingRequest={signingRequest}
                onConfirm={handleDelete}
                isDeleting={isDeleting}
            />

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
                <div className="flex min-h-0 flex-col lg:sticky lg:top-6 lg:col-span-1 lg:self-stretch">
                    <SigningRequestDetailsSection />
                </div>
                <div className="min-h-0 lg:col-span-2">
                    <SigningRequestSignersSection />
                </div>
            </div>
        </div>
    );
};

export default SigningRequestDetailPage;
