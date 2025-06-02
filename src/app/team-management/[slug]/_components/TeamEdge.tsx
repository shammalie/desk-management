import { BaseEdge, type EdgeProps } from "@xyflow/react";
import type { TeamEdgeProps } from "./types";

/**
 * TeamEdge component represents connections between teams in the hierarchy
 *
 * @description Renders edges between team nodes with conditional styling.
 * Draws straight lines for highlighted connections and one-to-one parent-child relationships.
 * Otherwise, draws a curved bezier path for better visual flow.
 *
 * @param props - Edge properties including source/target coordinates and connection data
 * @returns JSX element representing an edge between team nodes
 */
export function TeamEdge(props: EdgeProps & TeamEdgeProps) {
  const {
    source,
    target,
    sourceX,
    sourceY,
    targetX,
    targetY,
    markerEnd,
    data,
  } = props;

  // Extract connection information from edge data
  const highlightedTeamIds = data?.highlightedTeamIds as string[] | undefined;
  const isOneToOneConnection = data?.isOneToOneConnection as
    | boolean
    | undefined;

  // Check if both source and target are in the highlighted set
  const bothHighlighted =
    highlightedTeamIds?.includes(source) &&
    highlightedTeamIds?.includes(target);

  /**
   * Generate the SVG path for the edge
   * @returns SVG path string - straight line for highlighted or one-to-one connections, curved otherwise
   */
  const generateEdgePath = (): string => {
    const shouldDrawStraightLine =
      Boolean(bothHighlighted) || Boolean(isOneToOneConnection);

    if (shouldDrawStraightLine) {
      // Straight line for highlighted connections or one-to-one relationships
      return `M${sourceX},${sourceY} L${targetX},${targetY}`;
    } else {
      // Curved bezier path for normal connections
      const controlPointY = (sourceY + targetY) / 2;
      return `M${sourceX},${sourceY} C${sourceX},${controlPointY} ${targetX},${controlPointY} ${targetX},${targetY}`;
    }
  };

  return (
    <BaseEdge
      path={generateEdgePath()}
      style={{
        stroke: "hsl(var(--primary))",
        strokeWidth: 2,
      }}
      markerEnd={markerEnd}
    />
  );
}
