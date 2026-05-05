import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";

interface WorkplaceEmployeeDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employee: any | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const WorkplaceEmployeeDeleteModal = ({
    open,
    onOpenChange,
    employee,
    onConfirm,
    isDeleting,
}: WorkplaceEmployeeDeleteModalProps) => {
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
            title={t(
                "workplaces.employees.deleteEmployee",
                "Delete employee"
            )}
            description={t(
                "workplaces.employees.deleteEmployeeDescription",
                "Are you sure you want to delete '{{name}}'? This action cannot be undone.",
                { name: employeeName }
            )}
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default WorkplaceEmployeeDeleteModal;
