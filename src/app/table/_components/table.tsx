"use client";

import React from "react";
import {
  type ExpandedState,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  type ColumnDef,
  flexRender,
  getSortedRowModel,
  type SortingState,
} from "@tanstack/react-table";
import { Button } from "~/components/ui/common/button";
import { ChevronRight, X } from "lucide-react";
import { faker } from "@faker-js/faker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/common/table";
import { Input } from "~/components/ui/common/input";
import { cn } from "~/lib/utils";
import { Badge } from "~/components/ui/common/badge";

type RAG = "Red" | "Amber" | "Green";

type CaseStatus = "active" | "inactive" | "unknown" | "error";

type Availablility = {
  hour: number;
  status: RAG;
};

type Case = {
  name: string;
  status?: CaseStatus;
  taskId?: string;
  cards?: Array<Case>;
  availbility?: Array<Availablility>;
};

function makeData(caseCount: number, cardCount: number): Array<Case> {
  return Array.from({ length: caseCount }).map(() => ({
    name: faker.string.ulid(),
    status: faker.helpers.arrayElement([
      "active",
      "inactive",
      "unknown",
      "error",
    ]),
    taskId: faker.string.alphanumeric({ length: 6 }),
    cards: Array.from({ length: cardCount }).map(() => ({
      name: faker.string.alpha({ length: 10 }),
      availbility: Array.from({ length: 10 }).map((_, index) => ({
        hour: index,
        status: faker.helpers.arrayElement(["Red", "Amber", "Green"]),
      })),
    })),
  }));
}

