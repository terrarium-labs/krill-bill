import React, { useState } from 'react';
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
import { getOrgSkills } from '@/api/orgs/skills/skills';
import { postWorkOrderHardSkill } from '@/api/field-service/work-orders/hard-skills/hard-skills';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { MultiSelectApi } from '@/app/components/forms-elements/multi-select-api';
import { getSkillDescriptionForLevel } from '@/utils/skills';
import { Skill } from '@/types/general/skills';
import StarsLabel from '@/app/components/labels/stars-label';

interface AddSkillModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: string;
    workOrderId: string;
    /** Current skills - must pass all on POST, API replaces with what is passed */
    currentSkills?: Array<{ id: string; level?: number | null }>;
    onSuccess?: () => void;
}

export const AddSkillModal: React.FC<AddSkillModalProps> = ({
    open,
    onOpenChange,
    orgId,
    workOrderId,
    currentSkills = [],
    onSuccess,
}) => {
    const { t } = useTranslation();
    const [selectedSkillId, setSelectedSkillId] = useState<string[]>([]);
    const [level, setLevel] = useState<number>(3);
    const [loading, setLoading] = useState(false);
    const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

    const handleSubmit = async () => {
        if (!selectedSkillId[0]) {
            toast.error(t('workOrders.selectSkill', 'Please select a skill'));
            return;
        }

        if (!orgId || !workOrderId) return;

        setLoading(true);
        try {
            const existing = currentSkills
                .filter((s) => s.id !== selectedSkillId[0])
                .map((s) => ({ id: s.id, level: s.level ?? 1 }));
            const payload = {
                hard_skills: [
                    ...existing,
                    { id: selectedSkillId[0], level },
                ],
            };

            const response = await postWorkOrderHardSkill(orgId, workOrderId, payload);

            if (response.success) {
                toast.success(t('workOrders.skillAddedSuccessfully', 'Skill added successfully'));
                handleClose();
                onOpenChange(false);
                onSuccess?.();
            } else {
                toast.error(t('workOrders.errorAddingSkill', 'Error adding skill'));
            }
        } catch (error) {
            console.error('Error adding skill:', error);
            toast.error(t('workOrders.errorAddingSkill', 'Error adding skill'));
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedSkillId([]);
        setSelectedSkill(null);
        setLevel(3);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={(newOpen) => {
            if (!newOpen) handleClose();
            else onOpenChange(newOpen);
        }}>
            <DialogContent className="sm:max-w-[500px]" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>
                        {t('workOrders.addSkill', 'Add Skill')}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="skill-select">{t('workOrders.skill', 'Skill')} *</Label>
                        <MultiSelectApi
                            fetchOptions={getOrgSkills}
                            fetchArgs={[orgId, "hard"]}
                            optionsKey="skills"
                            customValueKey={(item) => item.id}
                            customLabelKey={(item) => item.name}
                            placeholder={t('workOrders.selectSkill', 'Select a skill...')}
                            searchPlaceholder={t('common.search', 'Search...')}
                            emptyText={t('workOrders.noSkillsAvailable', 'No skills available')}
                            value={selectedSkillId}
                            onChangeValue={setSelectedSkillId}
                            onChangeValueWithItem={(_value, _itemsMap, lastItem) => {
                                setSelectedSkill(lastItem as Skill);
                            }}
                            maxCount={1}
                            disabled={loading}
                            className="w-full truncate"
                            isApiSearchable={true}
                        />
                        {selectedSkill && getSkillDescriptionForLevel(selectedSkill.description, level) && (
                            <p className="text-sm text-muted-foreground">
                                {getSkillDescriptionForLevel(selectedSkill.description, level)}
                            </p>
                        )}
                    </div>

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
                                disabled={loading || selectedSkillId.length === 0}
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
                    <Button variant="outline" onClick={handleClose} disabled={loading}>
                        {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || selectedSkillId.length === 0}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('common.add', 'Add')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AddSkillModal;
