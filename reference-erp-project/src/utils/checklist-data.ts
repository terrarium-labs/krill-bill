import type { ChecklistField, ConditionalLogic } from '@/types/general/checklist-field';

/** Accept API shapes: nested objects, JSON strings, camelCase or snake_case. */
export function parseChecklistDataPayload(data: unknown): Record<string, unknown> | null {
    if (data == null) return null;
    if (typeof data === 'string') {
        try {
            const parsed = JSON.parse(data) as unknown;
            return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
        } catch {
            return null;
        }
    }
    if (typeof data === 'object') {
        return data as Record<string, unknown>;
    }
    return null;
}

function normalizeConditionalLogic(raw: unknown): ConditionalLogic | undefined {
    if (!raw || typeof raw !== 'object') return undefined;
    const cl = raw as Record<string, unknown>;
    const conditionsRaw = cl.conditions;
    const conditions = Array.isArray(conditionsRaw)
        ? conditionsRaw.map((c) => {
        if (!c || typeof c !== 'object') return null;
        const row = c as Record<string, unknown>;
        const fieldId = (row.fieldId ?? row.field_id) as string;
        const operator = row.operator as ConditionalLogic['conditions'][number]['operator'];
        const value = row.value;
        const logic = row.logic as 'AND' | 'OR' | undefined;
        if (!fieldId || !operator) return null;
        return { fieldId, operator, value: value as string | number | boolean, logic };
    }).filter(Boolean) as ConditionalLogic['conditions']
        : [];

    const enabled = cl.enabled !== undefined ? Boolean(cl.enabled) : conditions.length > 0;
    const action = (cl.action as ConditionalLogic['action']) || 'show';

    return { enabled, action, conditions };
}

export function normalizeChecklistFieldFromApi(raw: unknown): ChecklistField | null {
    if (!raw || typeof raw !== 'object') return null;
    const f = raw as Record<string, unknown>;
    const id = f.id as string;
    const type = f.type as ChecklistField['type'];
    const label = f.label as string;
    if (!id || !type || label == null) return null;

    const conditionalLogic = normalizeConditionalLogic(f.conditionalLogic ?? f.conditional_logic);

    return {
        ...(f as unknown as ChecklistField),
        id,
        type,
        label,
        conditionalLogic,
    };
}

export function extractFieldsFromChecklistData(data: unknown): ChecklistField[] {
    const parsed = parseChecklistDataPayload(data);
    if (!parsed) return [];
    const fields = parsed.fields;
    if (!Array.isArray(fields)) return [];
    return fields.map(normalizeChecklistFieldFromApi).filter(Boolean) as ChecklistField[];
}
