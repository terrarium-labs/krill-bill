import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { Employee } from "@/types/employees/employees";

interface OnCallGroupEmployeeDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onConfirm: () => void;
  isDeleting: boolean;
}

const OnCallGroupEmployeeDeleteModal = ({
  open,
  onOpenChange,
  employee,
  onConfirm,
  isDeleting,
}: OnCallGroupEmployeeDeleteModalProps) => {
  const { t } = useTranslation();

  const employeeName = employee
    ? `${employee.first_name} ${employee.last_name}`.trim() || employee.email
    : "-";

  return (
    <DeleteModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("on-call.groups.employees.removeEmployee", "Remove Employee")}
      description={
        <>
          {t(
            "on-call.groups.employees.removeEmployeeDescription",
            "Are you sure you want to remove '{{name}}' from this group? This action cannot be undone.",
            { name: employeeName }
          )}
          {employee && (
            <div className="mt-2 p-2 bg-muted rounded">
              <strong>{employeeName}</strong>
            </div>
          )}
        </>
      }
      deleteText={t("common.remove", "Remove")}
      deletingText={t("common.removing", "Removing...")}
      onConfirm={onConfirm}
      isDeleting={isDeleting}
    />
  );
};

export default OnCallGroupEmployeeDeleteModal;
