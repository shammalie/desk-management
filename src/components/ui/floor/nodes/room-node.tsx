"use client";

import {
  CheckCircledIcon,
  CircleIcon,
  CrossCircledIcon,
} from "@radix-ui/react-icons";
import {
  NodeResizer,
  useUpdateNodeInternals,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import React, { memo, useEffect, useRef, useState } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../../common/hover-card";
import { cn } from "~/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../common/dialog";
import { BookingStatus } from ".";
import { Label } from "../../common/label";
import { Popover, PopoverContent, PopoverTrigger } from "../../common/popover";
import { Input } from "../../common/input";
import { type D3DragEvent, drag } from "d3-drag";
import { select } from "d3-selection";
import { type CustomNodeType } from "./types";
import { dragHandle, onDragHandle } from "./utils";
import { RefreshCw } from "lucide-react";

export type RoomNode = Node<CustomNodeType>;

function RoomNode({
  id,
  data: { name, status, rotation },
  dragging,
  draggable,
  height,
  width,
  positionAbsoluteX,
  positionAbsoluteY,
  selected,
}: NodeProps<RoomNode>) {
  const [open, setOpen] = useState(false);
  const rotateControlRef = useRef(null);
  const updateNodeInternals = useUpdateNodeInternals();
  const [rotationDeg, setRotationDeg] = useState(rotation);
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rotateControlRef.current || !nodeRef.current) {
      return;
    }

    const selection = select<Element, unknown>(rotateControlRef.current);
    let startAngle = 0;

    const dragHandler = drag<Element, unknown, unknown>()
      .on("start", (event: D3DragEvent<Element, unknown, unknown>) => {
        startAngle = dragHandle(event, nodeRef);
      })
      .on("drag", (event: D3DragEvent<Element, unknown, unknown>) => {
        const snappedRotation = onDragHandle(
          event,
          nodeRef,
          startAngle,
          rotationDeg,
        );

        setRotationDeg(snappedRotation);
        updateNodeInternals(id);
      });

    selection.call(dragHandler);

    return () => {
      selection.on(".drag", null);
    };
  }, [id, updateNodeInternals, rotationDeg]);

  return (
    <Dialog
      open={!draggable && open}
      onOpenChange={(state) => !draggable && setOpen(state)}
    >
      <Popover>
        <DialogTrigger>
          <HoverCard>
            <HoverCardTrigger>
              <div
                ref={nodeRef}
                className={cn(
                  dragging && "border",
                  `flex flex-col items-center gap-2 rounded bg-clip-content p-2`,
                )}
                style={{
                  height: height,
                  width: width,
                  transform: `rotate(${rotationDeg ?? 0}deg)`,
                }}
              >
                <NodeResizer
                  isVisible={draggable}
                  minWidth={400}
                  minHeight={200}
                />
                <div
                  ref={rotateControlRef}
                  className={cn(
                    "absolute -top-12 flex h-10 w-10 cursor-grab touch-none select-none items-center justify-center rounded-full bg-background/30 p-2 backdrop-blur-sm transition-colors hover:bg-primary/15 active:cursor-grabbing",
                    (!draggable || !selected) && "hidden",
                  )}
                  style={{
                    transform: `rotate(${360 - (rotationDeg ?? 0)}deg)`,
                  }}
                >
                  <RefreshCw className="h-8 w-8 text-primary" />
                </div>
                <PopoverTrigger asChild>
                  <div
                    className={
                      "flex h-full w-full origin-center items-center justify-center border-2 border-muted-foreground bg-background"
                    }
                  >
                    <div
                      className="flex flex-col items-center gap-2"
                      style={{
                        transform: `rotate(${360 - (rotationDeg ?? 0)}deg)`,
                      }}
                    >
                      {status === BookingStatus.AVAILABLE ? (
                        <CircleIcon className="h-8 w-8 text-primary" />
                      ) : status === BookingStatus.BOOKED ? (
                        <CheckCircledIcon className="h-8 w-8 text-primary" />
                      ) : (
                        <CrossCircledIcon className="h-8 w-8 text-destructive" />
                      )}
                      <Label>{name}</Label>
                    </div>
                  </div>
                </PopoverTrigger>
              </div>
            </HoverCardTrigger>
            <PopoverContent side="right" className="flex flex-col gap-4">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-nowrap">X Position</Label>
                <Input value={positionAbsoluteX} className="col-span-2" />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-nowrap">Y Position</Label>
                <Input value={positionAbsoluteY} className="col-span-2" />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-nowrap">rotation</Label>
                <Input
                  value={rotationDeg}
                  className="col-span-2"
                  onChange={(e) => setRotationDeg(+e.target.value)}
                />
              </div>
            </PopoverContent>
            <HoverCardContent
              hidden={draggable}
              side="top"
              className="z-50 w-fit p-4"
            >
              <div className="flex justify-center">{status}</div>
            </HoverCardContent>
          </HoverCard>
        </DialogTrigger>
      </Popover>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Room Booking</DialogTitle>
          <DialogDescription>Manage bookings for {name}.</DialogDescription>
        </DialogHeader>
        <div>content here.</div>
      </DialogContent>
    </Dialog>
  );
}

export default memo(RoomNode);
