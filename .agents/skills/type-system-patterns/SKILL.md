# Type System & Data Patterns Skill

## Overview
This skill documents the type definitions and data patterns used throughout Krill Bill. Strong type safety is enforced at every level - types are the source of truth for all data structures.

## File Location
Type definitions are stored in `/src/types/` with clear naming:
- `organization.ts` - Organization and organizational structures
- `serial-numbers.ts` - Serial number patterns
- `clients.ts` - Client data
- `providers.ts` - Provider data
- `invoices.ts` - Invoice structures (may be in `/src/api/`)

## Type Definition Pattern

### 1. Core Entity Type

The primary type represents the complete database record:

```typescript
// src/types/organization.ts
export interface Organization {
  id: string;
  name: string;
  business_name?: string | null;
  business_email?: string | null;
  business_phone?: string | null;
  business_website?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  postal_code?: string | null;
  state?: string | null;
  country: string;
  currency: string;
  language: string;
  created_at: string;
  updated_at: string;
}
```

**Key Principles**:
- All fields from database are represented
- Required fields have no `?` modifier
- Nullable fields use `| null`
- Optional input fields use `?`
- Timestamps are always strings (ISO format)
- IDs are always strings

### 2. Create/Update Input Type

Input types exclude auto-generated fields:

```typescript
export interface CreateOrganizationInput {
  name: string;
  business_name?: string;
  business_email?: string;
  business_phone?: string;
  business_website?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  postal_code?: string;
  state?: string;
  country?: string;
  currency?: string;
  language?: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  business_name?: string;
  business_email?: string;
  // ... all fields optional
}
```

**Key Principles**:
- All fields optional (update operations)
- Never include `id`, `created_at`, `updated_at`
- ID fields that reference other entities included
- Use for both API inputs and form data

### 3. Enum Types

For restricted values:

```typescript
export type OrgPartnerType = 'client' | 'provider';
export type OrgMemberRole = 'owner' | 'admin' | 'member';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type InvoiceType = 'sales' | 'purchase';

// More explicit enum approach:
export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}
```

### 4. Relationship Types

For related data structures:

```typescript
export interface OrganizationPartner {
  id: string;
  organization_id: string;
  partner_organization_id: string;
  partner_type: OrgPartnerType;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  org_id?: string | null;
  user_id: string;
  role: OrgMemberRole;
  theme?: string;
  accent_color?: string;
  language?: string;
  created_at: string;
  updated_at: string;
}
```

### 5. Partial Types for Forms

For form data that might not have all fields:

```typescript
export type PartialOrganization = Partial<Omit<Organization, 'id' | 'created_at' | 'updated_at'>>;

export type InvoiceFormData = Partial<Invoice>;
```

## Common Type Patterns

### API Response Pattern
```typescript
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface ApiListResponse<T> {
  data: T[];
  error: string | null;
}

export interface ApiDeleteResponse {
  success: boolean;
  error: string | null;
}
```

### Filter/Query Options Pattern
```typescript
export interface FetchOrganizationsOptions {
  status?: string;
  name?: string;
  limit?: number;
  offset?: number;
}

export interface InvoiceFilters {
  status?: InvoiceStatus;
  clientId?: string;
  startDate?: string;
  endDate?: string;
}
```

### Paginated Response Pattern
```typescript
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
```

## Type Organization Best Practices

### 1. Group Related Types
```typescript
// src/types/organization.ts
export interface Organization { ... }
export interface OrganizationMember { ... }
export interface OrganizationPartner { ... }
export interface CreateOrganizationInput { ... }
```

### 2. Use Discriminated Unions for Variants
```typescript
export type Entity = 
  | { type: 'organization'; data: Organization }
  | { type: 'partner'; data: OrganizationPartner };

// Usage
function handleEntity(entity: Entity) {
  if (entity.type === 'organization') {
    // entity.data is Organization
  } else if (entity.type === 'partner') {
    // entity.data is OrganizationPartner
  }
}
```

### 3. Use Utility Types
```typescript
// Extract keys
export type OrganizationKey = keyof Organization;

// Omit fields
export type OrganizationWithoutDates = Omit<Organization, 'created_at' | 'updated_at'>;

// Pick specific fields
export type OrganizationPreview = Pick<Organization, 'id' | 'name' | 'business_name'>;

// Make fields optional
export type OptionalOrganization = Partial<Organization>;

// Make fields required
export type RequiredOrganization = Required<Organization>;

// Map type to different structure
export type OrganizationDTO = Omit<Organization, 'created_at' | 'updated_at'> & {
  createdAt: Date;
  updatedAt: Date;
};
```

## Type Examples from Krill Bill

