import { useTranslation } from "react-i18next";
import { Loader2, CalendarDays } from "lucide-react";
import { AbsenceCounter } from "@/types/general/absences";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { AbsencePolicyCounterInboxCard } from "./absence-policy-counter-inbox-card";
import { AbsencePolicyCounterInboxListSkeleton } from "./absence-policy-counter-inbox-list-skeleton";

interface AbsencePolicyCounterInboxListProps {
    counters: AbsenceCounter[];
    isLoading: boolean;
    nextPageToken: string | null;
    loadingMore: boolean;
    onLoadMore: () => void;
    onCounterClick: (counter: AbsenceCounter) => void;
    selectedCounterId?: string | null;
}

const AbsencePolicyCounterInboxList = ({
    counters,
    isLoading,
    nextPageToken,
    loadingMore,
    onLoadMore,
    onCounterClick,
    selectedCounterId,
}: AbsencePolicyCounterInboxListProps) => {
    const { t } = useTranslation();

    if (isLoading) {
        return (
            <ScrollArea className="max-h-[calc(100vh-18rem)] pr-4">
                <AbsencePolicyCounterInboxListSkeleton cardCount={6} />
            </ScrollArea>
        );
    }

    if (counters.length === 0) {
        return (
            <div className="text-center py-12">
                <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    {t("absence-policies.counters.noCounters", "No counters")}
                </h3>
                <p className="text-sm text-muted-foreground">
                    {t(
                        "absence-policies.counters.noCountersDescription",
                        "Add a counter to get started"
                    )}
                </p>
            </div>
        );
    }

    return (
        <ScrollArea className="max-h-[calc(100vh-18rem)] pr-4">
            <div className="space-y-2">
                {counters.map((counter) => (
                    <AbsencePolicyCounterInboxCard
                        key={counter.id}
                        counter={counter}
                        onClick={onCounterClick}
                        isSelected={selectedCounterId === counter.id}
                    />
                ))}
                {nextPageToken && (
                    <div className="flex justify-center pt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onLoadMore}
                            disabled={loadingMore}
                        >
                            {loadingMore ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {t("common.loading", "Loading...")}
                                </>
                            ) : (
                                t("common.loadMore", "Load More")
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </ScrollArea>
    );
};

export default AbsencePolicyCounterInboxList;
