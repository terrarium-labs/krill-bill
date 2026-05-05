import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";

export function NewsArticlePageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton - back button + description */}
      <div className="w-full max-w-full flex justify-between gap-6 md:gap-0">
        <div className="flex flex-row items-center w-full gap-2">
          <Skeleton className="h-6 w-6 shrink-0 rounded" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main content - 3 cols */}
        <div className="lg:col-span-3">
          <Card className="shadow-none border-none py-0">
            <CardHeader className="space-y-3 px-0 pt-0">
              <Skeleton className="h-9 w-3/4" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-2/3" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded" />
                <Skeleton className="h-6 w-20 rounded" />
                <Skeleton className="h-6 w-14 rounded" />
              </div>
              <div className="flex items-center gap-4 pb-4 border-b">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-24 ml-auto" />
              </div>
            </CardHeader>

            {/* Cover image placeholder */}
            <div className="pb-6">
              <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg border border-border bg-muted">
                <Skeleton className="h-full w-full rounded-none" />
              </AspectRatio>
            </div>

            {/* Content lines */}
            <CardContent className="px-0 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>

            {/* Reactions area */}
            <div className="border-t pt-6 pb-0">
              <div className="flex gap-4">
                <Skeleton className="h-8 w-24 rounded" />
                <Skeleton className="h-8 w-24 rounded" />
                <Skeleton className="h-8 w-24 rounded" />
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar - 1 col */}
        <div className="lg:col-span-1 space-y-6 sticky top-20 self-start">
          <Card className="shadow-none border-none gap-0">
            <CardHeader className="pb-0 px-0">
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent className="px-0 space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </CardContent>
          </Card>
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
