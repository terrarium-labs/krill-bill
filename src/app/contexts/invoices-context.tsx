import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Invoice } from "@shared/types/index";
import {
  createInvoice,
  deleteInvoice,
  listInvoices,
  updateInvoice,
  type CreateInvoiceInput,
} from "@/lib/invoices-store";

type InvoicesContextValue = {
  invoices: Invoice[];
  refresh: () => void;
  add: (input: CreateInvoiceInput) => Invoice;
  update: (id: string, patch: Partial<Invoice>) => Invoice;
  remove: (id: string) => void;
};

const InvoicesContext = createContext<InvoicesContextValue | null>(null);

export function InvoicesProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>(() => listInvoices());

  const refresh = useCallback(() => {
    setInvoices(listInvoices());
  }, []);

  const value = useMemo<InvoicesContextValue>(
    () => ({
      invoices,
      refresh,
      add: (input) => {
        const invoice = createInvoice(input);
        refresh();
        return invoice;
      },
      update: (id, patch) => {
        const invoice = updateInvoice(id, patch);
        refresh();
        return invoice;
      },
      remove: (id) => {
        deleteInvoice(id);
        refresh();
      },
    }),
    [invoices, refresh],
  );

  return <InvoicesContext.Provider value={value}>{children}</InvoicesContext.Provider>;
}

export function useInvoices() {
  const ctx = useContext(InvoicesContext);
  if (!ctx) throw new Error("useInvoices must be used within InvoicesProvider");
  return ctx;
}
