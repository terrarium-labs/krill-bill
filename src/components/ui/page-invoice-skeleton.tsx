import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";

export function PageInvoiceSkeleton() {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="max-h-[calc(100vh-6rem)] min-h-[calc(100vh-6rem)]"
    >
      {/* Left panel */}
      <ResizablePanel defaultSize={66} minSize={40}>
        <ScrollArea className="h-full min-w-0 pr-4">
          <div className="flex flex-col gap-4 min-w-0 pr-4">
            {/* Header skeleton */}
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-2 shrink-0">
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-6 w-36" />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Skeleton className="h-6 w-16 rounded" />
                <Skeleton className="h-6 w-20 rounded" />
                <Skeleton className="h-6 w-20 rounded" />
                <Skeleton className="h-6 w-6 rounded" />
              </div>
            </div>

            {/* Overview card skeleton - Client info + Financial summary */}
            <div className="flex gap-4 border border-border rounded-xl overflow-hidden">
              <div className="p-5 w-full space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-3 w-40" />
              </div>
              <div className="w-px bg-border shrink-0" />
              <div className="p-5 w-full space-y-3">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-8 w-32" />
                <div className="space-y-2 pt-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex justify-between gap-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Info section skeleton - 3 column grid */}
            <div className="space-y-4 py-4 px-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                ))}
              </div>
            </div>

            {/* Items table skeleton */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-6 w-24 rounded" />
              </div>
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="border-b border-border bg-muted/50 p-2">
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-4 p-2 border-b border-border last:border-b-0",
                      i % 2 === 0 && "bg-muted/20"
                    )}
                  >
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </ResizablePanel>

      <ResizableHandle />

      {/* Right panel - Tabs */}
      <ResizablePanel defaultSize={34} minSize={25} maxSize={60}>
        <div className="flex flex-col gap-4 pl-4">
          {/* Tabs skeleton */}
          <div className="w-full border-b-2 border-border bg-background">
            <div className="flex w-full items-center justify-start gap-6 p-[4px]">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton
                  key={i}
                  className="h-5 w-12 shrink-0 rounded-t-md rounded-b-none"
                />
              ))}
            </div>
          </div>
          {/* Tab content skeleton */}
          <div className="h-[calc(100vh-8.5rem)] space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
