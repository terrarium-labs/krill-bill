import React, { useState, useEffect, ReactNode } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormDescription,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import IdBadge from "@/app/components/id-badge";
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';
import { patchOrgSkill, postOrgSkill } from '@/api/orgs/skills/skills';
import { Loader2 } from 'lucide-react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { promptUnsavedChanges } from '@/app/components/forms-elements/modal-unsaved';
import { Skill } from '@/types/general/skills';
import { EMPTY_SKILL_DESCRIPTION } from '@/utils/skills';
import StarsLabel from '@/app/components/labels/stars-label';
import Tag from '@/app/components/tag/tag';

interface SkillEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSkillCreatedOrUpdated?: () => void;
    orgId: string;
    mode: 'create' | 'edit';
    skill?: Skill | null;
    defaultType?: 'hard' | 'soft';
    renderActions?: ReactNode;
}

const descriptionSchema = z.object({
    level_1: z.string().max(500),
    level_2: z.string().max(500),
    level_3: z.string().max(500),
    level_4: z.string().max(500),
    level_5: z.string().max(500),
});

const formSchema = z.object({
    name: z.string()
        .min(1, 'Skill name is required')
        .min(2, 'Skill name must be at least 2 characters')
        .max(64, 'Skill name must be less than 64 characters')
        .trim(),
    type: z.enum(['hard', 'soft']),
    description: descriptionSchema,
});

type FormValues = z.infer<typeof formSchema>;

const LEVEL_KEYS = ['level_1', 'level_2', 'level_3', 'level_4', 'level_5'] as const;

const SkillEditModal: React.FC<SkillEditModalProps> = ({
    open,
    onOpenChange,
    onSkillCreatedOrUpdated,
    orgId,
    mode,
    skill,
    defaultType = 'hard',
    renderActions,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();

    const isEditMode = mode === 'edit';

    const getDefaultValues = (s?: Skill | null): FormValues => {
        const desc = s?.description as Record<string, string> | null | undefined;
        return {
            name: s?.name || '',
            type: (s?.type as 'hard' | 'soft') ?? defaultType,
            description: desc
                ? {
                    level_1: desc.level_1 ?? '',
                    level_2: desc.level_2 ?? '',
                    level_3: desc.level_3 ?? '',
                    level_4: desc.level_4 ?? '',
                    level_5: desc.level_5 ?? '',
                }
                : { ...EMPTY_SKILL_DESCRIPTION },
        };
    };

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: getDefaultValues(skill ?? undefined),
    });

    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            const requestData = {
                name: values.name,
                type: values.type,
                description: values.description,
            };

            let response;
            if (isEditMode) {
                response = await patchOrgSkill(orgId, skill!.id, requestData);
            } else {
                response = await postOrgSkill(orgId, requestData);
            }

            if (response.success) {
                toast.success(
                    isEditMode
                        ? t('skills.updatedSuccess', 'Skill updated successfully')
                        : t('skills.createdSuccess', 'Skill created successfully')
                );

                if (!isEditMode) form.reset();
                onOpenChange(false);
                onSkillCreatedOrUpdated?.();
            } else {
                toast.error(
                    isEditMode
                        ? response.error || t('skills.updateError', 'Failed to update skill')
                        : response.error || t('skills.createError', 'Failed to create skill')
                );
            }
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} skill:`, error);
            toast.error(
                isEditMode
                    ? t('skills.updateError', 'Failed to update skill')
                    : t('skills.createError', 'Failed to create skill')
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenChange = async (open: boolean) => {
        if (!open) {
            if (form.formState.isDirty) {
                const discard = await promptUnsavedChanges();
                if (discard) {
                    if (!isEditMode) form.reset();
                    onOpenChange(false);
                }
            } else {
                if (!isEditMode) form.reset();
                onOpenChange(false);
            }
        } else {
            onOpenChange(true);
        }
    };

    const handleInteractOutside = (e: Event) => {
        if (form.formState.isDirty) {
            e.preventDefault();
            handleOpenChange(false);
        }
    };

    useEffect(() => {
        if (open) {
            form.reset(getDefaultValues(skill != null ? skill : undefined));
        }
    }, [open, skill, form, defaultType]);

    const dialogTitle = isEditMode
        ? t('skills.editSkill', 'Edit Skill')
        : t('skills.createNew', 'Create New Skill');

    const submitButtonText = isEditMode
        ? t('common.update', 'Update')
        : t('common.create', 'Create');

    const loadingText = isEditMode
        ? t('skills.updating', 'Updating...')
        : t('skills.creating', 'Creating...');

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="max-w-lg max-h-[90vh] overflow-y-auto"
                showCloseButton={false}
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                        {isEditMode ? (
                            <div className="flex items-center justify-between w-full">
                                <span className="flex-shrink-0">{dialogTitle}</span>
                                <div className="flex items-center gap-2 ml-auto">
                                    {skill && <IdBadge id={skill.id} />}
                                    {renderActions}
                                </div>
                            </div>
                        ) : (
                            dialogTitle
                        )}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <div className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('skills.name', 'Name')} *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t('skills.namePlaceholder', 'e.g., JavaScript, Project Management, SQL')}
                                            {...field}
                                            disabled={isLoading}
                                            autoFocus
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('skills.type', 'Type')} *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder={t('skills.selectType', 'Select type')} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="hard">
                                                <Tag text="hard" className="capitalize" />
                                            </SelectItem>
                                            <SelectItem value="soft">
                                                <Tag text="soft" className="capitalize" />
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription className="text-xs text-muted-foreground">
                                        {t(
                                            "skills.typeDescription",
                                            "Hard skills are technical or measurable; soft skills are interpersonal or behavioral.",
                                        )}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-3">
                            <div>
                                <FormLabel>{t('skills.levelDescriptions', 'Level descriptions')}</FormLabel>
                                <p className="text-xs text-muted-foreground mt-1.5">
                                    {t(
                                        "skills.levelDescriptionsIntro",
                                        "Describe what each proficiency level means so reviewers can score consistently.",
                                    )}
                                </p>
                            </div>
                            {LEVEL_KEYS.map((key, idx) => {
                                const level = idx + 1;
                                return (
                                    <FormField
                                        key={key}
                                        control={form.control}
                                        name={`description.${key}`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2 text-sm font-normal">
                                                    <span>{t('skills.level', 'Level')} {level}</span>
                                                    <StarsLabel level={level} variant="fill" size="md" />
                                                </FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder={t('skills.levelDescriptionPlaceholder', 'Description for this level')}
                                                        {...field}
                                                        value={field.value ?? ''}
                                                        disabled={isLoading}
                                                        rows={1}
                                                        className="resize-none !min-h-9"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={isLoading}
                        >
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button
                            type="submit"
                            onClick={form.handleSubmit(onSubmit)}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {loadingText}
                                </>
                            ) : (
                                submitButtonText
                            )}
                        </Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default SkillEditModal;
