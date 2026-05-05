import {
    Children,
    Fragment,
    isValidElement,
    memo,
    useMemo,
    useState,
    type ReactElement,
    type ReactNode,
} from "react";
import type { ColumnDef, ColumnSizingState } from "@tanstack/react-table";
import {
    TableProvider,
    TableHeader,
    TableHeaderGroup,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/shadcn-io/table";
import { TableRow as TableRowRaw } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type MarkdownRendererTableProps = {
    children?: ReactNode;
    getFontSize: (baseSize: number) => string;
    breakAll: boolean;
};

type MarkdownTableRow = Record<string, ReactNode | string> & { id: string };

type WithChildren = { children?: ReactNode };

function flattenElements(node: ReactNode): ReactElement[] {
    const out: ReactElement[] = [];
    Children.forEach(node, (child) => {
        if (!isValidElement(child)) return;
        if (child.type === Fragment) {
            out.push(...flattenElements((child.props as WithChildren).children));
        } else {
            out.push(child);
        }
    });
    return out;
}

function getCellsFromRow(tr: ReactElement<WithChildren>): ReactNode[] {
    const cells: ReactNode[] = [];
    Children.forEach(tr.props.children, (cell) => {
        if (!isValidElement(cell)) return;
        const t = cell.type;
        if (t === "th" || t === "td") {
            cells.push((cell as ReactElement<WithChildren>).props.children);
        }
    });
    return cells;
}

function extractMarkdownTableStructure(children: ReactNode): {
    headerCells: ReactNode[];
    bodyRows: ReactNode[][];
} | null {
    let headerCells: ReactNode[] = [];
    const bodyRows: ReactNode[][] = [];

    for (const section of flattenElements(children)) {
        if (!isValidElement(section)) continue;

        if (section.type === "thead") {
            for (const tr of flattenElements((section.props as WithChildren).children)) {
                if (!isValidElement(tr) || tr.type !== "tr") continue;
                const cells = getCellsFromRow(tr as ReactElement<WithChildren>);
                if (cells.length > 0) {
                    headerCells = cells;
                    break;
                }
            }
        } else if (section.type === "tbody") {
            for (const tr of flattenElements((section.props as WithChildren).children)) {
                if (!isValidElement(tr) || tr.type !== "tr") continue;
                const cells = getCellsFromRow(tr as ReactElement<WithChildren>);
                if (cells.length > 0) {
                    bodyRows.push(cells);
                }
            }
        }
    }

    if (headerCells.length === 0 && bodyRows.length > 0) {
        headerCells = bodyRows[0] ?? [];
        bodyRows.splice(0, 1);
    }

    const columnCount = Math.max(
        headerCells.length,
        ...bodyRows.map((r) => r.length),
        0,
    );

    if (columnCount === 0 || bodyRows.length === 0) {
        return null;
    }

    const pad = (cells: ReactNode[]) => {
        const row = [...cells];
        while (row.length < columnCount) row.push(null);
        return row.slice(0, columnCount);
    };

    return {
        headerCells: pad(headerCells),
        bodyRows: bodyRows.map(pad),
    };
}

function MarkdownRendererTableComponent({
    children,
    getFontSize,
    breakAll,
}: MarkdownRendererTableProps) {
    const extracted = useMemo(() => extractMarkdownTableStructure(children), [children]);

    const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});

    const { data, columns } = useMemo(() => {
        if (!extracted) {
            return { data: [] as MarkdownTableRow[], columns: [] as ColumnDef<MarkdownTableRow>[] };
        }

        const { headerCells, bodyRows } = extracted;
        const columnCount = headerCells.length;
        const fontSize = getFontSize(16);

        const cols: ColumnDef<MarkdownTableRow>[] = Array.from({ length: columnCount }, (_, i) => {
            const key = `c${i}`;
            return {
                id: key,
                accessorKey: key,
                enableSorting: false,
                enableResizing: true,
                size: 168,
                meta: { className: "px-4 py-2 align-top whitespace-normal" },
                header: () => (
                    <span
                        style={{ fontSize }}
                        className={cn("block min-w-0 font-medium text-foreground", breakAll && "break-all")}
                    >
                        {headerCells[i] ?? (
                            <span className="text-muted-foreground"> </span>
                        )}
                    </span>
                ),
                cell: ({ row }) => (
                    <div
                        style={{ fontSize }}
                        className={cn("min-w-0 text-foreground", breakAll && "break-all")}
                    >
                        {row.original[key] ?? (
                            <span className="text-muted-foreground"> </span>
                        )}
                    </div>
                ),
            };
        });

        const rowData: MarkdownTableRow[] = bodyRows.map((cells, ri) => {
            const row: MarkdownTableRow = { id: `md-row-${ri}` };
            for (let i = 0; i < columnCount; i++) {
                row[`c${i}`] = cells[i];
            }
            return row;
        });

        return { data: rowData, columns: cols };
    }, [extracted, getFontSize, breakAll]);

    if (!extracted || columns.length === 0) {
        return (
            <div className="my-4 min-w-0 w-full overflow-x-auto">
                <table className="min-w-full divide-y divide-border">{children}</table>
            </div>
        );
    }

    return (
        <div className="my-4 min-w-0 w-full overflow-x-auto">
            <TableProvider
                data={data}
                columns={columns}
                enableColumnResizing
                columnSizing={columnSizing}
                onColumnSizingChange={setColumnSizing}
            >
                <TableHeader className="bg-muted">
                    {({ headerGroup }) => (
                        <TableHeaderGroup key={headerGroup.id} headerGroup={headerGroup}>
                            {({ header }) => <TableHead key={header.id} header={header} />}
                        </TableHeaderGroup>
                    )}
                </TableHeader>
                <TableBody>
                    {({ row }) => (
                        <TableRowRaw
                            key={row.id}
                            className="border-b transition-colors hover:bg-muted/50"
                        >
                            {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id} cell={cell} />
                            ))}
                        </TableRowRaw>
                    )}
                </TableBody>
            </TableProvider>
        </div>
    );
}

export const MarkdownRendererTable = memo(MarkdownRendererTableComponent);
