import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { Group } from "@/types/general/groups";

interface GroupDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    group: Group | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const GroupDeleteModal = ({
    open,
    onOpenChange,
    group,
    onConfirm,
    isDeleting,
}: GroupDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t("groups.deleteGroup", "Delete Group")}
            description={
                <>
                    {t(
                        "groups.deleteConfirmation",
                        "Are you sure you want to delete this group? This action cannot be undone."
                    )}
                    {group && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            <strong>{group.name}</strong>
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default GroupDeleteModal;
