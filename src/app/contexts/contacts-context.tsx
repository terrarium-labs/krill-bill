import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Contact } from "@shared/types/index";
import {
  createContact,
  deleteContact,
  listContacts,
  updateContact,
} from "@/lib/contacts-store";

type ContactsContextValue = {
  contacts: Contact[];
  refresh: () => void;
  add: (input: Parameters<typeof createContact>[0]) => Contact;
  update: (id: string, input: Parameters<typeof updateContact>[1]) => Contact;
  remove: (id: string) => void;
};

const ContactsContext = createContext<ContactsContextValue | null>(null);

export function ContactsProvider({ children }: { children: ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>(() => listContacts());

  const refresh = useCallback(() => {
    setContacts(listContacts());
  }, []);

  const value = useMemo<ContactsContextValue>(
    () => ({
      contacts,
      refresh,
      add: (input) => {
        const contact = createContact(input);
        refresh();
        return contact;
      },
      update: (id, input) => {
        const contact = updateContact(id, input);
        refresh();
        return contact;
      },
      remove: (id) => {
        deleteContact(id);
        refresh();
      },
    }),
    [contacts, refresh],
  );

  return <ContactsContext.Provider value={value}>{children}</ContactsContext.Provider>;
}

export function useContacts() {
  const ctx = useContext(ContactsContext);
  if (!ctx) throw new Error("useContacts must be used within ContactsProvider");
  return ctx;
}
