# Krill Bill - Project Skills Index

Welcome to the Krill Bill skills documentation. This is your comprehensive guide to the architecture, patterns, and best practices used throughout this invoice management system.

## Project Overview

**Krill Bill** is a modern invoice manager built with React 19, TypeScript, Tailwind CSS, and Supabase. It enables users to:
- Create and manage invoices with real-time PDF preview
- Configure serial number patterns for automatic document numbering
- Manage clients and providers as business partners
- Handle organization structures for multi-org support
- Generate invoices with proper issuer/recipient information
- Export invoices as PDFs

## Project Structure

```
src/
├── api/              # Supabase API functions
│   ├── organizations.ts
│   ├── org-members.ts
│   ├── organization-partners.ts
│   ├── invoices.ts
│   └── ...
├── app/
│   ├── pages/        # Feature pages (Invoices, Clients, Providers, Settings)
│   ├── components/
│   │   ├── modals/   # Modal dialogs (Create, Edit, Confirm)
│   │   ├── tables/   # Data tables (SerialNumbers, Clients, Invoices)
│   │   ├── buttons/  # Action buttons
│   │   └── ...
│   └── contexts/     # React Context (Org, Auth, User)
├── components/       # UI components (shadcn-based)
├── types/            # TypeScript type definitions
├── locales/          # i18n translations (en.json, es.json)
└── lib/              # Utilities and helpers
```

## Skills Documentation

### 1. **API Architecture** - `/api-architecture/SKILL.md`
Foundation for all data operations using Supabase.

**What you'll learn**:
- How to structure API files with proper error handling
- CRUD operation patterns (fetch, create, update, delete)
- Type safety patterns imported from `/src/types/`
- Response type consistency
- Authentication patterns
- Relationship queries with nested selects

**When to use**: Creating new API functions, modifying existing data operations, adding new data sources.

**Key files**: `organizations.ts`, `invoices.ts`, `organization-partners.ts`

---

### 2. **Table & UI Components** - `/table-ui-components/SKILL.md`
Complex data display components using TanStack React Table.

**What you'll learn**:
- Column definition patterns
- Row interactions and click handling
- Empty states and loading states
- Responsive design for mobile and desktop
- Performance optimization with memoization
- Event delegation patterns

**When to use**: Creating tables for listing data, adding new columns, implementing sorting/filtering.

**Key files**: `serial-numbers-table.tsx`, `clients-table.tsx`, `invoices-table.tsx`

---

### 3. **Modal Components** - `/modal-components/SKILL.md`
Dialogs for creating, editing, and confirming actions.

**What you'll learn**:
- Modal state management
- Form validation and error handling
- Create vs Edit vs Confirm patterns
- Multi-step modal workflows
- Integration with page components
- Submission handling

**When to use**: Building forms for data entry, adding confirmation dialogs, implementing complex workflows.

**Key files**: `client-modal.tsx`, `invoice-modal.tsx`, `serial-number-modal.tsx`

---

### 4. **Page Architecture** - `/page-architecture/SKILL.md`
Page-level component composition and state management.

**What you'll learn**:
- Page structure with header, search, table, modals
- CRUD integration patterns
- State organization (data, loading, editing, modal)
- Search and filter implementation
- Empty state handling
- Loading state management

**When to use**: Creating new feature pages, adding tables to existing pages, implementing search/filter.

**Key files**: `InvoicesPage.tsx`, `ClientsPage.tsx`, `SettingsSerialNumbersPage.tsx`

---

### 5. **Type System & Data Patterns** - `/type-system-patterns/SKILL.md`
Strong TypeScript type definitions and data models.

**What you'll learn**:
- Type definition hierarchy (Entity, CreateInput, UpdateInput)
- Enum patterns for restricted values
- Type guards and narrowing
- Generic type patterns
- Relationship types
- Validation type patterns

**When to use**: Defining new data structures, working with types, ensuring type safety.

**Key files**: `organization.ts`, `serial-numbers.ts`, `invoices.ts` (in `/src/types/`)

---

## Quick Navigation

### I want to...

**Add a new feature page** → Start with `page-architecture/SKILL.md`
- Understand page structure: header, search, table, modals
- See how to connect tables and modals
- Learn state management for CRUD

**Create a new table** → Use `table-ui-components/SKILL.md`
- Define column structures
- Handle row interactions
- Implement empty/loading states

**Build a form/modal** → Follow `modal-components/SKILL.md`
- Structure form state
- Implement validation
- Handle submission

**Add new API functions** → Reference `api-architecture/SKILL.md`
- CRUD operation patterns
- Error handling
- Relationship queries

**Define new data types** → Check `type-system-patterns/SKILL.md`
- Entity types
- Input/Output types
- Enums and relationships

---

## Core Patterns

### Consistent Type Usage
All components use imported types from `/src/types/`. Never define duplicate types or use `any`.

```typescript
import { Organization } from '@/types/organization';

function OrgComponent() {
  const [org, setOrg] = useState<Organization | null>(null);
  // ✓ Type-safe
}
```

### API Response Pattern
All API functions return `{ data, error }` tuples:

