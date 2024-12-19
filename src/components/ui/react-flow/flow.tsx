"use client";

import { useCallback, useRef, useState } from "react";
import {
  Background,
  MiniMap,
  ReactFlow,
  useNodesState,
  useReactFlow,
  ReactFlowProvider,
  useOnSelectionChange,
  type Node,
  BackgroundVariant,
  OnInit,
} from "@xyflow/react";
import { format } from "date-fns";
import "@xyflow/react/dist/style.css";

import Nodes, { nodeTypes, type CustomNodeType } from "./nodes";
import { edgeTypes, type CustomEdgeType } from "./edges";
import { Card } from "../common/card";
import {
  BoxIcon,
  CalendarIcon,
  CornersIcon,
  Crosshair1Icon,
  DesktopIcon,
  DividerVerticalIcon,
  GridIcon,
  Pencil1Icon,
} from "@radix-ui/react-icons";
import { Button } from "../common/button";
import { Input } from "../common/input";
import { Separator } from "../common/separator";
import { Calendar } from "../common/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../common/popover";
import { cn } from "~/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../common/tooltip";

import { ReactFlowInstance } from "@xyflow/react"; // Add this import
import { NodeType } from "./nodes/types";

type FlowProps = {
  canEdit?: boolean;
};

let id = 0;
const getId = () => `dndnode_${id++}`;

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
        id: getId(),
        type,
        position,
        data: nodeData,
      } as unknown as CustomNodeType

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance],
  );

  return (
    <div className="flex h-full w-full bg-muted/40 rounded" ref={reactFlowWrapper}>
      <ReactFlowProvider>
        <div className="flex w-full flex-col items-center gap-3">
          <div className="absolute z-10 flex flex-col gap-2 mt-2">
            <FlowControls
              canEdit={!!canEdit}
              editMode={editMode}
              setEditMode={setEditMode}
            />
            {!!canEdit && editMode && (
              <EditControls
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
              snapGrid={[10, 10]}
              fitView
              nodesDraggable={editMode}
              disableKeyboardA11y={!editMode}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onInit={setReactFlowInstance as OnInit<any, any>}
            >
              {editMode && (
                <Background variant={BackgroundVariant.Cross} gap={[10, 10]} />
              )}
              <MiniMap />
            </ReactFlow>
          </div>
        </div>
      </ReactFlowProvider>
    </div>
  );
}

type EditControlsProps = {
  snapToGrid: boolean;
  setSnapToGrid: (value: boolean) => void;
};

function EditControls({ setSnapToGrid, snapToGrid }: EditControlsProps) {
  const { addNodes, getNode } = useReactFlow<CustomNodeType>();
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // the passed handler has to be memoized, otherwise the hook will not work correctly
  const onChange = useCallback(({ nodes }: { nodes: Node[] }) => {
    setSelectedNode(nodes.map((node) => node)[0] ?? null);
  }, []);

  useOnSelectionChange({
    onChange,
  });

  const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Card className={"flex justify-center gap-3 p-4"}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={snapToGrid ? "default" : "ghost"}
              size="icon"
              onClick={() => setSnapToGrid(!snapToGrid)}
              className="rounded-full"
            >
              <GridIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {snapToGrid ? "Disable" : "Enable"} snap to grid
          </TooltipContent>
        </Tooltip>
        <Separator orientation="vertical" />
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex rounded-full cursor-pointer align-middle items-center hover:bg-muted p-4" onDragStart={(event) => onDragStart(event, NodeType.Desk)} draggable>
              <DesktopIcon />
            </div>
          </TooltipTrigger>
          <TooltipContent>Drag to place new desk</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <DividerVerticalIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Drag to place new wall</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Card>
  );
}

type FlowControlsProps = {
  canEdit: boolean;
  editMode: boolean;
  setEditMode: (value: boolean) => void;
};

function FlowControls({ canEdit, editMode, setEditMode }: FlowControlsProps) {
  const { fitView } = useReactFlow<CustomNodeType, CustomEdgeType>();
  const [date, setDate] = useState<Date>(new Date());
  return (
    <Card className="flex flex-col items-center rounded-lg p-4 bg-background/70 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full p-2"
          disabled
        >
          <Crosshair1Icon className="h-6 w-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full p-2"
          onClick={() => fitView({ duration: 100 })}
        >
          <CornersIcon className="h-6 w-6" />
        </Button>
        <div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn("w-[240px] pl-3 text-left font-normal")}
              >
                {date ? format(date, "PPP") : <span>Pick a date</span>}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(date) => !!date && setDate(date)}
                disabled={(date) => {
                  const minDate = new Date();
                  minDate.setDate(minDate.getDate() - 1);

                  const maxDate = new Date();
                  maxDate.setMonth(maxDate.getMonth() + 1);

                  return date < minDate || date > maxDate;
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <Input placeholder="Search" />
        {canEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full p-2"
            onClick={() => setEditMode(!editMode)}
          >
            <Pencil1Icon className="h-6 w-6" />
          </Button>
        )}
      </div>
    </Card>
  );
}