### Invoice Type
```typescript
export interface InvoiceItem {
  id?: string;
  name: string;
  description?: string;
  quantity: number;
  price: number;
  apply_taxes: boolean;
}

export interface Invoice {
  id: string;
  organization_id: string;
  user_id: string;
  issuer_id?: string;
  recipient_id?: string;
  client_id?: string;
  provider_id?: string;
  issuer_name?: string;
  recipient_name?: string;
  invoice_number: string;
  invoice_type: 'sales' | 'purchase';
  issue_date: string;
  due_date: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  description?: string;
  notes?: string;
  items: InvoiceItem[];
  created_at: string;
  updated_at: string;
}
```

### Serial Number Type
```typescript
export interface SerialNumber {
  id: string;
  entity: 'sales_invoices' | 'purchase_invoices' | 'estimates' | 'orders';
  name: string;
  value: string;
  last_num_value: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSerialNumberInput {
  entity: SerialNumber['entity'];
  name: string;
  value: string;
  last_num_value?: number;
}
```

## Validation Types

### Form Validation Errors
```typescript
export type FormErrors<T> = Partial<Record<keyof T, string>>;

// Usage
const [errors, setErrors] = useState<FormErrors<CreateOrganizationInput>>({});
```

### Validation Result
```typescript
export interface ValidationResult<T> {
  isValid: boolean;
  errors: FormErrors<T>;
}

function validateForm<T>(data: T, schema: ValidationSchema): ValidationResult<T> {
  // ... validation logic
}
```

## Type Guards

### Type guard functions for runtime safety
```typescript
function isOrganization(data: unknown): data is Organization {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    'country' in data &&
    typeof (data as any).id === 'string' &&
    typeof (data as any).name === 'string'
  );
}

function isInvoiceStatus(value: unknown): value is InvoiceStatus {
  return ['draft', 'sent', 'paid', 'overdue', 'cancelled'].includes(value as string);
}

// Usage
if (isOrganization(data)) {
  // data is safely typed as Organization
  console.log(data.name);
}
```

## Type Narrowing Patterns

```typescript
// Narrow optional types
function getOrgName(org: Organization): string {
  return org.business_name || org.name;
}

// Narrow with type guard
function processEntity(entity: Organization | OrganizationPartner) {
  if ('partner_type' in entity) {
    // entity is OrganizationPartner
  } else {
    // entity is Organization
  }
}

// Narrow with discriminated union
function handleEntity(entity: Entity) {
  switch (entity.type) {
    case 'organization':
      return entity.data.name;
    case 'partner':
      return entity.data.partner_type;
  }
}
```

## Generic Type Patterns

### Generic API Response
```typescript
export type ApiResponse<T, E = string> = 
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: E };

// Usage
const response: ApiResponse<Organization> = {
  success: true,
  data: org,
  error: null
};
```

### Generic Table Props
```typescript
interface TableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
}

// Usage
<Table<SerialNumber> data={items} columns={cols} />
```

### Generic Modal Props
```typescript
interface ModalProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: T) => Promise<void>;
  initialData?: T;
}

// Usage
<Modal<CreateOrganizationInput> onSubmit={handleCreate} />
```

## Best Practices

1. **Always Define Types**: Never use `any`, use `unknown` with type guards if needed
2. **Source of Truth**: Types in `/src/types/` are the single source of truth
3. **API Consistency**: Keep types consistent between API functions and components
4. **Explicit over Implicit**: Use explicit types rather than inferring from usage
5. **Reuse Types**: Import and reuse types rather than duplicating definitions
6. **Document Complex Types**: Add JSDoc comments to complex types
7. **Keep Types Focused**: One primary type per file or closely related types
8. **Use Type Guards**: Validate runtime data against types with guard functions
9. **Avoid Circular Dependencies**: Structure types to avoid circular imports
10. **Test Type Safety**: Use TypeScript strict mode and `noImplicitAny`

## Migration Pattern

When updating a type, ensure consistency across:

1. **Type Definition** (`/src/types/`)
2. **API Functions** (`/src/api/`)
3. **Component Props** (components using the type)
4. **Database Schema** (if applicable)
5. **API Responses** (validation)

Example workflow:
```typescript
// 1. Update type
export interface Organization {
  // ... new field
  tags?: string[];
}

// 2. Update API
export async function createOrganization(input: CreateOrganizationInput) {
  // ... handle tags
}

// 3. Update components
function OrgForm() {
  const [tags, setTags] = useState<string[]>([]);
  // ...
}

// 4. Update forms
const [formData, setFormData] = useState<CreateOrganizationInput>({
  tags: []
});
```
