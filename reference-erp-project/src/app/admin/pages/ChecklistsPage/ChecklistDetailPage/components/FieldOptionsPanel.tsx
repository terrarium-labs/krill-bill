import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical, ListTodo } from 'lucide-react';
import { ChecklistField, SelectOption } from '@/types/general/checklist-field';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

interface FieldOptionsPanelProps {
    field: ChecklistField | null;
    allFields: ChecklistField[];
    onFieldUpdate: (field: ChecklistField) => void;
}

const FieldOptionsPanel: React.FC<FieldOptionsPanelProps> = ({
    field,
    allFields,
    onFieldUpdate,
}) => {
    const { t } = useTranslation();

    // State for new condition form
    const [newConditionAction, setNewConditionAction] = useState<'show' | 'hide'>('show');
    const [newConditionFieldId, setNewConditionFieldId] = useState<string>('');
    const [newConditionOperator, setNewConditionOperator] = useState<'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty'>('equals');
    const [newConditionValue, setNewConditionValue] = useState<string>('');
    const [newConditionLogic, setNewConditionLogic] = useState<'AND' | 'OR'>('AND');

    if (!field) {
        return (
            <div className="flex flex-col h-[calc(100vh-10rem)] max-h-[calc(100vh-10rem)] gap-4 border border-border rounded-lg p-4">
                <div className="text-center py-4 justify-center items-center h-full flex flex-col gap-2 pt-8">
                    <ListTodo className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <h3 className="text-md font-medium text-muted-foreground">
                        {t('checklists.noFieldSelected', 'No field selected')}
                    </h3>
                    <p className="text-muted-foreground mb-4 text-sm max-w-56 mx-auto">
                        {t('checklists.clickOnFieldToEdit', 'Click on a field to edit its properties')}
                    </p>
                </div>
            </div>
        );
    }

    const updateField = (updates: Partial<ChecklistField>) => {
        onFieldUpdate({ ...field, ...updates });
    };

    const updateOption = (index: number, updates: Partial<SelectOption>) => {
        const newOptions = [...(field.options || [])];
        newOptions[index] = { ...newOptions[index], ...updates };
        updateField({ options: newOptions });
    };

    const addOption = () => {
        const newOptions = [...(field.options || [])];
        newOptions.push({
            label: t('checklists.option', 'Option {{number}}', { number: newOptions.length + 1 }),
            value: `option${newOptions.length + 1}`,
        });
        updateField({ options: newOptions });
    };

    const removeOption = (index: number) => {
        const newOptions = field.options?.filter((_, i) => i !== index) || [];
        updateField({ options: newOptions });
    };

    const addCondition = () => {
        if (!newConditionFieldId) return;

        const newCondition = {
            fieldId: newConditionFieldId,
            operator: newConditionOperator,
            value: newConditionValue,
            logic: newConditionLogic,
        };

        const currentConditions = field.conditionalLogic?.conditions || [];
        updateField({
            conditionalLogic: {
                enabled: field.conditionalLogic?.enabled || true,
                conditions: [...currentConditions, newCondition],
                action: field.conditionalLogic?.action || newConditionAction,
            },
        });

        // Reset form
        setNewConditionFieldId('');
        setNewConditionValue('');
    };

    const removeCondition = (index: number) => {
        const newConditions = field.conditionalLogic?.conditions?.filter((_, i) => i !== index) || [];
        updateField({
            conditionalLogic: {
                ...field.conditionalLogic!,
                conditions: newConditions,
            },
        });
    };

    const updateConditionAction = (action: 'show' | 'hide') => {
        updateField({
            conditionalLogic: {
                ...field.conditionalLogic!,
                action,
            },
        });
        setNewConditionAction(action);
    };

    const hasOptions = ['select', 'multiselect', 'radio'].includes(field.type);
    const hasMinMax = ['number', 'slider', 'rating'].includes(field.type);
    const hasRows = field.type === 'textarea';
    const hasAccept = field.type === 'file';
    const layoutFieldTypes = ['section-header', 'heading', 'separator', 'text'];
    const supportsConditional = !layoutFieldTypes.includes(field.type);
    const isLayoutField = layoutFieldTypes.includes(field.type);

    return (
        <div className="flex flex-col h-[calc(100vh-10rem)] max-h-[calc(100vh-10rem)] gap-4 border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium">{t('checklists.fieldProperties', 'Field Properties')}</h3>

            <ScrollArea className="flex-1 -mx-4 px-4 max-h-[calc(100vh-15.5rem)] h-full">
                <div className="space-y-4">
                    {/* Basic Properties */}
                    <div className="space-y-3 px-1">
                        <div>
                            <Label htmlFor="field-label" className="text-sm font-medium">
                                {t('checklists.label', 'Label')}
                            </Label>
                            <Input
                                id="field-label"
                                value={field.label}
                                onChange={(e) => updateField({ label: e.target.value })}
                                placeholder={t('checklists.fieldLabel', 'Field label')}
                                className="mt-1.5"
                            />
                        </div>

                        <div>
                            <Label htmlFor="field-description" className="text-sm font-medium">
                                {t('checklists.description', 'Description')}
                            </Label>
                            <Textarea
                                id="field-description"
                                value={field.description || ''}
                                onChange={(e) => updateField({ description: e.target.value })}
                                placeholder={t('checklists.optionalDescription', 'Optional description')}
                                rows={2}
                                className="mt-1.5"
                            />
                        </div>

                        {!isLayoutField && field.type !== 'checkbox' && field.type !== 'switch' && (
                            <div>
                                <Label htmlFor="field-placeholder" className="text-sm font-medium">
                                    {t('checklists.placeholder', 'Placeholder')}
                                </Label>
                                <Input
                                    id="field-placeholder"
                                    value={field.placeholder || ''}
                                    onChange={(e) => updateField({ placeholder: e.target.value })}
                                    placeholder={t('checklists.placeholderText', 'Placeholder text')}
                                    className="mt-1.5"
                                />
                            </div>
                        )}

                        {supportsConditional && (
                            <div className="flex items-center justify-between">
                                <Label htmlFor="field-required" className="text-sm font-medium">
                                    {t('checklists.requiredField', 'Required Field')}
                                </Label>
                                <Switch
                                    id="field-required"
                                    checked={field.required || false}
                                    onCheckedChange={(checked) => updateField({ required: checked })}
                                />
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Field-Specific Options */}
                    {hasOptions && (
                        <div className="space-y-3 px-1">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">{t('checklists.options', 'Options')}</Label>
                                <Button size="sm" variant="outline" onClick={addOption} className="h-7">
                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                    {t('checklists.add', 'Add')}
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {field.options?.map((option, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <Input
                                            value={option.label}
                                            onChange={(e) => updateOption(index, { label: e.target.value })}
                                            placeholder={t('checklists.label', 'Label')}
                                            className="flex-1"
                                        />
                                        <Button
                                            size="icon-sm"
                                            variant="ghost"
                                            onClick={() => removeOption(index)}
                                            disabled={field.options!.length <= 1}
                                        >
                                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {hasMinMax && (
                        <div className="grid grid-cols-2 gap-3 px-1">
                            <div>
                                <Label htmlFor="field-min" className="text-sm font-medium">
                                    {t('checklists.minValue', 'Min Value')}
                                </Label>
                                <Input
                                    id="field-min"
                                    type="number"
                                    value={field.min || 0}
                                    onChange={(e) => updateField({ min: Number(e.target.value) })}
                                    className="mt-1.5"
                                />
                            </div>
                            <div>
                                <Label htmlFor="field-max" className="text-sm font-medium">
                                    {t('checklists.maxValue', 'Max Value')}
                                </Label>
                                <Input
                                    id="field-max"
                                    type="number"
                                    value={field.max || 100}
                                    onChange={(e) => updateField({ max: Number(e.target.value) })}
                                    className="mt-1.5"
                                />
                            </div>
                        </div>
                    )}

                    {field.type === 'slider' && (
                        <div className="px-1">
                            <Label htmlFor="field-step" className="text-sm font-medium">
                                {t('checklists.step', 'Step')}
                            </Label>
                            <Input
                                id="field-step"
                                type="number"
                                value={field.step || 1}
                                onChange={(e) => updateField({ step: Number(e.target.value) })}
                                className="mt-1.5"
                                min="1"
                            />
                        </div>
                    )}

                    {hasRows && (
                        <div className="px-1">
                            <Label htmlFor="field-rows" className="text-sm font-medium">
                                {t('checklists.rows', 'Rows')}
                            </Label>
                            <Input
                                id="field-rows"
                                type="number"
                                value={field.rows || 4}
                                onChange={(e) => updateField({ rows: Number(e.target.value) })}
                                className="mt-1.5"
                                min="2"
                                max="20"
                            />
                        </div>
                    )}

                    {hasAccept && (
                        <div className="px-1">
                            <div>
                                <Label htmlFor="field-accept" className="text-sm font-medium">
                                    {t('checklists.acceptedFileTypes', 'Accepted File Types')}
                                </Label>
                                <Input
                                    id="field-accept"
                                    value={field.accept || '*'}
                                    onChange={(e) => updateField({ accept: e.target.value })}
                                    placeholder={t('checklists.fileTypesPlaceholder', 'e.g., .pdf,.doc,.docx')}
                                    className="mt-1.5"
                                />
                                <p className="text-sm text-muted-foreground mt-1">
                                    {t('checklists.fileTypesHint', 'Use * for all files, or specify extensions')}
                                </p>
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="field-multiple" className="text-sm font-medium">
                                    {t('checklists.allowMultipleFiles', 'Allow Multiple Files')}
                                </Label>
                                <Switch
                                    id="field-multiple"
                                    checked={field.multiple || false}
                                    onCheckedChange={(checked) => updateField({ multiple: checked })}
                                />
                            </div>
                        </div>
                    )}

                    {(hasOptions || hasMinMax || hasRows || hasAccept) && <Separator />}

                    {/* Conditional Logic */}
                    {supportsConditional && (
                        <Accordion type="single" collapsible className="border rounded-lg">
                            <AccordionItem value="conditional" className="border-none">
                                <AccordionTrigger className="px-3 py-2 hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{t('checklists.conditionalLogic', 'Conditional Logic')}</span>
                                        {field.conditionalLogic?.enabled && (
                                            <Badge variant="secondary" className="text-sm">
                                                {t('checklists.active', 'Active')}
                                            </Badge>
                                        )}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-3 pb-3">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="conditional-enabled" className="text-sm font-medium">
                                                {t('checklists.enableConditionalLogic', 'Enable Conditional Logic')}
                                            </Label>
                                            <Switch
                                                id="conditional-enabled"
                                                checked={field.conditionalLogic?.enabled || false}
                                                onCheckedChange={(checked) =>
                                                    updateField({
                                                        conditionalLogic: {
                                                            enabled: checked,
                                                            conditions: field.conditionalLogic?.conditions || [],
                                                            action: field.conditionalLogic?.action || 'show',
                                                        },
                                                    })
                                                }
                                            />
                                        </div>

                                        {field.conditionalLogic?.enabled && (
                                            <div className="space-y-3 pt-2">
                                                {/* Action selector - Show/Hide (General Setting) */}
                                                <div className="space-y-2">
                                                    <Label className="text-xs text-muted-foreground">
                                                        {t('checklists.conditionalAction', 'Conditional Action')}
                                                    </Label>
                                                    <Select
                                                        value={field.conditionalLogic.action || 'show'}
                                                        onValueChange={(value) => updateConditionAction(value as 'show' | 'hide')}
                                                    >
                                                        <SelectTrigger className="h-8 w-full">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="show">{t('checklists.showField', 'Show field')}</SelectItem>
                                                            <SelectItem value="hide">{t('checklists.hideField', 'Hide field')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <p className="text-xs text-muted-foreground">
                                                        {field.conditionalLogic.action === 'hide'
                                                            ? t('checklists.hideFieldWhen', 'Hide this field when conditions are met')
                                                            : t('checklists.showFieldWhen', 'Show this field when conditions are met')}
                                                    </p>
                                                </div>

                                                <Separator />

                                                {/* Existing Conditions */}
                                                {field.conditionalLogic.conditions && field.conditionalLogic.conditions.length > 0 && (
                                                    <>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs text-muted-foreground">
                                                                {t('checklists.existingConditions', 'Existing Conditions')}
                                                            </Label>
                                                            {field.conditionalLogic.conditions.map((condition, index) => {
                                                                const conditionField = allFields.find((f) => f.id === condition.fieldId);
                                                                const displayValue = (() => {
                                                                    if (['is_empty', 'is_not_empty'].includes(condition.operator)) return null;
                                                                    if (conditionField && ['select', 'multiselect', 'radio'].includes(conditionField.type)) {
                                                                        const option = conditionField.options?.find((o) => o.value === String(condition.value));
                                                                        return option?.label || String(condition.value);
                                                                    }
                                                                    if (conditionField && ['checkbox', 'switch'].includes(conditionField.type)) {
                                                                        return condition.value === 'true' || condition.value === true
                                                                            ? t('checklists.true', 'True')
                                                                            : t('checklists.false', 'False');
                                                                    }
                                                                    return String(condition.value);
                                                                })();
                                                                return (
                                                                    <div
                                                                        key={index}
                                                                        className="flex items-center gap-2 p-2 bg-muted rounded-md text-xs"
                                                                    >
                                                                        {index > 0 && (
                                                                            <Badge variant="outline" className="text-xs">
                                                                                {condition.logic || 'AND'}
                                                                            </Badge>
                                                                        )}
                                                                        <div className="flex-1">
                                                                            <span className="font-medium">
                                                                                {conditionField?.label || t('checklists.unknownField', 'Unknown field')}
                                                                            </span>{' '}
                                                                            <span className="text-muted-foreground">
                                                                                {condition.operator.replace('_', ' ')}
                                                                            </span>{' '}
                                                                            {displayValue !== null && (
                                                                                <span className="font-medium">{displayValue}</span>
                                                                            )}
                                                                        </div>
                                                                        <Button
                                                                            size="icon-sm"
                                                                            variant="ghost"
                                                                            onClick={() => removeCondition(index)}
                                                                        >
                                                                            <Trash2 className="h-3 w-3 text-destructive" />
                                                                        </Button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        <Separator />
                                                    </>
                                                )}

                                                {/* Add New Condition */}
                                                <div className="space-y-2">
                                                    <Label className="text-xs text-muted-foreground">
                                                        {t('checklists.addNewCondition', 'Add New Condition')}
                                                    </Label>

                                                    {/* Logic selector (AND/OR) - only show if there are existing conditions */}
                                                    {field.conditionalLogic.conditions && field.conditionalLogic.conditions.length > 0 && (
                                                        <Select value={newConditionLogic} onValueChange={(value) => setNewConditionLogic(value as 'AND' | 'OR')}>
                                                            <SelectTrigger className="h-8 w-full">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="AND">{t('checklists.and', 'AND')}</SelectItem>
                                                                <SelectItem value="OR">{t('checklists.or', 'OR')}</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    )}

                                                    {/* Field selector */}
                                                    <Select value={newConditionFieldId} onValueChange={(value) => { setNewConditionFieldId(value); setNewConditionValue(''); }}>
                                                        <SelectTrigger className="h-8 w-full">
                                                            <SelectValue placeholder={t('checklists.selectField', 'Select a field')} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {allFields
                                                                .filter((f) => f.id !== field.id && !layoutFieldTypes.includes(f.type))
                                                                .map((f) => (
                                                                    <SelectItem key={f.id} value={f.id}>
                                                                        {f.label}
                                                                    </SelectItem>
                                                                ))}
                                                        </SelectContent>
                                                    </Select>

                                                    {/* Operator selector */}
                                                    <Select value={newConditionOperator} onValueChange={(value) => setNewConditionOperator(value as any)}>
                                                        <SelectTrigger className="h-8 w-full">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="equals">{t('checklists.equals', 'Equals')}</SelectItem>
                                                            <SelectItem value="not_equals">{t('checklists.notEquals', 'Not equals')}</SelectItem>
                                                            <SelectItem value="contains">{t('checklists.contains', 'Contains')}</SelectItem>
                                                            <SelectItem value="greater_than">{t('checklists.greaterThan', 'Greater than')}</SelectItem>
                                                            <SelectItem value="less_than">{t('checklists.lessThan', 'Less than')}</SelectItem>
                                                            <SelectItem value="is_empty">{t('checklists.isEmpty', 'Is empty')}</SelectItem>
                                                            <SelectItem value="is_not_empty">{t('checklists.isNotEmpty', 'Is not empty')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>

                                                    {/* Value input - hide for is_empty and is_not_empty */}
                                                    {!['is_empty', 'is_not_empty'].includes(newConditionOperator) && (() => {
                                                        const conditionField = allFields.find((f) => f.id === newConditionFieldId);
                                                        const hasSelectOptions = conditionField && ['select', 'multiselect', 'radio'].includes(conditionField.type) && conditionField.options;
                                                        const isBooleanField = conditionField && ['checkbox', 'switch'].includes(conditionField.type);

                                                        if (hasSelectOptions) {
                                                            return (
                                                                <Select value={newConditionValue} onValueChange={setNewConditionValue}>
                                                                    <SelectTrigger className="h-8 w-full">
                                                                        <SelectValue placeholder={t('checklists.selectValue', 'Select a value')} />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {conditionField.options!.map((opt) => (
                                                                            <SelectItem key={opt.value} value={opt.value}>
                                                                                {opt.label}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            );
                                                        }

                                                        if (isBooleanField) {
                                                            return (
                                                                <Select value={newConditionValue} onValueChange={setNewConditionValue}>
                                                                    <SelectTrigger className="h-8 w-full">
                                                                        <SelectValue placeholder={t('checklists.selectValue', 'Select a value')} />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="true">{t('checklists.true', 'True')}</SelectItem>
                                                                        <SelectItem value="false">{t('checklists.false', 'False')}</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            );
                                                        }

                                                        return (
                                                            <Input
                                                                placeholder={t('checklists.value', 'Value')}
                                                                className="h-8 w-full"
                                                                value={newConditionValue}
                                                                onChange={(e) => setNewConditionValue(e.target.value)}
                                                            />
                                                        );
                                                    })()}
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="w-full h-7"
                                                    onClick={addCondition}
                                                    disabled={!newConditionFieldId}
                                                >
                                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                                    {t('checklists.addCondition', 'Add Condition')}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    )}

                </div>
            </ScrollArea>
        </div>
    );
};

export default FieldOptionsPanel;

