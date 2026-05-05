import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/useTranslation';
import { deleteEmployeeSkill, postEmployeeSkill } from '@/api/employees/skills/skills';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { getSkillDescriptionForLevel } from '@/utils/skills';
import { Skill } from '@/types/general/skills';
import StarsLabel from '@/app/components/labels/stars-label';

interface EmployeeSkillEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: string;
    employeeId: string;
    /** The skill being edited */
    skill: Skill | null;
    onSuccess?: () => void;
}

const EmployeeSkillEditModal: React.FC<EmployeeSkillEditModalProps> = ({
    open,
    onOpenChange,
    orgId,
    employeeId,
    skill,
    onSuccess,
}) => {
    const { t } = useTranslation();
    const [level, setLevel] = useState<number>(3);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && skill) {
            setLevel(skill.level ?? 3);
        }
    }, [open, skill]);

    const handleSubmit = async () => {
        if (!skill || !orgId || !employeeId) return;

        setLoading(true);
        try {
            const deleteResponse = await deleteEmployeeSkill(orgId, employeeId, { skills: [skill.id] });
            if (!deleteResponse.success) {
                toast.error(deleteResponse.error?.message || t('employees.errorUpdatingSkill', 'Error updating skill'));
                return;
            }

            const postResponse = await postEmployeeSkill(orgId, employeeId, {
                skills: [{ id: skill.id, level }],
            });

            if (postResponse.success) {
                toast.success(t('employees.skillUpdatedSuccessfully', 'Skill updated successfully'));
                onOpenChange(false);
                onSuccess?.();
            } else {
                toast.error(postResponse.error || t('employees.errorUpdatingSkill', 'Error updating skill'));
            }
        } catch (error) {
            console.error('Error updating skill:', error);
            toast.error(t('employees.errorUpdatingSkill', 'Error updating skill'));
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        onOpenChange(false);
    };

    if (!skill) return null;

    return (
        <Dialog open={open} onOpenChange={(newOpen) => {
            if (!newOpen) handleClose();
            else onOpenChange(newOpen);
        }}>
            <DialogContent className="sm:max-w-[500px]" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>
                        {t('employees.editSkill', 'Edit Skill')}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Skill name (read-only) */}
                    <div className="space-y-2">
                        <Label>{t('employees.skill', 'Skill')}</Label>
                        <p className="text-sm font-medium text-foreground">{skill.name}</p>
                        {getSkillDescriptionForLevel(skill.description, level) && (
                            <p className="text-sm text-muted-foreground">
                                {getSkillDescriptionForLevel(skill.description, level)}
                            </p>
                        )}
                    </div>

                    {/* Level Slider */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="level-slider">{t('employees.proficiencyLevel', 'Proficiency Level')} *</Label>
                                <span className="flex items-center gap-1">
                                    <StarsLabel level={level} variant="default" size="md" />
                                    <span className="text-sm font-semibold text-muted-foreground ml-1">{level}/5</span>
                                </span>
                            </div>
                            <Slider
                                id="level-slider"
                                min={1}
                                max={5}
                                step={1}
                                value={[level]}
                                onValueChange={(value) => setLevel(value[0])}
                                className="w-full"
                                disabled={loading}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                <span>{t('employees.beginner', 'Beginner')}</span>
                                <span>{t('employees.intermediate', 'Intermediate')}</span>
                                <span>{t('employees.expert', 'Expert')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('common.update', 'Update')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EmployeeSkillEditModal;
