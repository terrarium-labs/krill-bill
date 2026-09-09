import {
  contactSchema,
  STORAGE_KEYS,
  type Contact,
  type CreateContactInput,
  type UpdateContactInput,
} from "@shared/types/index";
import { createId, nowIso } from "@/lib/utils";

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string) {
  localStorage.setItem(key, value);
}

function parseContacts(raw: string | null): Contact[] {
  if (!raw) return [];
  try {
    return contactSchema.array().parse(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function listContacts(): Contact[] {
  return parseContacts(readRaw(STORAGE_KEYS.contacts));
}

export function getContact(id: string): Contact | undefined {
  return listContacts().find((c) => c.id === id);
}

export function saveContacts(contacts: Contact[]) {
  writeRaw(STORAGE_KEYS.contacts, JSON.stringify(contacts));
}

export function createContact(input: CreateContactInput): Contact {
  const now = nowIso();
  const contact: Contact = contactSchema.parse({
    ...input,
    id: createId(),
    business_email: input.business_email || undefined,
    business_website: input.business_website || undefined,
    currency: input.currency ?? "EUR",
    language: input.language ?? "en",
    default_due_days: input.default_due_days ?? 30,
    created_at: now,
    updated_at: now,
  });
  const contacts = listContacts();
  contacts.unshift(contact);
  saveContacts(contacts);
  return contact;
}

export function updateContact(id: string, input: UpdateContactInput): Contact {
  const contacts = listContacts();
  const index = contacts.findIndex((c) => c.id === id);
  if (index === -1) throw new Error("Contact not found");
  const updated = contactSchema.parse({
    ...contacts[index],
    ...input,
    business_email: input.business_email ?? contacts[index].business_email,
    business_website: input.business_website ?? contacts[index].business_website,
    updated_at: nowIso(),
  });
  contacts[index] = updated;
  saveContacts(contacts);
  return updated;
}

export function deleteContact(id: string) {
  saveContacts(listContacts().filter((c) => c.id !== id));
}

export function getCompanyProfile(): Contact | null {
  const raw = readRaw(STORAGE_KEYS.company);
  if (!raw) return null;
  try {
    return contactSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveCompanyProfile(input: CreateContactInput): Contact {
  const existing = getCompanyProfile();
  const now = nowIso();
  const profile = contactSchema.parse({
    ...input,
    id: existing?.id ?? createId(),
    business_email: input.business_email || undefined,
    business_website: input.business_website || undefined,
    currency: input.currency ?? "EUR",
    language: input.language ?? "en",
    default_due_days: input.default_due_days ?? 30,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  });
  writeRaw(STORAGE_KEYS.company, JSON.stringify(profile));
  return profile;
}

export function exportContactsJson(): string {
  return JSON.stringify(
    { contacts: listContacts(), company: getCompanyProfile() },
    null,
    2,
  );
}

export function importContactsJson(raw: string) {
  const data = JSON.parse(raw) as { contacts?: unknown; company?: unknown };
  if (data.contacts) {
    saveContacts(contactSchema.array().parse(data.contacts));
  }
  if (data.company) {
    writeRaw(STORAGE_KEYS.company, JSON.stringify(contactSchema.parse(data.company)));
  }
}
