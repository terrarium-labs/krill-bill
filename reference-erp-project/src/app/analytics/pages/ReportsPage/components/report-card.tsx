import { useState } from "react";
import { FileBarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Report } from "@/types/general/reports";
import ReportRunModal from "./report-run-modal";

interface ReportCardProps {
    report: Report;
    className?: string;
}

const ReportCard = ({ report, className }: ReportCardProps) => {
    const [runOpen, setRunOpen] = useState(false);

    return (
        <>
            <div
                className={cn(
                    "flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-accent cursor-pointer",
                    className
                )}
                onClick={() => setRunOpen(true)}
            >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0 text-primary [&>svg]:w-4 [&>svg]:h-4 [&>svg]:min-w-4 [&>svg]:min-h-4">
                    <FileBarChart2 />
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold leading-snug text-primary">
                        {report.name}
                    </span>
                    <span className="line-clamp-2 text-sm text-muted-foreground mt-0.5">
                        {report.description}
                    </span>
                </div>
            </div>

            <ReportRunModal
                report={report}
                open={runOpen}
                onOpenChange={setRunOpen}
            />
        </>
    );
};

export default ReportCard;
