import { useState } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import NewsFeedList from "./components/news-feed-list";
import BirthdayFeedList from "./components/birthday-feed-list";
import QuickActionsContainer from "./components/quick-actions-container";
import TodayFeedContainer from "./components/today-feed-container";
import { TimeRecord } from "@/types/employees/time-records";
import { useEmployee } from "@/app/dashboard/contexts/DashboardEmployeeContext";
import { deleteEmployeeTimeRecord } from "@/api/employees/time-records/time-records";
import { toast } from "sonner";
import { formatDate, formatTimeToTravel } from "@/utils/miscelanea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const DashboardEmployeePageHome = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const { employee, refreshTimeRecords } = useEmployee();
    const [todayViewRefreshTrigger, setTodayViewRefreshTrigger] = useState(0);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [timeRecordToDelete, setTimeRecordToDelete] = useState<TimeRecord | null>(null);
    const [deletingTimeRecord, setDeletingTimeRecord] = useState(false);

    const handleDeleteTimeRecord = async () => {
        if (!timeRecordToDelete || !orgId || !employee) return;

        setDeletingTimeRecord(true);
        try {
            const response = await deleteEmployeeTimeRecord(orgId, employee.id, timeRecordToDelete.id);
            if (response.success) {
                toast.success(t("employees.timeRecords.timeRecordDeleted", "Time record deleted successfully"));
                setTodayViewRefreshTrigger(prev => prev + 1);
            } else {
                toast.error(t("employees.timeRecords.errorDeletingTimeRecord", "Error deleting time record"));
            }
        } catch (error) {
            toast.error(t("employees.timeRecords.errorDeletingTimeRecord", "Error deleting time record"));
        } finally {
            setDeletingTimeRecord(false);
            setDeleteModalOpen(false);
            setTimeRecordToDelete(null);
        }
    };

    const handleTimeRecordCreated = () => {
        setTodayViewRefreshTrigger(prev => prev + 1);
        refreshTimeRecords();
    };

    // Calculate duration in hours
    const calculateDuration = (startTime: string, endTime: string) => {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const durationMs = end.getTime() - start.getTime();
        const minutes = durationMs / (1000 * 60);
        return formatTimeToTravel(minutes);
    };

    return (
        <>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Sidebar - left side (1 column on large screens) */}
                <div className="flex flex-col gap-8 lg:col-span-1">
                    <BirthdayFeedList />
                    <NewsFeedList />
                </div>

                {/* Main Content Area - Right Side (2 columns on large screens) */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    {/* Quick Actions */}
                    <QuickActionsContainer
                        onTimeRecordChanged={handleTimeRecordCreated}
                    />
                    {/* TODO: Implement summary */}
                    <div className="flex items-center justify-center h-64 border border-dashed border-border rounded-lg">
                        <div className="text-center">
                            <h3 className="text-lg font-medium text-muted-foreground mb-2">
                                {t('clientsDetail.summaryTodo', 'Summary Tab')}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {t('clientsDetail.summaryTodoDescription', 'This tab is under construction')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle>{t("employees.timeRecords.deleteTimeRecord", "Delete Time Record")}</DialogTitle>
                        <DialogDescription>
                            {t("employees.timeRecords.deleteTimeRecordConfirmation", "Are you sure you want to delete this time record? This action cannot be undone.")}
                            {timeRecordToDelete && (
                                <div className="mt-2 p-2 bg-muted rounded">
                                    <div className="text-sm">
                                        <strong>{t("employees.timeRecords.startTime", "Start")}:</strong> {formatDate(timeRecordToDelete.start_time, { showTime: true })}
                                    </div>
                                    <div className="text-sm">
                                        <strong>{t("employees.timeRecords.endTime", "End")}:</strong> {formatDate(timeRecordToDelete.end_time, { showTime: true })}
                                    </div>
                                    <div className="text-sm">
                                        <strong>{t("employees.timeRecords.duration", "Duration")}:</strong> {calculateDuration(timeRecordToDelete.start_time, timeRecordToDelete.end_time)}h
                                    </div>
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteModalOpen(false)}
                            disabled={deletingTimeRecord}
                        >
                            {t("common.cancel", "Cancel")}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteTimeRecord}
                            disabled={deletingTimeRecord}
                        >
                            {deletingTimeRecord ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    {t("common.deleting", "Deleting...")}
                                </>
                            ) : (
                                t("common.delete", "Delete")
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default DashboardEmployeePageHome;