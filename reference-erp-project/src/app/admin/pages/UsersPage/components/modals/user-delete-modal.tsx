import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { OrgUser } from "@/types/general/user";

interface UserDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: OrgUser | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const UserDeleteModal = ({
    open,
    onOpenChange,
    user,
    onConfirm,
    isDeleting,
}: UserDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t("admin.users.users.deleteUser", "Delete User")}
            description={
                <>
                    {t(
                        "admin.users.users.deleteConfirmation",
                        "Are you sure you want to delete this user? This action cannot be undone."
                    )}
                    {user && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            <strong>
                                {`${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() ||
                                    user.email}
                            </strong>
                        </div>
                    )}
                </>
            }
            deleteText={t("admin.users.users.delete", "Delete User")}
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default UserDeleteModal;
