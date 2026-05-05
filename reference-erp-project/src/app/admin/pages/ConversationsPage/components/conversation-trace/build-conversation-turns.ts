import type { CharlesRun } from "@/types/chat/conversation-runs";
import type { Message, Content } from "@/types/chat/chat";
import type { ConversationTurn } from "./trace-types";
import { parseTrace } from "./trace-utils";

type MemMsg = { role?: string; content?: unknown };

function normalizeBlock(b: Record<string, unknown>): Content | null {
    const type = b.type as string;

    if (type === "text" && typeof b.text === "string") {
        return { type: "text", text: b.text, id: b.id as string | undefined };
    }

    if (type === "thinking" && typeof b.thinking === "string") {
        return {
            type: "thinking",
            thinking: b.thinking,
            signature: (b.signature as string) ?? null,
            id: b.id as string | undefined,
        };
    }

    if (type === "tool_use" && typeof b.name === "string") {
        const input =
            typeof b.input === "string"
                ? b.input
                : JSON.stringify(b.input ?? {});
        return {
            type: "tool_use",
            id: (b.id as string) ?? "",
            name: b.name as string,
            input,
            is_server_tool_use: (b.is_server_tool_use as boolean) ?? false,
        };
    }

    if (type === "tool_result") {
        return {
            type: "tool_result",
            id: (b.id as string) ?? "",
            content: Array.isArray(b.content) ? b.content : [],
        };
    }

    if (type === "file" && typeof b.file === "string") {
        return { type: "file", file: b.file };
    }

    if (type === "custom" && b.value != null) {
        return {
            type: "custom",
            value: b.value as Record<string, unknown>,
        };
    }

    return null;
}

function coerceContent(raw: unknown): Content[] {
    if (raw == null) return [];
    if (typeof raw === "string") {
        return raw.trim() ? [{ type: "text", text: raw.trim() }] : [];
    }
    if (!Array.isArray(raw)) {
        return [{ type: "text", text: String(raw) }];
    }
    const result: Content[] = [];
    for (const item of raw) {
        if (item == null || typeof item !== "object" || !("type" in item))
            continue;
        const normalized = normalizeBlock(item as Record<string, unknown>);
        if (normalized) result.push(normalized);
    }
    return result;
}

function memMsgToMessage(m: MemMsg): Message {
    return {
        role: m.role ?? "assistant",
        content: coerceContent(m.content),
    };
}

function plainText(content: Content[]): string {
    return content
        .map((c) => {
            if (c.type === "text") return c.text;
            if (c.type === "thinking") return `[think] ${c.thinking.slice(0, 120)}…`;
            if (c.type === "tool_use") return `[tool] ${c.name}`;
            return "";
        })
        .join(" ")
        .trim();
}

function extractAllMessagesFromRun(
    run: CharlesRun,
): { employeeText: string; assistantPreview: string; messages: Message[] } {
    const steps = parseTrace(run.trace);
    const root = steps.find((s) => !s.parent_call_id);
    const mem = root?.memory as MemMsg[] | undefined;

    if (Array.isArray(mem) && mem.length > 0) {
        let lastUserIdx = -1;
        for (let i = mem.length - 1; i >= 0; i--) {
            if (mem[i]!.role === "user") {
                lastUserIdx = i;
                break;
            }
        }

        if (lastUserIdx >= 0) {
            const raw: Message[] = [];
            for (let i = lastUserIdx; i < mem.length; i++) {
                raw.push(memMsgToMessage(mem[i]!));
            }
            const messages = mergeNonUserMessages(raw);
            const employeeText = plainText(messages[0]!.content) || "—";
            const assistantPreview = assistantPreviewFromMessages(messages.slice(1));
            return { employeeText, assistantPreview, messages };
        }
    }

    const input = root?.input as Record<string, unknown> | undefined;
    const prompt = input?.prompt as Record<string, unknown> | undefined;
    const userContent = prompt ? coerceContent(prompt.content) : [];
    const userMsg: Message = userContent.length > 0
        ? { role: "user", content: userContent }
        : { role: "user", content: [{ type: "text", text: "—" }] };

    const out = root?.output;
    if (out && typeof out === "object") {
        const o = out as { content?: unknown };
        const content = coerceContent(o.content);
        const t = plainText(content);
        if (t) {
            const assistantMsg: Message = { role: "assistant", content };
            return {
                employeeText: plainText(userMsg.content) || "—",
                assistantPreview: t.length > 220 ? `${t.slice(0, 217)}…` : t,
                messages: [userMsg, assistantMsg],
            };
        }
    }

    return {
        employeeText: plainText(userMsg.content) || "—",
        assistantPreview: "…",
        messages: [userMsg, { role: "assistant", content: [{ type: "text", text: "…" }] }],
    };
}

