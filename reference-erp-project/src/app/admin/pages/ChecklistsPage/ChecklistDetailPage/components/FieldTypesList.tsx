import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import * as Icons from 'lucide-react';
import { getFieldTypes, getCategoryLabel } from './field-types';
import { ChecklistFieldTemplate } from '@/types/general/checklist-field';
import { cn } from '@/lib/utils';
import SearchBar from '@/app/components/search-bar';
import { useTranslation } from 'react-i18next';

interface FieldTypesListProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFieldTypeClick: (fieldType: ChecklistFieldTemplate) => void;
}

const FieldTypeItem: React.FC<{
  fieldType: ChecklistFieldTemplate;
  onClick: () => void;
}> = ({ fieldType, onClick }) => {
  const IconComponent = fieldType.icon ? (Icons as any)[fieldType.icon] : null;

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-accent hover:border-accent-foreground/20 transition-all cursor-pointer'
      )}
    >
      {IconComponent && <IconComponent className="h-4 w-4 text-muted-foreground shrink-0" />}
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium truncate">{fieldType.label}</span>
        {fieldType.description && <span className="text-xs text-muted-foreground line-clamp-1">{fieldType.description}</span>}
      </div>
    </div>
  );
};

const FieldTypesList: React.FC<FieldTypesListProps> = ({ searchQuery, onSearchChange, onFieldTypeClick }) => {
  const { t } = useTranslation();
  
  const fieldTypes = React.useMemo(() => getFieldTypes(t), [t]);
  
  const filteredFieldTypes = React.useMemo(() => {
    if (!searchQuery.trim()) return fieldTypes;

    const query = searchQuery.toLowerCase();
    return fieldTypes.filter((field) =>
      field.label.toLowerCase().includes(query) ||
      field.type.toLowerCase().includes(query)
    );
  }, [searchQuery, fieldTypes]);

  const groupedFieldTypes = React.useMemo(() => {
    const groups = filteredFieldTypes.reduce((acc, field) => {
      if (!acc[field.category]) {
        acc[field.category] = [];
      }
      acc[field.category].push(field);
      return acc;
    }, {} as Record<string, ChecklistFieldTemplate[]>);

    return Object.entries(groups).map(([category, fields]) => ({
      category,
      label: getCategoryLabel(category, t),
      fields,
    }));
  }, [filteredFieldTypes, t]);

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-h-[calc(100vh-6rem)] gap-4">
      <SearchBar
        value={searchQuery}
        onChange={(query) => onSearchChange(query)}
        placeholder={t('checklists.searchFields', 'Search fields...')}
      />

      <ScrollArea className="flex-1 -mx-4 px-4 max-h-[calc(100vh-14rem)]">
        <div className="space-y-6">
          {groupedFieldTypes.map((group) => (
            <div key={group.category}>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                {group.label}
              </h4>
              <div className="space-y-2">
                {group.fields.map((fieldType) => (
                  <FieldTypeItem
                    key={fieldType.type}
                    fieldType={fieldType}
                    onClick={() => onFieldTypeClick(fieldType)}
                  />
                ))}
              </div>
            </div>
          ))}

          {groupedFieldTypes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {t('checklists.noFieldTypesFound', 'No field types found')}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default FieldTypesList;

