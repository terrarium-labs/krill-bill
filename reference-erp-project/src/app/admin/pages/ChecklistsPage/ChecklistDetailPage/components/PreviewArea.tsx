import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import * as Icons from 'lucide-react';
import { GripVertical, Trash2, Copy, Eye, Code2 } from 'lucide-react';
import { ChecklistField } from '@/types/general/checklist-field';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';
import FieldPreview from './FieldPreview';
import { useTranslation } from 'react-i18next';

interface PreviewAreaProps {
  fields: ChecklistField[];
  selectedFieldId: string | null;
  activeId?: string | null;
  onFieldSelect: (fieldId: string | null) => void;
  onFieldDelete: (fieldId: string) => void;
  onFieldDuplicate: (fieldId: string) => void;
  onFieldsReorder: (fields: ChecklistField[]) => void;
}


const SortableFieldCard: React.FC<{
  field: ChecklistField;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  fieldValues: Record<string, any>;
  onValueChange?: (fieldId: string, value: any) => void;
  allFields: ChecklistField[];
  applyConditionalVisibility: boolean;
}> = ({ field, isSelected, onSelect, onDelete, onDuplicate, fieldValues, onValueChange, allFields, applyConditionalVisibility }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative border rounded-lg bg-background transition-all',
        isSelected && 'ring-2 ring-primary border-primary shadow-sm',
        isDragging && 'opacity-50 shadow-xl'
      )}
    >
      <div
        className="flex items-start gap-2 p-3 cursor-pointer hover:bg-accent/50 rounded-lg"
        onClick={onSelect}
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing pt-1 hover:text-primary"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          <FieldPreview
            field={field}
            fieldValues={fieldValues}
            onValueChange={onValueChange}
            allFields={allFields}
            applyConditionalVisibility={applyConditionalVisibility}
          />
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const PreviewArea: React.FC<PreviewAreaProps> = ({
  fields,
  selectedFieldId,
  onFieldSelect,
  onFieldDelete,
  onFieldDuplicate,
  onFieldsReorder,
}) => {
  const [activeView, setActiveView] = useState<'design' | 'preview'>('design');
  const [activeId, setActiveId] = useState<string | null>(null);
  // Field values state for tracking form data in preview mode
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const { t } = useTranslation();

  const handleValueChange = (fieldId: string, value: any) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  // Clear selected field when switching to preview mode
  useEffect(() => {
    if (activeView === 'preview') {
      onFieldSelect(null);
    }
  }, [activeView, onFieldSelect]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // Can be used for visual feedback in the future
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newFields = [...fields];
      const [moved] = newFields.splice(oldIndex, 1);
      newFields.splice(newIndex, 0, moved);
      onFieldsReorder(newFields);
    }
  };

  const activeField = fields.find((f) => f.id === activeId);

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-h-[calc(100vh-10rem)] gap-4 border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">{t('checklists.preview', 'Checklist builder')}</h3>
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'design' | 'preview')}>
          <TabsList className="h-8">
            <TabsTrigger value="design">
              <Code2 className="h-4 w-4 shrink-0" />
              {t('checklists.design', 'Design')}
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 shrink-0" />
              {t('checklists.preview', 'Preview')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-4 justify-center items-center h-full flex flex-col gap-2 pb-16">
          <Icons.MousePointerClick className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <h3 className="text-md font-medium text-muted-foreground">
            {t('checklists.noFieldsYet', 'No fields yet')}
          </h3>
          <p className="text-muted-foreground mb-4 text-xs max-w-56 mx-auto">
            {t('checklists.clickOnFieldTypes', 'Click on field types from the left panel to start building your checklist')}
          </p>
        </div>
      ) : (
        <ScrollArea className="flex-1 -mx-4 px-4 max-h-[calc(100vh-15.5rem)] h-full">
          {activeView === 'design' ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3 p-2">
                  {fields.map((field) => (
                    <SortableFieldCard
                      key={field.id}
                      field={field}
                      isSelected={selectedFieldId === field.id}
                      onSelect={() => onFieldSelect(field.id)}
                      onDelete={() => onFieldDelete(field.id)}
                      onDuplicate={() => onFieldDuplicate(field.id)}
                      fieldValues={fieldValues}
                      onValueChange={handleValueChange}
                      allFields={fields}
                      applyConditionalVisibility={false}
                    />
                  ))}
                </div>
              </SortableContext>
              {createPortal(
                <DragOverlay>
                  {activeField ? (
                    <div className="border rounded-lg bg-background shadow-xl ring-2 ring-primary/50 w-[600px] max-w-[600px]">
                      <div className="flex items-start gap-2 p-3">
                        <GripVertical className="h-4 w-4 text-primary" />
                        <div className="flex-1 min-w-0">
                          <FieldPreview
                            field={activeField}
                            fieldValues={fieldValues}
                            onValueChange={handleValueChange}
                            allFields={fields}
                            applyConditionalVisibility={false}
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}
                </DragOverlay>,
                document.body
              )}
            </DndContext>
          ) : (
            <div className="p-2 space-y-4">
              {fields.map((field) => (
                <FieldPreview
                  key={field.id}
                  field={field}
                  interactive
                  fieldValues={fieldValues}
                  onValueChange={handleValueChange}
                  allFields={fields}
                  applyConditionalVisibility
                />
              ))}
            </div>
          )}
        </ScrollArea>
      )}
    </div>
  );
};

export default PreviewArea;
