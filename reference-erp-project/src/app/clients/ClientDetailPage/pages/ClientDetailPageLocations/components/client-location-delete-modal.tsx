import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { Location } from "@/types/general/location";

interface ClientLocationDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    location: Location | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const ClientLocationDeleteModal = ({
    open,
    onOpenChange,
    location,
    onConfirm,
    isDeleting,
}: ClientLocationDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t("locations.delete", "Delete Location")}
            description={
                <>
                    {t(
                        "locations.deleteConfirmation",
                        "Are you sure you want to delete this location? This action cannot be undone."
                    )}
                    {location && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            <strong>{location.name}</strong>
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default ClientLocationDeleteModal;
