import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import type { Layout, ResponsiveLayouts } from "react-grid-layout";
import { DEFAULT_LAYOUTS, type DefaultBreakpoint } from "../widget-registry";
import {
    getPageTemplates,
    postPageTemplate,
    patchPageTemplate,
    deletePageTemplate,
    type PageTemplate,
} from "@/api/orgs/page-templates/page-templates";

const PAGE_TEMPLATE_TYPE = "dashboard";
const STORAGE_KEY_PREFIX = "dashboard-active-layout";

export interface SavedLayout {
    id: string;
    name: string;
    layout: ResponsiveLayouts<DefaultBreakpoint>;
}

function normalizeLayouts(layouts: ResponsiveLayouts<DefaultBreakpoint>): ResponsiveLayouts<DefaultBreakpoint> {
    const bps: DefaultBreakpoint[] = ["lg", "md", "sm", "xs", "xxs"];
    const next: ResponsiveLayouts<DefaultBreakpoint> = { ...layouts };
    for (const bp of bps) {
        const row = next[bp] ?? [];
        const existing = new Set(row.map((item) => item.i));
        const defaults = DEFAULT_LAYOUTS[bp] ?? [];
        const missing = defaults.filter((d) => !existing.has(d.i));
        next[bp] = [...row.map((item) => ({ ...item, minW: 1, minH: 1 })), ...missing];
    }
    return next;
}

function templateToSavedLayout(t: PageTemplate): SavedLayout | null {
    const data = t.data as { name?: string; layout?: ResponsiveLayouts<DefaultBreakpoint> };
    if (!data?.layout) return null;
    return {
        id: t.id,
        name: data.name ?? "Untitled",
        layout: normalizeLayouts(data.layout),
    };
}

function getStoredLayoutId(orgId: string | undefined): string | null {
    if (!orgId) return null;
    try {
        return localStorage.getItem(`${STORAGE_KEY_PREFIX}:${orgId}`);
    } catch {
        return null;
    }
}

function storeLayoutId(orgId: string | undefined, id: string | null) {
    if (!orgId) return;
    try {
        const key = `${STORAGE_KEY_PREFIX}:${orgId}`;
        if (id === null) {
            localStorage.removeItem(key);
        } else {
            localStorage.setItem(key, id);
        }
    } catch { /* noop */ }
}

