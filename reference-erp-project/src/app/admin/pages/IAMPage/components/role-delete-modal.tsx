import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { Role } from "@/types/general/roles";

interface RoleDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    role: Role | null;
    onConfirm: () => Promise<void>;
    isDeleting: boolean;
}

const RoleDeleteModal = ({
    open,
    onOpenChange,
    role,
    onConfirm,
    isDeleting,
}: RoleDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t("admin.iam.deleteRole", "Delete Role")}
            description={
                <>
                    {t(
                        "admin.iam.deleteRoleDescription",
                        "Are you sure you want to delete this role? This action cannot be undone."
                    )}
                    {role && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            <strong>{role.name}</strong>
                            {role.description &&
                                ` - ${role.description}`}
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default RoleDeleteModal;
