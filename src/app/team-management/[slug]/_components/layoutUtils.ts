import type { Node, Edge } from "@xyflow/react";
import { LAYOUT_CONFIG } from "./types";

/**
 * Represents the result of the layout calculation
 */
interface LayoutResult {
  /** Array of positioned nodes */
  nodes: Node[];
  /** Array of edges (unchanged from input) */
  edges: Edge[];
}

/**
 * Calculates the layout positions for nodes in a hierarchical tree structure
 *
 * @description Uses a custom tree layout algorithm to position nodes in a hierarchy.
 * Nodes are arranged in levels with root nodes at the top, and child nodes positioned
 * below their parents. The algorithm calculates optimal spacing to prevent overlaps
 * and centers parent nodes over their children. For one-to-one connections (single child),
 * nodes are aligned vertically for perfect straight-line connections.
 *
 * @param nodes - Array of ReactFlow nodes to be positioned
 * @param edges - Array of ReactFlow edges defining parent-child relationships
 * @returns Object containing positioned nodes and original edges
 */
export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
): LayoutResult {
  if (nodes.length === 0) {
    return { nodes, edges };
  }

  try {
    const result = calculateTreeLayout(nodes, edges);
    return result;
  } catch (error) {
    console.error("Error in tree layout:", error);
    // Fallback to original nodes if layout fails
    return { nodes, edges };
  }
}

/**
 * Performs the core tree layout calculation
 *
 * @param nodes - Array of nodes to position
 * @param edges - Array of edges defining relationships
 * @returns Layout result with positioned nodes
 */
function calculateTreeLayout(nodes: Node[], edges: Edge[]): LayoutResult {
  // Build data structures for efficient lookups
  const { nodeMap, rootNodes, childrenMap } = buildHierarchyMaps(nodes, edges);

  const layoutedNodes: Node[] = [];
  const positionedNodes = new Set<string>();

  /**
   * Calculates the total width required for a subtree
   *
   * @description Determines the space needed for a node and all its descendants.
   * For leaf nodes, uses actual node width plus spacing. For parent nodes,
   * takes the maximum of the node's own width or the total width of all children
   * plus spacing between siblings.
   *
   * @param nodeId - Root node ID of the subtree
   * @returns Total width in pixels
   */
  function getSubtreeWidth(nodeId: string): number {
    const node = nodeMap.get(nodeId);
    const children = childrenMap.get(nodeId) ?? [];

    if (children.length === 0) {
      // Leaf node: return actual node width plus some spacing
      const nodeWidth =
        (node?.style?.width as number) ?? LAYOUT_CONFIG.NODE_WIDTH;
      return Math.max(
        nodeWidth + LAYOUT_CONFIG.NODE_SPACING,
        LAYOUT_CONFIG.NODE_SPACING,
      );
    }

    // Node with children: sum up all children widths
    const totalChildWidth = children.reduce((total, child) => {
      return total + getSubtreeWidth(child.id);
    }, 0);

    // Return the larger of: node's own width or total children width
    const nodeWidth =
      (node?.style?.width as number) ?? LAYOUT_CONFIG.NODE_WIDTH;
    return Math.max(nodeWidth + LAYOUT_CONFIG.NODE_SPACING, totalChildWidth);
  }

  /**
   * Recursively positions a node and its children
   *
   * @description Positions a node at the specified coordinates and then recursively
   * positions its children. For single children (one-to-one connections), the child
   * is positioned directly below the parent for vertical alignment and straight edges.
   * For multiple children, distributes them horizontally using calculated subtree widths
   * to ensure proper spacing and prevent overlaps.
   *
   * @param node - Node to position
   * @param centerX - X coordinate for the center of the node
   * @param y - Y coordinate for the node
   * @returns Updated X position for next sibling
   */
  function positionNode(node: Node, centerX: number, y: number): number {
    if (positionedNodes.has(node.id)) {
      return centerX;
    }

    const children = childrenMap.get(node.id) ?? [];

    // Calculate the actual position (top-left) from the center coordinates
    // ReactFlow positions are top-left corner, but we work with centers for alignment
    const nodeWidth = (node.style?.width as number) ?? LAYOUT_CONFIG.NODE_WIDTH;
    const nodeX = centerX - nodeWidth / 2;

    // Position current node
    layoutedNodes.push({
      ...node,
      position: { x: nodeX, y },
    });
    positionedNodes.add(node.id);

    // Position children if any exist
    if (children.length > 0) {
      const childY = y + LAYOUT_CONFIG.LEVEL_HEIGHT;

      // Special handling for one-to-one connections (single child)
      if (children.length === 1) {
        const singleChild = children[0];
        if (singleChild) {
          // Position the single child with the same center X as the parent
          positionNode(singleChild, centerX, childY);
        }
      } else {
        // Multiple children - use proper spacing algorithm to prevent overlaps
        const totalChildWidth = children.reduce((total, child) => {
          return total + getSubtreeWidth(child.id);
        }, 0);

        // Add extra spacing between siblings
        const spacingBetweenSiblings = LAYOUT_CONFIG.NODE_SPACING * 0.5;
        const totalSpacing = spacingBetweenSiblings * (children.length - 1);
        const totalRequiredWidth = totalChildWidth + totalSpacing;

        // Start positioning children from the left of the subtree
        let currentChildX = centerX - totalRequiredWidth / 2;

        children.forEach((child, index) => {
          const childWidth = getSubtreeWidth(child.id);
          const childCenterX = currentChildX + childWidth / 2;

          // Position the child
          positionNode(child, childCenterX, childY);

          // Move to the start of the next child's space (including spacing)
          currentChildX += childWidth;
          if (index < children.length - 1) {
            currentChildX += spacingBetweenSiblings;
          }
        });
      }
    }

    return centerX + getSubtreeWidth(node.id);
  }

  // Position all root nodes using center coordinates
  let currentCenterX = 0;
  rootNodes.forEach((rootNode) => {
    // Start each root tree with some spacing
    if (currentCenterX > 0) {
      currentCenterX += LAYOUT_CONFIG.NODE_SPACING;
    }

    const rootWidth = getSubtreeWidth(rootNode.id);
    const rootCenterX = currentCenterX + rootWidth / 2;

    positionNode(rootNode, rootCenterX, 0);
    currentCenterX += rootWidth;
  });

  return { nodes: layoutedNodes, edges };
}

/**
 * Builds efficient lookup maps for hierarchy traversal
 *
 * @param nodes - Array of all nodes
 * @param edges - Array of all edges
 * @returns Object containing node map, root nodes, and children map
 */
function buildHierarchyMaps(nodes: Node[], edges: Edge[]) {
  const nodeMap = new Map<string, Node>();
  const rootNodes: Node[] = [];
  const childrenMap = new Map<string, Node[]>();

  // Initialize maps
  nodes.forEach((node) => {
    nodeMap.set(node.id, node);
    childrenMap.set(node.id, []);
  });

  // Build parent-child relationships
  edges.forEach((edge) => {
    const children = childrenMap.get(edge.source);
    const child = nodeMap.get(edge.target);
    if (children && child) {
      children.push(child);
    }
  });

  // Find root nodes (nodes with no incoming edges)
  const hasParent = new Set(edges.map((edge) => edge.target));
  nodes.forEach((node) => {
    if (!hasParent.has(node.id)) {
      rootNodes.push(node);
    }
  });

  return { nodeMap, rootNodes, childrenMap };
}
