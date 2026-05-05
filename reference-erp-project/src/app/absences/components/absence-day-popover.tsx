import { useState, ReactNode } from "react";
import { CalendarDayButton } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, Paperclip, Gift, Pill } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDate, formatTime } from "@/utils/miscelanea";
import { Absence } from "@/types/employees/absences";
import type { SickLeave } from "@/types/employees/sick-leaves";
import { Holiday } from "@/types/general/holidays";
import { IconLabel } from "@/app/components/custom-labels";
import Tag from "@/app/components/tag/tag";

// Helper function to check if two dates are the same day
const isSameCalendarDay = (date1: Date, date2: Date): boolean => {
  const normalizeDate = (date: Date): Date => {
    return new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        0,
        0,
        0,
        0
      )
    );
  };
  return normalizeDate(date1).getTime() === normalizeDate(date2).getTime();
};

interface AbsenceDayPopoverProps
  extends React.ComponentProps<typeof CalendarDayButton> {
  absences: Absence[];
  sickLeaves?: SickLeave[];
  holidays?: Holiday[];
  onAddAbsence: (date: Date) => void;
  onViewAbsence: (absence: Absence) => void;
  /** Same behavior as clicking a sick leave row in the sick leaves card. */
  onViewSickLeave?: (sickLeave: SickLeave) => void;
  /** Custom render function for actions. Receives the absence and a callback to close the popover */
  renderActions?: (absence: Absence, closePopover: () => void) => ReactNode;
}

