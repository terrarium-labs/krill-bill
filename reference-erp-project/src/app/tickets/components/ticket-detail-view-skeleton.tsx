import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function TicketDetailViewSkeleton() {
  return (
    <Card className="shadow-none border-none py-1 px-2">
      <CardHeader className="space-y-3 px-0 pt-0">
        {/* Title with client avatar and actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-6 w-20 rounded" />
            <Skeleton className="h-6 w-24 rounded" />
          </div>
        </div>

        {/* Tags - Priority, Status, Type */}
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-20 rounded" />
          <Skeleton className="h-6 w-16 rounded" />
          <Skeleton className="h-6 w-16 rounded" />
        </div>

        {/* Date info */}
        <div className="flex items-center gap-2 pb-4 border-b">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-36" />
        </div>
      </CardHeader>

      <CardContent className="px-0 space-y-4">
        {/* AI Insights placeholder */}
        <Skeleton className="h-24 w-full rounded-lg" />

        {/* Contact & Related Information - 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-4">
            <Skeleton className="h-4 w-36" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-4 w-4 shrink-0" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-36" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-4 w-4 shrink-0" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="pt-6 border-border">
          <div className="w-full border-b-2 border-border bg-background mb-4">
            <div className="flex w-full items-center justify-start gap-6 p-[4px]">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton
                  key={i}
                  className="h-5 w-12 shrink-0 rounded-t-md rounded-b-none"
                />
              ))}
            </div>
          </div>
          {/* Tab content */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
