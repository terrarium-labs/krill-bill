import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import {
    ReactFlow,
    Node,
    Edge,
    useNodesState,
    useEdgesState,
    ConnectionLineType,
    Background,
    Controls,
    MiniMap,
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
import { Group } from '@/types/general/groups';
import { Users, Maximize, Minimize, Download, FilterX, LayoutGrid } from 'lucide-react';
import { Icon, IconName } from '@/components/ui/icon-picker';
import Tag from '@/app/components/tag/tag';
import { OrgAvatar } from '@/app/components/avatars/org-avatar';
import { EmployeeAvatar } from '@/app/components/avatars/employee-avatar';
import { useOrg } from '@/app/contexts/OrgContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { MultiSelect } from '@/app/components/forms-elements/multi-select';
import { useTranslation } from '@/hooks/useTranslation';

// Custom Node Component
const OrgNode = ({ data }: { data: any }) => {

    const isOrgRoot = data.isOrgRoot;

    if (isOrgRoot) {
        return (
            <>
                <Handle type="source" position={Position.Bottom} />
                <div className="px-6 py-4 rounded-lg border-2 border-primary bg-background shadow-lg min-w-[250px] flex items-center justify-center">
                    <OrgAvatar org={data} size="md" className="font-bold gap-3 text-lg" />
                </div>
            </>
        );
    }

    const responsible = data.responsible;

    return (
        <>
            <Handle type="target" position={Position.Top} />
            <Handle type="source" position={Position.Bottom} />
            <div className="px-4 py-3 rounded-lg border border-border bg-background shadow-md min-w-[280px] max-w-[320px] transition-all hover:shadow-lg hover:border-primary">
                <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                        {data.icon_url && (
                            <Icon name={data.icon_url as IconName} className="h-5 w-5 shrink-0" />
                        )}
                        <div className="font-semibold text-sm">{data.name}</div>
                    </div>
                    {data.type && (
                        <Tag
                            text={data.type}
                            className="capitalize"
                        />
                    )}
                </div>

                {data.description && (
                    <div className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {data.description}
                    </div>
                )}

                {(responsible || (data.num_employees_group > 0 || data.num_employees_total > 0)) && <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                    {responsible ? (
                        <div className="flex items-center gap-2">
                            <EmployeeAvatar employee={responsible} showName={false} />
                            <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-medium">
                                    {`${responsible.first_name || ""} ${responsible.last_name || ""}`.trim() || responsible.email || "-"}
                                </span>
                                {responsible.job_title?.name && <Tag text={responsible.job_title?.name} />}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1" />
                    )}

                    {(data.num_employees_group > 0 || data.num_employees_total > 0) && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                            <Users className="h-3 w-3" />
                            <span title={`Direct: ${data.num_employees_group} | Total (incl. sub-groups): ${data.num_employees_total}`}>
                                {data.num_employees_group === data.num_employees_total
                                    ? data.num_employees_group
                                    : `${data.num_employees_group} (${data.num_employees_total} total)`
                                }
                            </span>
                        </div>
                    )}
                </div>}
            </div>
        </>
    );
};

const nodeTypes = {
    orgNode: OrgNode,
};

const nodeWidth = 220;

// Build hierarchy from groups
interface HierarchyNode {
    id: string;
    data: any;
    children?: HierarchyNode[];
}

const buildHierarchyFromGroups = (groups: Group[]): HierarchyNode => {
    const { org } = useOrg();
    const groupMap = new Map<string, HierarchyNode>();
    const roots: HierarchyNode[] = [];

    // Create nodes for all groups
    groups.forEach((group) => {
        groupMap.set(group.id, {
            id: group.id,
            data: {
                name: group.name,
                type: group.type,
                num_employees_group: group.num_employees_group || 0,
                num_employees_total: group.num_employees_total || 0,
                icon_url: group.icon_url,
                description: group.description,
                responsible: group.responsible,
                isOrgRoot: false,
            },
            children: [],
        });
    });

    // Build hierarchy
    groups.forEach((group) => {
        const node = groupMap.get(group.id)!;
        if (group.parent?.id && groupMap.has(group.parent.id)) {
            const parent = groupMap.get(group.parent.id)!;
            if (!parent.children) {
                parent.children = [];
            }
            parent.children.push(node);
        } else {
            roots.push(node);
        }
    });

    // Create organization root node that connects all top-level nodes
    const orgRootNode: HierarchyNode = {
        id: 'org-root',
        data: {
            photo_url: org?.photo_url,
            name: org?.name,
            isOrgRoot: true,
        },
        children: roots,
    };

    return orgRootNode;
};

const getLayoutedElements = (groups: Group[]) => {
    if (groups.length === 0) {
        return { nodes: [], edges: [] };
    }

    const hierarchyRoot = buildHierarchyFromGroups(groups);

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const root = hierarchy(hierarchyRoot);

    // Use nodeSize instead of size for better control over spacing
    // nodeSize([width, height]) - spacing between node centers
    const treeLayout = tree<HierarchyNode>()
        .nodeSize([377, 237]) // [horizontal spacing, vertical spacing between levels]
        .separation((a, b) => (a.parent === b.parent ? 1.2 : 1.4));

    const treeData = treeLayout(root);

    // Convert d3 hierarchy to React Flow nodes
    treeData.descendants().forEach((node) => {
        nodes.push({
            id: node.data.id,
            type: 'orgNode',
            data: node.data.data,
            position: {
                x: node.x - nodeWidth / 2,
                y: node.y,
            },
        });
    });

    // Create edges
    treeData.links().forEach((link) => {
        edges.push({
            id: `${link.source.data.id}-${link.target.data.id}`,
            source: link.source.data.id,
            target: link.target.data.id,
            type: ConnectionLineType.SmoothStep,
            animated: false,
            style: { stroke: '#94a3b8', strokeWidth: 2 },
        });
    });

    return { nodes, edges };
};

