import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { CalendarSync, CalendarClock, CalendarCog } from "lucide-react";
import {
    VerticalMenu,
    VerticalMenuItem,
    VerticalMenuSeparator,
} from "@/components/ui/vertical-menu";
import { useTimePolicy } from "../../../context/TimePolicyContext.tsx";
import TimePolicyShiftsSection from "./components/time-policy-shifts-section.tsx";
import TimePolicyShiftsTipsCard from "./components/time-policy-shifts-tips-card.tsx";
import TimePolicyShiftEditModal from "./components/time-policy-shift-edit-modal.tsx";
import TimePolicyShiftDeleteModal from "./components/time-policy-shift-delete-modal.tsx";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { TimeSlot, TimeSlotRange } from "@/types/general/time-policies";
import { deleteTimeSlot } from "@/api/orgs/time-policies/time-slots/time-slots";

type CreateSlotTypePreset = "default_only" | "on_call_only" | "special_only" | "on_call_special";

const SHIFT_VIEW_VALUES = ["default", "on_call", "special"] as const;
type ShiftView = (typeof SHIFT_VIEW_VALUES)[number];

function isShiftView(v: string): v is ShiftView {
    return (SHIFT_VIEW_VALUES as readonly string[]).includes(v);
}

const TimePolicyDetailPageShifts = () => {
    const { t } = useTranslation();
    const { timePolicy, refetchTimePolicy } = useTimePolicy();
    const { orgId } = useParams<{ orgId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();

    const rawShiftView = searchParams.get("shiftView") || "default";
    const shiftView: ShiftView = isShiftView(rawShiftView) ? rawShiftView : "default";

    const handleShiftViewChange = (value: string) => {
        if (!isShiftView(value)) return;
        setSearchParams((prev) => {
            const p = new URLSearchParams(prev);
            p.set("tab", "shifts");
            p.set("shiftView", value);
            return p;
        });
    };

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | undefined>(undefined);
    const [defaultIsHoliday, setDefaultIsHoliday] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [timeSlotToDelete, setTimeSlotToDelete] = useState<TimeSlot | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [createSlotTypePreset, setCreateSlotTypePreset] = useState<CreateSlotTypePreset | null>(null);

    const filteredTimeSlotRanges: TimeSlotRange[] = useMemo(() => {
        if (!timePolicy) return [];
        return (timePolicy.time_slot_ranges ?? []).filter((r) => r.type === shiftView);
    }, [timePolicy, shiftView]);

    if (!timePolicy) return null;

    const handleAddTimeSlot = (isHoliday: boolean) => {
        setSelectedTimeSlot(undefined);
        // Special section never creates holiday shifts; section always passes false.
        setDefaultIsHoliday(shiftView === "special" ? false : isHoliday);
        if (shiftView === "default") {
            setCreateSlotTypePreset("default_only");
        } else if (shiftView === "on_call") {
            setCreateSlotTypePreset("on_call_only");
        } else {
            setCreateSlotTypePreset("special_only");
        }
        setIsModalOpen(true);
    };

    const handleEditTimeSlot = (timeSlot: TimeSlot) => {
        setSelectedTimeSlot(timeSlot);
        setDefaultIsHoliday(timeSlot.is_holiday);
        setCreateSlotTypePreset(null);
        setIsModalOpen(true);
    };

    const handleDeleteTimeSlot = (timeSlot: TimeSlot) => {
        setTimeSlotToDelete(timeSlot);
        setDeleteDialogOpen(true);
    };

    const handleDeleteFromEditModal = (timeSlot: TimeSlot) => {
        setIsModalOpen(false);
        setTimeSlotToDelete(timeSlot);
        setDeleteDialogOpen(true);
    };

    const handleEditModalClose = (open: boolean) => {
        setIsModalOpen(open);
        if (!open) {
            setDeleteDialogOpen(false);
            setCreateSlotTypePreset(null);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!timeSlotToDelete || !orgId || !timePolicy) return;

        setIsDeleting(true);
        try {
            const response = await deleteTimeSlot(orgId, timePolicy.id, timeSlotToDelete.id);
            if (response.success) {
                toast.success(t("timePolicies.timeSlots.deleteSuccess", "Time slot deleted successfully"));
                await refetchTimePolicy();
            } else {
                toast.error(
                    response.error || t("timePolicies.timeSlots.deleteError", "Failed to delete time slot")
                );
            }
        } catch (error) {
            console.error("Error deleting time slot:", error);
            toast.error(t("timePolicies.timeSlots.deleteError", "Failed to delete time slot"));
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
            setTimeSlotToDelete(null);
        }
    };

    const handleTimeShiftCreatedOrUpdated = async () => {
        await refetchTimePolicy();
        setIsModalOpen(false);
        setSelectedTimeSlot(undefined);
        setCreateSlotTypePreset(null);
    };

    const emptyMessage =
        shiftView === "default"
            ? t(
                "timePolicies.shifts.emptyDefaultRanges",
                "No default shift schedule has been configured yet. Use Add Shift to create weekly slots."
            )
            : shiftView === "on_call"
                ? t(
                    "timePolicies.shifts.emptyOnCallRanges",
                    "No on call shift ranges for this time policy. Add special shifts from the header or create ranges via the API."
                )
                : t(
                    "timePolicies.shifts.emptySpecialRanges",
                    "No special shift ranges for this time policy. Use Add Shift to define date ranges and slots for days without on-call coverage (e.g. reduced Friday hours)."
                );

    return (
        <>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-6">
                <aside className="w-full shrink-0 lg:w-auto lg:max-w-[min(100%,14rem)]">
                    <VerticalMenu value={shiftView} onValueChange={handleShiftViewChange}>
                        <VerticalMenuItem value="default">
                            <div className="flex items-center gap-2">
                                <CalendarSync className="h-4 w-4 shrink-0" />
                                {t("timePolicies.shifts.menuDefaultShifts", "Default Shifts")}
                            </div>
                        </VerticalMenuItem>
                        <VerticalMenuItem value="on_call">
                            <div className="flex items-center gap-2">
                                <CalendarClock className="h-4 w-4 shrink-0" />
                                {t("timePolicies.shifts.menuOnCallShifts", "On Call Shifts")}
                            </div>
                        </VerticalMenuItem>
                        <VerticalMenuItem value="special">
                            <div className="flex items-center gap-2">
                                <CalendarCog className="h-4 w-4 shrink-0" />
                                {t("timePolicies.shifts.menuSpecialShifts", "Special Shifts")}
                            </div>
                        </VerticalMenuItem>
                        <VerticalMenuSeparator className="my-2" />
                        <div className="min-w-0 pt-1" role="presentation">
                            <TimePolicyShiftsTipsCard variant={shiftView} />
                        </div>
                    </VerticalMenu>
                </aside>

                <div className="min-w-0 flex-1 space-y-8">
                    <TimePolicyShiftsSection
                        shiftView={shiftView}
                        timeSlotRanges={filteredTimeSlotRanges}
                        emptyMessage={emptyMessage}
                        onAddTimeSlot={handleAddTimeSlot}
                        onEditTimeSlot={handleEditTimeSlot}
                        onDeleteTimeSlot={handleDeleteTimeSlot}
                    />
                </div>
            </div>

            {/* Time Slot Modal */}
            {orgId && timePolicy && (
                <TimePolicyShiftEditModal
                    open={isModalOpen}
                    onOpenChange={handleEditModalClose}
                    onTimeShiftCreatedOrUpdated={handleTimeShiftCreatedOrUpdated}
                    orgId={orgId}
                    timePolicyId={timePolicy.id}
                    mode={selectedTimeSlot ? 'edit' : 'create'}
                    timeSlot={selectedTimeSlot}
                    defaultIsHoliday={defaultIsHoliday}
                    createSlotTypePreset={createSlotTypePreset}
                    renderActions={
                        selectedTimeSlot ? (
                            <CustomActionsDropdown
                                items={[
                                    {
                                        label: t("common.delete", "Delete"),
                                        icon: "trash-2",
                                        onClick: () => handleDeleteFromEditModal(selectedTimeSlot),
                                        variant: "destructive",
                                    },
                                ]}
                            />
                        ) : undefined
                    }
                />
            )}

            {/* Delete Confirmation Dialog */}
            <TimePolicyShiftDeleteModal
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                timeSlot={timeSlotToDelete}
                onConfirm={handleDeleteConfirm}
                isDeleting={isDeleting}
            />
        </>
    );
};

export default TimePolicyDetailPageShifts;

