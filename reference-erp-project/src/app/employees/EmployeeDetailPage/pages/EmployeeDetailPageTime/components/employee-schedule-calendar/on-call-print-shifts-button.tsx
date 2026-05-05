import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { OnCallShift } from "@/types/field-service/on-call/on-call-shifts";
import type { OnCallGroup } from "@/types/field-service/on-call/groups";
import type { TimePolicy } from "@/types/general/time-policies";
import { enUS } from "date-fns/locale";
import { es } from "date-fns/locale";
import { ca } from "date-fns/locale";
import type { Locale } from "date-fns";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import {
  computePrintKindsPresent,
  generateOnCallShiftsPrintHtml,
  printOnCallShiftsHtml,
  PRINT_SCHEDULE_KIND_ORDER,
  type PrintShiftsMode,
} from "../../utils/employee-on-call-shifts-print";

const LOCALE_MAP: Record<string, Locale> = {
  en: enUS,
  es,
  ca,
};

interface OnCallPrintShiftsButtonProps {
  shifts: OnCallShift[];
  groupsMap: Map<string, OnCallGroup>;
  showMonthView: boolean;
  currentMonthStart: Date;
  selectedYear: number;
  /** When set (employee schedule), print can include time policy schedule types. */
  timePolicy?: TimePolicy | null;
}

const OnCallPrintShiftsButton = ({
  shifts,
  groupsMap,
  showMonthView,
  currentMonthStart,
  selectedYear,
  timePolicy,
}: OnCallPrintShiftsButtonProps) => {
  const { t, i18n } = useTranslation();
  const locale = LOCALE_MAP[i18n.language] ?? enUS;

  const kindsPresent = useMemo(
    () =>
      computePrintKindsPresent({
        timePolicy,
        shifts,
        showMonthView,
        currentMonthStart,
        selectedYear,
      }),
    [timePolicy, shifts, showMonthView, currentMonthStart, selectedYear]
  );

  const hasTimePolicyRanges = !!timePolicy?.time_slot_ranges?.length;
  const showSplit = hasTimePolicyRanges && kindsPresent.size > 1;
  const canPrint = kindsPresent.size > 0;

  const runPrint = useCallback(
    (printMode: PrintShiftsMode) => {
      const html = generateOnCallShiftsPrintHtml({
        shifts,
        groupsMap,
        showMonthView,
        currentMonthStart,
        selectedYear,
        locale,
        t: (key, fallback) => t(key as string, fallback as string),
        timePolicy,
        printMode,
      });
      if (!printOnCallShiftsHtml(html)) {
        toast.error(t("on-call.printError", "Could not open print window") as string);
      }
    },
    [shifts, groupsMap, showMonthView, currentMonthStart, selectedYear, locale, t, timePolicy]
  );

  const handleMainPrint = useCallback(() => {
    if (!canPrint) return;
    if (hasTimePolicyRanges) {
      if (kindsPresent.size > 1) {
        runPrint("all");
      } else {
        const only = PRINT_SCHEDULE_KIND_ORDER.find((k) => kindsPresent.has(k));
        runPrint(only ?? "all");
      }
    } else {
      runPrint("all");
    }
  }, [canPrint, hasTimePolicyRanges, kindsPresent, runPrint]);

  const dropdownItems = useMemo(() => {
    const items: { label: string; icon: "printer"; onClick: () => void }[] = [
      {
        label: t("on-call.printAllShifts", "Print all shifts"),
        icon: "printer",
        onClick: () => runPrint("all"),
      },
    ];
    if (kindsPresent.has("default")) {
      items.push({
        label: t("on-call.legendWorkShift", "Work Shift"),
        icon: "printer",
        onClick: () => runPrint("default"),
      });
    }
    if (kindsPresent.has("on_call_policy") || kindsPresent.has("on_call_shifts")) {
      items.push({
        label: t("on-call.legendOnCallShift", "OnCall Shift"),
        icon: "printer",
        onClick: () => runPrint("on_call_union"),
      });
    }
    if (kindsPresent.has("special")) {
      items.push({
        label: t("on-call.legendSpecialShift", "Special Shift"),
        icon: "printer",
        onClick: () => runPrint("special"),
      });
    }
    return items;
  }, [kindsPresent, runPrint, t]);

  return (
    <div className="flex items-center gap-0">
      <Button
        variant="outline"
        size="sm"
        onClick={handleMainPrint}
        disabled={!canPrint}
        className={showSplit ? "gap-2 rounded-r-none" : "gap-2"}
      >
        <Printer className="h-4 w-4" />
        {t("on-call.printShifts", "Print Shifts")}
      </Button>
      {showSplit && (
        <CustomActionsDropdown
          triggerIcon="chevron-down"
          className="rounded-l-none border-l border-border h-8 min-w-8 px-2 -ml-px shrink-0"
          triggerVariant="outline"
          size="sm"
          triggerIconClassName="size-4"
          items={dropdownItems}
        />
      )}
    </div>
  );
};

export default OnCallPrintShiftsButton;
