"use client";
import { useMemo, useEffect, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// Component imports
import { TeamNode } from "./TeamNode";
import { TeamEdge } from "./TeamEdge";
import { AutoCenterOnNode } from "./AutoCenterOnNode";

// Utility imports
import { getLayoutedElements } from "./layoutUtils";
import { flattenTree, buildTeamMap, getExpandedTeamIds } from "./teamUtils";

// Type imports
import type { TeamHierarchyFlowProps } from "./types";
import { LAYOUT_CONFIG } from "./types";

// Register custom node and edge types
const nodeTypes = { team: TeamNode };
const edgeTypes = { team: TeamEdge };

/**
 * Inner component that operates within ReactFlow context
 *
 * @description Handles the core logic of building and rendering the team hierarchy.
 * Must be wrapped by ReactFlowProvider to access ReactFlow hooks and functionality.
 *
 * @param props - Component props containing tree data and highlighting information
 * @returns JSX element representing the ReactFlow instance
 */
function TeamHierarchyFlowInner({
  tree,
  highlightedTeamId,
}: TeamHierarchyFlowProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const reactFlowInstance = useReactFlow();

  // Flatten hierarchical tree data into a list for processing
  const teams = useMemo(() => (tree ? flattenTree(tree) : []), [tree]);

  // Create highlighted team IDs array
  const highlightedTeamIds = useMemo(
    () => (highlightedTeamId ? [highlightedTeamId] : []),
    [highlightedTeamId],
  );

  // Build efficient lookup map for team data
  const teamMap = useMemo(() => buildTeamMap(teams), [teams]);

  // Determine which teams should be visible based on highlighting
  const expandedTeamIds = useMemo(
    () => getExpandedTeamIds(teams, highlightedTeamIds, teamMap),
    [teams, highlightedTeamIds, teamMap],
  );

  /**
   * Builds ReactFlow nodes and edges from team data
   *
   * @description Creates Node and Edge objects for ReactFlow from the filtered
   * team data. Applies dynamic sizing and positioning through the layout engine.
   *
   * @returns Object containing positioned nodes and edges
   */
  const { nodes, edges } = useMemo(() => {
    // Filter teams to only show expanded/visible ones
    const visibleTeams = teams.filter((team) =>
      expandedTeamIds.includes(String(team.id)),
    );

    // Build parent-child relationship maps for connection analysis
    const parentChildMap = new Map<string, string[]>(); // parent -> children
    const childParentMap = new Map<string, string>(); // child -> parent

    visibleTeams.forEach((team) => {
      const teamId = String(team.id);
      const childIds = team.children
        .filter((child) => expandedTeamIds.includes(String(child.id)))
        .map((child) => String(child.id));

      parentChildMap.set(teamId, childIds);

      // Map children back to their parent
      childIds.forEach((childId) => {
        childParentMap.set(childId, teamId);
      });
    });

    // Create ReactFlow nodes
    const nodes: Node[] = visibleTeams.map((team) => {
      const label = team.name;
      const dynamicWidth = Math.max(
        LAYOUT_CONFIG.MIN_WIDTH,
        label.length * LAYOUT_CONFIG.APPROX_CHAR_WIDTH + LAYOUT_CONFIG.PADDING,
      );

      return {
        id: String(team.id),
        data: {
          label: team.name,
          highlightedTeamId: highlightedTeamId,
        },
        position: { x: 0, y: 0 }, // Will be set by layout algorithm
        type: "team",
        style: {
          minWidth: LAYOUT_CONFIG.MIN_WIDTH,
          width: dynamicWidth,
          height: LAYOUT_CONFIG.NODE_HEIGHT,
        },
        selected: highlightedTeamIds?.includes(String(team.id)),
      };
    });

    // Create ReactFlow edges from parent-child relationships
    const edges: Edge[] = visibleTeams.flatMap((team) =>
      team.children
        .filter((child) => expandedTeamIds.includes(String(child.id)))
        .map((child) => {
          const sourceId = String(team.id);
          const targetId = String(child.id);

          // Check if this is a one-to-one connection
          const sourceHasOneChild =
            (parentChildMap.get(sourceId)?.length ?? 0) === 1;
          const targetHasOneParent = childParentMap.get(targetId) === sourceId;
          const isOneToOneConnection = sourceHasOneChild && targetHasOneParent;

          return {
            id: `${team.id}->${child.id}`,
            source: sourceId,
            target: targetId,
            animated: true,
            type: "team",
            data: {
              highlightedTeamIds,
              isOneToOneConnection,
            },
          } as Edge;
        }),
    );

    // Apply layout algorithm to position nodes
    return getLayoutedElements(nodes, edges);
  }, [teams, highlightedTeamId, highlightedTeamIds, expandedTeamIds]);

  /**
   * Handles auto-centering when component initializes
   *
   * @description Centers viewport on highlighted nodes or fits entire view
   * when no highlighting is active. Only runs after ReactFlow is initialized.
   */
  useEffect(() => {
    if (
      reactFlowInstance &&
      isInitialized &&
      (!highlightedTeamIds || highlightedTeamIds.length === 0) &&
      nodes.length > 0
    ) {
      // Delay to ensure layout is ready
      void setTimeout(() => {
        void reactFlowInstance.fitView({ duration: 500, maxZoom: 0.5 });
      }, 100);
    }
  }, [highlightedTeamIds, nodes, isInitialized, reactFlowInstance]);

  /**
   * Handles ReactFlow initialization
   */
  const handleInit = () => {
    setIsInitialized(true);
  };

  return (
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
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      selectNodesOnDrag={false}
      onInit={handleInit}
    >
      <AutoCenterOnNode highlightedTeamIds={highlightedTeamIds} nodes={nodes} />
    </ReactFlow>
  );
}

/**
 * TeamHierarchyFlow - Main component for displaying team hierarchy as a flow chart
 *
 * @description Renders a hierarchical visualization of team structure using ReactFlow.
 * Supports highlighting specific teams, dynamic node sizing, and interactive navigation.
 * Uses a custom tree layout algorithm for optimal positioning of nodes.
 *
 * @param props - Component props containing team tree data and highlighting options
 * @returns JSX element wrapped in ReactFlowProvider for context
 *
 * @example
 * ```tsx
 * <TeamHierarchyFlow
 *   tree={teamTreeData}
 *   highlightedTeamId="team-123"
 * />
 * ```
 */
export default function TeamHierarchyFlow({
  tree,
  highlightedTeamId,
}: TeamHierarchyFlowProps) {
  return (
    <div className="mb-4 h-[500px] w-full rounded bg-background lg:h-full">
      <ReactFlowProvider>
        <TeamHierarchyFlowInner
          tree={tree}
          highlightedTeamId={highlightedTeamId}
        />
      </ReactFlowProvider>
    </div>
  );
}
