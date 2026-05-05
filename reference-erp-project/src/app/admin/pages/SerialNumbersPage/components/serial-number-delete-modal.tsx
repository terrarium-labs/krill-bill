import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { SerialNumber } from "@/types/general/serial-numbers";

interface SerialNumberDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    serialNumber: SerialNumber | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const SerialNumberDeleteModal = ({
    open,
    onOpenChange,
    serialNumber,
    onConfirm,
    isDeleting,
}: SerialNumberDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t(
                "admin.serialNumbers.deleteConfirmTitle",
                "Delete Serial Number"
            )}
            description={
                <>
                    {t(
                        "admin.serialNumbers.deleteConfirmDescription",
                        "Are you sure you want to delete this serial number? This action cannot be undone."
                    )}
                    {serialNumber && (
                        <div className="mt-4 p-3 bg-muted rounded-md">
                            <p className="font-semibold">{serialNumber.name}</p>
                            <p className="text-sm font-mono">
                                {serialNumber.value}
                            </p>
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default SerialNumberDeleteModal;
