import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Holiday } from "@/types/general/holidays";
import CalendarDayLabel from "@/app/components/labels/calendar-day-label";

interface HolidaysCardProps {
  holidays: Holiday[];
}

const HolidaysCard = ({ holidays }: HolidaysCardProps) => {
  const { t } = useTranslation();

  if (!holidays || holidays.length === 0) {
    return (
      <Card className="shadow-none">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2 justify-between">
            {t("workplaces.holidays", "Holidays")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            {t("workplaces.noHolidays", "No holidays")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const sortedHolidays = [...holidays].sort((a, b) =>
    a.holiday_date.localeCompare(b.holiday_date)
  );

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2 justify-between">
          {t("workplaces.holidays", "Holidays")}
          <Badge variant="secondary">{holidays.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-y-auto max-h-64">
          <div className="space-y-2 pr-4">
            {sortedHolidays.map((holiday) => (
                <div key={holiday.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                  <CalendarDayLabel data={new Date(holiday.holiday_date)} />
                  <div className="flex flex-col items-start gap-0.5 min-w-0 flex-1">
                    <h4 className="font-semibold text-sm">{holiday.name}</h4>
                    {holiday.description && (
                      <span className="text-xs text-muted-foreground">
                        {holiday.description}
                      </span>
                    )}
                  </div>
                </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HolidaysCard;