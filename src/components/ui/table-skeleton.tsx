import { TableRow, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export interface TableSkeletonProps {
  /** Number of columns to render */
  columnCount: number;
  /** Number of skeleton rows to show (default: 5) */
  rowCount?: number;
}

/** Varying widths for skeleton cells to create a more natural loading appearance */
const SKELETON_WIDTHS = ["w-12", "w-24", "w-32", "w-20", "w-28", "w-16", "w-36"];

export function TableSkeleton({
  columnCount,
  rowCount = 5,
}: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <TableRow key={rowIndex} className="hover:bg-transparent">
          {Array.from({ length: columnCount }).map((_, colIndex) => (
            <TableCell
              key={colIndex}
              className="align-middle"
            >
              <Skeleton
                className={`h-5 ${
                  SKELETON_WIDTHS[colIndex % SKELETON_WIDTHS.length]
                }`}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
