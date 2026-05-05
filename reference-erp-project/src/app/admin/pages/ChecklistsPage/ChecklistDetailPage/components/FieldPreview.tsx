import React, { useRef, useState } from 'react';
import { useParams } from 'react-router';
import SignatureCanvas from 'react-signature-canvas';
import { ChecklistField } from '@/types/general/checklist-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Upload, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import { postOrgFilesUploader, postOrgFiles } from '@/api/orgs/files/files';
import { uploadFile } from '@/lib/uploaders_timbal';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface FieldPreviewProps {
  field: ChecklistField;
  interactive?: boolean;
  fieldValues?: Record<string, any>;
  onValueChange?: (fieldId: string, value: any) => void;
  /** All checklist fields — needed to resolve multiselect conditions and controller defaults */
  allFields?: ChecklistField[];
  /** When false (e.g. design/builder), all fields stay visible so you can edit them */
  applyConditionalVisibility?: boolean;
}

// Helper function to evaluate a single condition
const normalizeValue = (val: any): string => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  return String(val);
};

const evaluateCondition = (
  condition: {
    fieldId: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
    value: string | number | boolean;
  },
  fieldValue: any,
  controllerField?: ChecklistField
): boolean => {
  const { operator, value } = condition;

  if (controllerField?.type === 'multiselect') {
    const arr = Array.isArray(fieldValue) ? fieldValue.map((v) => String(v)) : [];
    const want = String(value);
    switch (operator) {
      case 'equals':
        return arr.length === 1 && arr[0] === want;
      case 'not_equals':
        return !(arr.length === 1 && arr[0] === want);
      case 'contains':
        return arr.includes(want);
      case 'greater_than':
        return arr.some((v) => Number(v) > Number(value));
      case 'less_than':
        return arr.some((v) => Number(v) < Number(value));
      case 'is_empty':
        return arr.length === 0;
      case 'is_not_empty':
        return arr.length > 0;
      default:
        return true;
    }
  }

  const normalizedFieldValue = normalizeValue(fieldValue);
  const normalizedConditionValue = normalizeValue(value);

  switch (operator) {
    case 'equals':
      return normalizedFieldValue === normalizedConditionValue;
    case 'not_equals':
      return normalizedFieldValue !== normalizedConditionValue;
    case 'contains':
      return normalizedFieldValue.toLowerCase().includes(normalizedConditionValue.toLowerCase());
    case 'greater_than':
      return Number(fieldValue) > Number(value);
    case 'less_than':
      return Number(fieldValue) < Number(value);
    case 'is_empty':
      return !fieldValue || fieldValue === '' || (Array.isArray(fieldValue) && fieldValue.length === 0);
    case 'is_not_empty':
      return !!fieldValue && fieldValue !== '' && (!Array.isArray(fieldValue) || fieldValue.length > 0);
    default:
      return true;
  }
};

function effectiveConditionFieldValue(
  fieldId: string,
  fieldValues: Record<string, any>,
  allFields: ChecklistField[]
): any {
  if (Object.prototype.hasOwnProperty.call(fieldValues, fieldId)) {
    return fieldValues[fieldId];
  }
  const controller = allFields.find((f) => f.id === fieldId);
  if (controller?.defaultValue !== undefined) {
    return controller.defaultValue;
  }
  if (controller?.type === 'checkbox' || controller?.type === 'switch') {
    return false;
  }
  return undefined;
}

// Helper function to evaluate all conditions for a field
const shouldShowField = (
  field: ChecklistField,
  fieldValues: Record<string, any>,
  allFields: ChecklistField[]
): boolean => {
  if (!field.conditionalLogic?.enabled || !field.conditionalLogic.conditions || field.conditionalLogic.conditions.length === 0) {
    return true; // Show by default if no conditional logic
  }

  const { conditions, action = 'show' } = field.conditionalLogic;

  let result = true;
  for (let i = 0; i < conditions.length; i++) {
    const condition = conditions[i];
    const controllerField = allFields.find((f) => f.id === condition.fieldId);
    const fieldValue = effectiveConditionFieldValue(condition.fieldId, fieldValues, allFields);
    const conditionMet = evaluateCondition(condition, fieldValue, controllerField);

    if (i === 0) {
      result = conditionMet;
    } else {
      const logic = condition.logic || 'AND';
      if (logic === 'AND') {
        result = result && conditionMet;
      } else {
        result = result || conditionMet;
      }
    }
  }

  return action === 'show' ? result : !result;
};

