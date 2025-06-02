import type { TeamTree } from "~/server/schemas/team";

/**
 * Props for the main TeamHierarchyFlow component
 */
export interface TeamHierarchyFlowProps {
  /** Array of team tree data to display */
  tree: TeamTree[];
  /** ID of the team to highlight in the hierarchy */
  highlightedTeamId?: string;
}

/**
 * Extended Node props for team nodes with additional visual state
 */
export interface TeamNodeProps {
  /** Standard ReactFlow node data */
  data: {
    /** Display label for the node */
    label: string;
    /** ID of node to pulse (for highlighting) */
    pulseNodeId?: string;
    /** ID of currently clicked node */
    clickedNodeId?: string | null;
  };
  /** Node identifier */
  id: string;
  /** Whether the node is currently selected */
  selected?: boolean;
  /** ID of node to pulse (for highlighting) */
  pulseNodeId?: string;
  /** ID of currently clicked node */
  clickedNodeId?: string;
}

/**
 * Extended Edge props for team edges with highlighting support
 */
export interface TeamEdgeProps {
  /** Array of highlighted team IDs for edge styling */
  highlightedTeamIds?: string[];
  /** Whether this edge represents a one-to-one parent-child connection */
  isOneToOneConnection?: boolean;
}

/**
 * Configuration constants for the hierarchy layout
 */
export const LAYOUT_CONFIG = {
  /** Width of each node in pixels */
  NODE_WIDTH: 180,
  /** Height of each node in pixels */
  NODE_HEIGHT: 60,
  /** Vertical spacing between hierarchy levels */
  LEVEL_HEIGHT: 120,
  /** Horizontal spacing between nodes */
  NODE_SPACING: 15,
  /** Minimum width for nodes */
  MIN_WIDTH: 180,
  /** Padding inside nodes */
  PADDING: 2,
  /** Approximate character width for dynamic sizing */
  APPROX_CHAR_WIDTH: 10,
} as const;
