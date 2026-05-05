import { useTranslation } from "react-i18next";
import { Employee } from "@/types/employees/employees";
import { TimeRecordSummary } from "@/types/general/time-records";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/utils/miscelanea";
import EmployeeAvatar from "@/app/components/avatars/employee-avatar";
import TimeRecordsSummaryDetailPanel from "../time-records-summary-detail-panel";

interface TimeRecordsSummaryViewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    summary?: TimeRecordSummary | null;
    selectedEmployee?: Employee | null;
    dateRange?: { from: Date; to: Date } | null;
}

const TimeRecordsSummaryViewModal = ({
    open,
    onOpenChange,
    summary,
    selectedEmployee,
    dateRange,
}: TimeRecordsSummaryViewModalProps) => {
    const { t } = useTranslation();

    const getTitle = () => {
        const parts: string[] = [];
        const employee = summary?.employee || selectedEmployee;
        if (employee) {
            parts.push(`${employee.first_name} ${employee.last_name}`);
        }

        let effectiveDateRange = dateRange;
        if (summary?.day) {
            const dayDate = new Date(summary.day);
            effectiveDateRange = { from: dayDate, to: dayDate };
        }

        if (effectiveDateRange) {
            const from = formatDate(effectiveDateRange.from, {
                showTime: false,
                showDay: true,
                showMonthName: true,
                showYear: true,
            });
            const to = formatDate(effectiveDateRange.to, {
                showTime: false,
                showDay: true,
                showMonthName: true,
                showYear: true,
            });
            if (from === to) {
                parts.push(from);
            } else {
                parts.push(`${from} - ${to}`);
            }
        }

        if (parts.length === 0) {
            return t("timeRecords.timeRecords", "Time Records");
        }

        return `${parts.join(" - ")} ${t("timeRecords.title", "Time Records")}`;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex max-h-[90vh] min-h-[60vh] w-full max-w-7xl flex-col overflow-y-auto md:min-w-6xl"
                showCloseButton={false}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                        {(summary?.employee || selectedEmployee) && (
                            <EmployeeAvatar
                                employee={summary?.employee || selectedEmployee!}
                                showName={false}
                                size="sm"
                            />
                        )}
                        <span>{getTitle()}</span>
                    </DialogTitle>
                </DialogHeader>

                <TimeRecordsSummaryDetailPanel
                    active={open}
                    summary={summary}
                    selectedEmployee={selectedEmployee}
                    dateRange={dateRange}
                    embedded={false}
                    showFooterClose
                    onRequestClose={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
};

export default TimeRecordsSummaryViewModal;
