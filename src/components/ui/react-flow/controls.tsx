import { TargetIcon } from "@radix-ui/react-icons";
import { Button } from "../common/button";
import { Card } from "../common/card";

export function FlowControls() {
  return (
    <Card>
      <div className="flex gap-3">
        <Button variant="ghost" size="icon">
          <TargetIcon />
        </Button>
      </div>
    </Card>
  );
}
