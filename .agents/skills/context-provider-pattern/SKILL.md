# Context Provider Pattern Architecture

## Overview

This skill documents the standardized **Context Provider Pattern** used throughout the Krill Bill application for managing and distributing entity-specific state (Clients, Providers, Invoices) to components that need them.

This pattern provides:
- ✅ Centralized data fetching and caching
- ✅ Loading and error state management
- ✅ Data refresh capabilities
- ✅ Type-safe React Context API usage
- ✅ Skeleton loading UI during initial fetch
- ✅ Single source of truth for entity data

## Pattern Structure

### 1. Context Type Definition

```typescript
interface EntityContextType {
  entity: Entity;  // or Entity[] for lists
  refreshEntity: () => void;  // or refreshEntities
}
```

### 2. Context Creation

```typescript
const EntityContext = createContext<EntityContextType | undefined>(undefined);
```

### 3. Provider Component

The Provider component wraps children and manages:
- State for the entity/entities
- Loading state
- useEffect hook for initial fetch on mount
- Context.Provider with value

```typescript
export const EntityProvider = ({ children }: { children: React.ReactNode }) => {
  const [entity, setEntity] = useState<Entity | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch logic...
  
  if (isLoading || !entity) {
    return <PageSkeleton showBackButton={true} showIcon={true} tabCount={3} variant="split" />;
  }
  
  return (
    <EntityContext.Provider value={{ entity, refreshEntity }}>
      {children}
    </EntityContext.Provider>
  );
};
```

### 4. Hook for Context Access

```typescript
export const useEntity = () => {
  const context = useContext(EntityContext);
  if (context === undefined) {
    throw new Error("useEntity must be used within EntityProvider");
  }
  return context;
};
```

## Real-World Implementation Pattern

### ClientsContext Example

```typescript
import { createContext, useContext, useEffect, useState } from "react";
import { getOrgClients } from "@/api/clients";
import { useOrg } from "@/contexts/OrgContext";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Client } from "@/types/clients";

interface ClientsContextType {
  clients: Client[];
  refreshClients: () => void;
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined);

export const ClientsProvider = ({ children }: { children: React.ReactNode }) => {
  const { org } = useOrg();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchClients = async () => {
    if (!org?.id) return;
    try {
      setIsLoading(true);
      const { data } = await getOrgClients(org.id);
      if (data) {
        setClients(data);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (org?.id) {
      fetchClients();
    }
  }, [org?.id]);

  if (isLoading || !clients.length) {
    return <PageSkeleton showBackButton={true} showIcon={true} tabCount={2} variant="split" />;
  }

  const refreshClients = () => {
    fetchClients();
  };

  return (
    <ClientsContext.Provider value={{ clients, refreshClients }}>
      {children}
    </ClientsContext.Provider>
  );
};

export const useClients = () => {
  const context = useContext(ClientsContext);
  if (context === undefined) {
    throw new Error("useClients must be used within ClientsProvider");
  }
  return context;
};
```

## Usage

### Wrapping Components

```typescript
// In AppRoutes or page router setup
import { ClientsProvider } from "@/contexts/ClientsContext";

export function ClientsPage() {
  return (
    <ClientsProvider>
      <ClientsPageContent />
    </ClientsProvider>
  );
}

// Or wrap at route level
<Route path="/clients">
  <ClientsProvider>
    <ClientsPage />
  </ClientsProvider>
</Route>
```

### Using the Hook

```typescript
import { useClients } from "@/contexts/ClientsContext";

export function ClientList() {
  const { clients, refreshClients } = useClients();
  
  return (
    <div>
      {clients.map(client => (
        <div key={client.id}>{client.name}</div>
      ))}
      <button onClick={refreshClients}>Refresh</button>
    </div>
  );
}
```

## Benefits of This Pattern

### 1. **Separation of Concerns**
- Data fetching logic is separated from UI rendering
- Context provider manages state lifecycle
- Components focus on presentation

### 2. **Performance**
- Data is fetched once and cached
- Prevents duplicate API calls
- useCallback can optimize context value updates

### 3. **Loading States**
- Skeleton UI shown during initial load
- Loading state available to components via context
- Better UX during data fetching

### 4. **Error Handling**
- Can extend with error state
- Graceful degradation possibilities
- Console logging for debugging

### 5. **Testability**
- Provider can be mocked in tests
- Context value predictable
- Hook usage straightforward to test

## Key Differences from Hook-Only Pattern

| Aspect | Provider Pattern | Hook-Only Pattern |
|--------|-----------------|-------------------|
| Initial Load | Managed by Provider | Managed by consuming component |
| Loading State | Shown in Provider | Shown in component |
| Data Fetching | Provider responsibility | Hook responsibility |
| Multiple Consumers | Fetches once, shares | Each component might fetch separately |
| Skeleton UI | Centralized | Scattered across components |

## Lifecycle

1. **Mount**: Provider fetches data, shows skeleton
2. **Data Loaded**: Skeleton hidden, context value set
3. **Context Access**: Child components use `useEntity()` hook
4. **Refresh**: Components call `refreshEntity()` when needed
5. **Unmount**: Context cleaned up, provider removed

## Error Handling Extension

```typescript
interface EntityContextType {
  entity: Entity | null;
  isLoading: boolean;
  error: string | null;
  refreshEntity: () => void;
}

// Then in provider:
if (error) {
  return (
    <div className="error-container">
      <p>{error}</p>
      <button onClick={refreshEntity}>Retry</button>
    </div>
  );
}
```

## Best Practices

1. **Keep Contexts at Route Level**: Wrap route components with providers, not individual pages
2. **Use Hooks Only in Pages**: Pages use the context hooks to extract data
3. **Pass Props to Components**: Tables, buttons, and modals receive data as props (not hooks)
4. **Centralize State Management**: Page components manage state and pass down to children
5. **Always show skeleton** during initial load for better UX
6. **Catch and log errors** - don't silently fail
7. **Use meaningful context names** - `useClients`, `useProviders`
8. **Memoize context value** - prevents unnecessary re-renders
9. **Keep refresh simple** - usually just re-fetch and update state
10. **Handle dependencies carefully** - watch org.id, not entire org object
11. **Provide meaningful error messages** - help with debugging

## See Also

- [Page Architecture Patterns](../page-architecture/SKILL.md)
- [API Architecture](../api-architecture/SKILL.md)
- [Type System Patterns](../type-system-patterns/SKILL.md)
