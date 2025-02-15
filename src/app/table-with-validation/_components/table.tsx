/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import React, { ChangeEvent } from "react";

//
import {
  type Column,
  type Table as TSTable,
  type ColumnDef,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type RowData,
} from "@tanstack/react-table";
import { makeData, type Person } from "./makeData";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/common/table";
import { Input } from "~/components/ui/common/input";
import { Button } from "~/components/ui/common/button";

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    updateData: (
      rowIndex: number,
      columnId: string,
      value: unknown,
      isValid: boolean,
    ) => void;
  }
  interface ColumnMeta<TData extends RowData, TValue> {
    required: boolean;
    type: string;
    pattern?: string;
    validationMessage?: string;
    validate?(value: TValue): TValue;
  }
}

// Give our default column cell renderer editing superpowers!
const defaultColumn: Partial<ColumnDef<Person>> = {
  cell: ({
    getValue,
    row: { index },
    column: { id, columnDef },
    table: {
      options: { meta },
    },
  }) => {
    const initialValue = getValue();
    const columnMeta = columnDef.meta;
    // We need to keep and update the state of the cell normally
    const [value, setValue] = React.useState(initialValue);
    const [validationMessage, setValidationMessage] = React.useState("");

    // When the input is blurred, we'll call our table meta's updateData function
    const onBlur = (e: ChangeEvent<HTMLInputElement>) => {
      displayValidationMessage(e);
      meta?.updateData(index, id, value, e.target.validity.valid);
    };

    // If the initialValue is changed external, sync it up with our state
    React.useEffect(() => {
      setValue(initialValue);
    }, [initialValue]);

    const displayValidationMessage = <
      T extends HTMLInputElement | HTMLSelectElement,
    >(
      e: ChangeEvent<T>,
    ) => {
      if (columnMeta?.validate) {
        const isValid = columnMeta.validate(e.target.value);
        if (isValid) {
          e.target.setCustomValidity("");
          setValidationMessage("");
        } else {
          e.target.setCustomValidity(columnMeta.validationMessage ?? "");
          setValidationMessage(columnMeta.validationMessage ?? "");
        }
      } else if (e.target.validity.valid) {
        setValidationMessage("");
      } else {
        setValidationMessage(e.target.validationMessage);
      }
    };

    return (
      <Input
        className="invalid:[&:not(:placeholder-shown):not(:focus)]:border-red-500"
        value={value as string}
        onChange={(e) => setValue(e.target.value)}
        onBlur={onBlur}
        type={columnMeta?.type ?? "text"}
        required={columnMeta?.required}
        title={validationMessage}
        pattern={columnMeta?.pattern}
      />
    );
  },
};

function useSkipper() {
  const shouldSkipRef = React.useRef(true);
  const shouldSkip = shouldSkipRef.current;

  // Wrap a function with this to skip a pagination reset temporarily
  const skip = React.useCallback(() => {
    shouldSkipRef.current = false;
  }, []);

  React.useEffect(() => {
    shouldSkipRef.current = true;
  });

  return [shouldSkip, skip] as const;
}

export function EditableTable() {
  const rerender = React.useReducer(() => ({}), {})[1];

  const columns = React.useMemo<ColumnDef<Person>[]>(
    () => [
      {
        accessorKey: "firstName",
        footer: (props) => props.column.id,
        meta: {
          type: "text",
          required: true,
        },
      },
      {
        accessorFn: (row) => row.lastName,
        id: "lastName",
        header: () => <span>Last Name</span>,
        footer: (props) => props.column.id,
        meta: {
          type: "text",
          required: true,
          pattern: "^[a-zA-Z]+$",
        },
      },
      {
        accessorKey: "visits",
        header: () => <span>Visits</span>,
        footer: (props) => props.column.id,
        meta: {
          type: "number",
          required: true,
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        footer: (props) => props.column.id,
        meta: {
          type: "text",
          required: true,
        },
      },
      {
        accessorKey: "progress",
        header: "Profile Progress",
        footer: (props) => props.column.id,
        meta: {
          type: "text",
          required: true,
        },
      },
      // Additional column defs here.
    ],
    [],
  );

  const [data, setData] = React.useState(() => makeData(1000));
  const refreshData = () => setData(() => makeData(1000));

  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();
  const [editedRows, setEditedRows] = React.useState({});
  const [validRows, setValidRows] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    defaultColumn,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex,
    // Provide our updateData function to our table meta
    meta: {
      editedRows,
      setEditedRows,
      validRows,
      setValidRows,
      updateData: (rowIndex, columnId, value, isValid: boolean) => {
        // Skip page index reset until after next rerender
        skipAutoResetPageIndex();
        setData((old) =>
          old.map((row, index) => {
            if (index === rowIndex) {
              return {
                ...old[rowIndex]!,
                [columnId]: value,
              };
            }
            return row;
          }),
        );
        setValidRows((old) => ({
          ...old,
          [rowIndex]: { ...old[rowIndex], [columnId]: isValid },
        }));
      },
    },
    debugTable: true,
  });

  return (
    <div className="p-2">
      <div className="h-2" />
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : (
                      <div>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getCanFilter() ? (
                          <div>
                            <Filter column={header.column} table={table} />
                          </div>
                        ) : null}
                      </div>
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => {
            return (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  return (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div className="h-2" />
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          {"<<"}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {"<"}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {">"}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          {">>"}
        </Button>
        <span className="flex items-center gap-1">
          <div>Page</div>
          <strong>
            {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </strong>
        </span>
        <span className="flex items-center gap-1">
          | Go to page:
          <input
            type="number"
            min="1"
            max={table.getPageCount()}
            defaultValue={table.getState().pagination.pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              table.setPageIndex(page);
            }}
            className="w-16 rounded border p-1"
          />
        </span>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value));
          }}
        >
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-4">
        <div>{table.getRowModel().rows.length} Rows</div>
        <div className="flex flex-row gap-4">
          <div>
            <Button onClick={() => rerender()}>Force Rerender</Button>
          </div>
          <div>
            <Button onClick={() => refreshData()}>Refresh Data</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
function Filter({
  column,
  table,
}: {
  column: Column<any, any>;
  table: TSTable<any>;
}) {
  const firstValue = table
    .getPreFilteredRowModel()
    .flatRows[0]?.getValue(column.id);

  const columnFilterValue = column.getFilterValue();

  return typeof firstValue === "number" ? (
    <div className="flex space-x-2">
      <Input
        type="number"
        value={(columnFilterValue as [number, number])?.[0] ?? ""}
        onChange={(e) =>
          column.setFilterValue((old: [number, number]) => [
            e.target.value,
            old?.[1],
          ])
        }
        placeholder={`Min`}
        className="w-24 rounded border shadow"
      />
      <Input
        type="number"
        value={(columnFilterValue as [number, number])?.[1] ?? ""}
        onChange={(e) =>
          column.setFilterValue((old: [number, number]) => [
            old?.[0],
            e.target.value,
          ])
        }
        placeholder={`Max`}
        className="w-24 rounded border shadow"
      />
    </div>
  ) : (
    <Input
      type="text"
      value={(columnFilterValue ?? "") as string}
      onChange={(e) => column.setFilterValue(e.target.value)}
      placeholder={`Search...`}
      className="w-36 rounded border shadow"
    />
  );
}
