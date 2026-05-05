import { useEffect, useMemo, useCallback, useRef, useState, Activity } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    ReactFlow,
    Node,
    Edge,
    useNodesState,
    useEdgesState,
    ConnectionLineType,
    Background,
    Controls,
    Handle,
    Position,
    Panel,
    useReactFlow,
    ReactFlowProvider,
    getNodesBounds,
    getViewportForBounds,
} from 'reactflow';
import { toPng } from 'html-to-image';
import { tree, hierarchy } from 'd3-hierarchy';
import 'reactflow/dist/style.css';
import { OriginItem, OriginItemType } from "@/types/general/origin-tree";
import { Button } from "@/components/ui/button";
import { Download, LayoutGrid, GripVertical, CaptionsOff, Captions } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import IdBadge from "@/app/components/id-badge";
import { useHandleOriginClick } from "@/utils/origin";
import TicketViewModal, { useTicketModal } from "@/app/tickets/components/ticket-view-modal";
import { Origin } from "@/types/general/origin";
import EventsTimeline from "@/app/components/events-timeline";
import type { FetchEventsResult } from "@/utils/events";
import { useParams } from "react-router-dom";
import WorkOrderCard from "@/app/components/cards/work-order-card";
import OrderCard from "@/app/components/cards/order-card";
import TicketCard from "@/app/components/cards/ticket-card";
import InvoiceCard from "@/app/components/cards/invoice-card";

/**
 * Shape of an action button for the diagram panel (used by renderActions when supported).
 */
export interface OriginTreeDiagramAction {
    /** Button label. */
    name: string;
    /** Optional Lucide icon. */
    icon?: LucideIcon | null;
    /** When true, button is disabled. */
    disabled?: boolean;
    /** When true, button is not rendered. */
    hidden?: boolean;
    /** Called when the button is clicked. */
    onClick: () => void;
}

// Custom Node Component - delegates to type-specific card components
const OriginNode = ({ data }: { data: any }) => {
    const isSelected = data.selectedId != null && data.entityId === data.selectedId;
    const entity = data.entity;
    const handleOriginClick = data.handleOriginClick;

    const origin: Origin = {
        type: data.type,
        id: data.entityId,
        name: data.name || '',
    };

    const renderCard = () => {
        switch (data.type as OriginItemType) {
            case 'work_order':
                return entity ? (
                    <WorkOrderCard
                        workOrder={entity}
                        variant="default"
                        isSelected={isSelected}
                        className="min-w-[280px] w-[420px]"
                    />
                ) : null;
            case 'order':
                return entity ? (
                    <OrderCard
                        order={entity}
                        isSelected={isSelected}
                        className="min-w-[280px] w-[420px]"
                    />
                ) : null;
            case 'ticket':
                return entity ? (
                    <TicketCard
                        ticket={entity}
                        isSelected={isSelected}
                        className="min-w-[280px] w-[420px]"
                        onViewClick={handleOriginClick ? () => handleOriginClick(origin) : undefined}
                    />
                ) : null;
            case 'invoice':
                return entity ? (
                    <InvoiceCard
                        invoice={entity}
                        isSelected={isSelected}
                        className="min-w-[280px] w-[420px]"
                    />
                ) : null;
            default:
                return null;
        }
    };

    const card = renderCard();
    if (!card) return null;

    return (
        <>
            <Handle type="target" position={Position.Top} />
            <Handle type="source" position={Position.Bottom} />
            {card}
        </>
    );
};

const nodeTypes = {
    originNode: OriginNode,
};

const nodeWidth = 420;

const DEFAULT_TIMELINE_CARD_POSITION = { x: 16, y: 16 };
const TIMELINE_CARD_WIDTH = 360;
const TIMELINE_CARD_MAX_HEIGHT = 600;

// Build hierarchy from origin items
interface HierarchyNode {
    id: string;
    data: any;
    children?: HierarchyNode[];
}

