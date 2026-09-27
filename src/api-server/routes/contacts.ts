import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  contactSchema,
  createContactSchema,
  updateContactSchema,
  type Contact,
  type Env,
} from "@shared/types/index";
import { errorResponse, successResponse } from "@shared/utils/response";

const KV_KEY = "contacts";

export const contactsRouter = new Hono<{ Bindings: Env }>();

async function readContacts(kv: KVNamespace | undefined): Promise<Contact[]> {
  if (!kv) return [];
  const raw = await kv.get(KV_KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw) as unknown;
  return contactSchema.array().parse(parsed);
}

async function writeContacts(kv: KVNamespace | undefined, contacts: Contact[]) {
  if (!kv) {
    throw new Error("CONTACTS_KV binding is not configured");
  }
  await kv.put(KV_KEY, JSON.stringify(contacts));
}

function kvUnavailableResponse(c: { json: (body: unknown, status?: number) => Response }) {
  return c.json(
    errorResponse(
      "Contact sync requires a CONTACTS_KV binding. Data is stored locally in the browser.",
      "SERVICE_UNAVAILABLE",
    ),
    503,
  );
}

contactsRouter.get("/contacts", async (c) => {
  const contacts = await readContacts(c.env.CONTACTS_KV);
  return c.json(successResponse(contacts));
});

contactsRouter.post("/contacts", zValidator("json", createContactSchema), async (c) => {
  if (!c.env.CONTACTS_KV) return kvUnavailableResponse(c);
  try {
    const input = c.req.valid("json");
    const now = new Date().toISOString();
    const contact: Contact = {
      ...input,
      id: crypto.randomUUID(),
      business_email: input.business_email || undefined,
      business_website: input.business_website || undefined,
      currency: input.currency ?? "EUR",
      language: input.language ?? "en",
      default_due_days: input.default_due_days ?? 30,
      created_at: now,
      updated_at: now,
    };
    const contacts = await readContacts(c.env.CONTACTS_KV);
    contacts.unshift(contact);
    await writeContacts(c.env.CONTACTS_KV, contacts);
    return c.json(successResponse(contact), 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create contact";
    return c.json(errorResponse(message, "INTERNAL_SERVER_ERROR"), 500);
  }
});

contactsRouter.put("/contacts/:id", zValidator("json", updateContactSchema), async (c) => {
  if (!c.env.CONTACTS_KV) return kvUnavailableResponse(c);
  try {
    const id = c.req.param("id");
    const input = c.req.valid("json");
    const contacts = await readContacts(c.env.CONTACTS_KV);
    const index = contacts.findIndex((item) => item.id === id);
    if (index === -1) {
      return c.json(errorResponse("Contact not found", "NOT_FOUND"), 404);
    }
    const updated: Contact = {
      ...contacts[index],
      ...input,
      business_email: input.business_email || contacts[index].business_email,
      business_website: input.business_website || contacts[index].business_website,
      updated_at: new Date().toISOString(),
    };
    contacts[index] = contactSchema.parse(updated);
    await writeContacts(c.env.CONTACTS_KV, contacts);
    return c.json(successResponse(contacts[index]));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update contact";
    return c.json(errorResponse(message, "INTERNAL_SERVER_ERROR"), 500);
  }
});

contactsRouter.delete("/contacts/:id", async (c) => {
  if (!c.env.CONTACTS_KV) return kvUnavailableResponse(c);
  try {
    const id = c.req.param("id");
    const contacts = await readContacts(c.env.CONTACTS_KV);
    const next = contacts.filter((item) => item.id !== id);
    if (next.length === contacts.length) {
      return c.json(errorResponse("Contact not found", "NOT_FOUND"), 404);
    }
    await writeContacts(c.env.CONTACTS_KV, next);
    return c.json(successResponse({ id }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete contact";
    return c.json(errorResponse(message, "INTERNAL_SERVER_ERROR"), 500);
  }
});
