import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { Skill } from "@/types/general/skills";

interface SkillDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    skill: Skill | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const SkillDeleteModal = ({
    open,
    onOpenChange,
    skill,
    onConfirm,
    isDeleting,
}: SkillDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t("skills.deleteSkill", "Delete Skill")}
            description={
                <>
                    {t(
                        "skills.deleteConfirmation",
                        "Are you sure you want to delete this skill? This action cannot be undone."
                    )}
                    {skill && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            <strong>{skill.name}</strong>
                            {skill.description &&
                                ` - ${skill.description}`}
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default SkillDeleteModal;
