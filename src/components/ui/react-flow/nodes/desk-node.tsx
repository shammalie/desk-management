"use client";

import {
  CheckCircledIcon,
  CircleIcon,
  CrossCircledIcon,
  RotateCounterClockwiseIcon,
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
import { drag } from "d3-drag";
import { select } from "d3-selection";
import { Popover, PopoverContent, PopoverTrigger } from "../../common/popover";
import { Input } from "../../common/input";
import { Label } from "../../common/label";

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

    const dragHandler = drag<Element, unknown>()
      .on("start", (event: any) => {
        event.sourceEvent.stopPropagation();
        const node = nodeRef.current!.getBoundingClientRect();
        const centerX = node.left + node.width / 2;
        const centerY = node.top + node.height / 2;
        const x = event.sourceEvent.clientX;
        const y = event.sourceEvent.clientY;

        startAngle = Math.atan2(y - centerY, x - centerX);
      })
      .on("drag", (event) => {
        const node = nodeRef.current!.getBoundingClientRect();
        const centerX = node.left + node.width / 2;
        const centerY = node.top + node.height / 2;
        const x = event.sourceEvent.clientX;
        const y = event.sourceEvent.clientY;

        const currentAngle = Math.atan2(y - centerY, x - centerX);
        let deltaAngle = currentAngle - startAngle;

        // Convert radians to degrees and add to the current rotation
        let newRotation = (rotationDeg ?? 0) + (deltaAngle * 180) / Math.PI;

        // Normalize the degree to be between 0 and 360
        newRotation = ((newRotation % 360) + 360) % 360;

        setRotationDeg(newRotation);
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
                  !draggable && "border-none",
                  draggable && "border-dashed",
                  dragging && "border-solid",
                  "border bg-clip-contents-10 flex flex-col items-center gap-2 rounded border-primary p-2",
                )}
                style={{
                  transform: `rotate(${rotationDeg ?? 0}deg)`,
                }}
              >
                <div
                  ref={rotateControlRef}
                  className={cn(
                    "absolute -right-16 -top-16 flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary bg-background shadow-md",
                    "cursor-grab transition-colors hover:bg-primary/10 active:cursor-grabbing",
                    "touch-none select-none",
                    (!draggable || !selected) && "hidden",
                  )}
                >
                  <RotateCounterClockwiseIcon className="h-8 w-8 text-primary" />
                </div>
                <PopoverTrigger asChild>
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex flex-col items-center rounded-sm border-2 border-muted-foreground bg-background px-6 py-1 hover:bg-muted">
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
                    <div className="h-2 w-12 rounded bg-muted-foreground" />
                  </div>
                </PopoverTrigger>
              </div>
            </HoverCardTrigger>
            <PopoverContent
              side="bottom"
              sideOffset={30}
              className="flex flex-col gap-4"
            >
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
          <DialogTitle>Desk Booking</DialogTitle>
          <DialogDescription>Manage booking for {name}.</DialogDescription>
        </DialogHeader>
        <div>content here.</div>
      </DialogContent>
    </Dialog>
  );
}

export default memo(DeskNode);
