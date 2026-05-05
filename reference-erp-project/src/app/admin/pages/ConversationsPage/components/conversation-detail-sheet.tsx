import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";
import { Loader2, Copy, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { getCharlesConversationRuns } from "@/api/chat/conversations";
import type {
    CharlesConversationRunsSuccess,
    CharlesRun,
} from "@/types/chat/conversation-runs";
import IdBadge from "@/app/components/id-badge";
import Message from "@/app/chat/components/Message";
import { buildConversationTurns } from "./conversation-trace/build-conversation-turns";
import { buildHierarchy } from "./conversation-trace/trace-utils";
import AgentTracePanel, {
    type TraceViewMode,
} from "./conversation-trace/agent-trace-panel";
import StepDetailPanel from "./conversation-trace/step-detail-panel";
import type { TraceCall } from "./conversation-trace/trace-types";
import EmployeeAvatar from "@/app/components/avatars/employee-avatar";
import Tag from "@/app/components/tag/tag";
import { formatDate } from "@/utils/miscelanea";

type ConversationDetailSheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: string | undefined;
    groupId: string | null;
    totalCostUsd: number | null;
};

function runsFromResponse(body: unknown): {
    runs: CharlesRun[];
    nextPageToken: string | null;
} {
    if (!body || typeof body !== "object") {
        return { runs: [], nextPageToken: null };
    }
    const s = (body as { success?: CharlesConversationRunsSuccess }).success;
    if (!s || !Array.isArray(s.runs)) {
        return { runs: [], nextPageToken: null };
    }
    return { runs: s.runs, nextPageToken: s.next_page_token ?? null };
}

