import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface AbsencePolicyCounterInboxListSkeletonProps {
    /** Number of card skeletons to show (default: 6) */
    cardCount?: number;
    /** Additional className for the root container */
    className?: string;
}

function AbsencePolicyCounterInboxCardSkeleton() {
    return (
        <div
            className={cn(
                "overflow-hidden py-0 min-h-20 rounded-lg border border-border",
                "flex gap-3 p-3"
            )}
        >
            <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2">
                <div className="flex justify-between items-center gap-2">
                    <Skeleton className="h-4 w-28 shrink-0" />
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-14 shrink-0 rounded" />
                        <Skeleton className="h-5 w-16 shrink-0 rounded" />
                    </div>
                </div>
                <Skeleton className="h-3 w-20" />
                <div className="space-y-1">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-11/12" />
                </div>
            </div>
            <div className="flex items-center justify-center shrink-0">
                <Skeleton className="h-5 w-5 rounded" />
            </div>
        </div>
    );
}

export function AbsencePolicyCounterInboxListSkeleton({
    cardCount = 6,
    className,
}: AbsencePolicyCounterInboxListSkeletonProps) {
    return (
        <div className={cn("space-y-2", className)}>
            {Array.from({ length: cardCount }).map((_, i) => (
                <AbsencePolicyCounterInboxCardSkeleton key={i} />
            ))}
        </div>
    );
}
