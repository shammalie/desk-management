import { type ReactNode } from "react";
import { Card } from "~/components/ui/common/card";

export function ControlContainer({ children }: { children: ReactNode }) {
    return (
        <Card className="flex justify-center gap-3 bg-muted/60 p-4 backdrop-blur-sm">
            {children}
        </Card>
    )
}