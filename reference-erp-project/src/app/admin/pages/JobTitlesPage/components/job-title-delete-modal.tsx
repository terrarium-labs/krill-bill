import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { JobTitle } from "@/types/general/job-titles";

type JobTitleDeleteModalProps = {
    open: boolean;
    jobTitle: JobTitle | null;
    deleting: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
};

const JobTitleDeleteModal = ({
    open,
    jobTitle,
    deleting,
    onOpenChange,
    onConfirm,
}: JobTitleDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t("admin.jobTitles.deleteJobTitle", "Delete Job Title")}
            description={
                <>
                    {t(
                        "admin.jobTitles.deleteJobTitleConfirmation",
                        "Are you sure you want to delete this job title? This action cannot be undone."
                    )}
                    {jobTitle && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            <strong>{jobTitle.name}</strong>
                            {jobTitle.description &&
                                ` - ${jobTitle.description}`}
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
            isDeleting={deleting}
        />
    );
};

export default JobTitleDeleteModal;
