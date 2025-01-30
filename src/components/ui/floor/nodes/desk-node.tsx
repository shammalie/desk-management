"use client";

import {
  CheckCircledIcon,
  CircleIcon,
  CrossCircledIcon,
} from "@radix-ui/react-icons";
import {
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
import { type CustomNodeType } from "./types";
import { type D3DragEvent, drag } from "d3-drag";
import { select } from "d3-selection";
import { Popover, PopoverContent, PopoverTrigger } from "../../common/popover";
import { Input } from "../../common/input";
import { Label } from "../../common/label";
import { RefreshCw } from "lucide-react";
import { dragHandle, onDragHandle } from "./utils";

export type DeskNode = Node<CustomNodeType>;

function DeskNode({
  id,
  data: { name, status, rotation },
  dragging,
  draggable,
  positionAbsoluteX,
  positionAbsoluteY,
  selected,
}: NodeProps<DeskNode>) {
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
      <Popover open={draggable && selected}>
        <DialogTrigger>
          <HoverCard>
            <HoverCardTrigger>
              <div
                ref={nodeRef}
                className={cn(
                  "bg-clip-contents-10 box-content flex flex-col items-center gap-2 rounded border-primary p-2",
                )}
                style={{
                  transform: `rotate(${rotationDeg ?? 0}deg)`,
                }}
              >
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
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex flex-col items-center rounded-sm border-2 border-foreground/70 bg-background px-6 py-1 hover:bg-muted">
                      <div
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
                      </div>
                    </div>
                    <div className="absolute -bottom-1 h-2 w-12 rounded bg-foreground/70" />
                  </div>
                </PopoverTrigger>
              </div>
            </HoverCardTrigger>
            <PopoverContent
              side="bottom"
              sideOffset={30}
              className="z-[9999] flex flex-col"
              asChild
            >
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label className="text-nowrap">X Position</Label>
                  <Input
                    value={positionAbsoluteX}
                    className="col-span-2"
                    readOnly
                  />
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label className="text-nowrap">Y Position</Label>
                  <Input
                    value={positionAbsoluteY}
                    className="col-span-2"
                    readOnly
                  />
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label className="text-nowrap">Rotation</Label>
                  <Input
                    value={rotationDeg}
                    className="col-span-2"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "") {
                        setRotationDeg(0);
                      } else {
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue)) {
                          setRotationDeg(numValue % 360);
                        }
                      }
                      updateNodeInternals(id);
                    }}
                  />
                </div>
              </div>
            </PopoverContent>
            <HoverCardContent
              hidden={draggable}
              side="top"
              className="w-fit p-4"
            >
              <div className="flex justify-center">{status}</div>
            </HoverCardContent>
          </HoverCard>
        </DialogTrigger>
      </Popover>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Desk Booking</DialogTitle>
          <DialogDescription>Manage booking for {name}.</DialogDescription>
        </DialogHeader>
        <div>content here.</div>
      </DialogContent>
    </Dialog>
  );
}

export default memo(DeskNode);