const FieldPreview: React.FC<FieldPreviewProps> = ({
  field,
  interactive = false,
  fieldValues = {},
  onValueChange,
  allFields = [],
  applyConditionalVisibility = true,
}) => {
  const { orgId } = useParams<{ orgId: string }>();
  const { t } = useTranslation();

  // All hooks must be called at the top level, before any returns
  // State for file upload
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; url: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for signature
  const signatureRef = useRef<SignatureCanvas>(null);

  // State for rating hover (visual feedback only)
  const [ratingHover, setRatingHover] = useState<number>(0);

  const fieldList = allFields.length > 0 ? allFields : [field];
  const shouldShow = applyConditionalVisibility
    ? shouldShowField(field, fieldValues, fieldList)
    : true;

  // If in preview mode and field should be hidden, don't render
  if (!shouldShow) {
    return null;
  }

  const handleFileUpload = async (files: FileList) => {
    if (!orgId || !interactive || uploading) return;

    setUploading(true);
    const fileArray = Array.from(files);

    try {
      for (const file of fileArray) {
        // Get uploader from server
        const uploaderResponse = await postOrgFilesUploader(orgId, {
          name: file.name,
          entity_id: 'checklist',
          content_type: file.type,
          content_length: file.size,
          path: null,
        });

        if (!uploaderResponse.success) {
          throw new Error('Failed to get uploader');
        }

        // Upload file to S3
        const contentUrl = await uploadFile(
          uploaderResponse.success.uploader,
          file,
          (progress: number) => {
            console.log(`Upload progress: ${progress}%`);
          }
        );

        if (!contentUrl) {
          throw new Error('Failed to upload file');
        }

        // Create file record
        const fileResponse = await postOrgFiles(orgId, {
          name: file.name,
          is_dir: false,
          path: null,
          entity_id: 'checklist',
          url: contentUrl,
          content_length: file.size,
        });

        if (fileResponse.success) {
          setUploadedFiles((prev) => [
            ...prev,
            { name: file.name, url: contentUrl as string },
          ]);
          toast.success(t('checklists.fileUploadedSuccess', '{{fileName}} uploaded successfully', { fileName: file.name }));
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(t('checklists.fileUploadFailed', 'Failed to upload file'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearSignature = () => {
    signatureRef.current?.clear();
  };

  const renderFieldInput = () => {
    const commonProps = {
      disabled: !interactive,
      placeholder: field.placeholder,
    };

    switch (field.type) {
      case 'text-input':
        return <Input
          type="text"
          {...commonProps}
          onChange={(e) => onValueChange?.(field.id, e.target.value)}
          value={fieldValues[field.id] || ''}
        />;

      case 'email':
      case 'url':
        return <Input
          type={field.type}
          {...commonProps}
          onChange={(e) => onValueChange?.(field.id, e.target.value)}
          value={fieldValues[field.id] || ''}
        />;

      case 'password':
        return <Input
          type="password"
          {...commonProps}
          onChange={(e) => onValueChange?.(field.id, e.target.value)}
          value={fieldValues[field.id] || ''}
        />;

      case 'number':
        return (
          <Input
            type="number"
            min={field.min}
            max={field.max}
            step={field.step}
            {...commonProps}
            onChange={(e) => onValueChange?.(field.id, e.target.value)}
            value={fieldValues[field.id] || ''}
          />
        );

      case 'phone':
        return <Input
          type="tel"
          {...commonProps}
          onChange={(e) => onValueChange?.(field.id, e.target.value)}
          value={fieldValues[field.id] || ''}
        />;

      case 'textarea':
        return <Textarea
          rows={field.rows || 4}
          {...commonProps}
          onChange={(e) => onValueChange?.(field.id, e.target.value)}
          value={fieldValues[field.id] || ''}
        />;

      case 'date':
      case 'time':
      case 'datetime':
        return (
          <Input
            type={field.type === 'datetime' ? 'datetime-local' : field.type}
            {...commonProps}
            onChange={(e) => onValueChange?.(field.id, e.target.value)}
            value={fieldValues[field.id] || ''}
          />
        );

      case 'select': {
        const sel = fieldValues[field.id];
        const selectValue =
          sel !== undefined && sel !== null && String(sel) !== '' ? String(sel) : undefined;
        return (
          <Select
            disabled={!interactive}
            value={selectValue}
            onValueChange={(value) => onValueChange?.(field.id, value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={field.placeholder || t('checklists.selectAnOption', 'Select an option')} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }

      case 'multiselect':
        return (
          <MultiSelect
            options={field.options || []}
            selected={fieldValues[field.id] || []}
            onChange={(values) => onValueChange?.(field.id, values)}
            placeholder={field.placeholder || t('checklists.selectOptions', 'Select options...')}
            disabled={!interactive}
            className="w-full"
          />
        );

      case 'radio': {
        const rv = fieldValues[field.id];
        const radioValue =
          rv !== undefined && rv !== null && String(rv) !== '' ? String(rv) : undefined;
        return (
          <RadioGroup
            disabled={!interactive}
            value={radioValue}
            onValueChange={(value) => onValueChange?.(field.id, value)}
          >
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                <Label htmlFor={`${field.id}-${option.value}`} className="text-sm font-normal">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
      }

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              disabled={!interactive}
              checked={fieldValues[field.id] || false}
              onCheckedChange={(checked) => onValueChange?.(field.id, checked)}
            />
            <Label htmlFor={field.id} className="text-sm font-normal">
              {field.description || t('checklists.checkThisOption', 'Check this option')}
            </Label>
          </div>
        );

      case 'switch':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={field.id}
              disabled={!interactive}
              checked={fieldValues[field.id] || false}
              onCheckedChange={(checked) => onValueChange?.(field.id, checked)}
            />
            <Label htmlFor={field.id} className="text-sm font-normal">
              {field.description || t('checklists.toggleThisOption', 'Toggle this option')}
            </Label>
          </div>
        );

      case 'slider':
        return (
          <div className="space-y-2">
            <Slider
              disabled={!interactive}
              min={field.min || 0}
              max={field.max || 100}
              step={field.step || 1}
              value={[fieldValues[field.id] !== undefined ? fieldValues[field.id] : (field.defaultValue as number || field.min || 0)]}
              onValueChange={(values) => onValueChange?.(field.id, values[0])}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{field.min || 0}</span>
              <span>{field.max || 100}</span>
            </div>
          </div>
        );

      case 'rating':
        const ratingValue = fieldValues[field.id] || 0;
        return (
          <div className="flex gap-1">
            {Array.from({ length: field.max || 5 }).map((_, i) => {
              const starValue = i + 1;
              const isFilled = starValue <= (ratingHover || ratingValue);
              return (
                <Star
                  key={i}
                  className={cn(
                    'h-5 w-5 transition-colors',
                    interactive && 'cursor-pointer',
                    isFilled ? 'fill-yellow-400 text-yellow-400' : 'text-muted stroke-muted-foreground',
                    interactive && 'hover:scale-110'
                  )}
                  onClick={() => {
                    if (interactive) {
                      onValueChange?.(field.id, starValue);
                    }
                  }}
                  onMouseEnter={() => {
                    if (interactive) {
                      setRatingHover(starValue);
                    }
                  }}
                  onMouseLeave={() => {
                    if (interactive) {
                      setRatingHover(0);
                    }
                  }}
                />
              );
            })}
          </div>
        );

      case 'file':
        return (
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={field.accept || '*'}
              multiple={field.multiple || false}
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  handleFileUpload(e.target.files);
                }
              }}
              disabled={!interactive || uploading}
            />
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-4 text-center transition-colors",
                interactive && !uploading && "cursor-pointer hover:border-primary hover:bg-accent/50",
                uploading && "opacity-50"
              )}
              onClick={() => {
                if (interactive && !uploading) {
                  fileInputRef.current?.click();
                }
              }}
            >
              {uploading ? (
                <Loader2 className="h-8 w-8 mx-auto text-muted-foreground mb-2 animate-spin" />
              ) : (
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              )}
              <p className="text-sm text-muted-foreground">
                {uploading
                  ? t('checklists.uploading', 'Uploading...')
                  : field.placeholder || t('checklists.clickToUpload', 'Click to upload or drag and drop')}
              </p>
              {field.accept && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t('checklists.accepted', 'Accepted')}: {field.accept}
                </p>
              )}
            </div>
            {uploadedFiles.length > 0 && (
              <div className="space-y-1">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-secondary rounded-md text-sm"
                  >
                    <span className="truncate flex-1">{file.name}</span>
                    {interactive && (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeUploadedFile(index);
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'signature':
        return (
          <div className="space-y-2">
            <div className="border-2 border-dashed rounded-lg bg-muted/30 overflow-hidden">
              {interactive ? (
                <SignatureCanvas
                  ref={signatureRef}
                  canvasProps={{
                    className: 'w-full h-40 cursor-crosshair',
                  }}
                  backgroundColor="transparent"
                />
              ) : (
                <div className="p-8 text-center h-40 flex flex-col items-center justify-center">
                  <Icons.PenTool className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {field.placeholder || t('checklists.signHere', 'Sign here')}
                  </p>
                </div>
              )}
            </div>
            {interactive && (
              <Button
                size="sm"
                variant="outline"
                onClick={clearSignature}
                className="w-full"
              >
                {t('checklists.clearSignature', 'Clear Signature')}
              </Button>
            )}
          </div>
        );

      case 'section-header':
      case 'heading':
      case 'separator':
      case 'text':
        return null; // These don't have inputs

      default:
        return <Input {...commonProps} />;
    }
  };

  // Layout field types
  if (field.type === 'section-header') {
    return (
      <div className="space-y-1 py-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          {field.label}
        </h3>
        {field.description && (
          <p className="text-sm text-muted-foreground">{field.description}</p>
        )}
      </div>
    );
  }

  if (field.type === 'heading') {
    return (
      <div className="py-1">
        <h4 className="text-base font-semibold">{field.label}</h4>
      </div>
    );
  }

  if (field.type === 'separator') {
    return (
      <div className="py-2">
        <div className="border-t border-border" />
      </div>
    );
  }

  if (field.type === 'text') {
    return (
      <div className="py-1">
        <p className="text-sm text-muted-foreground">{field.label}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 w-full">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.conditionalLogic?.enabled && !interactive && (
              <Badge variant="outline" className="text-xs">
                {t('checklists.conditional', 'Conditional')}
              </Badge>
            )}
          </div>
          {field.description && field.type !== 'checkbox' && field.type !== 'switch' && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
          {renderFieldInput()}
        </div>
      </div>
    </div>
  );
};

export default FieldPreview;

