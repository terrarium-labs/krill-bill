import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useParams } from "react-router-dom";

import { deleteTraining } from "@/api/trainings/trainings";
import type { Training } from "@/types/trainings/trainings";
import { DeleteModal } from "@/app/components/modals/delete-modal";

interface TrainingDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    training: Training | null;
    onDeleted?: () => void;
}

const TrainingDeleteModal = ({
    open,
    onOpenChange,
    training,
    onDeleted,
}: TrainingDeleteModalProps) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirm = async () => {
        if (!training || !orgId) return;
        setIsDeleting(true);
        try {
            const response = await deleteTraining(orgId, training.id);
            if (response.success) {
                toast.success(
                    t("trainings.deletedSuccess", "Training deleted successfully"),
                );
                onDeleted?.();
            } else {
                toast.error(
                    t("trainings.errorDeleting", "Error deleting training"),
                );
                throw new Error("delete failed");
            }
        } catch (e) {
            if (!(e instanceof Error && e.message === "delete failed")) {
                toast.error(t("common.error", "An error occurred"));
            }
            throw e;
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            contentClassName="sm:max-w-md"
            title={t("trainings.deleteTraining", "Delete Training")}
            description={
                <>
                    {t(
                        "trainings.deleteConfirmation",
                        'Are you sure you want to delete "{{title}}"? This will also remove all enrollment records. This action cannot be undone.',
                        { title: training?.title ?? "" },
                    )}
                    {training ? (
                        <div className="mt-3 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-foreground">
                            <span className="font-medium">{training.title}</span>
                        </div>
                    ) : null}
                </>
            }
            onConfirm={handleConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default TrainingDeleteModal;
