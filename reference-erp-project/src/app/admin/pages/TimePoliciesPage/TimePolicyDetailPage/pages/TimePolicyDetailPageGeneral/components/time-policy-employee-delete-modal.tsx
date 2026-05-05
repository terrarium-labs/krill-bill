import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";

interface TimePolicyEmployeeDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employee: any | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const TimePolicyEmployeeDeleteModal: React.FC<TimePolicyEmployeeDeleteModalProps> = ({
    open,
    onOpenChange,
    employee,
    onConfirm,
    isDeleting,
}) => {
    const { t } = useTranslation();

    const employeeName =
        employee?.first_name && employee?.last_name
            ? `${employee.first_name} ${employee.last_name}`
            : employee?.email;

    const handleOpenChange = (next: boolean) => {
        onOpenChange(next);
        if (!next) {
            setTimeout(() => {
                document.body.style.removeProperty("pointer-events");
            }, 100);
        }
    };

    return (
        <DeleteModal
            open={open}
            onOpenChange={handleOpenChange}
            title={t(
                "timePolicies.employees.deleteEmployee",
                "Remove Employee"
            )}
            description={t(
                "timePolicies.employees.deleteEmployeeDescription",
                "Are you sure you want to remove '{{name}}' from this time policy? This action cannot be undone.",
                { name: employeeName }
            )}
            deleteText={t("common.delete", "Remove")}
            deletingText={t("common.deleting", "Removing...")}
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default TimePolicyEmployeeDeleteModal;
