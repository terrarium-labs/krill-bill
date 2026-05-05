import { Icon } from "@iconify/react";
import {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TraceCall } from "./trace-types";
import CascadeNode from "./cascade-node";
import WaterfallView from "./waterfall-view";
import FlowView from "./flow-view";

export type TraceViewMode = "cascade" | "waterfall" | "flow";

const AgentTracePanel = memo(function AgentTracePanel({
    rootCall,
    selectedStep,
    onStepSelect,
    viewMode,
    onViewModeChange,
    showDetail,
    onToggleDetail,
}: {
    rootCall: TraceCall | null;
    selectedStep: TraceCall | null;
    onStepSelect: (step: TraceCall | null) => void;
    viewMode: TraceViewMode;
    onViewModeChange: (mode: TraceViewMode) => void;
    showDetail: boolean;
    onToggleDetail: () => void;
}) {
    const { t } = useTranslation();
    const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(
        () => new Set(),
    );
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [displaySettings, setDisplaySettings] = useState({
        showLatency: true,
        showModel: true,
        showTokens: true,
    });
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchIdx, setSearchIdx] = useState(0);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const settingsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                settingsRef.current &&
                !settingsRef.current.contains(e.target as Node)
            ) {
                setSettingsOpen(false);
            }
        };
        if (settingsOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [settingsOpen]);

    const selectedChildIds = useMemo(() => {
        if (!selectedStep?.children?.length) return new Set<string>();
        const ids = new Set<string>();
        const walk = (node: TraceCall) => {
            if (node.children)
                node.children.forEach((child) => {
                    ids.add(child.call_id);
                    walk(child);
                });
        };
        walk(selectedStep);
        return ids;
    }, [selectedStep]);

    const toggleCollapse = useCallback((callId: string) => {
        setCollapsedNodes((prev) => {
            const next = new Set(prev);
            if (next.has(callId)) next.delete(callId);
            else next.add(callId);
            return next;
        });
    }, []);

    const expandAll = useCallback(() => {
        setCollapsedNodes(new Set());
    }, []);

    const collapseAll = useCallback(() => {
        const allIds = new Set<string>();
        const walk = (node: TraceCall) => {
            if (node.children?.length) {
                allIds.add(node.call_id);
                node.children.forEach(walk);
            }
        };
        if (rootCall) walk(rootCall);
        setCollapsedNodes(allIds);
    }, [rootCall]);

    const isAllCollapsed = useMemo(() => {
        if (!rootCall) return false;
        const collectIds = (node: TraceCall): string[] => {
            let ids: string[] = [];
            if (node.children?.length) {
                ids.push(node.call_id);
                node.children.forEach((child) => {
                    ids = ids.concat(collectIds(child));
                });
            }
            return ids;
        };
        const allIds = collectIds(rootCall);
        return (
            allIds.length > 0 &&
            allIds.every((id) => collapsedNodes.has(id))
        );
    }, [rootCall, collapsedNodes]);

    const toggleExpandCollapseAll = useCallback(() => {
        if (isAllCollapsed) expandAll();
        else collapseAll();
    }, [isAllCollapsed, expandAll, collapseAll]);

    const allNodes = useMemo(() => {
        const result: TraceCall[] = [];
        const walk = (node: TraceCall) => {
            result.push(node);
            if (node.children) node.children.forEach(walk);
        };
        if (rootCall) walk(rootCall);
        return result;
    }, [rootCall]);

    const searchMatches = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const term = searchTerm.toLowerCase();
        return allNodes.filter((n) => {
            const name = n.path ? n.path.split(".").pop() ?? "" : "";
            return name.toLowerCase().includes(term);
        });
    }, [allNodes, searchTerm]);

    const goToMatch = useCallback(
        (idx: number) => {
            if (searchMatches.length === 0) return;
            const safeIdx =
                ((idx % searchMatches.length) + searchMatches.length) %
                searchMatches.length;
            setSearchIdx(safeIdx);
            const target = searchMatches[safeIdx]!;

            const parentMap = new Map<string, TraceCall>();
            const buildParentMap = (
                node: TraceCall,
                parent: TraceCall | null,
            ) => {
                if (parent) parentMap.set(node.call_id, parent);
                if (node.children)
                    node.children.forEach((c) => buildParentMap(c, node));
            };
            if (rootCall) buildParentMap(rootCall, null);

            setCollapsedNodes((prev) => {
                const next = new Set(prev);
                let cur = parentMap.get(target.call_id);
                while (cur) {
                    next.delete(cur.call_id);
                    cur = parentMap.get(cur.call_id);
                }
                return next;
            });

            onStepSelect(target);

            requestAnimationFrame(() => {
                const el = document.querySelector(
                    `[data-call-id="${target.call_id}"]`,
                );
                el?.scrollIntoView({ block: "center", behavior: "smooth" });
            });
        },
        [searchMatches, rootCall, onStepSelect],
    );

    const toggleSearch = useCallback(() => {
        setSearchOpen((prev) => {
            if (prev) {
                setSearchTerm("");
                setSearchIdx(0);
            }
            return !prev;
        });
    }, []);

    const handleSearchKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter") {
                e.preventDefault();
                goToMatch(e.shiftKey ? searchIdx - 1 : searchIdx + 1);
            }
            if (e.key === "Escape") {
                setSearchOpen(false);
                setSearchTerm("");
                setSearchIdx(0);
            }
        },
        [goToMatch, searchIdx],
    );

    if (!rootCall) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                    {t("conversations.trace.no_details", "No trace details")}
                </p>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center px-4 py-2">
                <div className="flex items-center gap-1 rounded-lg border border-border p-1">
                    <Tabs
                        value={viewMode}
                        onValueChange={(v) =>
                            onViewModeChange(v as TraceViewMode)
                        }
                        className="w-fit gap-0"
                    >
                        <TabsList className="h-8 gap-0.5 bg-muted/80 p-0.5">
                            <TabsTrigger
                                value="cascade"
                                className="h-6 flex-none gap-1.5 px-2.5 text-xs"
                            >
                                <Icon
                                    icon="lucide:git-branch"
                                    className="h-3.5 w-3.5"
                                />
                                {t(
                                    "conversations.trace.cascade",
                                    "Cascade",
                                )}
                            </TabsTrigger>
                            <TabsTrigger
                                value="waterfall"
                                className="h-6 flex-none gap-1.5 px-2.5 text-xs"
                            >
                                <Icon
                                    icon="lucide:gantt-chart"
                                    className="h-3.5 w-3.5"
                                />
                                {t(
                                    "conversations.trace.waterfall",
                                    "Waterfall",
                                )}
                            </TabsTrigger>
                            <TabsTrigger
                                value="flow"
                                className="h-6 flex-none gap-1.5 px-2.5 text-xs"
                            >
                                <Icon
                                    icon="lucide:workflow"
                                    className="h-3.5 w-3.5"
                                />
                                {t("conversations.trace.flow", "Flow")}
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="mx-1 h-5 w-px bg-border" />

                    <button
                        type="button"
                        onClick={toggleSearch}
                        className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${searchOpen ? "bg-muted" : "hover:bg-muted/80"}`}
                        title={t(
                            "conversations.trace.search_nodes",
                            "Search nodes",
                        )}
                    >
                        <Icon
                            icon="lucide:search"
                            className="h-4 w-4 text-muted-foreground"
                        />
                    </button>
                    <button
                        type="button"
                        onClick={toggleExpandCollapseAll}
                        className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted/80"
                        title={
                            isAllCollapsed
                                ? t(
                                      "conversations.trace.expand_all",
                                      "Expand all",
                                  )
                                : t(
                                      "conversations.trace.collapse_all",
                                      "Collapse all",
                                  )
                        }
                    >
                        <Icon
                            icon={
                                isAllCollapsed
                                    ? "lucide:maximize-2"
                                    : "lucide:minimize-2"
                            }
                            className="h-4 w-4 text-muted-foreground"
                        />
                    </button>

                    <div className="relative" ref={settingsRef}>
                        <button
                            type="button"
                            onClick={() => setSettingsOpen((p) => !p)}
                            className={`flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted/80 ${settingsOpen ? "bg-muted" : ""}`}
                            title={t(
                                "conversations.trace.settings",
                                "Settings",
                            )}
                        >
                            <Icon
                                icon="lucide:settings"
                                className="h-4 w-4 text-muted-foreground"
                            />
                        </button>
                        {settingsOpen ? (
                            <div className="absolute top-full left-0 z-50 mt-1 flex min-w-[160px] flex-col gap-2.5 rounded-lg border border-border bg-popover p-3 shadow-md">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="show-latency"
                                        checked={displaySettings.showLatency}
                                        onCheckedChange={(v) =>
                                            setDisplaySettings((prev) => ({
                                                ...prev,
                                                showLatency: !!v,
                                            }))
                                        }
                                    />
                                    <Label
                                        htmlFor="show-latency"
                                        className="text-xs font-normal"
                                    >
                                        {t(
                                            "conversations.trace.latency",
                                            "Latency",
                                        )}
                                    </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="show-model"
                                        checked={displaySettings.showModel}
                                        onCheckedChange={(v) =>
                                            setDisplaySettings((prev) => ({
                                                ...prev,
                                                showModel: !!v,
                                            }))
                                        }
                                    />
                                    <Label
                                        htmlFor="show-model"
                                        className="text-xs font-normal"
                                    >
                                        {t(
                                            "conversations.trace.model",
                                            "Model",
                                        )}
                                    </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="show-tokens-cascade"
                                        checked={displaySettings.showTokens}
                                        onCheckedChange={(v) =>
                                            setDisplaySettings((prev) => ({
                                                ...prev,
                                                showTokens: !!v,
                                            }))
                                        }
                                    />
                                    <Label
                                        htmlFor="show-tokens-cascade"
                                        className="text-xs font-normal"
                                    >
                                        {t(
                                            "conversations.trace.tokens",
                                            "Tokens",
                                        )}
                                    </Label>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div className="mx-1 h-5 w-px bg-border" />

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={onToggleDetail}
                        title={
                            showDetail
                                ? t(
                                      "conversations.trace.hide_detail",
                                      "Hide detail panel",
                                  )
                                : t(
                                      "conversations.trace.show_detail",
                                      "Show detail panel",
                                  )
                        }
                    >
                        <Icon
                            icon={
                                showDetail
                                    ? "lucide:panel-right-close"
                                    : "lucide:panel-right-open"
                            }
                            className="h-4 w-4 text-muted-foreground"
                        />
                    </Button>
                </div>
            </div>

            {searchOpen ? (
                <div className="mx-4 mb-1 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5">
                    <Icon
                        icon="lucide:search"
                        className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                    />
                    <input
                        ref={searchInputRef}
                        autoFocus
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setSearchIdx(0);
                        }}
                        onKeyDown={handleSearchKeyDown}
                        placeholder={t(
                            "conversations.trace.search_steps",
                            "Search steps…",
                        )}
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                    {searchTerm ? (
                        <div className="flex shrink-0 items-center gap-1">
                            <span className="tabular-nums text-sm text-muted-foreground">
                                {searchMatches.length > 0
                                    ? `${searchIdx + 1}/${searchMatches.length}`
                                    : "0/0"}
                            </span>
                            <button
                                type="button"
                                onClick={() => goToMatch(searchIdx - 1)}
                                disabled={searchMatches.length === 0}
                                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted disabled:opacity-30"
                            >
                                <Icon
                                    icon="lucide:chevron-up"
                                    className="h-3.5 w-3.5"
                                />
                            </button>
                            <button
                                type="button"
                                onClick={() => goToMatch(searchIdx + 1)}
                                disabled={searchMatches.length === 0}
                                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted disabled:opacity-30"
                            >
                                <Icon
                                    icon="lucide:chevron-down"
                                    className="h-3.5 w-3.5"
                                />
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchTerm("");
                                    searchInputRef.current?.focus();
                                }}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <Icon icon="lucide:x" className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ) : null}
                </div>
            ) : null}

            <div
                className={
                    viewMode === "flow"
                        ? "min-h-0 flex-1 overflow-hidden"
                        : "min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-2"
                }
            >
                {viewMode === "cascade" ? (
                    <div className="px-4">
                        <CascadeNode
                            step={rootCall}
                            selectedStep={selectedStep}
                            onStepSelect={(s) => onStepSelect(s)}
                            t={t}
                            collapsedNodes={collapsedNodes}
                            toggleCollapse={toggleCollapse}
                            displaySettings={displaySettings}
                            selectedChildIds={selectedChildIds}
                        />
                    </div>
                ) : viewMode === "waterfall" ? (
                    <WaterfallView
                        rootCall={rootCall}
                        selectedStep={selectedStep}
                        onStepSelect={onStepSelect}
                        t={t}
                        collapsedNodes={collapsedNodes}
                        toggleCollapse={toggleCollapse}
                    />
                ) : (
                    <FlowView
                        rootCall={rootCall}
                        selectedStep={selectedStep}
                        onStepSelect={onStepSelect}
                        t={t}
                    />
                )}
            </div>
        </div>
    );
});

export default AgentTracePanel;
