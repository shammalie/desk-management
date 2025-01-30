import { type D3DragEvent } from "d3-drag";
import type React from "react";

const snapRotation = (angle: number) => {
  const increment = 15;
  return Math.round(angle / increment) * increment;
};

export const dragHandle = (
  event: D3DragEvent<Element, unknown, unknown>,
  nodeRef: React.RefObject<HTMLDivElement>,
): number => {
  const sourceEvent = event.sourceEvent as MouseEvent;
  sourceEvent.stopPropagation();
  const node = nodeRef.current!.getBoundingClientRect();
  const centerX = node.left + node.width / 2;
  const centerY = node.top + node.height / 2;
  const x = sourceEvent.clientX;
  const y = sourceEvent.clientY;

  return Math.atan2(y - centerY, x - centerX);
};

export const onDragHandle = (
  event: D3DragEvent<Element, unknown, unknown>,
  nodeRef: React.RefObject<HTMLDivElement>,
  startAngle: number,
  rotationDeg?: number,
) => {
  const currentAngle = dragHandle(event, nodeRef);
  const deltaAngle = currentAngle - startAngle;

  // Convert radians to degrees and add to the current rotation
  let newRotation = (rotationDeg ?? 0) + (deltaAngle * 180) / Math.PI;

  // Normalize the degree to be between 0 and 360
  newRotation = ((newRotation % 360) + 360) % 360;
  return snapRotation(newRotation);
};
