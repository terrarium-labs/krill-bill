import { useTranslation } from "react-i18next";
import { ReactNode } from "react";
import { TimeRecord } from "@/types/employees/time-records";
import { Employee } from "@/types/employees/employees";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/utils/miscelanea";
import EmployeeAvatar from "@/app/components/avatars/employee-avatar";
import TimeRecordsTable from "../time-records-table";
import { Button } from "@/components/ui/button";

interface TimeRecordsViewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    timeRecords: TimeRecord[];
    date?: Date;
    employee?: Employee | null;
    /** Custom render function for actions. Receives the time record and a callback to close (no-op in modal context) */
    renderActions?: (timeRecord: TimeRecord, closePopover: () => void) => ReactNode;
}

const TimeRecordsViewModal = ({
    open,
    onOpenChange,
    timeRecords,
    date,
    employee,
    renderActions,
}: TimeRecordsViewModalProps) => {
    const { t } = useTranslation();

    // Build title with optional date and employee info
    const getTitle = () => {
        const parts: string[] = [];
        
        if (employee) {
            parts.push(`${employee.first_name} ${employee.last_name}`);
        }
        
        if (date) {
            parts.push(formatDate(date, { showTime: false, showDay: true, showMonthName: true, showYear: true }));
        }
        
        if (parts.length === 0) {
            return t("timeRecords.timeRecords", "Time Records");
        }
        
        return `${parts.join(" - ")} ${t("timeRecords.title", "Time Records")}`;
    };

    // Adapt renderActions to table's expected signature
    const tableRenderActions = renderActions
        ? (timeRecord: TimeRecord, allTimeRecords: TimeRecord[]) => {
              // In modal context, closePopover is a no-op
              return renderActions(timeRecord, () => {});
          }
        : undefined;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-7xl md:min-w-6xl w-full max-h-[90vh] min-h-[60vh] overflow-y-auto flex flex-col"
                showCloseButton={false}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                        {employee && <EmployeeAvatar employee={employee} showName={false} size="sm" />}
                        <span>{getTitle()}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 overflow-y-auto max-h-[90vh] px-2 scrollbar-hide mb-16">
                    {/* Time Records Table */}
                    <TimeRecordsTable
                        timeRecords={timeRecords}
                        isLoading={false}
                        hiddenColumns={employee ? ["employee", "notes", "last_modified_by", "start_time", "end_time"] : ["notes", "last_modified_by", "start_time", "end_time"]}
                        renderActions={tableRenderActions}
                    />
                </div>

                <div className="flex-col rounded-b-lg sm:flex-row gap-2 fixed bottom-0 left-0 right-0 bg-background p-4 flex justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                {t("common.close", "Close")}
                            </Button>
                        </div>
            </DialogContent>
        </Dialog>
    );
};

export default TimeRecordsViewModal;
