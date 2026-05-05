import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { FileSignature, Hourglass, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type SigningRequestsSummaryStats = {
    total: number;
    pending: number;
    completed: number;
};

interface SigningRequestsSummaryCardProps {
    stats: SigningRequestsSummaryStats;
}

const SigningRequestsSummaryCard = ({ stats }: SigningRequestsSummaryCardProps) => {
    const { t } = useTranslation();

    const sections = [
        {
            id: "total",
            icon: FileSignature,
            label: t("signingRequests.statTotal", "Total"),
            value: stats.total,
            hint: t("signingRequests.statTotalHint", "All sent signing requests in this organization"),
        },
        {
            id: "pending",
            icon: Hourglass,
            label: t("signingRequests.statPending", "Pending"),
            value: stats.pending,
            hint: t("signingRequests.statPendingHint", "Not fully signed yet"),
        },
        {
            id: "completed",
            icon: CheckCircle2,
            label: t("signingRequests.statCompleted", "Completed"),
            value: stats.completed,
            hint: t("signingRequests.statCompletedHint", "All signers done"),
            iconClassName: "text-emerald-600/80",
        },
    ];

    return (
        <Card className="w-full shadow-none">
            <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {sections.map(({ id, icon: Icon, label, value, hint, iconClassName }) => (
                    <div
                        key={id}
                        className="flex flex-col items-start justify-center space-y-2 py-3 pl-4 pr-2 sm:pr-4"
                    >
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Icon className={cn("h-4 w-4 shrink-0", iconClassName)} aria-hidden />
                            <span>{label}</span>
                        </div>
                        <div className="text-2xl font-medium tabular-nums">{value}</div>
                        <p className="text-xs leading-snug text-muted-foreground">{hint}</p>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default SigningRequestsSummaryCard;