interface GroupsDiagramProps {
    groups: Group[];
}

// Inner component that uses React Flow hooks
const GroupsDiagramInner = ({ groups }: GroupsDiagramProps) => {
    const { t } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const { getNodes, fitView } = useReactFlow();

    // Type filter options
    const typeOptions = [
        { value: "area", label: t("groups.type.area", "Area") },
        { value: "department", label: t("groups.type.department", "Department") },
        { value: "section", label: t("groups.type.section", "Section") },
    ];

    // Filter groups by selected types
    const filteredGroups = useMemo(() => {
        if (selectedTypes.length === 0) return groups;
        return groups.filter(group => selectedTypes.includes(group.type));
    }, [groups, selectedTypes]);

    // Apply layout using d3-hierarchy
    const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
        () => getLayoutedElements(filteredGroups),
        [filteredGroups]
    );

    const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

    // Update nodes and edges when filter changes, then fit view
    useEffect(() => {
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        // Small delay to ensure nodes are rendered before fitting view
        setTimeout(() => {
            fitView({ padding: 0.2, duration: 300 });
        }, 50);
    }, [layoutedNodes, layoutedEdges, setNodes, setEdges, fitView]);

    // Toggle fullscreen (CSS-based to avoid portal issues)
    const toggleFullscreen = useCallback(() => {
        setIsFullscreen(prev => !prev);
    }, []);

    // Export to PNG using React Flow's recommended approach
    const exportToPng = useCallback(() => {
        const currentNodes = getNodes();
        if (currentNodes.length === 0) {
            toast.error('No nodes to export');
            return;
        }

        const nodesBounds = getNodesBounds(currentNodes);
        const padding = 150;
        const imageWidth = nodesBounds.width + padding * 2;
        const imageHeight = nodesBounds.height + padding * 2;
        const viewport = getViewportForBounds(nodesBounds, imageWidth, imageHeight, 0.5, 2, 0.1);

        const viewportElement = containerRef.current?.querySelector('.react-flow__viewport') as HTMLElement;
        if (!viewportElement) {
            toast.error('Could not export diagram');
            return;
        }

        // Use higher pixel ratio for better quality (3x for high-res export)
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
                link.setAttribute('download', 'org-chart.png');
                link.click();
                toast.success('Diagram exported successfully');
            })
            .catch((err) => {
                console.error('Export error:', err,);
                toast.error('Could not export diagram');
            });
    }, [getNodes]);

    // Handle ESC key to exit fullscreen
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isFullscreen]);

    // Clear filters
    const clearFilters = useCallback(() => {
        setSelectedTypes([]);
    }, []);

    // Auto layout - reset to calculated positions
    const autoLayout = useCallback(() => {
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        // Small delay to ensure nodes are updated before fitting view
        setTimeout(() => {
            fitView({ padding: 0.2, duration: 300 });
        }, 50);
    }, [layoutedNodes, layoutedEdges, setNodes, setEdges, fitView]);

    if (groups.length === 0) {
        return (
            <div className="h-[600px] flex items-center justify-center border rounded-lg bg-muted/20">
                <div className="text-center text-muted-foreground">
                    <p>No groups to display</p>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`border rounded-lg bg-background ${isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen rounded-none' : 'h-[82vh]'}`}
        >
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
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
                <MiniMap
                    className="bg-background! border-border!"
                    maskColor="rgba(0, 0, 0, 0.2)"
                    nodeColor={(node) => {
                        switch (node.data.type) {
                            case 'area':
                                return '#3b82f6';
                            case 'department':
                                return '#22c55e';
                            case 'section':
                                return '#a855f7';
                            default:
                                return '#6b7280';
                        }
                    }}
                />
                <Panel position="top-left" className="flex gap-2 items-center">
                    <MultiSelect
                        options={typeOptions}
                        selected={selectedTypes}
                        size="default"
                        onSelectedChange={setSelectedTypes}
                        placeholder={t("groups.filterByType", "Type")}
                        searchable={false}
                    />
                    {selectedTypes.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={clearFilters}
                            className="bg-background"
                        >
                            <FilterX className="h-4 w-4" />
                            {t("common.clearAll", "Clear")}
                        </Button>
                    )}
                </Panel>
                <Panel position="top-right" className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={autoLayout}
                        className="bg-background"
                    >
                        <LayoutGrid className="h-4 w-4" />
                        Auto Layout
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={exportToPng}
                        className="bg-background"
                    >
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleFullscreen}
                        className="bg-background"
                    >
                        {isFullscreen ? (
                            <Minimize className="h-4 w-4" />
                        ) : (
                            <Maximize className="h-4 w-4" />
                        )}
                        {isFullscreen ? 'Exit' : 'Fullscreen'}
                    </Button>
                </Panel>
            </ReactFlow>
        </div>
    );
};

// Wrapper component with ReactFlowProvider
const GroupsDiagram = ({ groups }: GroupsDiagramProps) => {
    return (
        <ReactFlowProvider>
            <GroupsDiagramInner groups={groups} />
        </ReactFlowProvider>
    );
};

export default GroupsDiagram;