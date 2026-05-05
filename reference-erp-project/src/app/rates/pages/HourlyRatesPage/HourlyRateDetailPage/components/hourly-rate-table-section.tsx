import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase } from "lucide-react";
import SearchBar from "@/app/components/search-bar";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { useHourlyRate } from "@/app/rates/contexts/HourlyRateContext";
import HourlyRateJobTitleAddmodal from "./hourly-rate-job-title-add-modal";
import HourlyRateJobTitleScheduleCard from "./hourly-rate-job-title-schedule-card";
import HourlyRateTimeframeEditModal from "./hourly-rate-timeframe-edit-modal";
import HourlyRateTimeframeDeleteModal from "./hourly-rate-timeframe-delete-modal";
import HourlyRateJobTitleDeleteModal from "./hourly-rate-job-title-delete-modal";
import { TimeFrame, HourlyRateJobTitle } from "@/types/general/hourly-rates";
import { patchOrgHourlyRateJobTitle, deleteOrgHourlyRateJobTitle } from "@/api/orgs/hourly-rates/hourly-rates";

const HourlyRateTableSection = ({ onAutosave }: { onAutosave: () => void }) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const { hourlyRate, refreshHourlyRate } = useHourlyRate();
    const [searchQuery, setSearchQuery] = useState("");
    const [addJobTitleModalOpen, setAddJobTitleModalOpen] = useState(false);
    const [editJobTitleModalOpen, setEditJobTitleModalOpen] = useState(false);
    const [timeframeModalOpen, setTimeframeModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteJobTitleDialogOpen, setDeleteJobTitleDialogOpen] = useState(false);
    const [selectedRateJobTitle, setSelectedRateJobTitle] = useState<HourlyRateJobTitle | null>(null);
    const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame | null>(null);
    const [initialIsHoliday, setInitialIsHoliday] = useState<boolean>(false);
    const [timeframeToDelete, setTimeframeToDelete] = useState<{
        rateJobTitle: HourlyRateJobTitle;
        timeframe: TimeFrame;
    } | null>(null);
    const [jobTitleToDelete, setJobTitleToDelete] = useState<HourlyRateJobTitle | null>(null);
    const [jobTitleToEdit, setJobTitleToEdit] = useState<HourlyRateJobTitle | null>(null);

    const handleJobTitleAdded = () => {
        refreshHourlyRate();
        onAutosave();
    };

    const handleTimeframeChanged = () => {
        refreshHourlyRate();
        onAutosave();
    };

    // Filter job titles based on search query
    const filteredJobTitles = hourlyRate?.rate_job_titles?.filter((rjt) =>
        rjt.job_title.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const handleAddTimeframe = (rateJobTitle: HourlyRateJobTitle, isHoliday: boolean) => {
        setSelectedRateJobTitle(rateJobTitle);
        setSelectedTimeframe(null); // Clear for create mode
        setInitialIsHoliday(isHoliday);
        setTimeframeModalOpen(true);
    };

    const handleEditTimeframe = (rateJobTitle: HourlyRateJobTitle, timeframe: TimeFrame) => {
        setSelectedRateJobTitle(rateJobTitle);
        setSelectedTimeframe(timeframe);
        setTimeframeModalOpen(true);
    };

    const handleDeleteTimeframe = (rateJobTitle: HourlyRateJobTitle, timeframe: TimeFrame) => {
        setTimeframeToDelete({ rateJobTitle, timeframe });
        setDeleteDialogOpen(true);
    };

    const confirmDeleteTimeframe = async () => {
        if (!orgId || !hourlyRate?.id || !timeframeToDelete) return;

        const { rateJobTitle, timeframe } = timeframeToDelete;

        try {
            const updatedTimeframes = rateJobTitle.time_frames.filter(
                tf =>
                    !(tf.day_of_week === timeframe.day_of_week &&
                        tf.start_time === timeframe.start_time &&
                        tf.end_time === timeframe.end_time &&
                        tf.price === timeframe.price)
            );

            const response = await patchOrgHourlyRateJobTitle(
                orgId,
                hourlyRate.id,
                rateJobTitle.job_title.id,
                {
                    ...rateJobTitle,
                    time_frames: updatedTimeframes,
                }
            );

            if (response.success) {
                toast.success(t("hourlyRates.timeframe.deleted", "Timeframe deleted successfully"));
                handleTimeframeChanged();
                setDeleteDialogOpen(false);
                setTimeframeToDelete(null);
            } else {
                toast.error(t("hourlyRates.timeframe.deleteError", "Error deleting timeframe"));
            }
        } catch (error) {
            console.error("Error deleting timeframe:", error);
            toast.error(t("hourlyRates.timeframe.deleteError", "Error deleting timeframe"));
        }
    };

    const handleEditJobTitle = (rateJobTitle: HourlyRateJobTitle) => {
        setJobTitleToEdit(rateJobTitle);
        setEditJobTitleModalOpen(true);
    };

    const handleDeleteJobTitle = (rateJobTitle: HourlyRateJobTitle) => {
        setJobTitleToDelete(rateJobTitle);
        setDeleteJobTitleDialogOpen(true);
    };

    const confirmDeleteJobTitle = async () => {
        if (!orgId || !hourlyRate?.id || !jobTitleToDelete || !jobTitleToDelete.job_title.id) return;

        try {
            const response = await deleteOrgHourlyRateJobTitle(
                orgId,
                hourlyRate.id,
                jobTitleToDelete.job_title.id,
            );

            if (response.success) {
                toast.success(t("hourlyRates.jobTitle.deleted", "Job title removed from hourly rate successfully"));
                handleJobTitleAdded(); // Refresh the list
                setDeleteJobTitleDialogOpen(false);
                setJobTitleToDelete(null);
            } else {
                toast.error(t("hourlyRates.jobTitle.deleteError", "Error removing job title from hourly rate"));
            }
        } catch (error) {
            console.error("Error deleting job title:", error);
            toast.error(t("hourlyRates.jobTitle.deleteError", "Error removing job title from hourly rate"));
        }
    };

    return (
        <div className="space-y-6">

            <div className="flex gap-2">
                <SearchBar
                    isLoading={false}
                    onChange={setSearchQuery}
                    onSearch={() => { }}
                    placeholder={t(
                        "hourlyRates.table.searchPlaceholder",
                        "Search rates in this hourly rate..."
                    )}
                    className="w-full"
                />
                <Button onClick={() => setAddJobTitleModalOpen(true)}>
                    <Plus className="h-4 w-4" />
                    {t("hourlyRates.table.addRate", "Add rate")}
                </Button>
            </div>

            {/* Job Title Schedule Cards */}
            <div className="space-y-4">
                {filteredJobTitles.length > 0 ? (
                    filteredJobTitles.map((rateJobTitle) => (
                        <HourlyRateJobTitleScheduleCard
                            key={rateJobTitle.id}
                            rateJobTitle={rateJobTitle}
                            onAddTimeframe={(isHoliday) => handleAddTimeframe(rateJobTitle, isHoliday)}
                            onEditTimeframe={(timeframe) => handleEditTimeframe(rateJobTitle, timeframe)}
                            onDeleteTimeframe={(timeframe) => handleDeleteTimeframe(rateJobTitle, timeframe)}
                            onEditJobTitle={() => handleEditJobTitle(rateJobTitle)}
                            onDeleteJobTitle={() => handleDeleteJobTitle(rateJobTitle)}
                        />
                    ))
                ) : (
                    <div className="h-96 flex items-center justify-center">
                        <div className="flex items-center justify-center space-y-4 flex-col">
                            <Briefcase className="h-10 w-10 text-muted-foreground" />
                            <div className="flex flex-col items-center justify-center">
                                <h3 className="text-lg font-medium">
                                    {searchQuery
                                        ? t("hourlyRates.noJobTitlesFound", "No job titles found")
                                        : t("hourlyRates.noJobTitlesTitle", "No job titles yet")}
                                </h3>
                                <p className="text-muted-foreground">
                                    {searchQuery
                                        ? t("hourlyRates.noJobTitlesSearchDescription", "No job titles match your search for '{{searchQuery}}'", { searchQuery })
                                        : t("hourlyRates.noJobTitlesDescription", "Start by adding your first job title rate")}
                                </p>
                            </div>
                            {!searchQuery && (
                                <Button variant="outline" onClick={() => setAddJobTitleModalOpen(true)}>
                                    <Plus className="h-4 w-4" />
                                    {t("hourlyRates.table.addRate", "Add rate")}
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Add Job Title Modal */}
            {orgId && hourlyRate?.id && (
                <HourlyRateJobTitleAddmodal
                    open={addJobTitleModalOpen}
                    onOpenChange={setAddJobTitleModalOpen}
                    onJobTitleAdded={handleJobTitleAdded}
                    orgId={orgId}
                    hourlyRateId={hourlyRate.id}
                />
            )}

            {/* Timeframe Modal */}
            {orgId && hourlyRate?.id && selectedRateJobTitle && (
                <HourlyRateTimeframeEditModal
                    open={timeframeModalOpen}
                    onOpenChange={setTimeframeModalOpen}
                    onTimeframeChanged={handleTimeframeChanged}
                    orgId={orgId}
                    hourlyRateId={hourlyRate.id}
                    rateJobTitle={selectedRateJobTitle}
                    timeframe={selectedTimeframe || undefined}
                    initialIsHoliday={initialIsHoliday}
                />
            )}

            {/* Delete Timeframe Confirmation Dialog */}
            <HourlyRateTimeframeDeleteModal
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={confirmDeleteTimeframe}
                timeframe={timeframeToDelete?.timeframe || null}
            />

            {/* Edit Job Title Modal */}
            {orgId && hourlyRate?.id && (
                <HourlyRateJobTitleAddmodal
                    open={editJobTitleModalOpen}
                    onOpenChange={setEditJobTitleModalOpen}
                    onJobTitleAdded={handleJobTitleAdded}
                    orgId={orgId}
                    hourlyRateId={hourlyRate.id}
                    rateJobTitle={jobTitleToEdit || undefined}
                />
            )}

            {/* Delete Job Title Confirmation Dialog */}
            <HourlyRateJobTitleDeleteModal
                open={deleteJobTitleDialogOpen}
                onOpenChange={setDeleteJobTitleDialogOpen}
                onConfirm={confirmDeleteJobTitle}
                rateJobTitle={jobTitleToDelete}
            />

        </div>
    );
};
export default HourlyRateTableSection;