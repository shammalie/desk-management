import { Handle, Position, type NodeProps } from "@xyflow/react";
import { LAYOUT_CONFIG } from "./types";

/**
 * TeamNode component represents a single team in the hierarchy
 *
 * @description Renders a team node with dynamic sizing based on label length,
 * handles for connecting to parent/child nodes, and visual states for selection,
 * highlighting, and clicking.
 *
 * @param props - Node properties including data, id, and visual state
 * @returns JSX element representing a team node
 */
export function TeamNode({
  data,
  id,
  selected,
}: NodeProps & {
  selected?: boolean;
}) {
  // Extract label and highlighted team ID from node data with type safety
  let label = "";
  let highlightedTeamId = "";

  if (typeof data === "object" && data !== null) {
    if (
      "label" in data &&
      typeof (data as { label: unknown }).label === "string"
    ) {
      label = (data as { label: string }).label;
    }
    if (
      "highlightedTeamId" in data &&
      typeof (data as { highlightedTeamId: unknown }).highlightedTeamId ===
        "string"
    ) {
      highlightedTeamId = (data as { highlightedTeamId: string })
        .highlightedTeamId;
    }
  }

  // Apply pulse animation only if this node matches the highlighted team ID
  const shouldPulse = highlightedTeamId === id;

  // Calculate dynamic width based on label length
  const dynamicWidth = Math.max(
    LAYOUT_CONFIG.MIN_WIDTH,
    label.length * LAYOUT_CONFIG.APPROX_CHAR_WIDTH + LAYOUT_CONFIG.PADDING,
  );

  // Build CSS classes for visual states
  const nodeClasses = [
    "flex flex-col items-center justify-center h-full rounded-lg bg-card shadow-md p-2 relative border-2",
    shouldPulse ? "pulse-border" : "",
    !shouldPulse && selected
      ? "border-primary ring-2 ring-primary ring-offset-2"
      : "border-border",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      style={{
        minWidth: LAYOUT_CONFIG.MIN_WIDTH,
        width: dynamicWidth,
      }}
      className={nodeClasses}
    >
      {/* Top handle for parent connections */}
      <Handle
        type="target"
        position={Position.Top}
        className="absolute -top-2 left-1/2 z-10 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-background bg-primary"
        id={`${id}-target`}
      />

      {/* Team name label */}
      <span className="whitespace-nowrap text-base font-semibold text-foreground">
        {label}
      </span>

      {/* Bottom handle for child connections */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="absolute -bottom-2 left-1/2 z-10 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-background bg-primary"
        id={`${id}-source`}
      />
    </div>
  );
}
