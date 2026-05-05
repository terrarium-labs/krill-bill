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
import { DateTimePicker } from "@/app/components/forms-elements/date-time-picker";
import IdBadge from "@/app/components/id-badge";
import { promptUnsavedChanges } from "@/app/components/forms-elements/modal-unsaved";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";

// Form validation schema
const timeRecordSchema = z.object({
    start_time: z.date().refine((val) => val !== null && val !== undefined, {
        message: "Start time is required",
    }),
    end_time: z.date().refine((val) => val !== null && val !== undefined, {
        message: "End time is required",
    }),
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof timeRecordSchema>;

// Type for API response
interface ApiResponse {
    success?: unknown;
    error?: string | { message?: string };
}

export interface TimeRecordEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onTimeRecordCreatedOrUpdated?: () => void;
    timeRecord?: TimeRecord | null;
    mode: "create" | "edit";
    /** Custom function to create a time record. Required for create mode */
    onCreateTimeRecord?: (data: {
        start_time: string;
        end_time: string;
        notes: string | null;
    }) => Promise<ApiResponse>;
    /** Custom function to update a time record. Required for edit mode */
    onUpdateTimeRecord?: (
        timeRecordId: string,
        data: {
            start_time: string;
            end_time: string;
            notes: string | null;
        }
    ) => Promise<ApiResponse>;
    /** Whether to show the employee info in the header (for admin editing) */
    showEmployeeInfo?: boolean;
    /** Render custom action buttons in the header (right side, next to ID badge). Receives the time record and a close function. */
    renderActions?: (timeRecord: TimeRecord, closeModal: () => void) => React.ReactNode;
}

const TimeRecordEditModal: React.FC<TimeRecordEditModalProps> = ({
    open,
    onOpenChange,
    onTimeRecordCreatedOrUpdated,
    timeRecord,
    mode,
    onCreateTimeRecord,
    onUpdateTimeRecord,
    showEmployeeInfo = true,
    renderActions,
}) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    const isEditMode = mode === "edit";

    const form = useForm<FormValues>({
        resolver: zodResolver(timeRecordSchema),
        defaultValues: {
            start_time: new Date(),
            end_time: new Date(),
            notes: "",
        },
    });

    const watchedStartTime = form.watch("start_time");
    const watchedEndTime = form.watch("end_time");

    // Reset form when modal opens
    useEffect(() => {
        if (open) {
            if (isEditMode && timeRecord) {
                form.reset({
                    start_time: new Date(timeRecord.start_time),
                    end_time: new Date(timeRecord.end_time),
                    notes: timeRecord.notes || "",
                });
            } else {
                // For create mode, reset to current time
                const now = new Date();
                form.reset({
                    start_time: now,
                    end_time: now,
                    notes: "",
                });
            }
        }
    }, [open, form, isEditMode, timeRecord]);

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

        setIsLoading(true);
        try {
            const requestData = {
                start_time: values.start_time.toISOString(),
                end_time: values.end_time.toISOString(),
                notes: values.notes || null,
            };

            let response: ApiResponse;

            if (isEditMode && timeRecord) {
                if (onUpdateTimeRecord) {
                    response = await onUpdateTimeRecord(timeRecord.id, requestData);
                } else {
                    toast.error(
                        t(
                            "employees.timeRecords.noUpdateHandler",
                            "No update handler provided"
                        )
                    );
                    return;
                }
            } else {
                if (onCreateTimeRecord) {
                    response = await onCreateTimeRecord(requestData);
                } else {
                    toast.error(
                        t(
                            "employees.timeRecords.noCreateHandler",
                            "No create handler provided"
                        )
                    );
                    return;
                }
            }

            if (response.success) {
                const successMessage = isEditMode
                    ? t(
                        "employees.timeRecords.updateSuccess",
                        "Time record updated successfully"
                    )
                    : t(
                        "employees.timeRecords.createSuccess",
                        "Time record created successfully"
                    );

                toast.success(successMessage);
                form.reset();
                onOpenChange(false);
                onTimeRecordCreatedOrUpdated?.();
            } else {
                const errorMsg =
                    typeof response.error === "string"
                        ? response.error
                        : response.error?.message;
                const errorMessage = isEditMode
                    ? errorMsg ||
                    t(
                        "employees.timeRecords.updateError",
                        "Failed to update time record"
                    )
                    : errorMsg ||
                    t(
                        "employees.timeRecords.createError",
                        "Failed to create time record"
                    );

                toast.error(errorMessage);
            }
        } catch (error) {
            console.error(
                `Error ${isEditMode ? "updating" : "creating"} time record:`,
                error
            );
            const errorMessage = isEditMode
                ? t(
                    "employees.timeRecords.updateError",
                    "Failed to update time record"
                )
                : t(
                    "employees.timeRecords.createError",
                    "Failed to create time record"
                );
            toast.error(errorMessage);
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

    const dialogTitle = isEditMode
        ? t("employees.timeRecords.editTimeRecord", "Edit Time Record")
        : t("employees.timeRecords.addTimeRecord", "Add Time Record");

    // Get employee display info
    const employee = timeRecord?.employee as Employee | undefined;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange} key="time-record-dialog">
            <DialogContent
                className="max-w-2xl md:min-w-2xl"
                showCloseButton={false}
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between gap-2 text-lg font-semibold mb-4">
                        <span>{dialogTitle}</span>
                        {isEditMode && timeRecord && (
                            <div className="flex items-center gap-2">
                                {/* Show employee info when editing */}
                                {showEmployeeInfo && employee && (
                                    <EmployeeAvatar employee={employee} />
                                )}
                                <IdBadge id={timeRecord.id} />
                                {renderActions?.(timeRecord, () => handleOpenChange(false))}
                            </div>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-6 overflow-y-auto max-h-[70vh] px-2 scrollbar-hide mb-6">
                            {/* Date and Time Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
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
                                    <FormItem>
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
                                                rows={4}
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
                                            {isEditMode
                                                ? t("common.updating", "Updating...")
                                                : t("common.creating", "Creating...")}
                                        </>
                                    ) : isEditMode ? (
                                        t("common.update", "Update")
                                    ) : (
                                        t("common.create", "Create")
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

export { TimeRecordEditModal };
export default TimeRecordEditModal;

