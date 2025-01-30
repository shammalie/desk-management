"use client";

import { useCallback, useRef, useState } from "react";
import {
  Background,
  MiniMap,
  ReactFlow,
  useNodesState,
  ReactFlowProvider,
  BackgroundVariant,
  type OnInit,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { v4 as uuid } from "uuid";

import Nodes, { nodeTypes, type CustomNodeType } from "./nodes";
import { edgeTypes, type CustomEdgeType } from "./edges";

import { type ReactFlowInstance } from "@xyflow/react"; // Add this import
import { type NodeType } from "./nodes/types";
import { FloorEditControls } from "./controls/edit-control";
import { FloorViewControls } from "./controls/view-control";

type FlowProps = {
  canEdit?: boolean;
};

export default function Flow({ canEdit }: FlowProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [editMode, setEditMode] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNodeType>([]);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null); // Update the type

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const reactFlowBounds =
        reactFlowWrapper?.current?.getBoundingClientRect();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const type = event.dataTransfer.getData(
        "application/reactflow",
      ) as NodeType;

      if (typeof type === "undefined" || !type) {
        console.warn("Node type not found!");
        return;
      }

      // https://github.com/sametkabay/react-flow-dnd-example/tree/main

      if (!reactFlowInstance || !reactFlowBounds) {
        console.warn("React Flow instance or bounds not found!");
        return;
      }

      const nodeData = Nodes[type];
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      const newNode = {
        ...nodeData,
        position,
        type,
        id: uuid(),
      } as CustomNodeType;

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes],
  );

  console.log(nodes);

  return (
    <div className="flex h-full w-full rounded" ref={reactFlowWrapper}>
      <ReactFlowProvider>
        <div className="flex w-full flex-col items-center gap-3">
          <div className="absolute z-10 mt-2 flex flex-col gap-2">
            <FloorViewControls
              canEdit={!!canEdit}
              editMode={editMode}
              setEditMode={setEditMode}
            />
            {!!canEdit && editMode && (
              <FloorEditControls
                snapToGrid={snapToGrid}
                setSnapToGrid={setSnapToGrid}
              />
            )}
          </div>
          <div className="flex h-full w-full gap-2">
            <ReactFlow<CustomNodeType, CustomEdgeType>
              nodes={nodes}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              edgeTypes={edgeTypes}
              snapToGrid={snapToGrid}
              snapGrid={[5, 5]}
              fitView
              nodesDraggable={editMode}
              disableKeyboardA11y={!editMode}
              onDrop={onDrop}
              onDragOver={onDragOver}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onInit={setReactFlowInstance as OnInit<any, any>}
            >
              {editMode && (
                <Background variant={BackgroundVariant.Dots} gap={[10, 10]} />
              )}
              <MiniMap />
            </ReactFlow>
          </div>
        </div>
      </ReactFlowProvider>
    </div>
  );
}
