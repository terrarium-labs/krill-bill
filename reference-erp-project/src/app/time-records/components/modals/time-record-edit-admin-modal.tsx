import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { TimeRecord } from "@/types/employees/time-records";
import { Employee } from "@/types/employees/employees";
import TimeRecordTimeRangeCard from "../time-record-time-range-card";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { DateTimePicker } from "@/app/components/forms-elements/date-time-picker";
import { MultiSelect } from "@/app/components/forms-elements/multi-select";
import IdBadge from "@/app/components/id-badge";
import { promptUnsavedChanges } from "@/app/components/forms-elements/modal-unsaved";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";

// Form validation schema for admin/manager mode
const adminTimeRecordSchema = z.object({
    start_time: z.date().refine((val) => val !== null && val !== undefined, {
        message: "Start time is required",
    }),
    end_time: z.date().refine((val) => val !== null && val !== undefined, {
        message: "End time is required",
    }),
    notes: z.string().optional(),
    verification_status: z.enum(["approved", "rejected"]),
    verification_notes: z.string().optional(),
});

type FormValues = z.infer<typeof adminTimeRecordSchema>;

// Type for API response
interface ApiResponse {
    success?: unknown;
    error?: string | { message?: string };
}

export interface TimeRecordEditAdminModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onTimeRecordUpdated?: () => void;
    /** The time record to edit (required for admin mode) */
    timeRecord: TimeRecord;
    /** Custom function to update a time record */
    onUpdateTimeRecord?: (
        timeRecordId: string,
        data: {
            start_time: string;
            end_time: string;
            notes: string | null;
            verification_status: "approved" | "rejected";
            verification_notes: string | null;
        }
    ) => Promise<ApiResponse>;
    /** Render custom action buttons in the header (right side, next to ID badge). Receives the time record and a close function. */
    renderActions?: (timeRecord: TimeRecord, closeModal: () => void) => React.ReactNode;
}

/**
 * Modal for managers/admins to edit employee time records.
 * Used when viewing/editing time records for employees (not "me").
 *
 * Manager/Admin can edit:
 * - start_time / end_time
 * - notes
 * - verification_status (approved/rejected)
 * - verification_notes (for the decision)
 */
