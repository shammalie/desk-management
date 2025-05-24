'use client';
import { useMemo, useEffect, useState, useRef } from 'react';
import { ReactFlow, ReactFlowProvider, type Node, type Edge, type NodeProps, Handle, Position, type EdgeProps, BaseEdge, useReactFlow, type ReactFlowInstance } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { TeamTree } from '~/server/schemas/team';
import Dagre from '@dagrejs/dagre';
import { useRouter, useSearchParams } from 'next/navigation';

interface TeamHierarchyFlowProps {
    tree: TeamTree[];
    highlightedTeamId?: string;
}

const nodeWidth = 180;
const nodeHeight = 60;

function TeamNode({ data, id, selected, pulseNodeId, clickedNodeId }: NodeProps & { selected?: boolean; pulseNodeId?: string; clickedNodeId?: string }) {
    let label = '';
    if (typeof data === 'object' && data !== null && 'label' in data && typeof (data as { label: unknown }).label === 'string') {
        label = (data as { label: string }).label;
    }
    const pulse = pulseNodeId && id === pulseNodeId && !clickedNodeId;
    const clicked = clickedNodeId && id === clickedNodeId;
    // Dynamic width based on label length, with a minimum
    const minWidth = 180;
    const padding = 32;
    const approxCharWidth = 10;
    const dynamicWidth = Math.max(minWidth, label.length * approxCharWidth + padding);
    return (
        <div
            style={{ minWidth: minWidth, width: dynamicWidth }}
            className={
                `flex flex-col items-center justify-center h-full rounded-lg bg-card shadow-md p-2 relative border-2 ` +
                (pulse ? 'border-primary animate-pulse ' : '') +
                (!pulse && (selected ? 'pulse-border ring-2 ring-primary ring-offset-2 ' : '')) +
                (clicked ? ' border-secondary ring-2 ring-secondary ' : '')
            }
        >
            {/* Top handle (for parent connection) */}
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 bg-primary border-2 border-background rounded-full absolute -top-2 left-1/2 -translate-x-1/2 z-10"
                id={`${id}-target`}
            />
            <span className="text-base font-semibold text-foreground whitespace-nowrap">{label}</span>
            {/* Bottom handle (for child connection) */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 bg-primary border-2 border-background rounded-full absolute -bottom-2 left-1/2 -translate-x-1/2 z-10"
                id={`${id}-source`}
            />
        </div>
    );
}

function TeamEdge(props: EdgeProps & { highlightedTeamIds?: string[] }) {
    const { source, target, sourceX, sourceY, targetX, targetY, markerEnd, data } = props;
    // If both source and target are highlighted, draw a straight line
    const highlightedTeamIds = data?.highlightedTeamIds as string[] | undefined;
    const bothHighlighted = highlightedTeamIds?.includes(source) && highlightedTeamIds?.includes(target);
    const edgePath = bothHighlighted
        ? `M${sourceX},${sourceY} L${targetX},${targetY}`
        : `M${sourceX},${sourceY} C${sourceX},${(sourceY + targetY) / 2} ${targetX},${(sourceY + targetY) / 2} ${targetX},${targetY}`;
    return (
        <BaseEdge
            path={edgePath}
            style={{ stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
            markerEnd={markerEnd}
        />
    );
}

const nodeTypes = { team: TeamNode };
const edgeTypes = { team: TeamEdge };

// Helper component to handle auto-centering on highlighted node
function AutoCenterOnNode({ highlightedTeamIds, nodes }: { highlightedTeamIds?: string[], nodes: Node[] }) {
    const reactFlowInstance = useReactFlow();
    useEffect(() => {
        if (highlightedTeamIds && highlightedTeamIds.length > 0) {
            const node = nodes.find(n => n.id === highlightedTeamIds[0]);
            void (node?.position && reactFlowInstance.setCenter(
                node.position.x + nodeWidth / 2,
                node.position.y + nodeHeight / 2,
                { zoom: 0.7, duration: 500 }
            ));
        } else {
            // If filter is cleared, fit the whole view after a short delay
            const timeout = setTimeout(() => {
                void reactFlowInstance.fitView({ duration: 500, maxZoom: 0.5 });
            }, 100);
            return () => clearTimeout(timeout);
        }
    }, [highlightedTeamIds, nodes, reactFlowInstance]);
    return null;
}

export default function TeamHierarchyFlow({ tree, highlightedTeamId }: TeamHierarchyFlowProps) {
    const [clickedNodeId, setClickedNodeId] = useState<string | null>(null);
    const reactFlowInstanceRef = useRef<ReactFlowInstance<Node, Edge> | null>(null);

    // Flatten the tree into a list for React Flow
    function flattenTree(tree: TeamTree[], acc: TeamTree[] = []): TeamTree[] {
        for (const node of tree) {
            acc.push(node);
            if (node.children.length > 0) flattenTree(node.children, acc);
        }
        return acc;
    }
    const teams = useMemo(() => tree ? flattenTree(tree) : [], [tree]);

    // Highlighted team IDs based on highlightedTeamId
    const highlightedTeamIds = highlightedTeamId ? [highlightedTeamId] : [];

    // Build a map for parent/child traversal
    const teamMap = useMemo(() => {
        const map = new Map<string, TeamTree>();
        for (const t of teams) map.set(String(t.id), t);
        return map;
    }, [teams]);

    // Recursively collect all parents
    function collectParents(team: TeamTree, acc: Set<string>) {
        if (team.parent && !acc.has(String(team.parent.id))) {
            acc.add(String(team.parent.id));
            const parent = teamMap.get(String(team.parent.id));
            if (parent) collectParents(parent, acc);
        }
    }
    // Recursively collect all children
    function collectChildren(team: TeamTree, acc: Set<string>) {
        for (const child of team.children) {
            if (!acc.has(String(child.id))) {
                acc.add(String(child.id));
                const childTeam = teamMap.get(String(child.id));
                if (childTeam) collectChildren(childTeam, acc);
            }
        }
    }

    // Build the set of all teams to show
    const expandedTeamIds = useMemo(() => {
        if (!highlightedTeamIds || highlightedTeamIds.length === 0) return teams.map(t => String(t.id));
        const acc = new Set<string>();
        for (const id of highlightedTeamIds) {
            acc.add(id);
            const team = teamMap.get(id);
            if (team) {
                collectParents(team, acc);
                collectChildren(team, acc);
            }
        }
        return Array.from(acc);
    }, [highlightedTeamIds, teamMap, teams]);

    // Build nodes and edges from teams
    const { nodes, edges } = useMemo(() => {
        const g = new Dagre.graphlib.Graph();
        g.setDefaultEdgeLabel(() => ({}));
        g.setGraph({ rankdir: 'TB' }); // Top to Bottom

        // Only show expanded teams
        const visibleTeams = teams.filter(team => expandedTeamIds.includes(String(team.id)));

        // Create nodes
        const nodes: Node[] = visibleTeams.map((team) => {
            const label = team.name;
            const minWidth = 180;
            const padding = 32;
            const approxCharWidth = 10;
            const dynamicWidth = Math.max(minWidth, label.length * approxCharWidth + padding);
            g.setNode(String(team.id), { width: dynamicWidth, height: nodeHeight });
            return {
                id: String(team.id),
                data: { label: team.name, pulseNodeId: highlightedTeamId, clickedNodeId },
                position: { x: 0, y: 0 }, // will be set by dagre
                type: 'team',
                style: { minWidth, width: dynamicWidth, height: nodeHeight },
                selected: highlightedTeamIds?.includes(String(team.id)),
            };
        });

        // Create edges
        const edges: Edge[] = visibleTeams.flatMap((team) =>
            team.children
                .filter(child => expandedTeamIds.includes(String(child.id)))
                .map((child) => {
                    g.setEdge(String(team.id), String(child.id));
                    return {
                        id: `${team.id}->${child.id}`,
                        source: String(team.id),
                        target: String(child.id),
                        animated: true,
                        type: 'team',
                        data: { highlightedTeamIds },
                    } as Edge;
                })
        );

        // Run dagre layout
        Dagre.layout(g);
        const layoutedNodes = nodes.map((node) => {
            const pos = g.node(node.id);
            return {
                ...node,
                position: { x: pos.x - nodeWidth / 2, y: pos.y - nodeHeight / 2 },
            };
        });

        return { nodes: layoutedNodes, edges };
    }, [teams, highlightedTeamId, clickedNodeId, highlightedTeamIds, expandedTeamIds]);

    // Auto-center on load if no highlighted node
    useEffect(() => {
        if (reactFlowInstanceRef.current && (!highlightedTeamIds || highlightedTeamIds.length === 0) && nodes.length > 0) {
            // Delay to ensure layout is ready
            void setTimeout(() => {
                void reactFlowInstanceRef.current?.fitView({ duration: 500, maxZoom: 0.5 });
            }, 100);
        }
    }, [highlightedTeamIds, nodes]);

    return (
        <div className="w-full h-[500px] lg:h-full bg-background rounded mb-4">
            <ReactFlowProvider>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    fitView
                    fitViewOptions={{ maxZoom: 0.5 }}
                    minZoom={0.1}
                    maxZoom={2}
                    proOptions={{ hideAttribution: true }}
                    onNodeClick={(_, node) => {
                        setClickedNodeId(node.id);
                    }}
                    onNodeDragStart={(_, node) => setClickedNodeId(node.id)}
                    onInit={instance => { reactFlowInstanceRef.current = instance; }}
                />
                <AutoCenterOnNode highlightedTeamIds={highlightedTeamIds} nodes={nodes} />
            </ReactFlowProvider>
        </div>
    );
} 