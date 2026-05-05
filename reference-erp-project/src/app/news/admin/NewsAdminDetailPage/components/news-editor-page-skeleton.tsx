import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function NewsEditorPageSkeleton() {
  return (
    <div className="flex flex-col space-y-6">
      {/* Header skeleton */}
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <Skeleton className="h-6 w-6 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Skeleton className="h-9 w-32 rounded" />
          <Skeleton className="h-9 w-24 rounded" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar column */}
        <div className="space-y-6">
          <Card className="shadow-none">
            <CardContent className="space-y-6 pt-6">
              {/* Cover image */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-48 w-full rounded-md" />
                <Skeleton className="h-9 w-full rounded" />
              </div>
              {/* Slug */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-9 w-full" />
              </div>
              {/* Tags */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-10" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 flex-1" />
                  <Skeleton className="h-9 w-9 rounded" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-16 rounded" />
                  <Skeleton className="h-6 w-20 rounded" />
                  <Skeleton className="h-6 w-14 rounded" />
                </div>
              </div>
              {/* Related news */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-9 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-[500px] w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
