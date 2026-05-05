import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";

interface JobTitleEmployee {
    id: string;
    first_name?: string;
    last_name?: string;
    email: string;
    [key: string]: any;
}

interface JobTitleEmployeeDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employee: JobTitleEmployee | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const JobTitleEmployeeDeleteModal = ({
    open,
    onOpenChange,
    employee,
    onConfirm,
    isDeleting,
}: JobTitleEmployeeDeleteModalProps) => {
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
                "jobTitles.employees.deleteEmployee",
                "Remove Employee"
            )}
            description={t(
                "jobTitles.employees.deleteEmployeeDescription",
                "Are you sure you want to remove '{{name}}' from this job title? This action cannot be undone.",
                { name: employeeName }
            )}
            deleteText={t("common.delete", "Remove")}
            deletingText={t("common.deleting", "Removing...")}
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default JobTitleEmployeeDeleteModal;
