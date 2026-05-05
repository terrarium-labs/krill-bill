import { useTranslation } from "@/hooks/useTranslation";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { Employee } from "@/types/employees/employees";

interface GroupEmployeeDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employee: Employee | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const GroupEmployeeDeleteModal = ({
    open,
    onOpenChange,
    employee,
    onConfirm,
    isDeleting,
}: GroupEmployeeDeleteModalProps) => {
    const { t } = useTranslation();

    const employeeName =
        employee?.first_name || employee?.last_name || employee?.email;

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
            title={t("groups.employees.deleteEmployee", "Remove Employee")}
            description={t(
                "groups.employees.deleteEmployeeDescription",
                "Are you sure you want to remove '{{name}}' from this group?",
                { name: employeeName }
            )}
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default GroupEmployeeDeleteModal;
