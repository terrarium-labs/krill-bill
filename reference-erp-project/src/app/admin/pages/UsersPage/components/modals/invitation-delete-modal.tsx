import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { Invitation } from "@/types/general/invitation";

interface InvitationDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    invitation: Invitation | null;
    onConfirm: () => void;
    isCanceling: boolean;
}

const InvitationDeleteModal = ({
    open,
    onOpenChange,
    invitation,
    onConfirm,
    isCanceling,
}: InvitationDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t(
                "admin.users.invitations.cancelInvitation",
                "Cancel Invitation"
            )}
            description={
                <>
                    {t(
                        "admin.users.invitations.cancelConfirmation",
                        "Are you sure you want to cancel this invitation? This action cannot be undone."
                    )}
                    {invitation && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            <strong>{invitation.email}</strong>
                        </div>
                    )}
                </>
            }
            deleteText={t(
                "admin.users.invitations.cancel",
                "Cancel Invitation"
            )}
            deletingText={t("common.canceling", "Canceling...")}
            onConfirm={onConfirm}
            isDeleting={isCanceling}
        />
    );
};

export default InvitationDeleteModal;
