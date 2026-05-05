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
import { postEmployeeSkill } from '@/api/employees/skills/skills';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { MultiSelectApi } from '@/app/components/forms-elements/multi-select-api';
import { getSkillDescriptionForLevel } from '@/utils/skills';
import { Skill } from '@/types/general/skills';
import StarsLabel from '@/app/components/labels/stars-label';

interface EmployeeSkillsAddModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: string;
    employeeId: string;
    onSuccess?: () => void;
}

const EmployeeSkillsAddModal: React.FC<EmployeeSkillsAddModalProps> = ({
    open,
    onOpenChange,
    orgId,
    employeeId,
    onSuccess,
}) => {
    const { t } = useTranslation();
    const [skillType, setSkillType] = useState<'hard' | 'soft'>('hard');
    const [selectedSkillId, setSelectedSkillId] = useState<string[]>([]);
    const [level, setLevel] = useState<number>(3);
    const [loading, setLoading] = useState(false);
    const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

    const handleSubmit = async () => {
        if (!selectedSkillId[0]) {
            toast.error(t('employees.selectSkill', 'Please select a skill'));
            return;
        }

        setLoading(true);
        try {
            const response = await postEmployeeSkill(orgId, employeeId, {
                skills: [{
                    id: selectedSkillId[0],
                    level: level
                }]
            });

            if (response.success) {
                toast.success(t('employees.skillAdded', 'Skill added successfully'));
                handleClose();
                onSuccess?.();
            } else {
                toast.error(response.error || t('employees.errorAddingSkill', 'Error adding skill'));
            }
        } catch (error) {
            console.error('Error adding skill:', error);
            toast.error(t('employees.errorAddingSkill', 'Error adding skill'));
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSkillType('hard');
        setSelectedSkillId([]);
        setSelectedSkill(null);
        setLevel(3);
        onOpenChange(false);
    };

    const handleSkillTypeChange = (value: 'hard' | 'soft') => {
        setSkillType(value);
        setSelectedSkillId([]);
        setSelectedSkill(null);
    };

    return (
        <Dialog open={open} onOpenChange={(newOpen) => {
            if (!newOpen) {
                handleClose();
            } else {
                onOpenChange(newOpen);
            }
        }}>
            <DialogContent className="sm:max-w-[500px]" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>
                        {t('employees.addSkill', 'Add Skill')}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Skill Type */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                            {t('employees.skillType', 'Skill Type')}
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                type="button"
                                variant={skillType === 'hard' ? 'default' : 'outline'}
                                className="flex-1"
                                onClick={() => handleSkillTypeChange('hard')}
                                disabled={loading}
                            >
                                {t('skills.hardSkill', 'Hard Skill')}
                            </Button>
                            <Button
                                type="button"
                                variant={skillType === 'soft' ? 'default' : 'outline'}
                                className="flex-1"
                                onClick={() => handleSkillTypeChange('soft')}
                                disabled={loading}
                            >
                                {t('skills.softSkill', 'Soft Skill')}
                            </Button>
                        </div>
                    </div>

                    {/* Skill Select */}
                    <div className="space-y-2">
                        <Label htmlFor="skill-select">{t('employees.skill', 'Skill')}</Label>
                        <MultiSelectApi
                            key={skillType}
                            fetchOptions={getOrgSkills}
                            fetchArgs={[orgId, skillType]}
                            optionsKey="skills"
                            customValueKey={(item) => item.id}
                            customLabelKey={(item) => item.name}
                            placeholder={skillType === 'hard'
                                ? t('employees.selectHardSkill', 'Select a hard skill...')
                                : t('employees.selectSoftSkill', 'Select a soft skill...')}
                            searchPlaceholder={skillType === 'hard'
                                ? t('employees.searchHardSkills', 'Search hard skills...')
                                : t('employees.searchSoftSkills', 'Search soft skills...')}
                            emptyText={skillType === 'hard'
                                ? t('employees.noHardSkillsAvailable', 'No hard skills available')
                                : t('employees.noSoftSkillsAvailable', 'No soft skills available')}
                            value={selectedSkillId}
                            onChangeValue={setSelectedSkillId}
                            onChangeValueWithItem={(_value, _itemsMap, lastItem) => {
                                setSelectedSkill(lastItem as Skill);
                            }}
                            maxCount={1}
                            disabled={loading}
                            className="w-full truncate"
                        />
                        {selectedSkill && getSkillDescriptionForLevel(selectedSkill.description, level) && (
                            <p className="text-sm text-muted-foreground">
                                {getSkillDescriptionForLevel(selectedSkill.description, level)}
                            </p>
                        )}
                    </div>

                    {/* Level Slider */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="level-slider">{t('employees.proficiencyLevel', 'Proficiency Level')}</Label>
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

export default EmployeeSkillsAddModal;