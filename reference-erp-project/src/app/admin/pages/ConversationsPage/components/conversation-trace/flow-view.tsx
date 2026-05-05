import { memo, useCallback, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import ReactFlow, {
    Background,
    Controls,
    Handle,
    MarkerType,
    Position,
    ReactFlowProvider,
    useEdgesState,
    useNodesState,
    useReactFlow,
    type Node,
    type Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import type { TFunction } from "i18next";
import { cn } from "@/lib/utils";
import { getColorClasses } from "@/utils/miscelanea";
import type { TraceCall } from "./trace-types";
import {
    formatTraceDurationMs,
    getStepIconStyle,
} from "./trace-misc";
import StepIcon from "./step-icon";
import { getTokenCount } from "./trace-utils";

const NODE_W = 200;
const NODE_H = 56;
const H_GAP = 50;
const GROUP_PAD_X = 24;
const GROUP_PAD_TOP = 50;
const GROUP_PAD_BOTTOM = 20;
const V_GAP = 20;

function detectParallelGroups(children: TraceCall[]): TraceCall[][] {
    if (!children?.length) return [];
    const getStart = (c: TraceCall) =>
        Number(c.start_time ?? c.t0) || 0;
    const getEnd = (c: TraceCall) =>
        Number(c.end_time ?? c.t1) || 0;

    const hasTimingData = children.every(
        (c) => getStart(c) > 0 && getEnd(c) > 0,
    );
    if (!hasTimingData) return children.map((c) => [c]);

    const sorted = [...children].sort((a, b) => getStart(a) - getStart(b));
    const groups: TraceCall[][] = [];
    let currentGroup = [sorted[0]!];
    let groupEnd = getEnd(sorted[0]!);

    for (let i = 1; i < sorted.length; i++) {
        const child = sorted[i]!;
        if (getStart(child) < groupEnd) {
            currentGroup.push(child);
            groupEnd = Math.max(groupEnd, getEnd(child));
        } else {
            groups.push(currentGroup);
            currentGroup = [child];
            groupEnd = getEnd(child);
        }
    }
    groups.push(currentGroup);
    return groups;
}

const StepFlowNode = memo(
    ({
        data,
    }: {
        data: {
            step: TraceCall;
            isSelected: boolean;
            hasError: boolean;
            t: TFunction;
        };
    }) => {
        const { step, isSelected, hasError, t } = data;
        const stepName = step.path
            ? step.path.split(".").pop()
            : t("conversations.trace.unknown", "Unknown");
        const tokens = getTokenCount(step);
        const iconStyle = hasError
            ? { className: getColorClasses("red") }
            : getStepIconStyle(step);

        const cardClass = cn(
            "min-w-[180px] rounded-lg border-2 px-3 py-2 shadow-sm",
            isSelected
                ? "border-primary bg-primary/10 dark:border-primary dark:bg-primary/20"
                : hasError
                  ? getColorClasses("red")
                  : "border-border bg-background dark:border-neutral-700 dark:bg-neutral-800",
        );

        const duration =
            typeof step.duration === "number"
                ? step.duration
                : Number(step.end_time ?? step.t1) -
                  Number(step.start_time ?? step.t0);

        return (
            <>
                <Handle
                    type="target"
                    position={Position.Left}
                    className="!h-0 !w-0 !border-0 !opacity-0"
                />
                <div className={cardClass}>
                    <div className="flex items-center gap-2">
                        <div
                            className={cn(
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border",
                                iconStyle.className,
                            )}
                        >
                            <StepIcon step={step} className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex min-w-0 flex-col">
                            <span className="max-w-[140px] truncate text-xs font-medium">
                                {stepName}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span>{formatTraceDurationMs(duration)}</span>
                                {tokens != null ? (
                                    <>
                                        <span className="text-muted-foreground/50">
                                            ·
                                        </span>
                                        <span>
                                            {tokens.toLocaleString()}{" "}
                                            {t(
                                                "conversations.trace.tok",
                                                "tok",
                                            )}
                                        </span>
                                    </>
                                ) : null}
                            </div>
                        </div>
                        {hasError ? (
                            <Icon
                                icon="lucide:alert-circle"
                                className="ml-auto h-3.5 w-3.5 shrink-0 opacity-90"
                            />
                        ) : null}
                    </div>
                </div>
                <Handle
                    type="source"
                    position={Position.Right}
                    className="!h-0 !w-0 !border-0 !opacity-0"
                />
            </>
        );
    },
);
StepFlowNode.displayName = "StepFlowNode";

const GroupFlowNode = memo(
    ({
        data,
    }: {
        data: {
            step: TraceCall;
            isSelected: boolean;
            hasError: boolean;
            t: TFunction;
        };
    }) => {
        const { step, isSelected, hasError, t } = data;
        const stepName = step.path
            ? step.path.split(".").pop()
            : t("conversations.trace.unknown", "Unknown");
        const iconStyle = hasError
            ? { className: getColorClasses("red") }
            : getStepIconStyle(step);

        const shellClass = cn(
            "h-full w-full rounded-xl border-2 border-dashed",
            isSelected
                ? "border-primary bg-primary/5 dark:border-primary dark:bg-primary/10"
                : hasError
                  ? getColorClasses("red")
                  : "border-border bg-muted/30 dark:border-neutral-600 dark:bg-neutral-800/30",
        );

        const duration =
            typeof step.duration === "number"
                ? step.duration
                : Number(step.end_time ?? step.t1) -
                  Number(step.start_time ?? step.t0);

        return (
            <>
                <Handle
                    type="target"
                    position={Position.Left}
                    className="!h-0 !w-0 !border-0 !opacity-0"
                />
                <div className={shellClass}>
                    <div className="flex h-10 items-center gap-2 border-b border-border/30 px-3 dark:border-neutral-700/30">
                        <div
                            className={cn(
                                "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                                iconStyle.className,
                            )}
                        >
                            <StepIcon step={step} className="h-3 w-3" />
                        </div>
                        <span
                            className={cn(
                                "truncate text-xs font-medium",
                                !hasError &&
                                    "text-foreground/80 dark:text-neutral-300",
                            )}
                        >
                            {stepName}
                        </span>
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                            {formatTraceDurationMs(duration)}
                        </span>
                        {hasError ? (
                            <Icon
                                icon="lucide:alert-circle"
                                className="h-3 w-3 shrink-0 opacity-90"
                            />
                        ) : null}
                    </div>
                </div>
                <Handle
                    type="source"
                    position={Position.Right}
                    className="!h-0 !w-0 !border-0 !opacity-0"
                />
            </>
        );
    },
);
GroupFlowNode.displayName = "GroupFlowNode";

function buildFlowGraph(
    rootCall: TraceCall | null,
    selectedStep: TraceCall | null,
    t: TFunction,
): { nodes: Node[]; edges: Edge[] } {
    if (!rootCall) return { nodes: [], edges: [] };
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const sizeMap = new Map<string, { w: number; h: number }>();
    const groupsMap = new Map<string, TraceCall[][]>();

    const getGroupDims = (groups: TraceCall[][]) =>
        groups.map((group) => {
            const sizes = group.map((c) => sizeMap.get(c.call_id)!);
            if (group.length === 1)
                return { w: sizes[0]!.w, h: sizes[0]!.h };
            return {
                w: Math.max(...sizes.map((s) => s.w)),
                h:
                    sizes.reduce((sum, s) => sum + s.h, 0) +
                    (group.length - 1) * V_GAP,
            };
        });

    const computeSize = (node: TraceCall): { w: number; h: number } => {
        if (!node.children?.length) {
            const s = { w: NODE_W, h: NODE_H };
            sizeMap.set(node.call_id, s);
            return s;
        }
        node.children.forEach((c) => computeSize(c));

        const groups = detectParallelGroups(node.children);
        groupsMap.set(node.call_id, groups);
        const groupDims = getGroupDims(groups);

        const totalW =
            groupDims.reduce((sum, g) => sum + g.w, 0) +
            (groups.length - 1) * H_GAP;
        const maxH = Math.max(...groupDims.map((g) => g.h));
        const w = totalW + 2 * GROUP_PAD_X;
        const h = maxH + GROUP_PAD_TOP + GROUP_PAD_BOTTOM;
        sizeMap.set(node.call_id, { w, h });
        return { w, h };
    };
    computeSize(rootCall);

    const place = (
        node: TraceCall,
        x: number,
        y: number,
        parentId: string | null,
    ) => {
        const hasChildren = node.children?.length > 0;
        const size = sizeMap.get(node.call_id)!;

        if (hasChildren) {
            nodes.push({
                id: node.call_id,
                type: "groupNode",
                position: { x, y },
                parentNode: parentId ?? undefined,
                data: {
                    step: node,
                    isSelected: selectedStep?.call_id === node.call_id,
                    hasError: !!node.error,
                    t,
                },
                style: { width: size.w, height: size.h },
                draggable: false,
            });

            const groups = groupsMap.get(node.call_id)!;
            const groupDims = getGroupDims(groups);
            const maxH = Math.max(...groupDims.map((g) => g.h));
            let gx = GROUP_PAD_X;

            for (let gi = 0; gi < groups.length; gi++) {
                const group = groups[gi]!;
                const gDim = groupDims[gi]!;

                if (group.length === 1) {
                    const child = group[0]!;
                    const cs = sizeMap.get(child.call_id)!;
                    const cy = GROUP_PAD_TOP + (maxH - cs.h) / 2;
                    place(child, gx, cy, node.call_id);
                } else {
                    let cy = GROUP_PAD_TOP + (maxH - gDim.h) / 2;
                    for (const child of group) {
                        const cs = sizeMap.get(child.call_id)!;
                        const cx = gx + (gDim.w - cs.w) / 2;
                        place(child, cx, cy, node.call_id);
                        cy += cs.h + V_GAP;
                    }
                }

                if (gi < groups.length - 1) {
                    const nextGroup = groups[gi + 1]!;
                    for (const src of group) {
                        for (const tgt of nextGroup) {
                            const edgeColor = src.error ? "#ef4444" : "#a1a1aa";
                            edges.push({
                                id: `e-${src.call_id}-${tgt.call_id}`,
                                source: src.call_id,
                                target: tgt.call_id,
                                type: "smoothstep",
                                animated: true,
                                style: {
                                    stroke: edgeColor,
                                    strokeWidth: 1.5,
                                },
                                markerEnd: {
                                    type: MarkerType.ArrowClosed,
                                    width: 12,
                                    height: 12,
                                    color: edgeColor,
                                },
                            });
                        }
                    }
                }
                gx += gDim.w + H_GAP;
            }
        } else {
            nodes.push({
                id: node.call_id,
                type: "stepNode",
                position: { x, y },
                parentNode: parentId ?? undefined,
                data: {
                    step: node,
                    isSelected: selectedStep?.call_id === node.call_id,
                    hasError: !!node.error,
                    t,
                },
                draggable: false,
            });
        }
    };

    place(rootCall, 0, 0, null);
    return { nodes, edges };
}

const FLOW_NODE_TYPES = {
    stepNode: StepFlowNode,
    groupNode: GroupFlowNode,
};

const FlowViewInner = memo(function FlowViewInner({
    rootCall,
    selectedStep,
    onStepSelect,
    t,
}: {
    rootCall: TraceCall | null;
    selectedStep: TraceCall | null;
    onStepSelect: (step: TraceCall) => void;
    t: TFunction;
}) {
    const { setCenter } = useReactFlow();
    const { nodes: initNodes, edges: initEdges } = useMemo(
        () => buildFlowGraph(rootCall, selectedStep, t),
        [rootCall, selectedStep, t],
    );
    const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);

    useEffect(() => {
        setNodes(initNodes);
    }, [initNodes, setNodes]);
    useEffect(() => {
        setEdges(initEdges);
    }, [initEdges, setEdges]);

    useEffect(() => {
        if (!selectedStep) return;
        const target = initNodes.find(
            (n) => n.id === selectedStep.call_id,
        );
        if (!target) return;

        let absX = target.position.x;
        let absY = target.position.y;
        let currentParentId = target.parentNode;
        while (currentParentId) {
            const pid = currentParentId;
            const parentNode = initNodes.find((n) => n.id === pid);
            if (!parentNode) break;
            absX += parentNode.position.x;
            absY += parentNode.position.y;
            currentParentId = parentNode.parentNode;
        }

        const w = (target.style?.width as number) || NODE_W;
        const h = (target.style?.height as number) || NODE_H;
        setCenter(absX + w / 2, absY + h / 2, {
            zoom: 1,
            duration: 400,
        });
    }, [selectedStep, initNodes, setCenter]);

    const handleNodeClick = useCallback(
        (_: React.MouseEvent, node: Node) => {
            const step = (node.data as { step: TraceCall }).step;
            onStepSelect(step);
        },
        [onStepSelect],
    );

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            nodeTypes={FLOW_NODE_TYPES}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            minZoom={0.1}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={false}
            nodesConnectable={false}
            className="bg-muted/50 dark:bg-neutral-900"
        >
            <Background color="#d4d4d8" gap={20} size={1} />
            <Controls
                showInteractive={false}
                className="!rounded-lg !border-border !shadow-sm dark:!border-neutral-700"
            />
        </ReactFlow>
    );
});

const FlowView = memo(function FlowView(
    props: React.ComponentProps<typeof FlowViewInner>,
) {
    return (
        <div className="h-full w-full min-h-[420px]">
            <ReactFlowProvider>
                <FlowViewInner {...props} />
            </ReactFlowProvider>
        </div>
    );
});

export default FlowView;
