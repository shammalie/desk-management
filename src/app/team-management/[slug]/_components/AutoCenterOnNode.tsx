import { useEffect } from "react";
import { useReactFlow, type Node } from "@xyflow/react";
import { LAYOUT_CONFIG } from "./types";

/**
 * Props for the AutoCenterOnNode component
 */
interface AutoCenterOnNodeProps {
  /** Array of highlighted team IDs */
  highlightedTeamIds?: string[];
  /** Array of all nodes in the flow */
  nodes: Node[];
}

/**
 * AutoCenterOnNode component handles automatic viewport centering
 *
 * @description Automatically centers the viewport on highlighted nodes or fits
 * the entire view when no nodes are highlighted. Uses ReactFlow's built-in
 * viewport controls with smooth transitions.
 *
 * @param props - Component props containing highlighted team IDs and nodes
 * @returns null - This is an effect-only component with no rendered output
 */
export function AutoCenterOnNode({
  highlightedTeamIds,
  nodes,
}: AutoCenterOnNodeProps) {
  const reactFlowInstance = useReactFlow();

  useEffect(() => {
    if (highlightedTeamIds && highlightedTeamIds.length > 0) {
      // Center on the first highlighted node
      centerOnHighlightedNode();
    } else {
      // Fit the entire view when no specific node is highlighted
      const timeout = setTimeout(() => {
        void reactFlowInstance.fitView({
          duration: 500,
          maxZoom: 0.5,
        });
      }, 100);

      // Cleanup timeout on unmount
      return () => clearTimeout(timeout);
    }
  }, [highlightedTeamIds, nodes, reactFlowInstance]);

  /**
   * Centers the viewport on the first highlighted node
   */
  function centerOnHighlightedNode(): void {
    if (!highlightedTeamIds || highlightedTeamIds.length === 0) {
      return;
    }

    const targetNode = nodes.find((node) => node.id === highlightedTeamIds[0]);

    if (targetNode?.position) {
      // Calculate center point of the node
      const centerX = targetNode.position.x + LAYOUT_CONFIG.NODE_WIDTH / 2;
      const centerY = targetNode.position.y + LAYOUT_CONFIG.NODE_HEIGHT / 2;

      void reactFlowInstance.setCenter(centerX, centerY, {
        zoom: 0.7,
        duration: 500,
      });
    }
  }

  // This component only manages viewport effects, no rendered output
  return null;
}