const AbsenceDayPopover = ({
  className,
  day,
  absences,
  sickLeaves = [],
  holidays = [],
  onAddAbsence,
  onViewAbsence,
  onViewSickLeave,
  renderActions,
}: AbsenceDayPopoverProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const hasAbsences = absences.length > 0;
  const hasSickLeaves = sickLeaves.length > 0;

  const handleAddAbsenceForDay = () => {
    // Create a date at start of day in UTC
    const selectedDayUTC = new Date(
      Date.UTC(
        day.date.getFullYear(),
        day.date.getMonth(),
        day.date.getDate(),
        0,
        0,
        0,
        0
      )
    );
    onAddAbsence(selectedDayUTC);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "min-h-6 min-w-6 max-h-6 max-w-6 p-0 text-xs font-normal flex items-center justify-center hover:bg-accent hover:text-accent-foreground focus-visible:ring-1",
            className
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          {day.date.getDate()}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" side="top" align="center">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">
              {formatDate(day.date, {
                showTime: false,
                showYear: true,
                useUTC: false,
                showDayName: true,
              })}
            </h4>
          </div>
          {hasAbsences ? (
            <div className="flex flex-col gap-1">
              {absences.map((absence, index) => {
                const absence_type = absence.absence_type;
                const startDate = new Date(absence.start_date);
                const endDate = new Date(absence.end_date);
                const isMultiDay = !isSameCalendarDay(startDate, endDate);

                return (
                  <div
                    key={absence.id || index}
                    className={cn(
                      "py-1.5 px-2 rounded-md transition-colors cursor-pointer",
                      "hover:bg-accent hover:text-accent-foreground"
                    )}
                    onClick={() => {
                      if (absence.id) {
                        onViewAbsence(absence);
                        setIsOpen(false);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <IconLabel
                        icon={absence_type.icon_url}
                        text={absence_type.name}
                        color={absence_type.color}
                      />
                      <Tag
                        text={absence.status}
                        className="capitalize"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      {isMultiDay ? (
                        <span className="text-xs text-muted-foreground">
                          {formatDate(startDate, {
                            showTime: true,
                            showYear: false,
                            useUTC: true,
                          })}{" "}
                          -{" "}
                          {formatDate(endDate, {
                            showTime: true,
                            showYear: false,
                            useUTC: true,
                          })}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {formatTime(startDate, { useUTC: true })} -{" "}
                          {formatTime(endDate, { useUTC: true })}
                        </span>
                      )}
                      {absence.id && renderActions && (
                        <div onClick={(e) => e.stopPropagation()}>
                          {renderActions(absence, () => setIsOpen(false))}
                        </div>
                      )}
                    </div>
                    {absence.id && (
                      <p
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewAbsence(absence!);
                          setIsOpen(false);
                        }}
                        className="hover:underline text-xs cursor-pointer flex items-center gap-1 text-blue-500 mt-1"
                      >
                        <Paperclip className="h-3 w-3" />
                        {t("absences.addFiles", "Add files")}
                        {absence.num_files > 0 && (
                            <> ({absence.num_files})</>
                        )}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : !hasSickLeaves ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <p className="text-sm text-muted-foreground">
                {t("absences.noAbsencesThisDay", "No absences on this day")}
              </p>
              <Button
                size="sm"
                onClick={handleAddAbsenceForDay}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                {t("dashboard.absences.addAbsence", "Add Absence")}
              </Button>
            </div>
          ) : null}

          {/* Sick leaves — same layout as absences; pill icon instead of type icon */}
          {hasSickLeaves && (
            <div
              className={cn(
                "flex flex-col gap-1",
                hasAbsences && "border-t pt-3 mt-1"
              )}
            >
              {sickLeaves.map((sl, index) => {
                const startDate = new Date(sl.start_date);
                const endDate = new Date(sl.end_date);
                const isMultiDay = !isSameCalendarDay(startDate, endDate);
                const title = sl.name?.trim() || t("sickLeaves.title", "Sick Leave");
                return (
                  <div
                    key={sl.id || index}
                    role={onViewSickLeave ? "button" : undefined}
                    tabIndex={onViewSickLeave ? 0 : undefined}
                    className={cn(
                      "py-1.5 px-2 rounded-md transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      onViewSickLeave && "cursor-pointer"
                    )}
                    onClick={() => {
                      if (!onViewSickLeave) return;
                      onViewSickLeave(sl);
                      setIsOpen(false);
                    }}
                    onKeyDown={(e) => {
                      if (!onViewSickLeave) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onViewSickLeave(sl);
                        setIsOpen(false);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <IconLabel
                        icon={Pill}
                        text={title}
                        color="red"
                      />
                      <Tag
                        text={t("sickLeaves.title", "Sick Leave")}
                        color="red"
                        className="capitalize"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      {isMultiDay ? (
                        <span className="text-xs text-muted-foreground">
                          {formatDate(startDate, {
                            showTime: true,
                            showYear: false,
                            useUTC: true,
                          })}{" "}
                          -{" "}
                          {formatDate(endDate, {
                            showTime: true,
                            showYear: false,
                            useUTC: true,
                          })}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {formatTime(startDate, { useUTC: true })} -{" "}
                          {formatTime(endDate, { useUTC: true })}
                        </span>
                      )}
                    </div>
                    {sl.num_files > 0 && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Paperclip className="h-3 w-3 shrink-0" />
                        {t("sickLeaves.attachedFiles", "{{count}} file(s)", {
                          count: sl.num_files,
                        })}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!hasAbsences && hasSickLeaves && (
            <div className="flex flex-col items-center justify-center pt-2 space-y-3">
              <Button
                size="sm"
                onClick={handleAddAbsenceForDay}
                className="gap-2"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                {t("dashboard.absences.addAbsence", "Add Absence")}
              </Button>
            </div>
          )}
          
          {/* Holidays Section */}
          {holidays.length > 0 && (
            <div className="border-t pt-3 mt-3">
              <div className="space-y-2">
                {holidays.map((holiday) => (
                  <div
                    key={holiday.id}
                    className="py-2 px-2 rounded-md bg-amber-50 dark:bg-amber-950"
                  >
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        {holiday.name}
                      </span>
                    </div>
                    {holiday.description && (
                      <p className="text-xs text-amber-700 dark:text-amber-200 mt-1">
                        {holiday.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AbsenceDayPopover;