const ConversationDetailSheet = ({
    open,
    onOpenChange,
    orgId,
    groupId,
    totalCostUsd = null,
}: ConversationDetailSheetProps) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [runs, setRuns] = useState<CharlesRun[]>([]);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [selectedTurnId, setSelectedTurnId] = useState<string | null>(null);
    const [selectedStep, setSelectedStep] = useState<TraceCall | null>(null);
    const [viewMode, setViewMode] = useState<TraceViewMode>("cascade");
    const [detailOpen, setDetailOpen] = useState(true);

    useEffect(() => {
        if (!open || !groupId || !orgId) {
            setRuns([]);
            setNextPageToken(null);
            setSelectedTurnId(null);
            setSelectedStep(null);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setRuns([]);
        setNextPageToken(null);
        setSelectedTurnId(null);
        setSelectedStep(null);

        void (async () => {
            try {
                const response = await getCharlesConversationRuns(
                    orgId,
                    groupId,
                );
                if (cancelled) return;
                const { runs: list, nextPageToken: npt } =
                    runsFromResponse(response);
                setRuns(list);
                setNextPageToken(npt);
            } catch {
                if (!cancelled) {
                    toast.error(
                        t(
                            "conversations.detail.fetchError",
                            "Failed to load conversation",
                        ),
                    );
                    setRuns([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [open, groupId, orgId, t]);

    const loadMore = useCallback(async () => {
        if (!orgId || !groupId || !nextPageToken || loadingMore) return;
        setLoadingMore(true);
        try {
            const response = await getCharlesConversationRuns(
                orgId,
                groupId,
                nextPageToken,
            );
            const { runs: moreRuns, nextPageToken: npt } =
                runsFromResponse(response);
            setRuns((prev) => [...prev, ...moreRuns]);
            setNextPageToken(npt);
        } catch {
            toast.error(
                t(
                    "conversations.detail.fetchError",
                    "Failed to load conversation",
                ),
            );
        } finally {
            setLoadingMore(false);
        }
    }, [orgId, groupId, nextPageToken, loadingMore, t]);

    const turns = useMemo(
        () => buildConversationTurns(runs),
        [runs],
    );

    useEffect(() => {
        if (turns.length === 0) {
            setSelectedTurnId(null);
            return;
        }
        setSelectedTurnId((prev) => {
            if (prev && turns.some((x) => x.id === prev)) return prev;
            return turns[0]!.id;
        });
    }, [turns]);

    const selectedTurn = useMemo(
        () => turns.find((x) => x.id === selectedTurnId) ?? null,
        [turns, selectedTurnId],
    );

    const { rootCall, flatSteps } = useMemo(
        () => buildHierarchy(selectedTurn?.run.trace),
        [selectedTurn?.run.trace],
    );

    useEffect(() => {
        if (!selectedTurn || !rootCall) {
            setSelectedStep(null);
            return;
        }
        setSelectedStep((prev) => {
            if (prev && flatSteps.some((s) => s.call_id === prev.call_id)) {
                return prev;
            }
            return rootCall;
        });
    }, [selectedTurn, rootCall, flatSteps]);

    const runForHeader = selectedTurn?.run ?? runs[0];
    const employee = runForHeader?.employee;

    const selectedTurnIndex = turns.findIndex((x) => x.id === selectedTurnId);
    const canGoPrev = selectedTurnIndex > 0;
    const canGoNext = selectedTurnIndex < turns.length - 1 && selectedTurnIndex !== -1;

    const goToPrevRun = () => {
        if (canGoPrev) setSelectedTurnId(turns[selectedTurnIndex - 1]!.id);
    };
    const goToNextRun = () => {
        if (canGoNext) setSelectedTurnId(turns[selectedTurnIndex + 1]!.id);
    };

    const copyRaw = () => {
        const text = JSON.stringify(
            { runs, group_id: groupId },
            null,
            2,
        );
        void navigator.clipboard.writeText(text);
        toast.success(
            t("common.copiedToClipboard", "Copied to clipboard"),
        );
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="flex h-dvh max-h-dvh w-full max-w-full flex-col gap-0 border-0 p-0 sm:max-w-full [&>button.absolute]:hidden"
            >
                <SheetHeader className="shrink-0 border-b px-4 py-2">
                    <div className="flex items-center gap-3 justify-center">
                        <SheetTitle className="shrink-0 text-md font-semibold">
                            {t(
                                "conversations.detail.title",
                                "Conversation details",
                            )}
                        </SheetTitle>

                        {runForHeader?.created_at ? (
                            <span className="text-xs text-muted-foreground tabular-nums mr-auto">
                                {formatDate(runForHeader.created_at, { showTime: true, showSeconds: false })}
                            </span>
                        ) : <span className="mr-auto" />}

                        <SheetDescription className="sr-only">
                            {t("conversations.detail.title", "Conversation")}
                        </SheetDescription>


                        {groupId ? (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                {t("conversations.detail.groupId", "Group ID")}:
                                <IdBadge id={groupId} hideIcon />
                            </span>
                        ) : null}

                        {totalCostUsd != null && totalCostUsd > 0 ? (
                            <IdBadge
                                id={`$${totalCostUsd.toFixed(4)}`}
                                className="text-xs"
                                customTooltip={t("conversations.trace.copy_cost", "Copy cost")}
                            />
                        ) : null}

                        {employee ? (
                            <EmployeeAvatar
                                employee={employee}
                                size="sm"
                            />
                        ) : null}

                        {runForHeader ? (
                            <Tag
                                text={runForHeader.status}
                                className="text-xs font-normal capitalize"
                            />
                        ) : null}

                        {turns.length > 1 ? (
                            <div className="flex items-center gap-0.5">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    disabled={!canGoPrev}
                                    onClick={goToPrevRun}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-xs text-muted-foreground tabular-nums">
                                    {selectedTurnIndex + 1}/{turns.length}
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    disabled={!canGoNext}
                                    onClick={goToNextRun}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : null}

                        <div className="flex items-center gap-1">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-7 gap-1.5 text-xs"
                                onClick={copyRaw}
                                disabled={runs.length === 0}
                            >
                                <Copy className="h-3 w-3" />
                                {t("common.copy", "Copy trace")}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => onOpenChange(false)}
                            >
                                <Icon
                                    icon="lucide:x"
                                    className="h-4 w-4"
                                />
                            </Button>
                        </div>
                    </div>
                </SheetHeader>

                {loading ? (
                    <div className="flex flex-1 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : runs.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted-foreground">
                        <Icon
                            icon="lucide:message-square-off"
                            className="h-10 w-10 opacity-50"
                        />
                        {t(
                            "conversations.detail.empty",
                            "No runs for this conversation.",
                        )}
                    </div>
                ) : (
                    <ResizablePanelGroup
                        direction="horizontal"
                        className="min-h-0 flex-1"
                    >
                        {/* Chat panel */}
                        <ResizablePanel
                            defaultSize={22}
                            minSize={15}
                            maxSize={45}
                        >
                            <div className="flex h-full flex-col">
                                <ScrollArea className="min-h-0 flex-1">
                                    <div className="flex flex-col-reverse gap-4 p-4">
                                        {[...turns].reverse().map((turn) => {
                                            const active =
                                                turn.id === selectedTurnId;
                                            return (
                                                <button
                                                    key={turn.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedTurnId(
                                                            turn.id,
                                                        );
                                                        setSelectedStep(null);
                                                    }}
                                                    className={cn(
                                                        "flex w-full flex-col gap-4 rounded-xl px-2 py-3 text-left transition-colors",
                                                        active
                                                            ? "bg-accent/60 ring-1 ring-primary/20"
                                                            : "hover:bg-muted/40",
                                                    )}
                                                >
                                                    {turn.messages.map(
                                                        (msg, idx) => (
                                                            <Message
                                                                key={`${turn.id}-msg-${idx}`}
                                                                message={msg}
                                                            />
                                                        ),
                                                    )}
                                                    {turn.run.created_at ? (
                                                        <span className="text-[10px] text-muted-foreground/60">
                                                            {formatDate(turn.run.created_at, { showTime: true, showSeconds: true })}
                                                        </span>
                                                    ) : null}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </ScrollArea>
                                {nextPageToken ? (
                                    <div className="flex shrink-0 justify-center border-t py-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="gap-1.5 text-xs text-muted-foreground"
                                            disabled={loadingMore}
                                            onClick={() => void loadMore()}
                                        >
                                            {loadingMore ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <ChevronDown className="h-3 w-3" />
                                            )}
                                            {t(
                                                "conversations.detail.loadOlder",
                                                "Load older",
                                            )}
                                        </Button>
                                    </div>
                                ) : null}
                            </div>
                        </ResizablePanel>

                        <ResizableHandle />

                        {/* Trace panel */}
                        <ResizablePanel
                            defaultSize={detailOpen && selectedTurn?.run.trace ? 40 : 71}
                            minSize={25}
                        >
                            {selectedTurn?.run.trace ? (
                                <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
                                    <AgentTracePanel
                                        rootCall={rootCall}
                                        selectedStep={selectedStep}
                                        onStepSelect={setSelectedStep}
                                        viewMode={viewMode}
                                        onViewModeChange={setViewMode}
                                        showDetail={detailOpen}
                                        onToggleDetail={() =>
                                            setDetailOpen((p) => !p)
                                        }
                                    />
                                </div>
                            ) : (
                                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                    {t(
                                        "conversations.trace.no_trace",
                                        "No trace for this turn.",
                                    )}
                                </div>
                            )}
                        </ResizablePanel>

                        {detailOpen && selectedTurn?.run.trace ? (
                            <>
                                <ResizableHandle />
                                <ResizablePanel
                                    defaultSize={35}
                                    minSize={35}
                                    maxSize={35}
                                >
                                    <div className="h-full min-h-0 min-w-0 overflow-hidden">
                                        <StepDetailPanel
                                            runDetails={selectedTurn.run}
                                            selectedStep={selectedStep}
                                            rootCall={rootCall}
                                        />
                                    </div>
                                </ResizablePanel>
                            </>
                        ) : null}
                    </ResizablePanelGroup>
                )}
            </SheetContent>
        </Sheet>
    );
};

export default ConversationDetailSheet;
