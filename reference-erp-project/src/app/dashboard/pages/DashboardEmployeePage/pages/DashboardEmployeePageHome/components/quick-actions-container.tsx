import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Play, Square, Loader2 } from "lucide-react";
import { useEmployee } from "@/app/dashboard/contexts/DashboardEmployeeContext";
import { postEmployeeStartTimeRecord, postEmployeeStopTimeRecord } from "@/api/employees/time-records/time-records";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface DashboardQuickActionsProps {
    onTimeRecordChanged?: () => void;
}

const DashboardQuickActions = ({ onTimeRecordChanged }: DashboardQuickActionsProps) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const { activeTimeRecord, refreshActiveTimeRecord, handleEmptyActiveTimeRecord } = useEmployee();
    const { i18n } = useTranslation();
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    // Calculate elapsed time
    useEffect(() => {
        if (!activeTimeRecord) {
            setElapsedTime(0);
            return;
        }

        const calculateElapsedTime = () => {
            const startTime = new Date(activeTimeRecord.start_time).getTime();
            const currentTime = Date.now();
            const elapsed = Math.floor((currentTime - startTime) / 1000);
            setElapsedTime(elapsed);
        };

        calculateElapsedTime();
        const interval = setInterval(calculateElapsedTime, 1000);

        return () => clearInterval(interval);
    }, [activeTimeRecord]);

    // Format elapsed time to XXh XXm XXs
    const formatElapsedTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
    };

    const handleStartTimeRecord = async () => {
        if (!orgId) return;

        setIsLoading(true);
        try {
            const response = await postEmployeeStartTimeRecord(orgId, "me");
            if (response.success) {
                toast.success(t("employees.timeRecords.timeRecordStarted", "Time record started"));
                refreshActiveTimeRecord();
                onTimeRecordChanged?.();
            } else {
                toast.error(t("employees.timeRecords.errorStartingTimeRecord", "Error starting time record"));
            }
        } catch (error) {
            toast.error(t("employees.timeRecords.errorStartingTimeRecord", "Error starting time record"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleStopTimeRecord = async () => {
        if (!orgId) return;

        setIsLoading(true);
        try {
            const response = await postEmployeeStopTimeRecord(orgId, "me");
            if (response.success) {
                toast.success(t("employees.timeRecords.timeRecordStopped", "Time record stopped"));
                refreshActiveTimeRecord();
                handleEmptyActiveTimeRecord();
                onTimeRecordChanged?.();
            } else {
                toast.error(t("employees.timeRecords.errorStoppingTimeRecord", "Error stopping time record"));
            }
        } catch (error) {
            toast.error(t("employees.timeRecords.errorStoppingTimeRecord", "Error stopping time record"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="shadow-none border-none" >
            <div className="flex flex-col gap-4">
                <div className="text-md font-semibold">
                    {t("dashboard.quickActions", "Quick Actions")}
                </div>

                <div className="grid flex-1 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Placeholder Button 1 */}
                    <div
                        className="h-24 items-center justify-center border border-dashed border-border flex rounded-lg"
                    >
                        <div className="text-muted-foreground text-sm">
                            {t("dashboard.comingSoon", "Coming Soon")}
                        </div>
                    </div>

                    {/* Placeholder Button 2 */}
                    <div
                        className="h-24 items-center justify-center border border-dashed border-border flex rounded-lg"
                    >
                        <div className="text-muted-foreground text-sm">
                            {t("dashboard.comingSoon", "Coming Soon")}
                        </div>
                    </div>

                    <div
                        className="w-full h-24 px-4 justify-center border border-border flex flex-col rounded-lg gap-0.5"
                    >
                        <div className="items-center flex gap-2">
                            <div className={`size-2 rounded-full bg-red-500 ${activeTimeRecord ? 'animate-pulse' : ''}`} />
                            <div className="text-muted-foreground text-xs">
                                {Intl.DateTimeFormat(i18n.language, {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric"
                                }).format(new Date())}
                            </div>
                        </div>
                        <div className="items-center flex justify-between gap-2">
                            <div className="text-xl font-medium whitespace-nowrap">
                                {formatElapsedTime(elapsedTime)}
                            </div>
                            <Button
                                size="sm"
                                onClick={activeTimeRecord ? handleStopTimeRecord : handleStartTimeRecord}
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : activeTimeRecord ? <Square className="min-h-4 min-w-4" /> : <Play className="min-h-4 min-w-4" />}
                            </Button>
                        </div>
                        <Button
                            onClick={() => navigate(`/${orgId}?tab=activity`)}
                            variant="link" size="sm" className=" h-3 w-full text-muted-foreground font-normal items-start justify-start text-xs p-0 m-0">
                            {t("dashboard.viewTimeRecord", "View all time records")}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardQuickActions;
