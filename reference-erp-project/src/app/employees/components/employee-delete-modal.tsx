import { useTranslation } from "@/hooks/useTranslation";
import { Employee } from "@/types/employees/employees";
import { DeleteModal } from "@/app/components/modals/delete-modal";

export interface EmployeeDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Employee | null;
    onConfirm: () => Promise<void>;
    isDeleting: boolean;
}

export const EmployeeDeleteModal = ({
    isOpen,
    onClose,
    employee,
    onConfirm,
    isDeleting,
}: EmployeeDeleteModalProps) => {
    const { t } = useTranslation();

    if (!employee) return null;

    const employeeName = `${employee.first_name || ""} ${employee.last_name || ""}`.trim();

    return (
        <DeleteModal
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            title={t("employees.deleteEmployee", "Delete Employee")}
            description={t(
                "employees.deleteEmployeeConfirmation",
                "Are you sure you want to delete this employee? This action cannot be undone."
            )}
            onConfirm={onConfirm}
            isDeleting={isDeleting}
            contentClassName="max-w-md"
        >
            <div className="space-y-2 p-3 rounded-md bg-muted/50 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">
                        {t("employees.name", "Name")}:
                    </span>
                    <span className="font-medium">{employeeName}</span>
                </div>
                {employee.email && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">
                            {t("employees.email", "Email")}:
                        </span>
                        <span className="font-medium">{employee.email}</span>
                    </div>
                )}
                {employee.phone && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">
                            {t("employees.phone", "Phone")}:
                        </span>
                        <span className="font-medium">{employee.phone}</span>
                    </div>
                )}
                {employee.job_title && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">
                            {t("employees.role", "Role")}:
                        </span>
                        <span className="font-medium">
                            {employee.job_title.name}
                        </span>
                    </div>
                )}
            </div>
        </DeleteModal>
    );
};

export default EmployeeDeleteModal;