const buildHierarchyFromOriginItems = (items: OriginItem[]): HierarchyNode | null => {
    if (items.length === 0) return null;

    const nodeMap = new Map<string, HierarchyNode>();
    const roots: HierarchyNode[] = [];

    // Create nodes for all items
    items.forEach((item) => {
        const nodeId = item.entity.id;
        // Get the entity name based on type
        let entityName = '';
        const entity = item.entity as any;
        if (entity.name) {
            entityName = entity.name;
        } else if (entity.title) {
            entityName = entity.title;
        }

        nodeMap.set(nodeId, {
            id: nodeId,
            data: {
                entity: item.entity,
                entityId: item.entity.id,
                name: entityName,
                type: item.type,
            },
            children: [],
        });
    });

    // Build hierarchy based on parent_entity
    items.forEach((item) => {
        const node = nodeMap.get(item.entity.id)!;
        const parentId = item.parent_entity?.id || null;

        if (parentId && nodeMap.has(parentId)) {
            const parent = nodeMap.get(parentId)!;
            if (!parent.children) {
                parent.children = [];
            }
            parent.children.push(node);
        } else {
            // If parent not found in items, this is a root node
            roots.push(node);
        }
    });

    // If we have multiple roots, create a virtual root
    if (roots.length > 1) {
        return {
            id: 'virtual-root',
            data: {
                entity: null,
                entityId: 'root',
                name: 'Origin',
                type: 'work_order' as const,
                isVirtualRoot: true,
            },
            children: roots,
        };
    }

    return roots[0] || null;
};

const getLayoutedElements = (items: OriginItem[]) => {
    if (items.length === 0) {
        return { nodes: [], edges: [] };
    }

    const hierarchyRoot = buildHierarchyFromOriginItems(items);
    if (!hierarchyRoot) {
        return { nodes: [], edges: [] };
    }

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const root = hierarchy(hierarchyRoot);

    const treeLayout = tree<HierarchyNode>()
        .nodeSize([420, 260])
        .separation((a, b) => (a.parent === b.parent ? 1.4 : 1.8));

    const treeData = treeLayout(root);

    // Convert d3 hierarchy to React Flow nodes
    treeData.descendants().forEach((node) => {
        // Skip virtual root if it exists
        if (node.data.data.isVirtualRoot) return;

        nodes.push({
            id: node.data.id,
            type: 'originNode',
            data: node.data.data,
            position: {
                x: node.x - nodeWidth / 2,
                y: node.y,
            },
        });
    });

    // Create edges
    treeData.links().forEach((link) => {
        // Skip edges from virtual root
        if (link.source.data.data.isVirtualRoot) return;

        edges.push({
            id: `${link.source.data.id}-${link.target.data.id}`,
            source: link.source.data.id,
            target: link.target.data.id,
            type: ConnectionLineType.SmoothStep,
            animated: true,
            style: { stroke: '#94a3b8', strokeWidth: 2 },
        });
    });

    return { nodes, edges };
};

