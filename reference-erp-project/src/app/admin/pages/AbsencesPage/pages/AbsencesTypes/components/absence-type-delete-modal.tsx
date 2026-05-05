import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { AbsenceType } from "@/types/general/absences";

interface AbsenceTypeDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    absenceType: AbsenceType | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const AbsenceTypeDeleteModal = ({
    open,
    onOpenChange,
    absenceType,
    onConfirm,
    isDeleting,
}: AbsenceTypeDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t("absences.types.deleteType", "Delete Absence Type")}
            description={
                <>
                    {t(
                        "absences.types.deleteConfirmation",
                        "Are you sure you want to delete this absence type? This action cannot be undone."
                    )}
                    {absenceType && (
                        <div className="mt-4 p-3 bg-muted rounded-md">
                            <p className="font-semibold">{absenceType.name}</p>
                            {absenceType.description && (
                                <p className="text-sm text-muted-foreground">
                                    {absenceType.description}
                                </p>
                            )}
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default AbsenceTypeDeleteModal;
