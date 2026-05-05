import React, { useState, useEffect, useRef, useCallback } from "react";
import { Plus, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useSaleInvoice } from "../../contexts/SaleInvoiceContext";

interface FieldEntry {
    id: number;
    key: string;
    value: string;
}

let nextFieldId = 0;

const toEntries = (fields: Record<string, string> | null): FieldEntry[] => {
    if (!fields) return [];
    return Object.entries(fields).map(([key, value]) => ({
        id: nextFieldId++,
        key,
        value,
    }));
};

const toRecord = (entries: FieldEntry[]): Record<string, string> | null => {
    if (entries.length === 0) return null;
    const record: Record<string, string> = {};
    for (const entry of entries) {
        if (entry.key.trim()) record[entry.key] = entry.value;
    }
    return Object.keys(record).length > 0 ? record : null;
};

const AdditionalFieldsSection: React.FC = () => {
    const { t } = useTranslation();
    const { invoice, setData, isReadOnly } = useSaleInvoice();
    const [localEntries, setLocalEntries] = useState<FieldEntry[]>(() =>
        toEntries(invoice.additional_fields)
    );
    const [newKey, setNewKey] = useState("");
    const [newValue, setNewValue] = useState("");
    const isFocusedRef = useRef(false);

    useEffect(() => {
        if (!isFocusedRef.current) {
            setLocalEntries(toEntries(invoice.additional_fields));
        }
    }, [invoice.additional_fields]);

    const syncToContext = useCallback((entries: FieldEntry[]) => {
        setData({ additional_fields: toRecord(entries) });
    }, [setData]);

    const handleBlur = () => {
        isFocusedRef.current = false;
        syncToContext(localEntries);
    };

    const handleFocus = () => {
        isFocusedRef.current = true;
    };

    const updateEntry = (id: number, field: "key" | "value", val: string) => {
        setLocalEntries((prev) =>
            prev.map((e) => (e.id === id ? { ...e, [field]: val } : e))
        );
    };

    const handleRemove = (id: number) => {
        const updated = localEntries.filter((e) => e.id !== id);
        setLocalEntries(updated);
        syncToContext(updated);
    };

    const handleAdd = () => {
        const key = newKey.trim();
        if (!key) return;
        const newEntry: FieldEntry = { id: nextFieldId++, key, value: newValue };
        const updated = [...localEntries, newEntry];
        setLocalEntries(updated);
        syncToContext(updated);
        setNewKey("");
        setNewValue("");
    };

    if (isReadOnly && localEntries.length === 0) return null;

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">
                {t("invoices.additionalFields", "Campos adicionales")}
            </h3>

            {localEntries.length > 0 && (
                <div className="space-y-4 px-1">
                    {localEntries.map((entry) => (
                        <div key={entry.id} className="space-y-1">
                            {isReadOnly ? (
                                <>
                                    <p className="text-sm font-medium">{entry.key}</p>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.value}</p>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={entry.key}
                                            onChange={(e) => updateEntry(entry.id, "key", e.target.value)}
                                            onFocus={handleFocus}
                                            onBlur={handleBlur}
                                            className="h-8 text-sm font-medium flex-1"
                                            placeholder={t("invoices.fieldName", "Nombre del campo")}
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 shrink-0"
                                            onClick={() => handleRemove(entry.id)}
                                        >
                                            <X className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </div>
                                    <Textarea
                                        value={entry.value}
                                        onChange={(e) => updateEntry(entry.id, "value", e.target.value)}
                                        onFocus={handleFocus}
                                        onBlur={handleBlur}
                                        className="text-sm min-h-[60px] resize-y"
                                        placeholder={t("invoices.fieldValue", "Valor")}
                                    />
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {!isReadOnly && (
                <div className="space-y-2 border border-dashed rounded-lg p-3">
                    <Input
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                        className="h-8 text-sm"
                        placeholder={t("invoices.newFieldName", "Nombre del campo")}
                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    />
                    <Textarea
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        className="text-sm min-h-[60px] resize-y"
                        placeholder={t("invoices.newFieldValue", "Valor")}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAdd();
                        }}
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={handleAdd}
                        disabled={!newKey.trim()}
                    >
                        <Plus className="h-4 w-4" />
                        {t("invoices.addField", "Añadir campo")}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default AdditionalFieldsSection;
