import { useCallback, useState } from "react";
import type { ColumnOrderState, ColumnSizingState, VisibilityState } from "@tanstack/react-table";

const STORAGE_KEY = "laia:item-rates-table-prefs";

/** Columns hidden by default — users opt-in via the column selector. */
const defaultColumnVisibility: VisibilityState = {};

const defaultPreferences = {
    columnVisibility: defaultColumnVisibility,
    columnOrder: [] as ColumnOrderState,
    columnSizing: {} as ColumnSizingState,
};

type Prefs = typeof defaultPreferences;

function loadPreferences(): Prefs {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored) as Partial<Prefs>;
            return {
                ...defaultPreferences,
                ...parsed,
                columnVisibility: {
                    ...defaultColumnVisibility,
                    ...(parsed.columnVisibility ?? {}),
                },
            };
        }
    } catch {
        // ignore parse errors
    }
    return defaultPreferences;
}

function savePreferences(prefs: Prefs) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
        // ignore write errors
    }
}

export function useItemRatesTablePreferences() {
    const [prefs, setPrefs] = useState<Prefs>(loadPreferences);

    const setColumnVisibility = useCallback(
        (updater: VisibilityState | ((old: VisibilityState) => VisibilityState)) => {
            setPrefs((prev) => {
                const next = {
                    ...prev,
                    columnVisibility:
                        typeof updater === "function" ? updater(prev.columnVisibility) : updater,
                };
                savePreferences(next);
                return next;
            });
        },
        [],
    );

    const setColumnOrder = useCallback(
        (updater: ColumnOrderState | ((old: ColumnOrderState) => ColumnOrderState)) => {
            setPrefs((prev) => {
                const next = {
                    ...prev,
                    columnOrder:
                        typeof updater === "function" ? updater(prev.columnOrder) : updater,
                };
                savePreferences(next);
                return next;
            });
        },
        [],
    );

    const setColumnSizing = useCallback(
        (updater: ColumnSizingState | ((old: ColumnSizingState) => ColumnSizingState)) => {
            setPrefs((prev) => {
                const next = {
                    ...prev,
                    columnSizing:
                        typeof updater === "function" ? updater(prev.columnSizing) : updater,
                };
                savePreferences(next);
                return next;
            });
        },
        [],
    );

    const resetPreferences = useCallback(() => {
        savePreferences(defaultPreferences);
        setPrefs(defaultPreferences);
    }, []);

    return {
        columnVisibility: prefs.columnVisibility,
        setColumnVisibility,
        columnOrder: prefs.columnOrder,
        setColumnOrder,
        columnSizing: prefs.columnSizing,
        setColumnSizing,
        resetPreferences,
    };
}