/**
 * Merge consecutive non-user messages into a single assistant message and
 * reorder content so thinking comes first, then all tool_use blocks condensed
 * together (forcing the accordion grouping), then text / other blocks.
 * tool_result blocks are dropped — Message.tsx has no renderer for them.
 */
function mergeNonUserMessages(messages: Message[]): Message[] {
    const merged: Message[] = [];
    let buf: Content[] = [];

    const flush = () => {
        if (buf.length === 0) return;
        const thinking: Content[] = [];
        const tools: Content[] = [];
        const rest: Content[] = [];
        for (const c of buf) {
            if (c.type === "thinking") thinking.push(c);
            else if (c.type === "tool_use") tools.push(c);
            else if (c.type === "tool_result") continue;
            else rest.push(c);
        }
        merged.push({ role: "assistant", content: [...thinking, ...tools, ...rest] });
        buf = [];
    };

    for (const msg of messages) {
        if (msg.role === "user") {
            flush();
            merged.push(msg);
        } else {
            buf.push(...msg.content);
        }
    }
    flush();
    return merged;
}

function buildTurnMessages(userMem: MemMsg, afterUser: MemMsg[]): Message[] {
    const msgs: Message[] = [memMsgToMessage(userMem)];
    for (const m of afterUser) {
        msgs.push(memMsgToMessage(m));
    }
    return mergeNonUserMessages(msgs);
}

function assistantPreviewFromMessages(msgs: Message[]): string {
    const texts: string[] = [];
    for (const m of msgs) {
        if (m.role === "tool") {
            continue;
        }
        if (m.role === "assistant" || m.role === undefined) {
            const t = plainText(m.content);
            if (t) texts.push(t);
        }
    }
    const joined = texts.join(" ").trim();
    if (joined.length > 220) return `${joined.slice(0, 217)}…`;
    return joined || "…";
}

/**
 * Multiple API runs → one turn per run.
 * Single run → one turn per user message in `memory` on the root agent step.
 */
export function buildConversationTurns(runs: CharlesRun[]): ConversationTurn[] {
    if (runs.length === 0) return [];

    if (runs.length > 1) {
        return runs.map((run) => {
            const { employeeText, assistantPreview, messages } = extractAllMessagesFromRun(run);
            return {
                id: String(run.id),
                employeeText,
                assistantPreview,
                messages,
                run,
            };
        });
    }

    const run = runs[0]!;
    const steps = parseTrace(run.trace);
    const root = steps.find((s) => !s.parent_call_id);
    const mem = root?.memory as MemMsg[] | undefined;

    if (!Array.isArray(mem) || mem.length === 0) {
        const { employeeText, assistantPreview, messages } = extractAllMessagesFromRun(run);
        return [
            {
                id: String(run.id),
                employeeText,
                assistantPreview,
                messages,
                run,
            },
        ];
    }

    const turns: ConversationTurn[] = [];
    let i = 0;
    let turnIdx = 0;
    while (i < mem.length) {
        const msg = mem[i]!;
        if (msg.role !== "user") {
            i += 1;
            continue;
        }
        i += 1;
        const afterUser: MemMsg[] = [];
        while (i < mem.length && mem[i]!.role !== "user") {
            afterUser.push(mem[i]!);
            i += 1;
        }
        const messages = buildTurnMessages(msg, afterUser);
        const employeeText = plainText(messages[0]!.content) || "—";
        turns.push({
            id: `${run.id}-turn-${turnIdx}`,
            employeeText,
            assistantPreview: assistantPreviewFromMessages(messages.slice(1)),
            messages,
            run,
        });
        turnIdx += 1;
    }

    if (turns.length > 0) return turns;

    const { employeeText, assistantPreview, messages } = extractAllMessagesFromRun(run);
    return [
        {
            id: String(run.id),
            employeeText,
            assistantPreview,
            messages,
            run,
        },
    ];
}
