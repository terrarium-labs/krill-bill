import { Icon } from "@iconify/react";
import type { ReactNode } from "react";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import CodeViewer, { type MonacoEditor } from "@/app/components/code-viewer";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import IdBadge from "@/app/components/id-badge";
import Tag from "@/app/components/tag/tag";
import type { TraceCall } from "./trace-types";
import type { CharlesRun } from "@/types/chat/conversation-runs";
import {
    formatTraceDurationMs,
    getStepIconStyle,
} from "./trace-misc";
import StepIcon from "./step-icon";
import {
    getActualModel,
    getTokenCount,
} from "./trace-utils";
import { formatDate, getColorClasses } from "@/utils/miscelanea";

function safeJson(data: unknown): string {
    if (data == null) return "";
    if (typeof data === "string") return data;
    try {
        return JSON.stringify(data, null, 2);
    } catch {
        return String(data);
    }
}

const KNOWN_USAGE_KEYS = new Set([
    "prompt_tokens",
    "completion_tokens",
    "total_tokens",
    "cache_read_input_tokens",
    "cache_creation_input_tokens",
]);

function parsePerModelUsage(
    usage: TraceCall["usage"],
): { model: string; tokenType: string; label: string; value: number }[] {
    if (!usage) return [];
    const rows: { model: string; tokenType: string; label: string; value: number }[] =
        [];
    for (const [key, value] of Object.entries(usage)) {
        if (KNOWN_USAGE_KEYS.has(key) || typeof value !== "number") continue;
        const colonIdx = key.indexOf(":");
        if (colonIdx === -1) continue;
        const model = key.slice(0, colonIdx);
        const tokenType = key.slice(colonIdx + 1);
        rows.push({
            model,
            tokenType,
            label: `${model}:${tokenType}`,
            value,
        });
    }
    return rows.sort((a, b) => {
        if (a.model !== b.model) return a.model.localeCompare(b.model);
        const aLast = a.tokenType === "total_tokens" ? 1 : 0;
        const bLast = b.tokenType === "total_tokens" ? 1 : 0;
        if (aLast !== bLast) return aLast - bLast;
        return a.tokenType.localeCompare(b.tokenType);
    });
}