// Inner component that uses React Flow hooks
const OriginTreeDiagramInner = ({
    items,
    isLoading,
    defaultSelectedId,
    showTimeline = true,
    draggableTimeline = true,
    toggleTimelineOpacity = false,
    timelineShowSearchbar = false,
    timelineShowTitle = false,
    fetchEvents: fetchEventsProp,
    renderActions,
}: {
    items: OriginItem[];
    isLoading?: boolean;
    defaultSelectedId?: string;
    showTimeline?: boolean;
    draggableTimeline?: boolean;
    toggleTimelineOpacity?: boolean;
    timelineShowSearchbar?: boolean;
    timelineShowTitle?: boolean;
    fetchEvents?: (query?: string, pageToken?: string) => Promise<FetchEventsResult>;
    renderActions?: React.ReactNode;
}) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const containerRef = useRef<HTMLDivElement>(null);
    const { getNodes, fitView } = useReactFlow();

    const [selectedId, setSelectedId] = useState<string | undefined>(defaultSelectedId);
    const selectedIdRef = useRef(selectedId);
    selectedIdRef.current = selectedId;

    const [isTimelineOpen, setIsTimelineOpen] = useState(true);
    const [cardPosition, setCardPosition] = useState(DEFAULT_TIMELINE_CARD_POSITION);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number } | null>(null);

    // Ticket modal and origin navigation
    const { ticketModalOpen, selectedTicketId, setTicketModalOpen, openTicketModal } = useTicketModal();
    const handleOriginClick = useHandleOriginClick(openTicketModal);
    const handleOriginClickRef = useRef(handleOriginClick);
    
    // Update ref when handler changes
    useEffect(() => {
        handleOriginClickRef.current = handleOriginClick;
    }, [handleOriginClick]);

    // Create stable wrapper function for node data
    const stableHandleOriginClick = useCallback((origin: any) => {
        handleOriginClickRef.current(origin);
    }, []);

    const handleTimelineDragStart = useCallback(
        (e: React.MouseEvent) => {
            if (!draggableTimeline) return;
            e.preventDefault();
            setIsDragging(true);
            dragStartRef.current = {
                mouseX: e.clientX,
                mouseY: e.clientY,
                posX: cardPosition.x,
                posY: cardPosition.y,
            };
        },
        [cardPosition, draggableTimeline]
    );

    useEffect(() => {
        if (!isDragging) return;
        const onMove = (e: MouseEvent) => {
            if (!dragStartRef.current) return;
            const rect = containerRef.current?.getBoundingClientRect();
            const maxX = rect ? rect.width - TIMELINE_CARD_WIDTH : Infinity;
            const maxY = rect ? rect.height - TIMELINE_CARD_MAX_HEIGHT : Infinity;
            setCardPosition({
                x: Math.max(0, Math.min(maxX, dragStartRef.current.posX + e.clientX - dragStartRef.current.mouseX)),
                y: Math.max(0, Math.min(maxY, dragStartRef.current.posY + e.clientY - dragStartRef.current.mouseY)),
            });
        };
        const onUp = () => {
            setIsDragging(false);
            dragStartRef.current = null;
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
    }, [isDragging]);

    // Apply layout using d3-hierarchy
    const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
        () => getLayoutedElements(items),
        [items]
    );

    const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

    // When defaultSelectedId changes (e.g. navigation), reset selection to the new default
    useEffect(() => {
        setSelectedId(defaultSelectedId);
    }, [defaultSelectedId]);

    // When layout (items) changes: apply full layout and fit view (not on selection change)
    useEffect(() => {
        const currentSelection = selectedIdRef.current;
        const nodesWithSelection = layoutedNodes.map((n) => ({
            ...n,
            data: { 
                ...n.data, 
                selectedId: currentSelection, 
                handleOriginClick: stableHandleOriginClick
            },
        }));
        setNodes(nodesWithSelection);
        setEdges(layoutedEdges);
        setTimeout(() => {
            fitView({ padding: 0.2, duration: 300 });
        }, 50);
    }, [layoutedNodes, layoutedEdges, setNodes, setEdges, fitView, stableHandleOriginClick]);

    // When only selection changes: update selection in existing nodes without fitting view
    useEffect(() => {
        setNodes((current) =>
            current.map((n) => ({ 
                ...n, 
                data: { 
                    ...n.data, 
                    selectedId,
                    handleOriginClick: stableHandleOriginClick
                } 
            }))
        );
    }, [selectedId, setNodes, stableHandleOriginClick]);

    // Export to PNG
    const exportToPng = useCallback(() => {
        const currentNodes = getNodes();
        if (currentNodes.length === 0) {
            toast.error(t('common.noNodesToExport', 'No nodes to export'));
            return;
        }

        const nodesBounds = getNodesBounds(currentNodes);
        const padding = 150;
        const imageWidth = nodesBounds.width + padding * 2;
        const imageHeight = nodesBounds.height + padding * 2;
        const viewport = getViewportForBounds(nodesBounds, imageWidth, imageHeight, 0.5, 2, 0.1);

        const viewportElement = containerRef.current?.querySelector('.react-flow__viewport') as HTMLElement;
        if (!viewportElement) {
            toast.error(t('common.couldNotExport', 'Could not export diagram'));
            return;
        }

        const pixelRatio = 3;

        toPng(viewportElement, {
            cacheBust: true,
            backgroundColor: '#ffffff',
            width: imageWidth,
            height: imageHeight,
            pixelRatio,
            style: {
                width: `${imageWidth}px`,
                height: `${imageHeight}px`,
                transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            },
        })
            .then((dataUrl) => {
                const link = document.createElement('a');
                link.setAttribute('href', dataUrl);
                link.setAttribute('download', 'origin-tree.png');
                link.click();
                toast.success(t('common.exportedSuccessfully', 'Diagram exported successfully'));
            })
            .catch((err) => {
                console.error('Export error:', err);
                toast.error(t('common.couldNotExport', 'Could not export diagram'));
            });
    }, [getNodes, t]);

    // Auto layout
    const autoLayout = useCallback(() => {
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        setTimeout(() => {
            fitView({ padding: 0.2, duration: 300 });
        }, 50);
    }, [layoutedNodes, layoutedEdges, setNodes, setEdges, fitView]);

    if (isLoading) {
        return (
            <div className="h-[600px] flex items-center justify-center border rounded-lg bg-muted/20">
                <div className="text-center text-muted-foreground">
                    <p>{t('common.loading', 'Loading...')}</p>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="h-[600px] flex items-center justify-center border rounded-lg bg-muted/20">
                <div className="text-center text-muted-foreground">
                    <p>{t('workOrders.noOriginTree', 'No origin tree to display')}</p>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={cn("border rounded-lg bg-background h-[82vh]", showTimeline && "relative")}
        >
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={(_e, node) => {
                    const entityId = node?.data?.entityId;
                    if (entityId) setSelectedId(entityId);
                }}
                nodeTypes={nodeTypes}
                connectionLineType={ConnectionLineType.SmoothStep}
                proOptions={{
                    hideAttribution: true,
                }}
                fitView
                minZoom={0.1}
                maxZoom={1.5}
                defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
                className="dark:bg-background"
            >
                <Background className="dark:bg-background!" />
                <Controls
                    className="bg-background! border-border! shadow-md! [&>button]:bg-background! [&>button]:border-border! [&>button:hover]:bg-muted! [&>button>svg]:fill-foreground! [&>button>svg]:stroke-foreground!"
                />
                <Panel position="top-right" className="flex gap-2 flex-wrap">
                    {showTimeline && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsTimelineOpen((prev) => !prev)}
                            className="bg-background"
                        >
                            {isTimelineOpen ? (
                                <>
                                    <CaptionsOff className="h-4 w-4 mr-2" />
                                    {t("workOrdersDetail.hideTimeline", "Hide timeline")}
                                </>
                            ) : (
                                <>
                                    <Captions className="h-4 w-4 mr-2" />
                                    {t("workOrdersDetail.showTimeline", "Show timeline")}
                                </>
                            )}
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={autoLayout}
                        className="bg-background"
                    >
                        <LayoutGrid className="h-4 w-4" />
                        {t('common.autoLayout', 'Auto Layout')}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={exportToPng}
                        className="bg-background"
                    >
                        <Download className="h-4 w-4" />
                        {t('common.export', 'Export')}
                    </Button>
                    {renderActions}
                </Panel>
            </ReactFlow>

            {showTimeline && (
                <Activity mode={isTimelineOpen ? "visible" : "hidden"}>
                    <div
                        className={cn(
                            "absolute z-20 flex flex-col rounded-lg border bg-background shadow-lg transition-opacity duration-200",
                            toggleTimelineOpacity && "opacity-60 hover:opacity-100",
                            toggleTimelineOpacity && isDragging && "opacity-100"
                        )}
                        style={{
                            left: cardPosition.x,
                            top: cardPosition.y,
                            width: `${TIMELINE_CARD_WIDTH}px`,
                            maxHeight: `min(${TIMELINE_CARD_MAX_HEIGHT}px, 75vh)`,
                        }}
                    >
                        <div
                            className={cn(
                                "flex items-center justify-between gap-2 px-3 py-2 border-b bg-muted/30 rounded-t-lg select-none",
                                draggableTimeline && "cursor-grab active:cursor-grabbing"
                            )}
                            onMouseDown={handleTimelineDragStart}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="text-sm font-semibold truncate flex items-center gap-2">
                                    {t("workOrdersDetail.timelineFor", "Timeline for")}
                                    <IdBadge id={selectedId ?? ""} hideIcon />
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsTimelineOpen(false);
                                }}
                                title={t("workOrdersDetail.hideTimeline", "Hide timeline")}
                            >
                                <CaptionsOff className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex-1 overflow-hidden min-h-0 rounded-b-lg p-2 flex flex-col">
                            <EventsTimeline
                                entityId={selectedId}
                                fetchEvents={fetchEventsProp}
                                showTitle={timelineShowTitle}
                                showSearchbar={timelineShowSearchbar}
                            />
                        </div>
                    </div>
                </Activity>
            )}

            {/* Ticket View Modal */}
            <TicketViewModal
                open={ticketModalOpen}
                onOpenChange={setTicketModalOpen}
                orgId={orgId || ""}
                ticketId={selectedTicketId}
            />
        </div>
    );
};