export function CustomTable() {
  const rerender = React.useReducer(() => ({}), {})[1];

  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const columns = React.useMemo<ColumnDef<Case>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            Case Name
            <ChevronRight
              className={cn(
                "h-4 w-4 shrink-0 transition-transform",
                column.getIsSorted() === "asc"
                  ? "-rotate-90"
                  : column.getIsSorted() === "desc" && "rotate-90",
              )}
            />
          </Button>
        ),
        cell: ({ row, getValue }) => (
          <div
            className="flex items-center gap-2"
            style={{
              paddingLeft: `${row.depth * 2}rem`,
            }}
          >
            {row.getCanExpand() && (
              <Button size="icon" variant="ghost">
                <ChevronRight
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform",
                    row.getIsExpanded() && "rotate-90",
                  )}
                />
                <span className="sr-only">
                  {row.getIsExpanded() ? "collapse row" : "expand row"}
                </span>
              </Button>
            )}
            <span>{getValue<string>()}</span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ChevronRight
              className={cn(
                "h-4 w-4 shrink-0 transition-transform",
                column.getIsSorted() === "asc"
                  ? "-rotate-90"
                  : column.getIsSorted() === "desc" && "rotate-90",
              )}
            />
          </Button>
        ),
        cell: ({ getValue }) => {
          const status = getValue<CaseStatus>();
          return (
            <Badge
              variant={
                status === "error"
                  ? "destructive"
                  : status === "active"
                    ? "default"
                    : status === "inactive"
                      ? "secondary"
                      : "outline"
              }
            >
              {status.toUpperCase()}
            </Badge>
          );
        },
      },
      {
        accessorKey: "taskId",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tasking ID
            <ChevronRight
              className={cn(
                "h-4 w-4 shrink-0 transition-transform",
                column.getIsSorted() === "asc"
                  ? "-rotate-90"
                  : column.getIsSorted() === "desc" && "rotate-90",
              )}
            />
          </Button>
        ),
        cell: ({ getValue }) => <span>{getValue<string>()}</span>,
      },
    ],
    [],
  );

  const [data, setData] = React.useState(() => makeData(10, 10));
  const [expanded, setExpanded] = React.useState<ExpandedState>({});

  const hasMatchInChildren = React.useCallback(
    (row: Case, filter: string): boolean => {
      const searchStr = filter.toLowerCase();
      const { name, status, taskId, cards } = row;
      if (
        name.toLowerCase().includes(searchStr) ??
        status?.toLowerCase().includes(searchStr) ??
        taskId?.toLowerCase().includes(searchStr)
      )
        return true;

      return !!cards?.some(
        (card) =>
          card.name.toLowerCase().includes(searchStr) ||
          card.availbility?.some((a) =>
            a.status.toLowerCase().includes(searchStr),
          ),
      );
    },
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      expanded,
      globalFilter,
      sorting,
    },
    onExpandedChange: setExpanded,
    onSortingChange: setSorting,
    getSubRows: (row) => row.cards,
    getCoreRowModel: getCoreRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, columnId, filterValue: string) => {
      return hasMatchInChildren(row.original, filterValue);
    },
    onGlobalFilterChange: setGlobalFilter,
    enableExpanding: true,
    debugTable: true,
  });

  React.useEffect(() => {
    if (globalFilter) {
      const newExpanded: ExpandedState = {};
      table.getRowModel().rows.forEach((row) => {
        if (
          row.getCanExpand() &&
          hasMatchInChildren(row.original, globalFilter)
        ) {
          newExpanded[row.id] = true;
        }
      });
      setExpanded(newExpanded);
    }
  }, [globalFilter, table, hasMatchInChildren]);

  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between gap-2 p-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            table.toggleAllRowsExpanded();
          }}
        >
          <ChevronRight
            className={cn(
              "h-4 w-4 shrink-0 transition-transform",
              table.getIsAllRowsExpanded() && "rotate-90",
            )}
          />
          {table.getIsAllRowsExpanded() ? "Collapse All" : "Expand All"}
        </Button>
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="outline"
            onClick={() => setGlobalFilter("")}
            disabled={globalFilter.length === 0}
          >
            <X />
            <span className="sr-only">clear filter</span>
          </Button>
          <Input
            placeholder="Search all columns..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <React.Fragment key={row.id}>
                {row.getCanExpand() && (
                  <>
                    <TableRow
                      className={cn(
                        row.getCanExpand() && "cursor-pointer",
                        row.index % 2 === 0 ? "bg-secondary" : "",
                        globalFilter &&
                          hasMatchInChildren(row.original, globalFilter)
                          ? "bg-primary/20 hover:bg-primary/30 dark:bg-primary/30 dark:hover:bg-primary/40"
                          : "",
                      )}
                      onClick={() => {
                        if (row.getCanExpand()) {
                          row.toggleExpanded();
                        }
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    {row.getIsExpanded() && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={columns.length} className="p-0">
                          <div>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Card Name</TableHead>
                                  <TableHead>Card Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {row.original.cards?.map((card, idx) => (
                                  <TableRow
                                    key={idx}
                                    className={cn(
                                      idx % 2 === 0 ? "bg-secondary" : "",
                                      globalFilter &&
                                        card.name
                                          .toLowerCase()
                                          .includes(globalFilter.toLowerCase())
                                        ? "bg-primary/20 hover:bg-primary/30 dark:bg-primary/30 dark:hover:bg-primary/40"
                                        : "",
                                      "",
                                    )}
                                  >
                                    <TableCell>{card.name}</TableCell>
                                    <TableCell>
                                      <div className="pointer grid min-w-[100px] max-w-[380px] select-none grid-cols-10 gap-1">
                                        {card.availbility?.map(
                                          ({ status, hour }, index) => (
                                            <Button
                                              key={index}
                                              size="sm"
                                              variant={
                                                status === "Red"
                                                  ? "destructive"
                                                  : status === "Amber"
                                                    ? "outline"
                                                    : "default"
                                              }
                                              className="flex items-center justify-center"
                                            >
                                              {hour}
                                            </Button>
                                          ),
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </React.Fragment>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="h-24">
                <div className="flex flex-col items-center justify-center gap-2">
                  <span>
                    {`No results found with search term "${globalFilter}".`}
                  </span>
                  <Button
                    variant="outline"
                    className="px-2 font-medium"
                    onClick={() => setGlobalFilter("")}
                  >
                    Reset filter
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
