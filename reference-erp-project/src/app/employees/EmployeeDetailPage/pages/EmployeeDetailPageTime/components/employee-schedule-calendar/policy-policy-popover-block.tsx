import { useTranslation } from "react-i18next";
import type { PolicyDayDisplayInfo } from "@/app/employees/EmployeeDetailPage/pages/EmployeeDetailPageTime/utils/policy-day-display";
import { PolicyCalendarTile, type PolicyCalendarTileSize } from "./policy-calendar-tile";

export function PolicyPolicyPopoverBlock({
  info,
  tileSize = "default",
}: {
  info: PolicyDayDisplayInfo;
  tileSize?: PolicyCalendarTileSize;
}) {
  const { t } = useTranslation();
  return (
    <div className="rounded-md border border-dashed border-muted-foreground/30 bg-muted/30 p-2 text-xs space-y-1.5">
      <p className="font-medium text-muted-foreground">
        {t("employeesDetail.timePolicyWorkHours", "Time policy (work hours)")}
      </p>
      <p className="text-[10px] text-muted-foreground/80">{info.sourceLabel}</p>
      <ul className="space-y-1 list-none">
        {info.slots.map((slot) => (
          <li key={slot.id}>
            <PolicyCalendarTile slot={slot} sourceLabel={info.sourceLabel} tileSize={tileSize} />
          </li>
        ))}
      </ul>
    </div>
  );
}