interface OriginTreeDiagramProps {
    /** List of origin items (work order, order, ticket, invoice) to render as a tree. Required. Pass the result of e.g. getWorkOrderOriginTree. */
    items: OriginItem[];
    /** When true, shows a loading placeholder instead of the diagram. Use while fetching origin tree data. */
    isLoading?: boolean;
    /** Id of the node to select initially (e.g. current work order id). Selection is internal: user can change it by clicking nodes. Omit for no initial selection. */
    defaultSelectedId?: string;
    /** When true, shows the floating timeline card for the selected node. Default: true. */
    showTimeline?: boolean;
    /** When true, the timeline card header can be dragged to reposition. Default: true. */
    draggableTimeline?: boolean;
    /** When true, the timeline card is semi-transparent until hovered. Default: false. */
    toggleTimelineOpacity?: boolean;
    /** When true, shows a search bar inside the timeline (events list). Default: false. */
    timelineShowSearchbar?: boolean;
    /** Custom function to fetch events for the selected node. If omitted, events are fetched with fetchEventsForEntity(orgId, selectedId) using orgId from the URL. */
    fetchEvents?: (query?: string, pageToken?: string) => Promise<FetchEventsResult>;
    /** Optional actions to render to the right of the Export button in the diagram panel. */
    renderActions?: React.ReactNode;
}

