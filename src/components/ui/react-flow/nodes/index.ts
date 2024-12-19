import type { BuiltInNode, Node, NodeTypes } from "@xyflow/react";

import DeskNode, { type DeskNode as DeskNodeType } from "./desk-node";
import RoomNode, { type RoomNode as RoomNodeType } from "./room-node";
import { BookingStatus, NodeType } from "./types";
import { v4 as uuid } from 'uuid';

export const nodeTypes = {
  desk: DeskNode,
  room: RoomNode,
  // Add any of your custom nodes here!
} satisfies NodeTypes;

const Nodes: { [key in NodeType]: CustomNodeType } = {
  [NodeType.Desk]: {
    id: uuid(),
    position: {
      x: 0,
      y: 0,
    },
    data: {
      key: NodeType.Desk,
      status: BookingStatus.AVAILABLE,
      label: 'Desk',
      name: '',
      rotationSnap: false
    }
  },
  [NodeType.Room]: {
    id: uuid(),
    position: {
      x: 0,
      y: 0,
    },
    data: {
      key: NodeType.Desk,
      status: BookingStatus.AVAILABLE,
      label: 'Room',
      name: '',
      rotationSnap: false
    }
  },
};

// Append the types of you custom edges to the BuiltInNode type
export type CustomNodeType = BuiltInNode | DeskNodeType | RoomNodeType;
export { BookingStatus };
export default Nodes;
