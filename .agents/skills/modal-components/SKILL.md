# Modal Components Skill

## Overview
This skill documents the pattern for creating and maintaining modal dialogs in Krill Bill. Modals are used for creating, editing, and configuring data with proper validation and error handling.

## File Location
Modal components are stored in `/src/app/components/modals/` with clear naming:
- `client-modal.tsx` - Create/edit clients
- `invoice-modal.tsx` - Create invoices with split layout
- `serial-number-modal.tsx` - Create/edit serial number patterns

## Modal Architecture

### Reference Implementation: ClientModal

The `client-modal.tsx` demonstrates the standard modal pattern:

```typescript
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// 1. Define Props Interface
export interface ClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientCreated?: () => void | Promise<void>;
  onClose?: () => void;
  isSubmitting?: boolean;
}

// 2. Create Component
export default function ClientModal({
  open,
  onOpenChange,
  onClientCreated,
  onClose,
  isSubmitting = false,
}: ClientModalProps) {
  const { t } = useTranslation();
  
  // 3. Define Form State
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // 4. Handle Modal State Change
  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!next) {
        onClose?.();
      }
      onOpenChange(next);
    },
    [onClose, onOpenChange]
  );

  // 5. Form Submission with Validation
  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const newErrors: Record<string, string> = {};

      // Validate form
      if (!formData.name.trim()) {
        newErrors.name = t('clients.errors.nameRequired', 'Name is required');
      }

      if (formData.email && !formData.email.includes('@')) {
        newErrors.email = t('clients.errors.invalidEmail', 'Invalid email');
      }

      // Show validation errors
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      try {
        // Call parent callback
        await onClientCreated?.();
        
        // Show success
        toast.success(t('clients.createdSuccess', 'Client created'));
        
        // Reset form
        setFormData({ name: '', email: '', phone: '', address: '' });
        setErrors({});
        
        // Close modal
        onClose?.();
        onOpenChange(false);
      } catch (error) {
        toast.error(t('clients.createError', 'Failed to create client'));
      }
    },
    [formData, onClientCreated, t, onClose, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('clients.createClient', 'Create Client')}</DialogTitle>
          <DialogDescription>
            {t('clients.createClientDescription', 'Add a new client')}
          </DialogDescription>
        </DialogHeader>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Form Fields */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('common.name', 'Name')}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.name
                  ? 'border-destructive focus:ring-destructive'
                  : 'border-border focus:ring-ring'
              }`}
              placeholder={t('clients.placeholders.name', 'e.g., Acme Inc.')}
            />
            {errors.name && (
              <p className="text-destructive text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* More fields... */}
        </form>

        {/* Footer Actions */}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            type="button"
            variant="theme"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('common.creating', 'Creating...')}
              </>
            ) : (
              t('common.create', 'Create')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## Modal Patterns

### 1. Simple Create Modal Pattern

For straightforward create operations:

```typescript
export interface SimpleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: FormData) => void | Promise<void>;
  isLoading?: boolean;
}

export default function SimpleModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: SimpleModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const newErrors = validate(formData);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSubmit?.(formData);
      toast.success(t('toasts.success'));
      onOpenChange(false);
    } catch (error) {
      toast.error(t('toasts.error'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('modal.title')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Form fields */}
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 2. Complex Modal with Multi-Step

For invoice creation with split layout:

```typescript
export interface ComplexModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: PartialData;
}