/**
 * Renders an origin tree diagram with optional floating timeline.
 *
 * @param props.items - List of origin items (work order, order, ticket, invoice) to render as a tree. Required. Pass the result of e.g. getWorkOrderOriginTree.
 * @param props.isLoading - When true, shows a loading placeholder instead of the diagram. Use while fetching origin tree data.
 * @param props.defaultSelectedId - Id of the node to select initially (e.g. current work order id). Selection is internal: user can change it by clicking nodes. Omit for no initial selection.
 * @param props.showTimeline - When true, shows the floating timeline card for the selected node. Default: true.
 * @param props.draggableTimeline - When true, the timeline card header can be dragged to reposition. Default: true.
 * @param props.toggleTimelineOpacity - When true, the timeline card is semi-transparent until hovered. Default: false.
 * @param props.timelineShowSearchbar - When true, shows a search bar inside the timeline (events list). Default: false.
 * @param props.fetchEvents - Custom function to fetch events for the selected node. If omitted, events are fetched with fetchEventsForEntity(orgId, selectedId) using orgId from the URL.
 */
const OriginTreeDiagram = ({
    items,
    isLoading,
    defaultSelectedId,
    showTimeline = true,
    draggableTimeline = true,
    toggleTimelineOpacity = false,
    timelineShowSearchbar = true,
    fetchEvents,
    renderActions,
}: OriginTreeDiagramProps) => {
    return (
        <ReactFlowProvider>
            <OriginTreeDiagramInner
                items={items}
                isLoading={isLoading}
                defaultSelectedId={defaultSelectedId}
                showTimeline={showTimeline}
                draggableTimeline={draggableTimeline}
                toggleTimelineOpacity={toggleTimelineOpacity}
                timelineShowSearchbar={timelineShowSearchbar}
                timelineShowTitle={false}
                fetchEvents={fetchEvents}
                renderActions={renderActions}
            />
        </ReactFlowProvider>
    );
};

export default OriginTreeDiagram;