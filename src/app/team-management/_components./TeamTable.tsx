'use client';
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    type ColumnDef,
} from '@tanstack/react-table';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '~/components/ui/common/table';
import type { TeamWithRelations } from '~/server/schemas/team';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Input } from '~/components/ui/common/input';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationPrevious,
    PaginationNext,
    PaginationLink,
    PaginationEllipsis,
} from '~/components/ui/common/pagination';
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from '~/components/ui/common/select';

interface TeamTableProps {
    teams: TeamWithRelations[];
    filter?: string;
    page?: number;
    pageSize?: number;
    total?: number;
}

export default function TeamTable({ teams, filter = '', page = 1, pageSize = 10, total = 0 }: TeamTableProps) {
    const [inputValue, setInputValue] = useState(filter);
    const router = useRouter();

    useEffect(() => {
        const handler = setTimeout(() => {
            if (inputValue !== filter) {
                router.push(`/team-management?filter=${encodeURIComponent(inputValue)}`);
            }
        }, 300);
        return () => clearTimeout(handler);
    }, [inputValue]);

    useEffect(() => {
        setInputValue(filter);
    }, [filter]);

    const columns = useMemo<ColumnDef<TeamWithRelations>[]>(() => [
        { accessorKey: 'name', header: 'Name', enableSorting: false },
        { accessorKey: 'parentCount', header: 'Parent Count', enableSorting: false },
        { accessorKey: 'childCount', header: 'Child Count', enableSorting: false },
    ], []);

    const table = useReactTable({
        data: teams,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const canPrev = page > 1;
    const canNext = page < totalPages;
    function goToPage(newPage: number) {
        const params = new URLSearchParams(window.location.search);
        params.set('page', String(newPage));
        params.set('pageSize', String(pageSize));
        if (filter) params.set('filter', filter);
        router.push(`/team-management?${params.toString()}`);
    }
    function changePageSize(newSize: number) {
        const params = new URLSearchParams(window.location.search);
        params.set('page', '1');
        params.set('pageSize', String(newSize));
        if (filter) params.set('filter', filter);
        router.push(`/team-management?${params.toString()}`);
    }

    return (
        <section>
            <div className="mb-4 max-w-xs">
                <Input
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    placeholder="Filter by team name"
                />
            </div>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map(headerGroup => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map(header => {
                                    const canSort = header.column.getCanSort?.();
                                    const isSorted = header.column.getIsSorted?.();
                                    return (
                                        <TableHead
                                            key={header.id}
                                            onClick={canSort ? header.column.getToggleSortingHandler?.() : undefined}
                                            className={canSort ? 'cursor-pointer select-none' : ''}
                                        >
                                            <span className="inline-flex items-center gap-1">
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {canSort && isSorted === false && (
                                                    <ChevronsUpDown className="w-4 h-4 opacity-40" />
                                                )}
                                                {isSorted === 'asc' && <ChevronUp className="w-4 h-4" />}
                                                {isSorted === 'desc' && <ChevronDown className="w-4 h-4" />}
                                            </span>
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.map(row => (
                            <TableRow
                                key={row.id}
                                className="cursor-pointer hover:bg-accent"
                                onClick={() => {
                                    const teamName = row.original.name;
                                    if (teamName) {
                                        router.push(`/team-management/${encodeURIComponent(teamName)}`);
                                    }
                                }}
                            >
                                {row.getVisibleCells().map(cell => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className="flex w-full">
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                href="#"
                                onClick={e => {
                                    e.preventDefault();
                                    if (canPrev) goToPage(page - 1);
                                }}
                                aria-disabled={!canPrev}
                            />
                        </PaginationItem>
                        {(() => {
                            const items = [];
                            const window = 2;
                            for (let i = 1; i <= totalPages; i++) {
                                if (
                                    i === 1 ||
                                    i === totalPages ||
                                    (i >= page - window && i <= page + window)
                                ) {
                                    items.push(
                                        <PaginationItem key={i}>
                                            <PaginationLink
                                                href="#"
                                                isActive={page === i}
                                                onClick={e => {
                                                    e.preventDefault();
                                                    if (page !== i) goToPage(i);
                                                }}
                                            >
                                                {i}
                                            </PaginationLink>
                                        </PaginationItem>
                                    );
                                } else if (
                                    (i === page - window - 1 && i > 1) ||
                                    (i === page + window + 1 && i < totalPages)
                                ) {
                                    items.push(
                                        <PaginationItem key={`ellipsis-${i}`}>
                                            <PaginationEllipsis />
                                        </PaginationItem>
                                    );
                                }
                            }
                            return items;
                        })()}
                        <PaginationItem>
                            <PaginationNext
                                href="#"
                                onClick={e => {
                                    e.preventDefault();
                                    if (canNext) goToPage(page + 1);
                                }}
                                aria-disabled={!canNext}
                            />
                        </PaginationItem>
                        <PaginationItem>
                            <Select value={String(pageSize)} onValueChange={v => changePageSize(Number(v))}>
                                <SelectTrigger className="w-[120px] ml-4">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[10, 20, 30, 40, 50].map(size => (
                                        <SelectItem key={size} value={String(size)}>
                                            Show {size}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </section>
    );
} 