const TimeRecordEditAdminModal: React.FC<TimeRecordEditAdminModalProps> = ({
    open,
    onOpenChange,
    onTimeRecordUpdated,
    timeRecord,
    onUpdateTimeRecord,
    renderActions,
}) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    // Status options for the dropdown
    const statusOptions = [
        { value: "approved", label: t("employees.timeRecords.status.approved", "Approved") },
        { value: "rejected", label: t("employees.timeRecords.status.rejected", "Rejected") },
    ];

    const form = useForm<FormValues>({
        resolver: zodResolver(adminTimeRecordSchema),
        defaultValues: {
            start_time: new Date(),
            end_time: new Date(),
            notes: "",
            verification_status: "approved",
            verification_notes: "",
        },
    });

    const watchedStartTime = form.watch("start_time");
    const watchedEndTime = form.watch("end_time");

    // Reset form when modal opens with time record data
    useEffect(() => {
        if (open && timeRecord) {
            // Default to "approved" when the current status is pending
            const currentStatus = timeRecord.verification_status;
            const defaultStatus: "approved" | "rejected" =
                currentStatus === "approved" || currentStatus === "rejected"
                    ? currentStatus
                    : "approved";

            form.reset({
                start_time: new Date(timeRecord.start_time),
                end_time: new Date(timeRecord.end_time),
                notes: timeRecord.notes || "",
                verification_status: defaultStatus,
                verification_notes: timeRecord.verification_notes || "",
            });
        }
    }, [open, form, timeRecord]);

    const onSubmit = async (values: FormValues) => {
        // Validate time range
        const startMs = values.start_time.getTime();
        const endMs = values.end_time.getTime();

        if (endMs <= startMs) {
            toast.error(
                t(
                    "employees.timeRecords.invalidTimeRange",
                    "End time must be after start time"
                )
            );
            return;
        }

        const maxDurationMs = 24 * 60 * 60 * 1000; // 24 hours
        if (endMs - startMs > maxDurationMs) {
            toast.error(
                t(
                    "employees.timeRecords.timeRangeTooLong",
                    "Time range cannot exceed 24 hours"
                )
            );
            return;
        }

        if (!onUpdateTimeRecord) {
            toast.error(
                t(
                    "employees.timeRecords.noUpdateHandler",
                    "No update handler provided"
                )
            );
            return;
        }

        setIsLoading(true);
        try {
            const requestData = {
                start_time: values.start_time.toISOString(),
                end_time: values.end_time.toISOString(),
                notes: values.notes || null,
                verification_status: values.verification_status,
                verification_notes: values.verification_notes || null,
            };

            const response = await onUpdateTimeRecord(timeRecord.id, requestData);

            if (response.success) {
                toast.success(
                    t(
                        "employees.timeRecords.updateSuccess",
                        "Time record updated successfully"
                    )
                );
                form.reset();
                onOpenChange(false);
                onTimeRecordUpdated?.();
            } else {
                const errorMsg =
                    typeof response.error === "string"
                        ? response.error
                        : response.error?.message;
                toast.error(
                    errorMsg ||
                    t(
                        "employees.timeRecords.updateError",
                        "Failed to update time record"
                    )
                );
            }
        } catch (error) {
            console.error("Error updating time record:", error);
            toast.error(
                t(
                    "employees.timeRecords.updateError",
                    "Failed to update time record"
                )
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenChange = async (open: boolean) => {
        if (!open) {
            if (form.formState.isDirty) {
                const discard = await promptUnsavedChanges();
                if (discard) {
                    form.reset();
                    onOpenChange(false);
                }
            } else {
                form.reset();
                onOpenChange(false);
            }
        } else {
            onOpenChange(open);
        }
    };

    const handleInteractOutside = (e: Event) => {
        if (form.formState.isDirty) {
            e.preventDefault();
            handleOpenChange(false);
        }
    };

    // Get employee display info
    const employee = timeRecord?.employee as Employee | undefined;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange} key="time-record-admin-dialog">
            <DialogContent
                className="max-w-2xl md:min-w-2xl"
                showCloseButton={false}
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between gap-2 text-lg font-semibold mb-4">
                        <span>
                            {t("employees.timeRecords.editTimeRecord", "Edit Time Record")}
                        </span>
                        {timeRecord && (
                            <div className="flex items-center gap-2">
                                <IdBadge id={timeRecord.id} />
                                {renderActions?.(timeRecord, () => handleOpenChange(false))}
                            </div>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        <div className="space-y-6 overflow-y-auto max-h-[70vh] px-2 scrollbar-hide mb-6">

                            {/* Employee and Status - side by side */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                {/* Employee - displayed as disabled MultiSelect */}
                                <FormItem>
                                    <FormLabel>{t("employees.timeRecords.employee", "Employee")}</FormLabel>
                                    <MultiSelect
                                        options={
                                            employee
                                                ? [
                                                    {
                                                        value: employee.id,
                                                        label: <EmployeeAvatar employee={employee} />,
                                                    },
                                                ]
                                                : []
                                        }
                                        selected={employee ? [employee.id] : []}
                                        onSelectedChange={() => { }}
                                        placeholder={t("employees.timeRecords.selectEmployee", "Select employee")}
                                        disabled={true}
                                        searchable={false}
                                        className="w-full"
                                    />
                                </FormItem>

                                {/* Verification Status */}
                                <FormField
                                    control={form.control}
                                    name="verification_status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {t("employees.timeRecords.verificationStatus", "Status")} *
                                            </FormLabel>
                                            <FormControl>
                                                <MultiSelect
                                                    options={statusOptions}
                                                    selected={field.value ? [field.value] : []}
                                                    onSelectedChange={(values: string[]) => {
                                                        field.onChange(values[0] || "approved");
                                                    }}
                                                    placeholder={t(
                                                        "employees.timeRecords.selectStatus",
                                                        "Select status"
                                                    )}
                                                    searchable={false}
                                                    disabled={isLoading}
                                                    className="w-full"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Verification Notes - full width */}
                                <FormField
                                    control={form.control}
                                    name="verification_notes"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>
                                                {t("employees.timeRecords.verificationNotes", "Verification Notes")}
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder={t(
                                                        "employees.timeRecords.verificationNotesPlaceholder",
                                                        "Enter notes about the verification decision..."
                                                    )}
                                                    className="resize-none"
                                                    rows={3}
                                                    {...field}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Separator />

                            {/* Date and Time Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DateTimePicker
                                    form={form}
                                    name="start_time"
                                    showMonthYearPicker={true}
                                    label={t("employees.timeRecords.startTime", "Start Time")}
                                    required
                                    showTime={true}
                                    format24h={true}
                                    disabled={isLoading}
                                />

                                <DateTimePicker
                                    form={form}
                                    name="end_time"
                                    showMonthYearPicker={true}
                                    label={t("employees.timeRecords.endTime", "End Time")}
                                    required
                                    showTime={true}
                                    format24h={true}
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Duration Display */}
                            <TimeRecordTimeRangeCard
                                startTime={watchedStartTime}
                                endTime={watchedEndTime}
                            />

                            {/* Notes */}
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem className="pb-10">
                                        <FormLabel>
                                            {t("employees.timeRecords.notes", "Notes")}
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder={t(
                                                    "employees.timeRecords.notesPlaceholder",
                                                    "Enter any notes about this time record..."
                                                )}
                                                className="resize-none"
                                                rows={3}
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter className="flex-col rounded-b-lg sm:flex-row gap-2 fixed bottom-0 left-0 right-0 bg-background p-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleOpenChange(false)}
                                    disabled={isLoading}
                                >
                                    {t("common.cancel", "Cancel")}
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            {t("common.updating", "Updating...")}
                                        </>
                                    ) : (
                                        t("common.update", "Update")
                                    )}
                                </Button>
                            </DialogFooter>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export { TimeRecordEditAdminModal };
export default TimeRecordEditAdminModal;
