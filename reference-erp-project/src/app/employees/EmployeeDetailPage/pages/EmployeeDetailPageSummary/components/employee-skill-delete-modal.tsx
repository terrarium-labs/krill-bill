import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { Skill } from "@/types/general/skills";
import { getSkillDescriptionForLevel } from "@/utils/skills";
import StarsLabel from "@/app/components/labels/stars-label";

interface EmployeeSkillDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    skill: Skill | null;
    onConfirm: () => void | Promise<void>;
    isDeleting?: boolean;
}

const EmployeeSkillDeleteModal: React.FC<EmployeeSkillDeleteModalProps> = ({
    open,
    onOpenChange,
    skill,
    onConfirm,
    isDeleting = false,
}) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t("employees.deleteSkill", "Delete Skill")}
            description={
                <>
                    {t(
                        "employees.deleteSkillConfirmation",
                        "Are you sure you want to delete this skill? This action cannot be undone."
                    )}
                    {skill && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            <strong>{skill.name}</strong>
                            {getSkillDescriptionForLevel(skill.description, skill.level ?? 1) && (
                                <span className="block text-xs text-muted-foreground mt-1">
                                    {getSkillDescriptionForLevel(skill.description, skill.level ?? 1)}
                                </span>
                            )}
                            <div className="flex items-center gap-1 mt-1">
                                <StarsLabel level={skill.level ?? 1} variant="default" size="sm" />
                            </div>
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default EmployeeSkillDeleteModal;
