import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { SigningRequest } from "@/types/general/signing-requests";

interface SigningRequestDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    signingRequest: SigningRequest | null;
    onConfirm: () => void | Promise<void>;
    isDeleting: boolean;
}

const SigningRequestDeleteModal = ({
    isOpen,
    onClose,
    signingRequest,
    onConfirm,
    isDeleting,
}: SigningRequestDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            title={t("signingRequests.deleteTitle", "Delete signing request")}
            description={
                <>
                    {t(
                        "signingRequests.deleteDescription",
                        "This will remove the signing request. This action cannot be undone."
                    )}
                    {signingRequest && (
                        <div className="mt-4 p-3 bg-muted rounded-md">
                            <p className="font-semibold">{signingRequest.name}</p>
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default SigningRequestDeleteModal;
