# API Architecture Skill

## Overview
This skill documents the pattern for creating and maintaining API files in Krill Bill. All API files follow a consistent pattern with proper TypeScript types, error handling, and Supabase integration.

## File Location
API files are stored in `/src/api/` directory with clear naming:
- `organizations.ts` - Organization CRUD operations
- `org-members.ts` - Organization member management
- `organization-partners.ts` - Client/provider partnerships
- `invoices.ts` - Invoice operations
- `serial-numbers.ts` - Serial number pattern handling
- `clients.ts` - Client records
- `providers.ts` - Provider records

## Type Definition Pattern

### Step 1: Define Types in `/src/types/`
Create a dedicated types file that your API will import from. Example:

```typescript
// src/types/organization.ts
export interface Organization {
  id: string;
  name: string;
  business_name?: string | null;
  business_email?: string | null;
  address_line_1?: string | null;
  country: string;
  currency: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOrganizationInput {
  name: string;
  business_name?: string;
  business_email?: string;
  address_line_1?: string;
  country?: string;
  currency?: string;
  language?: string;
}
```

**Key Principle**: Types are the source of truth. Never repeat field definitions in API files.

## API Function Pattern

### Response Type Pattern
All API functions follow consistent return types:

```typescript
// Success with data
{ data: T | null; error: string | null }

// Delete operations  
{ success: boolean; error: string | null }

// List operations
{ data: T[]; error: null } or { data: []; error: string }
```

### Standard CRUD Operations

#### 1. Fetch All (with filtering)
```typescript
export const fetchOrganizations = async (
  filters?: { status?: string; name?: string }
) => {
  try {
    let query = supabase.from('organizations').select('*');
    
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.name) query = query.ilike('name', `%${filters.name}%`);

    const { data, error } = await query;
    
    if (error) throw error;
    return { data: data as Organization[] || [], error: null };
  } catch (error: any) {
    console.error('Error fetching organizations:', error);
    return { data: [], error: error.message };
  }
};
```

#### 2. Fetch Single
```typescript
export const fetchOrganization = async (
  id: string
): Promise<{ data: Organization | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as Organization, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
};
```

#### 3. Create with Related Data
```typescript
export const createOrganization = async (
  input: CreateOrganizationInput
): Promise<{ data: Organization | null; error: string | null }> => {
  try {
    const user = (await supabase.auth.getSession()).data.session?.user;
    if (!user) return { data: null, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name: input.name,
        business_name: input.business_name || null,
        business_email: input.business_email || null,
        country: input.country || 'ES',
        currency: input.currency || 'EUR',
        language: input.language || 'en',
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    const orgId = (data as Organization).id;

    // Create related records
    await supabase.from('org_members').insert({
      org_id: orgId,
      user_id: user.id,
      role: 'owner',
      theme: 'system',
      accent_color: 'blue',
      language: 'en',
    });

    return { data: data as Organization, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
};
```

#### 4. Update
```typescript
export const updateOrganization = async (
  id: string,
  updates: Partial<CreateOrganizationInput>
): Promise<{ data: Organization | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as Organization, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
};
```

#### 5. Delete
```typescript
export const deleteOrganization = async (
  id: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: String(err) };
  }
};
```

## Relationship Queries

### Many-to-One with nested select
```typescript
// Fetch partners with related organization data
export const fetchOrganizationPartners = async (orgId: string) => {
  try {
    const { data, error } = await supabase
      .from('organization_partners')
      .select(`
        *,
        partner_org:partner_organization_id (
          id,
          name,
          business_name,
          business_email,
          country,
          currency
        )
      `)
      .eq('organization_id', orgId);

    if (error) throw error;
    return { data: data as any[] || [], error: null };
  } catch (error: any) {
    console.error('Error fetching organization partners:', error);
    return { data: [], error: error.message };
  }
};
```

## Error Handling Pattern

Always follow this error handling pattern:
1. Try-catch wraps the entire operation
2. Supabase errors are caught and returned
3. All errors are logged to console in development
4. Return consistent error format
5. Never throw errors to callers (always return error in response object)

```typescript
export const riskyOperation = async () => {
  try {
    // Main operation
    const { data, error } = await supabase.from('table').select('*');
    
    // Check Supabase error immediately
    if (error) return { data: null, error: error.message };
    
    // Process data
    return { data, error: null };
  } catch (err) {
    // Fallback for unexpected errors
    console.error('Error in riskyOperation:', err);
    return { data: null, error: String(err) };
  }
};
```

## Authentication Pattern

For operations requiring user context:

```typescript
export const getUserData = async () => {
  try {
    const { data, error: sessionError } = await supabase.auth.getSession();
    const user = data?.session?.user;
    
    if (!user) return { data: null, error: 'Not authenticated' };

    // Now proceed with user context
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) return { data: null, error: error.message };
    return { data: userData, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
};
```

## Best Practices

1. **Type Safety**: Import and use types from `/src/types/`, never use `any`
2. **Null Coalescing**: Use `|| []` or `|| null` in return statements
3. **Type Casting**: Use `as Type` only when necessary, after error checking
4. **Naming**: Use camelCase for functions, PascalCase for types
5. **Exports**: Export functions with `export const`, not `export default`
6. **Organization**: Group related CRUD operations together
7. **Documentation**: Add JSDoc comments for exported functions
8. **Error Messages**: Make error messages user-friendly when possible

## Template for New API File

```typescript
import { supabase } from '@/lib/supabase';
import { YourType, CreateYourTypeInput } from '@/types/your-type';

/**
 * Fetch all items with optional filtering
 */
export const fetchItems = async () => {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('*');

    if (error) throw error;
    return { data: (data as YourType[]) || [], error: null };
  } catch (error: any) {
    console.error('Error fetching items:', error);
    return { data: [], error: error.message };
  }
};

/**
 * Fetch single item by ID
 */
export const fetchItem = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as YourType, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
};

/**
 * Create new item
 */
export const createItem = async (
  input: CreateYourTypeInput
) => {
  try {
    const { data, error } = await supabase
      .from('items')
      .insert(input)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as YourType, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
};

/**
 * Update existing item
 */
export const updateItem = async (
  id: string,
  updates: Partial<CreateYourTypeInput>
) => {
  try {
    const { data, error } = await supabase
      .from('items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as YourType, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
};

/**
 * Delete item
 */
export const deleteItem = async (id: string) => {
  try {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: String(err) };
  }
};
```
