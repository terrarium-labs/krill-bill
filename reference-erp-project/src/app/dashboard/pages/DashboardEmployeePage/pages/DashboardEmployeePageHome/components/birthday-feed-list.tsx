import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Loader2, Cake } from "lucide-react";
import { getBirthdays } from "@/api/orgs/birthdays/birthdays";
import { toast } from "sonner";
import { BirthdayFeedCard } from "./birthday-feed-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import Employee from "@/types/employees/employees";
import { formatDateForAPI } from "@/utils/miscelanea";

const BirthdayFeedList = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [birthdays, setBirthdays] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch upcoming birthdays (today + 7 days)
    const fetchBirthdays = async () => {
        if (!orgId) return;
        setIsLoading(true);
        try {
            const today = new Date();
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);

            const fromDate = formatDateForAPI(today);
            const toDate = formatDateForAPI(nextWeek);

            const response = await getBirthdays(orgId, fromDate, toDate);
            if (response.success && response.success.birthdays) {
                setBirthdays(response.success.birthdays);
            } else {
                toast.error(t("dashboard.errorFetchingBirthdays", "Error fetching birthdays"));
            }
        } catch (error) {
            toast.error(t("dashboard.errorFetchingBirthdays", "Error fetching birthdays"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBirthdays();
    }, [orgId]);

    return (
        <div className="shadow-none border-none">
            <div className="flex flex-col gap-4">
                <div className="text-md font-semibold">
                    {t("dashboard.upcomingBirthdays", "Upcoming Birthdays")}
                </div>

                <div className="overflow-hidden">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-3">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                {t("dashboard.loadingBirthdays", "Loading birthdays...")}
                            </p>
                        </div>
                    ) : birthdays.length === 0 ? (
                        <div className="text-center py-4">
                            <Cake className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <h3 className="text-md font-medium text-muted-foreground">
                                {t('dashboard.noUpcomingBirthdays', 'No upcoming birthdays')}
                            </h3>
                            <p className="text-muted-foreground mb-4 text-xs">
                                {t('dashboard.noUpcomingBirthdaysDescription', 'No birthdays in the next 7 days')}
                            </p>
                        </div>
                    ) : (
                        <ScrollArea className={birthdays.length > 5 ? "max-h-[300px]" : ""}>
                            <div className="space-y-3">
                                {birthdays.map((birthday) => (
                                    <BirthdayFeedCard key={birthday.id} birthday={birthday} />
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BirthdayFeedList;