const MetricsSection = memo(function MetricsSection({
    step,
    runDetails,
}: {
    step: TraceCall;
    runDetails?: CharlesRun | null;
}) {
    const { t } = useTranslation();
    const duration =
        Number(step.end_time ?? step.t1) -
        Number(step.start_time ?? step.t0);
    const model = getActualModel(step);
    const aggregateTotal = getTokenCount(step);
    const stepType =
        typeof step.metadata?.type === "string"
            ? step.metadata.type
            : "unknown";
    const perModel = useMemo(
        () => parsePerModelUsage(step.usage),
        [step.usage],
    );

    return (
        <ScrollArea className="h-full">
            <div className="space-y-3 px-4 py-4 pr-6">
                <div className="rounded-lg border border-border">
                    <div className="border-b border-border bg-muted/50 px-3 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground">
                        {t("conversations.trace.overview", "Overview")}
                    </div>
                    <div className="divide-y divide-border text-sm">
                        <Row
                            label={t("conversations.trace.status", "Status")}
                            value={
                                <Tag
                                    text={
                                        step.error
                                            ? t(
                                                "conversations.trace.error",
                                                "Error",
                                            )
                                            : t(
                                                "conversations.trace.success",
                                                "Success",
                                            )
                                    }
                                />
                            }
                        />
                        {runDetails?.created_at ? (
                            <Row
                                label={t(
                                    "conversations.trace.created_at",
                                    "Created at",
                                )}
                                value={formatDate(runDetails.created_at, {
                                    showTime: true,
                                    showSeconds: true,
                                })}
                            />
                        ) : null}
                        <Row
                            label={t("conversations.trace.latency", "Latency")}
                            value={formatTraceDurationMs(duration)}
                        />
                        <Row
                            label={t("conversations.trace.type", "Type")}
                            value={stepType}
                            valueClass="capitalize"
                        />
                        {model ? (
                            <Row
                                label={t("conversations.trace.model", "Model")}
                                value={model}
                                valueClass="font-mono text-xs"
                            />
                        ) : null}
                    </div>
                </div>

                {perModel.length > 0 || aggregateTotal != null ? (
                    <div className="rounded-lg border border-border">
                        <div className="border-b border-border bg-muted/50 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                            {t(
                                "conversations.trace.usage_by_model",
                                "Usage by model",
                            )}
                        </div>
                        <div className="divide-y divide-border">
                            {perModel.map((r, i) => (
                                <div
                                    key={`${r.label}-${i}`}
                                    className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                                >
                                    <span className="min-w-0 break-all font-mono text-xs text-muted-foreground">
                                        {r.label}
                                    </span>
                                    <span className="shrink-0 font-mono text-xs">
                                        {r.value.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                            {aggregateTotal != null ? (
                                <div
                                    className={cn(
                                        "flex items-center justify-between gap-2 px-3 py-2 text-sm",
                                        perModel.length > 0 &&
                                        "bg-muted/30",
                                    )}
                                >
                                    <span className="font-mono text-xs font-semibold text-muted-foreground">
                                        {t(
                                            "conversations.trace.total",
                                            "Total",
                                        )}
                                    </span>
                                    <span className="shrink-0 font-mono text-xs font-semibold">
                                        {aggregateTotal.toLocaleString()}
                                    </span>
                                </div>
                            ) : null}
                        </div>
                    </div>
                ) : null}

                <div className="rounded-lg border border-border">
                    <div className="border-b border-border bg-muted/50 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                        {t("conversations.trace.ids", "IDs")}
                    </div>
                    <div className="divide-y divide-border text-sm">
                        {step.call_id ? (
                            <Row
                                label="call_id"
                                value={step.call_id}
                                valueClass="break-all font-mono text-xs"
                            />
                        ) : null}
                        {step.parent_call_id ? (
                            <Row
                                label="parent_call_id"
                                value={String(step.parent_call_id)}
                                valueClass="break-all font-mono text-xs"
                            />
                        ) : null}
                    </div>
                </div>
            </div>
        </ScrollArea>
    );
});

function Row({
    label,
    value,
    valueClass,
}: {
    label: string;
    value: ReactNode;
    valueClass?: string;
}) {
    return (
        <div className="flex items-center justify-between gap-3 px-3 py-2">
            <span className="shrink-0 text-muted-foreground">{label}</span>
            <span
                className={`text-right ${valueClass ?? "text-foreground"}`}
            >
                {value}
            </span>
        </div>
    );
}

const JsonBlock = memo(function JsonBlock({
    title,
    value,
    defaultOpen = true,
}: {
    title: string;
    value: unknown;
    defaultOpen?: boolean;
}) {
    const { t } = useTranslation();
    const editorRef = useRef<MonacoEditor | null>(null);
    const text = safeJson(value);
    const hasContent = value != null && text !== "";

    const copy = () => {
        void navigator.clipboard.writeText(text || "");
        toast.success(
            t("common.copiedToClipboard", "Copied to clipboard"),
        );
    };

    const openFind = () => {
        editorRef.current?.focus();
        void editorRef.current?.getAction("actions.find")?.run();
    };

    if (!hasContent) {
        return (
            <div className="min-w-0">
                <div className="border-b border-border bg-muted/50 px-3 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground">
                    {title}
                </div>
                <div className="bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                    {t("conversations.trace.empty", "Empty")}
                </div>
            </div>
        );
    }

    return (
        <Collapsible className="group" defaultOpen={defaultOpen}>
            <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/50 px-3 py-1.5">
                <CollapsibleTrigger className="flex flex-1 items-center gap-2 text-left text-xs font-semibold tracking-wide text-muted-foreground hover:underline [&[data-state=open]>svg]:-rotate-90">
                    <Icon
                        icon="lucide:chevron-down"
                        className="h-3.5 w-3.5 shrink-0 transition-transform duration-200"
                    />
                    {title}
                </CollapsibleTrigger>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4! w-4! shrink-0"
                    title={t("common.search", "Search")}
                    onClick={openFind}
                >
                    <Icon icon="lucide:search" className="h-4! w-4! text-muted-foreground" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4! w-4! shrink-0"
                    onClick={copy}
                >
                    <Icon icon="lucide:copy" className="h-4! w-4! text-muted-foreground" />
                </Button>
            </div>
            <CollapsibleContent className="min-w-0 overflow-hidden">
                <CodeViewer
                    value={text}
                    language={typeof value === "string" ? "plaintext" : "json"}
                    maxHeight={350}
                    className="bg-muted/20"
                    onEditorMount={(ed) => { editorRef.current = ed; }}
                />
            </CollapsibleContent>
        </Collapsible>
    );
});

const CopyRunButton = memo(function CopyRunButton({
    runDetails,
    t,
}: {
    runDetails: CharlesRun | null;
    t: ReturnType<typeof useTranslation>["t"];
}) {
    const copy = useCallback(() => {
        if (!runDetails) return;
        void navigator.clipboard.writeText(
            JSON.stringify(runDetails, null, 2),
        );
        toast.success(t("common.copiedToClipboard", "Copied to clipboard"));
    }, [runDetails, t]);

    if (!runDetails) return null;

    return (
        <Button
            type="button"
            variant="outline"
            className="h-7 gap-1.5 text-xs"
            onClick={copy}
        >
            <Icon icon="lucide:copy" className="h-3 w-3" />
            {t("conversations.trace.copy_run", "Copy run")}
        </Button>
    );
});

const StepDetailPanel = memo(function StepDetailPanel({
    runDetails,
    selectedStep,
    rootCall,
}: {
    runDetails: CharlesRun | null;
    selectedStep: TraceCall | null;
    rootCall: TraceCall | null;
}) {
    const { t } = useTranslation();
    const [tab, setTab] = useState("run");

    const activeStep = selectedStep ?? rootCall;

    if (!activeStep) {
        return (
            <div className="flex h-full items-center justify-center p-6">
                <p className="text-sm text-muted-foreground">
                    {t(
                        "conversations.trace.select_step",
                        "Select a step to view details",
                    )}
                </p>
            </div>
        );
    }

    const stepName = activeStep.path
        ? activeStep.path.split(".").pop()
        : t("conversations.trace.unknown", "Unknown");

    const headerIconStyle = activeStep.error
        ? { className: getColorClasses("red") }
        : getStepIconStyle(activeStep);

    const meta = activeStep.metadata as Record<string, unknown> | undefined;
    const instructions =
        (meta?.instructions as string | undefined) ??
        (meta?.system_prompt as string | undefined) ??
        null;

    return (
        <div className="flex h-full min-h-0 min-w-0 flex-col">
            <Tabs
                value={tab}
                onValueChange={setTab}
                className="flex min-h-0 min-w-0 flex-1 flex-col gap-0"
            >
                <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-2">
                    <div
                        className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md border", headerIconStyle.className)}
                    >
                        <StepIcon
                            step={activeStep}
                            className="h-3.5 w-3.5"
                        />
                    </div>
                    <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">
                        {stepName}
                    </h2>

                    {runDetails?.id ? (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            {t("conversations.trace.run_id", "Run ID")}:
                            <IdBadge
                                id={String(runDetails.id)}
                                className="text-xs"
                            />
                        </span>
                    ) : null}

                    {runDetails?.cost_usd != null && runDetails.cost_usd > 0 ? (
                        <IdBadge
                            id={`$${runDetails.cost_usd.toFixed(4)}`}
                            className="text-xs"
                            customTooltip={t("conversations.trace.copy_cost", "Copy cost")}
                        />
                    ) : null}

                    <TabsList className="h-8 gap-0.5 rounded-lg bg-muted/80 p-0.5">
                        <TabsTrigger
                            value="run"
                            className="h-6 flex-none px-2.5 text-xs"
                        >
                            {t("conversations.trace.tab_run", "Run")}
                        </TabsTrigger>
                        <TabsTrigger
                            value="metrics"
                            className="h-6 flex-none px-2.5 text-xs"
                        >
                            {t("conversations.trace.tab_metrics", "Metrics")}
                        </TabsTrigger>
                    </TabsList>
                    <CopyRunButton runDetails={runDetails} t={t} />
                </div>

                <TabsContent
                    value="run"
                    className="mt-0 min-h-0 min-w-0 flex-1 overflow-hidden data-[state=inactive]:hidden"
                >
                    <ScrollArea className="h-full min-w-0">
                        <div className="min-w-0 space-y-2 p-4 pr-6">
                            <div className="min-w-0 overflow-hidden rounded-lg border border-border">
                                <JsonBlock
                                    title={t(
                                        "conversations.trace.input",
                                        "Input",
                                    )}
                                    value={activeStep.input}
                                />
                            </div>
                            {instructions ? (
                                <div className="min-w-0 overflow-hidden rounded-lg border border-border">
                                    <JsonBlock
                                        title={t(
                                            "conversations.trace.system_prompt",
                                            "System prompt",
                                        )}
                                        value={instructions}
                                        defaultOpen={false}
                                    />
                                </div>
                            ) : null}
                            <div className="min-w-0 overflow-hidden rounded-lg border border-border">
                                <JsonBlock
                                    title={
                                        activeStep.error
                                            ? t(
                                                "conversations.trace.error_block",
                                                "Error",
                                            )
                                            : t(
                                                "conversations.trace.output",
                                                "Output",
                                            )
                                    }
                                    value={
                                        activeStep.error ?? activeStep.output
                                    }
                                />
                            </div>
                        </div>
                    </ScrollArea>
                </TabsContent>

                <TabsContent
                    value="metrics"
                    className="mt-0 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden"
                >
                    <MetricsSection
                        step={activeStep}
                        runDetails={runDetails}
                    />
                </TabsContent>
            </Tabs >
        </div >
    );
});

export default StepDetailPanel;
