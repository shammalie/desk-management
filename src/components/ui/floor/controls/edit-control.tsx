import { useCallback, useState } from "react";
import {
    useReactFlow,
    useOnSelectionChange,
    type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { type CustomNodeType } from "~/components/ui/floor/nodes";
import {
    DesktopIcon,
    DividerVerticalIcon,
    GridIcon,
} from "@radix-ui/react-icons";
import { Button } from "~/components/ui/common/button";
import { Separator } from "~/components/ui/common/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "~/components/ui/common/tooltip";

import { NodeType } from "~/components/ui/floor/nodes/types";
import { ControlContainer } from "~/components/ui/floor/controls/control-container";
import { Box, Eraser, SaveAll } from "lucide-react";


type EditControlsProps = {
    snapToGrid: boolean;
    setSnapToGrid: (value: boolean) => void;
};

function FloorEditControls({ setSnapToGrid, snapToGrid }: EditControlsProps) {
    const { addNodes, getNode } = useReactFlow<CustomNodeType>();
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

    // the passed handler has to be memoized, otherwise the hook will not work correctly
    const onChange = useCallback(({ nodes }: { nodes: Node[] }) => {
        setSelectedNode(nodes.map((node) => node)[0] ?? null);
    }, []);

    useOnSelectionChange({
        onChange,
    });

    const onDragStart = (
        event: React.DragEvent<HTMLDivElement>,
        nodeType: NodeType,
    ) => {
        event.dataTransfer.setData("application/reactflow", nodeType);
        event.dataTransfer.effectAllowed = "move";
    };

    return (
        <ControlContainer>
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
                        <div
                            className="flex cursor-pointer items-center rounded-full h-8 w-8 p-2 align-middle hover:bg-muted"
                            onDragStart={(event) => onDragStart(event, NodeType.Desk)}
                            draggable
                        >
                            <DesktopIcon />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>Drag to place new desk</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className="flex cursor-pointer items-center rounded-full h-8 w-8 p-2 align-middle hover:bg-muted"
                            onDragStart={(event) => onDragStart(event, NodeType.Desk)}
                            draggable
                        >
                            <DividerVerticalIcon />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>Drag to place new wall</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className="flex cursor-pointer items-center rounded-full h-8 w-8 p-2 align-middle hover:bg-muted"
                            onDragStart={(event) => onDragStart(event, NodeType.Room)}
                            draggable
                        >
                            <Box />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>Drag to place new room</TooltipContent>
                </Tooltip>
                <Separator orientation="vertical" />
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <SaveAll />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Save Changes</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <Eraser />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Discard Changes</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </ControlContainer >
    );
}

export { FloorEditControls }