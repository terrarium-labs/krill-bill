import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { Holiday } from "@/types/general/holidays";
import { cn } from "@/lib/utils";
import { formatDate, getColorClasses } from "@/utils/miscelanea";

interface WorkplaceHolidayDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    holiday: Holiday | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const FancyCalendarDate: React.FC<{
    day: number;
    month: number;
}> = ({ day, month }) => {
    const currentYear = new Date().getFullYear();
    const holidayDate = new Date(currentYear, month - 1, day);

    const monthName = formatDate(holidayDate, {
        showTime: false,
        showDay: false,
        showMonth: true,
        showYear: false,
    });
    const dayFormatted = formatDate(holidayDate, {
        showTime: false,
        showDay: true,
        showMonth: false,
        showYear: false,
    });

    return (
        <div className="flex flex-col items-center justify-center w-12 rounded-sm border border-border flex-shrink-0">
            <div
                className={cn(
                    "text-xs w-full text-center rounded-t-sm py-0.5",
                    getColorClasses("red")
                )}
            >
                {monthName}
            </div>
            <div className="text-lg font-bold text-foreground leading-none pt-1 pb-2">
                {dayFormatted}
            </div>
        </div>
    );
};

const getDayMonth = (
    holiday: Holiday
): { day: number; month: number } => {
    const d = new Date(holiday.holiday_date + "T12:00:00Z");
    return { day: d.getUTCDate(), month: d.getUTCMonth() + 1 };
};

const WorkplaceHolidayDeleteModal = ({
    open,
    onOpenChange,
    holiday,
    onConfirm,
    isDeleting,
}: WorkplaceHolidayDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t("workplaces.deleteHoliday", "Delete Holiday")}
            description={
                <>
                    {t(
                        "workplaces.deleteHolidayConfirmation",
                        "Are you sure you want to delete this holiday? This action cannot be undone."
                    )}
                    {holiday && (
                        <div className="mt-4 p-3 bg-muted rounded-lg flex items-center gap-3">
                            <FancyCalendarDate
                                day={getDayMonth(holiday).day}
                                month={getDayMonth(holiday).month}
                            />
                            <div>
                                <div className="font-semibold">
                                    {holiday.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {holiday.description}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default WorkplaceHolidayDeleteModal;
