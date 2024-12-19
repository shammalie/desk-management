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
import { drag } from "d3-drag";
import { select } from "d3-selection";
import { type CustomNodeType } from "./types";

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

  useEffect(() => {
    if (!rotateControlRef.current) {
      return;
    }

    const selection = select<Element, unknown>(rotateControlRef.current);
    const dragHandler = drag().on(
      "drag",
      ({ x, y }: { x: number; y: number }) => {
        const dx = x - 100;
        const dy = y - 100;
        const rad = Math.atan2(dx, dy);
        const deg = rad * (180 / Math.PI);
        setRotationDeg(180 - deg);
        updateNodeInternals(id);
      },
    );

    selection.call(dragHandler);
  }, [id, updateNodeInternals]);

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
                    !draggable && "hidden",
                    "absolute top-[-30px] h-4 w-4 rounded-full bg-primary",
                  )}
                />
                <PopoverTrigger asChild>
                  <div
                    className={
                      "flex h-full w-full origin-center items-center justify-center border-2 border-muted-foreground bg-muted"
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
