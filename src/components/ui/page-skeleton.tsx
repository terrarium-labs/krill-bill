import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type PageSkeletonVariant = "default" | "table" | "split" | "three-panel";

export interface PageSkeletonProps {
  /** Show page header skeleton block (default: true). Set to false when the page already renders PageHeader above the skeleton. */
  showPageHeader?: boolean;
  /** Show back button skeleton in header (default: true). Ignored when showPageHeader is false. */
  showBackButton?: boolean;
  /** Show icon/avatar skeleton in header (default: true). Ignored when showPageHeader is false. */
  showIcon?: boolean;
  /** Number of tab skeletons to show; 0 = no tabs (default: 4) */
  tabCount?: number;
  /** Main content layout variant (default: "default") */
  variant?: PageSkeletonVariant;
  /** Number of table columns for "table" variant (default: 5) */
  tableColumns?: number;
  /** Number of table rows for "table" variant (default: 6) */
  tableRows?: number;
  /** Additional className for the root container */
  className?: string;
}

const SKELETON_WIDTHS = ["w-12", "w-24", "w-32", "w-20", "w-28", "w-16", "w-36"];

export function PageSkeleton({
  showPageHeader = true,
  showBackButton = true,
  showIcon = true,
  tabCount = 4,
  variant = "default",
  tableColumns = 5,
  tableRows = 6,
  className,
}: PageSkeletonProps) {
  return (
    <div className={`space-y-6 ${className ?? ""}`}>
      {/* Page header skeleton */}
      {showPageHeader && (
        <div className="w-full max-w-full flex justify-between gap-6 md:gap-0">
          <div className="flex flex-row items-center w-full gap-2">
            {showBackButton && (
              <Skeleton className="h-6 w-6 shrink-0 rounded" />
            )}
            {showIcon && (
              <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
            )}
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      )}

      {/* Tabs list skeleton - only when tabCount > 0 */}
      {tabCount > 0 && (
        <div className="w-full border-b-2 border-border bg-background mb-4">
          <div className="flex w-full items-center justify-start gap-6 p-[4px]">
            {Array.from({ length: tabCount }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-12 shrink-0 rounded-t-md rounded-b-none" />
            ))}
          </div>
        </div>
      )}

      {/* Main content skeleton - variant-specific */}
      {variant === "table" ? (
        <div className="space-y-4">
          {/* Filters row skeleton */}
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-9 w-32 rounded" />
            <Skeleton className="h-9 w-24 rounded" />
            <Skeleton className="h-9 w-28 rounded" />
          </div>
          {/* Table skeleton */}
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {Array.from({ length: tableColumns }).map((_, i) => (
                    <TableHead key={i}>
                      <Skeleton
                        className={`h-4 ${
                          SKELETON_WIDTHS[i % SKELETON_WIDTHS.length]
                        }`}
                      />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: tableRows }).map((_, rowIndex) => (
                  <TableRow key={rowIndex} className="hover:bg-transparent">
                    {Array.from({ length: tableColumns }).map((_, colIndex) => (
                      <TableCell key={colIndex} className="align-middle">
                        <Skeleton
                          className={`h-5 ${
                            SKELETON_WIDTHS[colIndex % SKELETON_WIDTHS.length]
                          }`}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : variant === "split" ? (
        /* Left panel (1/3) + Right panel (2/3) - e.g. Employee/Client/Supplier detail */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="flex flex-col gap-4 lg:col-span-1">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          </div>
        </div>
      ) : variant === "three-panel" ? (
        /* Left (1/4) + Center (1/2) + Right (1/4) - e.g. Checklist editor */
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-3 flex flex-col gap-4">
            <Skeleton className="h-10 w-full rounded" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
          <div className="col-span-6 flex flex-col gap-4">
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
          <div className="col-span-3 flex flex-col gap-4">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-48 w-full" />
          <div className="flex gap-4">
            <Skeleton className="h-24 flex-1" />
            <Skeleton className="h-24 flex-1" />
            <Skeleton className="h-24 flex-1" />
          </div>
        </div>
      )}
    </div>
  );
}
