/**
 * Team Hierarchy Flow Components
 *
 * @description Exports for the modular team hierarchy visualization system.
 * This provides a clean interface for importing components and utilities
 * used to render interactive team hierarchy flow charts.
 */

// Main component export
export { default as TeamHierarchyFlow } from "./TeamHierarchyFlow";

// Individual component exports
export { TeamNode } from "./TeamNode";
export { TeamEdge } from "./TeamEdge";
export { AutoCenterOnNode } from "./AutoCenterOnNode";

// Utility function exports
export { getLayoutedElements } from "./layoutUtils";
export {
  flattenTree,
  buildTeamMap,
  getExpandedTeamIds,
  collectParents,
  collectChildren,
} from "./teamUtils";

// Type and constant exports
export type {
  TeamHierarchyFlowProps,
  TeamNodeProps,
  TeamEdgeProps,
} from "./types";
export { LAYOUT_CONFIG } from "./types";
