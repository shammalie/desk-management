import { useState } from "react";
import {
    useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { type CustomNodeType } from "~/components/ui/floor/nodes";
import { Card } from "~/components/ui/common/card";
import {
    CalendarIcon,
    CornersIcon,
    Crosshair1Icon,
    Pencil1Icon,
} from "@radix-ui/react-icons";
import { Button } from "~/components/ui/common/button";

import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/common/popover";
import { Calendar } from "~/components/ui/common/calendar";
import { type CustomEdgeType } from "~/components/ui/floor/edges";
import { cn } from "~/lib/utils";
import { Input } from "../../common/input";
import { format } from "date-fns";
import { ControlContainer } from "~/components/ui/floor/controls/control-container";

type FlowControlsProps = {
    canEdit: boolean;
    editMode: boolean;
    setEditMode: (value: boolean) => void;
};

function FloorViewControls({ canEdit, editMode, setEditMode }: FlowControlsProps) {
    const { fitView } = useReactFlow<CustomNodeType, CustomEdgeType>();
    const [date, setDate] = useState<Date>(new Date());
    return (
        <ControlContainer>
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
                <Input placeholder="Search" className="bg-background" />
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
        </ControlContainer>
    );
}

export { FloorViewControls }