```typescript
const { data, error } = await fetchOrganizations();
if (error) {
  toast.error(error);
  return;
}
// Use data safely
```

### Page Structure
Every page follows the same structure:
1. Header (PageHeader component)
2. Search/Action bar
3. Data display (table or grid)
4. Modal for creating/editing
5. State management for CRUD

### Modal Integration
Modals are always controlled by parent pages with:
- `open` state
- `onOpenChange` handler
- `onSubmit` callback
- Optional `initialData` for editing

### Table Pattern
Tables receive:
- `data` array
- `isLoading` flag
- Column visibility/order/sizing states
- Callback handlers for row actions

---

## Technology Stack

- **React 19.2.5** - UI framework with Hooks
- **TypeScript 5.9.3** - Static typing (strict mode)
- **Tailwind CSS 4.2.4** - Styling with CSS variables
- **Supabase PostgreSQL** - Backend with RLS
- **TanStack React Table** - Advanced table features
- **shadcn/ui** - Component library
- **i18next 26.0.8** - Multi-language support (en, es)
- **Vite 7.3.2** - Build tool

---

## Development Workflow

### 1. Creating a New Feature

Follow this order:
1. **Define Types** in `/src/types/` (import from other types if needed)
2. **Create API Functions** in `/src/api/` (use types from step 1)
3. **Build Modal/Form** for data input
4. **Build Table** for listing data
5. **Create Page** that connects everything

### 2. Type Consistency
- Types are the source of truth
- Import types from `/src/types/`
- API functions import and use these types
- Components import types from APIs
- No duplication across layers

### 3. Error Handling
- API functions always catch and return `{ data, error }`
- Components show errors via toast notifications
- Never throw errors to parent components
- Always validate data before using

### 4. Translation
- All user-facing text uses i18n keys
- Add keys to both `en.json` and `es.json`
- Use translation keys like: `t('pages.invoices.title')`

---

## Common Development Tasks

### Task: Add a new field to Invoice
1. Update `Invoice` type in `/src/types/invoices.ts` (if in API)
2. Update `CreateInvoiceInput` type
3. Update `createInvoice()` API function to handle field
4. Update `InvoiceForm` component to include new input
5. Update `InvoicePDFPreview` to display field
6. Add translation keys

### Task: Create new page for Estimates
1. Create `/src/types/estimates.ts` with type definitions
2. Create `/src/api/estimates.ts` with CRUD functions
3. Create `/src/app/components/tables/estimates-table.tsx`
4. Create `/src/app/components/modals/estimate-modal.tsx`
5. Create `/src/app/pages/EstimatesPage.tsx`
6. Add routes in `App.tsx` and sidebar

### Task: Add column to SerialNumbers table
1. Update `columns` array in `SerialNumbersTable`
2. Add `ColumnDef<SerialNumber>` with proper cell rendering
3. Add column key to type `SerialNumberTableColumnKey`
4. Test responsive behavior

---

## Testing Checklist

When implementing new features:
- [ ] TypeScript strict mode passes (no errors)
- [ ] All types imported from `/src/types/`
- [ ] API functions follow error handling pattern
- [ ] Component props properly typed
- [ ] Modal form validates before submission
- [ ] Table empty state displays when no data
- [ ] Loading skeleton shows during fetch
- [ ] Toast notifications for success/error
- [ ] Translation keys added to both en.json and es.json
- [ ] Responsive design tested on mobile
- [ ] Build passes: `npm run build`

---

## Architecture Decision Record

### Why separate types from API?
- Types are the source of truth for data shape
- Multiple API functions can use the same type
- Components can import types without importing API
- Easier to test and refactor

### Why use `{ data, error }` pattern?
- Never throws exceptions in async operations
- Predictable error handling everywhere
- Compatible with React hooks patterns
- Clear success/failure paths

### Why memoize tables and components?
- Tables can have large datasets
- Expensive column computations
- Frequent re-renders from parent state changes
- Performance optimization for production

### Why use controlled modals?
- Parent page controls modal state
- Consistency across all modals
- Easy to track modal lifecycle
- Predictable API for integration

---

## Resources and References

- **TypeScript**: https://www.typescriptlang.org/docs/
- **React**: https://react.dev/
- **Supabase**: https://supabase.com/docs/
- **TanStack Table**: https://tanstack.com/table/latest
- **shadcn/ui**: https://ui.shadcn.com/
- **Tailwind CSS**: https://tailwindcss.com/docs

---

## Getting Help

When building a new feature:

1. **Look at existing implementations** - They follow the documented patterns
2. **Check the skills files** - Each has detailed examples
3. **Follow the reference implementations** - SerialNumbers, Clients, Invoices
4. **Review type definitions** - They document data structure
5. **Examine API functions** - See the error handling and response patterns

---

## Notes

- All code uses **TypeScript strict mode** - No `any` types
- All components are **functional components** with Hooks
- All state mutations use **setState patterns**
- All async operations **handle errors explicitly**
- All user text **uses i18n translations**
- All styling uses **Tailwind CSS** with theme variables

---

Last updated: 2026-05-26
