# Context Provider Pattern - Implementation Examples

## Overview

The Krill Bill application uses the **Context Provider Pattern** for managing entity data (Clients, Providers, Invoices). This directory contains the architectural reference and examples.

## Files in This Skill

- **SKILL.md** - Complete documentation of the pattern including structure, benefits, lifecycle, and best practices

## Real-World Implementations

The following contexts in the codebase implement this pattern:

### 1. ClientsContext
**Location**: `src/contexts/ClientsContext.tsx`

```typescript
export const ClientsProvider = ({ children }) => { /* ... */ };
export const useClients = () => { /* ... */ };
```

**Usage in Routes**:
```typescript
<Route path="clients" element={<ClientsProvider><ClientsPage /></ClientsProvider>} />
```

**Usage in Components**:
```typescript
const { clients, isLoading, refreshClients } = useClients();
```

### 2. InvoicesContext
**Location**: `src/contexts/InvoicesContext.tsx`

```typescript
export const InvoicesProvider = ({ children }) => { /* ... */ };
export const useInvoices = () => { /* ... */ };
```

**Usage in Routes**:
```typescript
<Route path="invoices" element={<InvoicesProvider><InvoicesPage /></InvoicesProvider>} />
```

**Usage in Components**:
```typescript
const { invoices, isLoading, refreshInvoices } = useInvoices();
```

### 3. ProvidersContext
**Location**: `src/contexts/ProvidersContext.tsx`

```typescript
export const ProvidersProvider = ({ children }) => { /* ... */ };
export const useProviders = () => { /* ... */ };
```

**Usage in Routes**:
```typescript
<Route path="providers" element={<ProvidersProvider><ProvidersPage /></ProvidersProvider>} />
```

**Usage in Components**:
```typescript
const { providers, isLoading, refreshProviders } = useProviders();
```

## Route Setup

**Location**: `src/app/AppRoutes.tsx`

The route definitions show how providers wrap entire route branches:

```typescript
<Route path="clients/*" element={<ClientsProvider><ClientRoutes /></ClientsProvider>} />
<Route path="invoices/*" element={<InvoicesProvider><InvoicesRoutes /></InvoicesProvider>} />
<Route path="providers/*" element={<ProvidersProvider><ProviderRoutes /></ProvidersProvider>} />
```

## Data Flow Architecture

### 1. Provider Wraps Route
```
AppRoutes
  └── Route /clients/*
      └── ClientsProvider (manages state)
          └── ClientRoutes
              └── ClientsPage (page component)
```

### 2. Page Uses Hook and Passes Props Down
```typescript
// ClientsPage.tsx
export default function ClientsPage() {
  const { clients, isLoading, refreshClients } = useClients(); // Get data from context
  
  return (
    <>
      <NewClientButton onClientCreated={refreshClients} /> {/* Pass refresh function */}
      <ClientsTable 
        clients={clients}        {/* Pass data */}
        isLoading={isLoading}    {/* Pass loading state */}
        onRefresh={refreshClients} {/* Pass refresh callback */}
      />
    </>
  );
}
```

### 3. Tables and Buttons Receive Props (Presentational)
```typescript
// ClientsTable.tsx
interface ClientsTableProps {
  clients: Client[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
  onEdit?: (client: Client) => void;
}

export default function ClientsTable({ clients, isLoading, onRefresh, onEdit }: ClientsTableProps) {
  // No hooks here - just presentational logic
  // Use props for all data and callbacks
}

// NewClientButton.tsx
interface NewClientButtonProps {
  onClientCreated?: () => Promise<void>;
}

export default function NewClientButton({ onClientCreated }: NewClientButtonProps) {
  // No hooks here - receives refresh function via props
}
```

## Key Characteristics

✅ **Provider Pattern**: Each context has a corresponding Provider component  
✅ **Loading States**: Skeleton UI shown during initial data fetch  
✅ **Data Caching**: Data fetched once and cached in context  
✅ **Refresh Mechanism**: `refresh*` functions trigger data re-fetch  
✅ **Type Safety**: Full TypeScript support with context types  
✅ **Error Handling**: Console logging for failed requests  
✅ **Organization Scoping**: All data fetching uses organization ID from `useOrg()`

## When to Create a New Context Provider

Create a new context provider when you need to:

1. Manage a collection of entities that multiple components need
2. Centralize API calls for that entity type
3. Handle loading states across multiple components
4. Cache data to prevent duplicate API calls
5. Provide a refresh mechanism for data synchronization

## Step-by-Step Guide to Creating a New Context Provider

### 1. Define the Context Type

```typescript
interface EntityContextType {
  entities: Entity[];
  isLoading: boolean;
  refreshEntities: () => void;
}
```

### 2. Create the Context

```typescript
const EntityContext = createContext<EntityContextType | undefined>(undefined);
```

### 3. Create the Provider Component

```typescript
export const EntityProvider = ({ children }: { children: React.ReactNode }) => {
  const { org } = useOrg();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEntities = async () => {
    if (!org?.id) return;
    try {
      setIsLoading(true);
      const { data } = await fetchOrgEntities(org.id);
      if (data) setEntities(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (org?.id) fetchEntities();
  }, [org?.id]);

  if (isLoading && entities.length === 0) {
    return <PageSkeleton showBackButton={true} showIcon={true} />;
  }

  return (
    <EntityContext.Provider value={{ entities, isLoading, refreshEntities: fetchEntities }}>
      {children}
    </EntityContext.Provider>
  );
};
```

### 4. Create the Hook

```typescript
export const useEntity = () => {
  const context = useContext(EntityContext);
  if (context === undefined) {
    throw new Error("useEntity must be used within EntityProvider");
  }
  return context;
};
```

### 5. Wrap Route in AppRoutes

```typescript
<Route path="entities" element={<EntityProvider><EntitiesPage /></EntityProvider>} />
```

### 6. Use the Hook in Components

```typescript
const { entities, isLoading, refreshEntities } = useEntity();
```

## Related Patterns

- **OrgContext**: Manages organization and member data (not wrapped with provider, initialized at app root)
- **AuthContext**: Manages authentication state (not wrapped with provider, initialized at app root)
- **MultiSelectApi**: API-driven multi-select component (used in forms for dynamic option loading)

## Troubleshooting

### "useX must be used within XProvider" Error

**Cause**: Component is trying to use the hook outside of the provider context.

**Solution**: Ensure the component is rendered as a child of the provider:
```typescript
<Route path="entities" element={<EntityProvider><EntitiesPage /></EntityProvider>} />
```

### Data Not Loading

**Cause**: Provider might not have org.id available yet.

**Solution**: The provider waits for org.id from useOrg(). Ensure OrgProvider is higher in the component tree.

### Loading Skeleton Shows Indefinitely

**Cause**: `isLoading` stays true due to error in fetch.

**Solution**: Check console for error messages. The provider sets isLoading to false in the finally block.

## Performance Considerations

- Data is fetched once on provider mount
- Context value is only updated when data changes
- Components subscribing to the context re-render on value changes
- Use `useMemo` in parent components if needed to prevent child re-renders
