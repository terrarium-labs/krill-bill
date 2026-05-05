import { useTranslation } from "react-i18next";
import { Absence } from "@/types/employees/absences";
import { Employee } from "@/types/employees/employees";
import { formatDate } from "@/utils/miscelanea";
import { DeleteModal } from "@/app/components/modals/delete-modal";

interface AbsenceDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    absence: Absence | null;
    onConfirm: () => Promise<void>;
    isDeleting: boolean;
}

export const AbsenceDeleteModal = ({
    isOpen,
    onClose,
    absence,
    onConfirm,
    isDeleting,
}: AbsenceDeleteModalProps) => {
    const { t } = useTranslation();

    if (!absence) return null;

    return (
        <DeleteModal
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            title={t("absences.deleteAbsence", "Delete Absence")}
            description={t(
                "absences.deleteAbsenceDescription",
                "Are you sure you want to delete this absence? This action cannot be undone."
            )}
            onConfirm={onConfirm}
            isDeleting={isDeleting}
            contentClassName="max-w-md"
        >
            <div className="space-y-2 p-3 rounded-md bg-muted/50 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">
                        {t("absences.employee", "Employee")}:
                    </span>
                    <span className="font-medium">
                        {`${(absence.employee as Employee).first_name || ""} ${(absence.employee as Employee).last_name || ""}`.trim()}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">
                        {t("absences.absenceType", "Absence Type")}:
                    </span>
                    <span className="font-medium">
                        {absence.absence_type.name}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">
                        {t("absences.period", "Period")}:
                    </span>
                    <span className="font-medium">
                        {formatDate(absence.start_date)} -{" "}
                        {formatDate(absence.end_date)}
                    </span>
                </div>
            </div>
        </DeleteModal>
    );
};

export default AbsenceDeleteModal;
