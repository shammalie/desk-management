import { faker } from "@faker-js/faker";
import { Badge } from "~/components/ui/common/badge";
import { Label } from "~/components/ui/common/label";
import { cn } from "~/lib/utils";

type location = {
  name: string;
  totalDesks: number;
  availableDesks: number;
  bookingStatus: "quiet" | "moderate";
  averageActivity: hourStatus[];
};

type hourStatus = {
  hourValue: number;
  status: "low" | "medium" | "high";
};

const data: location[] = Array.from({ length: 100 }, () => {
  const total = faker.helpers.rangeToNumber(10000);
  const available = faker.helpers.rangeToNumber({ min: 0, max: total });
  return {
    name: faker.location.city(),
    totalDesks: total,
    availableDesks: available,
    bookingStatus: available >= total / 2 ? "moderate" : "quiet",
    averageActivity: Array.from({ length: 24 }).map((_, index) => {
      const status = faker.helpers.rangeToNumber({ min: 1, max: 3 });
      return {
        hourValue: index + 1,
        status: status === 1 ? "low" : status === 2 ? "medium" : "high",
      };
    }),
  };
});

export default function LocationsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 px-8 pt-0">
      <div className="grid auto-rows-min gap-4 md:grid-cols-4">
        {data.map(
          (
            {
              availableDesks,
              bookingStatus,
              name,
              totalDesks,
              averageActivity,
            },
            index,
          ) => (
            <div
              key={index}
              className="flex aspect-video cursor-pointer flex-col rounded-xl border bg-muted/40 p-8 shadow-sm hover:bg-muted/60 hover:shadow-md"
            >
              <div className="flex h-full flex-col justify-between gap-2">
                <span className="text-xl">{name}</span>
                <div>
                  <Badge
                    variant={
                      bookingStatus === "moderate" ? "destructive" : "default"
                    }
                  >
                    {bookingStatus}
                  </Badge>
                </div>
                <div className="flex flex-col gap-2 rounded-lg">
                  <Label className="text-xs text-muted-foreground">
                    Activity
                  </Label>
                  <div className="grid h-8 grid-cols-12 gap-1">
                    {averageActivity.map(({ status, hourValue }) => (
                      <div
                        key={hourValue}
                        className={cn(
                          "h-full w-full rounded-lg",
                          status === "low"
                            ? "bg-green-500"
                            : status === "medium"
                              ? "bg-yellow-500"
                              : "bg-red-500",
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
