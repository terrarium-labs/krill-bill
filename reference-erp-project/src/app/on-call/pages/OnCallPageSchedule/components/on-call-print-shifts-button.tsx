import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { OnCallShift } from "@/types/field-service/on-call/on-call-shifts";
import type { OnCallGroup } from "@/types/field-service/on-call/groups";
import { enUS } from "date-fns/locale";
import { es } from "date-fns/locale";
import { ca } from "date-fns/locale";
import type { Locale } from "date-fns";
import {
  generateOnCallShiftsPrintHtml,
  printOnCallShiftsHtml,
} from "../../../utils/on-call-shifts-print";

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
}

const OnCallPrintShiftsButton = ({
  shifts,
  groupsMap,
  showMonthView,
  currentMonthStart,
  selectedYear,
}: OnCallPrintShiftsButtonProps) => {
  const { t, i18n } = useTranslation();
  const locale = LOCALE_MAP[i18n.language] ?? enUS;

  const handlePrint = useCallback(() => {
    const html = generateOnCallShiftsPrintHtml({
      shifts,
      groupsMap,
      showMonthView,
      currentMonthStart,
      selectedYear,
      locale,
      t: (key, fallback) => t(key as string, fallback as string),
    });
    if (!printOnCallShiftsHtml(html)) {
      toast.error(t("on-call.printError", "Could not open print window") as string);
    }
  }, [shifts, groupsMap, showMonthView, currentMonthStart, selectedYear, locale, t]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePrint}
      className="gap-2"
    >
      <Printer className="h-4 w-4" />
      {t("on-call.printShifts", "Print Shifts")}
    </Button>
  );
};

export default OnCallPrintShiftsButton;