export default function ComplexModal({
  open,
  onOpenChange,
  data,
}: ComplexModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<PartialData>(data || {});

  const handleNext = () => {
    if (validateStep(step, formData)) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => setStep(step - 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {t(`modal.step${step}`)}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {step === 1 && <StepOne data={formData} onChange={setFormData} />}
          {step === 2 && <StepTwo data={formData} onChange={setFormData} />}
        </div>

        <DialogFooter>
          <Button onClick={handlePrevious} disabled={step === 1}>
            {t('common.previous')}
          </Button>
          <Button onClick={handleNext} disabled={step === 2}>
            {t('common.next')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 3. Edit Modal Pattern

For modifying existing data:

```typescript
export interface EditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: ItemType;
  onSave?: (id: string, data: Partial<ItemType>) => Promise<void>;
  isLoading?: boolean;
}

export default function EditModal({
  open,
  onOpenChange,
  item,
  onSave,
  isLoading = false,
}: EditModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Partial<ItemType>>(item || {});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData(item);
      setIsDirty(false);
    }
  }, [item, open]);

  const handleChange = (updates: Partial<ItemType>) => {
    setFormData({ ...formData, ...updates });
    setIsDirty(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item?.id) return;

    try {
      await onSave?.(item.id, formData);
      toast.success(t('toasts.saved'));
      onOpenChange(false);
    } catch (error) {
      toast.error(t('toasts.error'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('modal.edit')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Form fields with onChange handler */}
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || !isDirty}
          >
            {isLoading ? <Loader2 className="animate-spin" /> : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## Form Field Pattern

### Input Fields with Error Handling

```typescript
interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'textarea';
  disabled?: boolean;
}

const FormField = ({
  label,
  value,
  onChange,
  error,
  placeholder,
  type = 'text',
  disabled = false,
}: FormFieldProps) => (
  <div>
    <label className="block text-sm font-medium text-foreground mb-2">
      {label}
    </label>
    {type === 'textarea' ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-none ${
          error ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-ring'
        }`}
        rows={3}
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
          error ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-ring'
        }`}
      />
    )}
    {error && <p className="text-destructive text-sm mt-1">{error}</p>}
  </div>
);
```

## Modal State Management

### Form State Pattern
```typescript
const [formData, setFormData] = useState<FormData>({
  name: '',
  email: '',
  phone: '',
});

const handleFieldChange = (field: keyof FormData, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }));
};
```

### Error State Pattern
```typescript
const [errors, setErrors] = useState<Record<string, string>>({});

const validate = (data: FormData): Record<string, string> => {
  const newErrors: Record<string, string> = {};
  
  if (!data.name?.trim()) {
    newErrors.name = t('errors.nameRequired');
  }
  
  if (!data.email?.includes('@')) {
    newErrors.email = t('errors.invalidEmail');
  }
  
  return newErrors;
};
```

## Integration with Pages

### Usage in Page Component

```typescript
export default function ClientsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateClient = async () => {
    setIsSubmitting(true);
    try {
      const { data, error } = await createClient(formData);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success(t('toasts.clientCreated'));
      setIsModalOpen(false);
      // Refresh clients list
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t('pages.clients.title')} />
      
      <NewClientButton onClick={() => setIsModalOpen(true)} />
      
      <ClientModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onClientCreated={handleCreateClient}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
```

## Validation Patterns

### Form Validation Helper
```typescript
const validateFormData = (data: FormData): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Required fields
  if (!data.name?.trim()) {
    errors.name = t('errors.required');
  }

  // Email validation
  if (data.email && !isValidEmail(data.email)) {
    errors.email = t('errors.invalidEmail');
  }

  // Phone validation
  if (data.phone && !isValidPhone(data.phone)) {
    errors.phone = t('errors.invalidPhone');
  }

  return errors;
};
```

## Best Practices

1. **Props Interface**: Always define a clear props interface
2. **Translation**: Use i18n for all user-facing text
3. **Error Handling**: Show field-level errors, not generic alerts
4. **Loading State**: Show loading spinner on submit button
5. **Validation**: Validate before submission, show errors inline
6. **Reset**: Reset form when modal closes
7. **Focus Management**: Focus first input on open
8. **Callbacks**: Use optional callbacks for flexible integration
9. **Event Prevention**: Use `preventDefault()` on form submission
10. **Accessibility**: Use proper labels and ARIA attributes

## Common Modal Scenarios

### Confirmation Dialog
```typescript
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{t('modal.confirmDelete')}</DialogTitle>
    </DialogHeader>
    <p>{t('modal.confirmDeleteMessage')}</p>
    <DialogFooter>
      <Button onClick={() => onOpenChange(false)} variant="outline">
        {t('common.cancel')}
      </Button>
      <Button onClick={handleDelete} variant="destructive">
        {t('common.delete')}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Multi-Select Modal
```typescript
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{t('modal.selectItems')}</DialogTitle>
    </DialogHeader>
    <MultiSelect
      options={options}
      selected={selected}
      onChange={setSelected}
    />
    <DialogFooter>
      <Button onClick={() => onOpenChange(false)} variant="outline">
        {t('common.cancel')}
      </Button>
      <Button onClick={handleSubmit}>
        {t('common.done')}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```