export function useDashboardLayout() {
    const { orgId } = useParams<{ orgId: string }>();

    const [layouts, setLayouts] = useState<ResponsiveLayouts<DefaultBreakpoint>>(DEFAULT_LAYOUTS);
    const [savedLayouts, setSavedLayouts] = useState<SavedLayout[]>([]);
    const [activeLayoutId, setActiveLayoutId] = useState<string | null>(() => getStoredLayoutId(orgId));
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const snapshotRef = useRef<ResponsiveLayouts<DefaultBreakpoint> | null>(null);

    const fetchTemplates = useCallback(async () => {
        if (!orgId) return;
        setIsLoading(true);
        try {
            const res = await getPageTemplates(orgId, PAGE_TEMPLATE_TYPE);
            if (!res.success) return;

            const templates: PageTemplate[] = res.success.page_templates ?? [];
            const converted = templates
                .filter((t) => t.type === PAGE_TEMPLATE_TYPE)
                .map(templateToSavedLayout)
                .filter((s): s is SavedLayout => s !== null);

            setSavedLayouts(converted);

            if (converted.length > 0) {
                const storedId = activeLayoutId ?? getStoredLayoutId(orgId);
                const match = storedId ? converted.find((s) => s.id === storedId) : null;
                const target = match ?? converted[0];
                setActiveLayoutId(target.id);
                storeLayoutId(orgId, target.id);
                setLayouts(target.layout);
            } else if (activeLayoutId) {
                setActiveLayoutId(null);
                storeLayoutId(orgId, null);
            }
        } finally {
            setIsLoading(false);
        }
    }, [orgId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        fetchTemplates();
    }, [orgId]);

    const selectLayout = useCallback((id: string | null) => {
        if (id === null) {
            setActiveLayoutId(null);
            storeLayoutId(orgId, null);
            setLayouts(DEFAULT_LAYOUTS);
            return;
        }
        const found = savedLayouts.find((s) => s.id === id);
        if (found) {
            setActiveLayoutId(found.id);
            storeLayoutId(orgId, found.id);
            setLayouts(found.layout);
        }
    }, [savedLayouts, orgId]);

    const startEditing = useCallback(() => {
        snapshotRef.current = structuredClone(layouts) as ResponsiveLayouts<DefaultBreakpoint>;
        setIsEditing(true);
    }, [layouts]);

    const cancelEditing = useCallback(() => {
        if (snapshotRef.current) {
            setLayouts(snapshotRef.current);
        }
        snapshotRef.current = null;
        setIsEditing(false);
    }, []);

    const saveLayoutAs = useCallback(async (name: string) => {
        if (!orgId) return;
        setIsSaving(true);
        try {
            const payload = { name, layout: layouts };
            await postPageTemplate(orgId, {
                type: PAGE_TEMPLATE_TYPE,
                data: payload,
            });
            const res = await getPageTemplates(orgId, PAGE_TEMPLATE_TYPE);
            if (res.success) {
                const templates: PageTemplate[] = res.success.page_templates ?? [];
                const converted = templates
                    .filter((t) => t.type === PAGE_TEMPLATE_TYPE)
                    .map(templateToSavedLayout)
                    .filter((s): s is SavedLayout => s !== null);
                setSavedLayouts(converted);
                const newest = converted.find((s) => (s.name === name));
                if (newest) {
                    setActiveLayoutId(newest.id);
                    storeLayoutId(orgId, newest.id);
                }
            }
        } finally {
            setIsSaving(false);
        }
        snapshotRef.current = null;
        setIsEditing(false);
    }, [orgId, layouts]);

    const updateActiveLayout = useCallback(async () => {
        if (!orgId || !activeLayoutId) return;
        setIsSaving(true);
        try {
            const active = savedLayouts.find((s) => s.id === activeLayoutId);
            const payload = { name: active?.name ?? "Untitled", layout: layouts };
            await patchPageTemplate(orgId, activeLayoutId, { data: payload });
            setSavedLayouts((prev) =>
                prev.map((s) =>
                    s.id === activeLayoutId ? { ...s, layout: layouts } : s
                )
            );
        } finally {
            setIsSaving(false);
        }
        snapshotRef.current = null;
        setIsEditing(false);
    }, [orgId, activeLayoutId, layouts, savedLayouts]);

    const deleteLayout = useCallback(async (id: string) => {
        if (!orgId) return;
        await deletePageTemplate(orgId, id);
        setSavedLayouts((prev) => prev.filter((s) => s.id !== id));
        if (activeLayoutId === id) {
            setActiveLayoutId(null);
            storeLayoutId(orgId, null);
            setLayouts(DEFAULT_LAYOUTS);
        }
    }, [orgId, activeLayoutId]);

    const renameLayout = useCallback(async (id: string, newName: string) => {
        if (!orgId) return;
        const target = savedLayouts.find((s) => s.id === id);
        if (!target) return;
        const payload = { name: newName, layout: target.layout };
        await patchPageTemplate(orgId, id, { data: payload });
        setSavedLayouts((prev) =>
            prev.map((s) => (s.id === id ? { ...s, name: newName } : s))
        );
    }, [orgId, savedLayouts]);

    const resetToDefault = useCallback(() => {
        setActiveLayoutId(null);
        storeLayoutId(orgId, null);
        setLayouts(DEFAULT_LAYOUTS);
        snapshotRef.current = null;
        setIsEditing(false);
    }, [orgId]);

    const onLayoutChange = useCallback(
        (_layout: Layout, allLayouts: ResponsiveLayouts<DefaultBreakpoint>) => {
            setLayouts(allLayouts);
        },
        [],
    );

    return {
        layouts,
        savedLayouts,
        activeLayoutId,
        isEditing,
        isSaving,
        isLoading,
        startEditing,
        cancelEditing,
        saveLayoutAs,
        updateActiveLayout,
        selectLayout,
        deleteLayout,
        renameLayout,
        resetToDefault,
        onLayoutChange,
    };
}
