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
import { postWorkOrderHardSkill } from '@/api/field-service/work-orders/hard-skills/hard-skills';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { getSkillDescriptionForLevel } from '@/utils/skills';
import { Skill } from '@/types/general/skills';
import StarsLabel from '@/app/components/labels/stars-label';

interface WorkOrderHardSkillEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: string;
    workOrderId: string;
    /** The skill being edited */
    skill: Skill | null;
    /** All current skills - must pass all on POST, API replaces with what is passed */
    currentSkills?: Array<{ id: string; level?: number | null }>;
    onSuccess?: () => void;
}

const WorkOrderHardSkillEditModal: React.FC<WorkOrderHardSkillEditModalProps> = ({
    open,
    onOpenChange,
    orgId,
    workOrderId,
    skill,
    currentSkills = [],
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
        if (!skill || !orgId || !workOrderId) return;

        setLoading(true);
        try {
            const payload = {
                skills: currentSkills.map((s) => ({
                    id: s.id,
                    level: s.id === skill.id ? level : (s.level ?? 1),
                })),
            };

            const response = await postWorkOrderHardSkill(orgId, workOrderId, payload);

            if (response.success) {
                toast.success(t('workOrders.skillUpdatedSuccessfully', 'Skill updated successfully'));
                onOpenChange(false);
                onSuccess?.();
            } else {
                toast.error(t('workOrders.errorUpdatingSkill', 'Error updating skill'));
            }
        } catch (error) {
            console.error('Error updating skill:', error);
            toast.error(t('workOrders.errorUpdatingSkill', 'Error updating skill'));
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
                        {t('workOrders.editSkill', 'Edit Skill')}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Skill name (read-only) */}
                    <div className="space-y-2">
                        <Label>{t('workOrders.skill', 'Skill')}</Label>
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
                                <Label htmlFor="level-slider">{t('workOrders.proficiencyLevel', 'Proficiency Level')} *</Label>
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
                                <span>{t('workOrders.level.beginner', 'Beginner')}</span>
                                <span>{t('workOrders.level.intermediate', 'Intermediate')}</span>
                                <span>{t('workOrders.level.master', 'Expert')}</span>
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

export default WorkOrderHardSkillEditModal;
