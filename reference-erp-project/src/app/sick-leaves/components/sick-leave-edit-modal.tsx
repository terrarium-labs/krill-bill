import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "@/hooks/useTranslation";
import { SickLeave } from "@/types/employees/sick-leaves";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { formatDateForAPI } from "@/utils/miscelanea";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/app/components/forms-elements/date-time-picker";
import { MultiSelectApi } from "@/app/components/forms-elements/multi-select-api";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";
import IdBadge from "@/app/components/id-badge";
import { getOrgEmployees } from "@/api/employees/employees";
import {
  postSickLeave,
  patchSickLeave,
} from "@/api/orgs/sick-leaves/sick-leaves";
import { Employee } from "@/types/employees/employees";
import { promptUnsavedChanges } from "@/app/components/forms-elements/modal-unsaved";
import FilesSection from "@/app/components/files/files-section";

const sickLeaveSchema = z
  .object({
    employee_id: z.string().min(1, "Employee is required"),
    name: z.string().min(1, "Title is required"),
    start_date: z.date({ error: "Start date is required" }),
    end_date: z.date({ error: "End date is required" }),
    description: z.string().optional(),
  })
  .refine(
    (data) =>
      data.start_date && data.end_date && data.end_date >= data.start_date,
    {
      path: ["end_date"],
      message: "End date must be after start date",
    }
  );

type FormValues = z.infer<typeof sickLeaveSchema>;

// Type for API response
interface ApiResponse {
  success?: any;
  error?: string;
}

export interface SickLeaveEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSickLeaveCreatedOrUpdated?: () => void;
  orgId: string;
  /** Sick leave to edit (null for create mode) */
  sickLeave?: SickLeave | null;
  /** Whether we're editing or creating */
  mode: "create" | "edit";
  /** Pre-set employee ID (hides employee selector and auto-fills employee_id) */
  employeeId?: string;
  /** Custom function to create a sick leave */
  onCreateSickLeave?: (data: {
    employee_id: string;
    name: string;
    start_date: string;
    end_date: string;
    description: string | null;
  }) => Promise<ApiResponse>;
  /** Custom function to update a sick leave */
  onUpdateSickLeave?: (
    sickLeaveId: string,
    data: {
      employee_id: string;
      name: string;
      start_date: string;
      end_date: string;
      description: string | null;
    }
  ) => Promise<ApiResponse>;
  /** Whether to show the files section */
  showFiles?: boolean;
  /** Render custom action buttons in the header (right side, next to ID badge). Receives the sick leave and a close function. */
  renderActions?: (
    sickLeave: SickLeave,
    closeModal: () => void
  ) => React.ReactNode;
}

/**
 * Modal for creating or editing sick leaves.
 * Used for admin/manager access to manage employee sick leaves.
 * 
 * Can edit:
 * - employee_id (only in create mode)
 * - name (title)
 * - start_date / end_date
 * - description
 * 
 * Employee can be selected in create mode but is read-only in edit mode.
 */

const SickLeaveEditModal: React.FC<SickLeaveEditModalProps> = ({
  open,
  onOpenChange,
  onSickLeaveCreatedOrUpdated,
  orgId,
  sickLeave,
  mode,
  employeeId,
  onCreateSickLeave,
  onUpdateSickLeave,
  showFiles = true,
  renderActions,
}) => {
  const { t } = useTranslation();
  const isEditMode = mode === "edit";
  const hasPresetEmployee = !!employeeId;
  const [isLoading, setIsLoading] = useState(false);
  const [modalSickLeaveId, setModalSickLeaveId] = useState<string | undefined>(
    sickLeave?.id
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(sickLeaveSchema),
    defaultValues: {
      employee_id: "",
      name: "",
      start_date: new Date(),
      end_date: new Date(),
      description: "",
    },
  });

  useEffect(() => {
    if (open) {
      setModalSickLeaveId(sickLeave?.id || undefined);
    }
  }, [open, sickLeave?.id]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      if (isEditMode && sickLeave) {
        form.reset({
          employee_id: (sickLeave as any)?.employee?.id || "",
          name: sickLeave.name || "",
          start_date: new Date(sickLeave.start_date),
          end_date: new Date(sickLeave.end_date),
          description: sickLeave.description || "",
        });
      } else {
        // For create mode, reset everything
        const today = new Date();
        form.reset({
          employee_id: employeeId || "", // Use preset employeeId if provided
          name: "",
          start_date: today,
          end_date: today,
          description: "",
        });
      }
    }
  }, [open, form, isEditMode, sickLeave, employeeId]);

  const handleOpenChange = async (open: boolean) => {
    if (!open) {
      if (form.formState.isDirty) {
        const discard = await promptUnsavedChanges();
        if (discard) {
          form.reset();
          setModalSickLeaveId(undefined);
          onOpenChange(false);
        }
      } else {
        form.reset();
        setModalSickLeaveId(undefined);
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

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const payload = {
        employee_id: values.employee_id,
        name: values.name.trim(),
        start_date: formatDateForAPI(values.start_date, "ms"),
        end_date: formatDateForAPI(values.end_date, "ms"),
        description: values.description?.trim() || null,
      };

      let response: ApiResponse;

      if (isEditMode && sickLeave) {
        if (onUpdateSickLeave) {
          response = await onUpdateSickLeave(sickLeave.id, payload);
        } else {
          response = await patchSickLeave(orgId, sickLeave.id, payload);
        }
      } else {
        if (onCreateSickLeave) {
          response = await onCreateSickLeave(payload);
        } else {
          response = await postSickLeave(orgId, payload);
        }
      }

      if (response.success) {
        const successMessage = isEditMode
          ? t("sickLeaves.updateSuccess", "Sick leave updated successfully")
          : t("sickLeaves.createSuccess", "Sick leave created successfully");

        // Capture sick_leave_id from response for newly created sick leaves
        if (!isEditMode && response.success.sick_leave_id) {
          setModalSickLeaveId(response.success.sick_leave_id);
        }
        toast.success(successMessage);
        form.reset();
        // Reload list before closing (same as delete flow)
        onSickLeaveCreatedOrUpdated?.();
        onOpenChange(false);
      } else {
        const errorMessage = isEditMode
          ? (response as any)?.error?.message ||
          (response as any)?.error ||
          t("sickLeaves.updateError", "Failed to update sick leave")
          : (response as any)?.error?.message ||
          (response as any)?.error ||
          t("sickLeaves.createError", "Failed to create sick leave");
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} sick leave:`,
        error
      );
      const errorMessage = isEditMode
        ? t("sickLeaves.updateError", "Failed to update sick leave")
        : t("sickLeaves.createError", "Failed to create sick leave");
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const dialogTitle = isEditMode
    ? t("sickLeaves.editTitle", "Edit Sick Leave")
    : t("sickLeaves.createTitle", "Create Sick Leave");

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      key="sick-leave-modal"
    >
      <DialogContent
        className="max-w-2xl md:min-w-2xl"
        showCloseButton={false}
        onPointerDownOutside={handleInteractOutside}
        onEscapeKeyDown={handleInteractOutside}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 text-lg font-semibold mb-4">
            <span>{dialogTitle}</span>
            {isEditMode && modalSickLeaveId && sickLeave && (
              <div className="flex items-center gap-2">
                <IdBadge id={modalSickLeaveId} />
                {renderActions?.(sickLeave, () => handleOpenChange(false))}
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-6 overflow-y-auto max-h-[60vh] px-2 scrollbar-hide mb-16">
            {/* Employee and Title - Side by Side */}
            <div className={`grid grid-cols-1 ${hasPresetEmployee ? '' : 'md:grid-cols-2'} gap-4`}>
              {/* Employee Field - Only show if no preset employee */}
              {!hasPresetEmployee && (
                <FormField
                  control={form.control}
                  name="employee_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("absences.employee", "Employee")} *
                      </FormLabel>
                      <FormControl>
                        <MultiSelectApi
                          fetchOptions={getOrgEmployees}
                          fetchArgs={[orgId, undefined, undefined, undefined, undefined, undefined, undefined]}
                          optionsKey="employees"
                          enableParams="hidden"
                          defaultParams="employees"
                          customValueKey={(item: Employee) => item.id}
                          customLabelKey={(item: Employee) => (
                            <EmployeeAvatar employee={item} />
                          )}
                          placeholder={t(
                            "employees.selectEmployee",
                            "Select employee"
                          )}
                          searchPlaceholder={t(
                            "employees.searchEmployee",
                            "Search employees..."
                          )}
                          emptyText={t(
                            "employees.noEmployees",
                            "No employees found."
                          )}
                          value={field.value ? [field.value] : []}
                          onChangeValue={(values) =>
                            field.onChange(values[0] || "")
                          }
                          defaultItems={sickLeave?.employee ? [sickLeave.employee] : undefined}
                          maxCount={1}
                          disabled={isLoading || isEditMode}
                          className="w-full truncate"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Title Field */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("sickLeaves.titleLabel", "Title")} *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          "sickLeaves.titlePlaceholder",
                          "Enter a title"
                        )}
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DateTimePicker
                form={form}
                name="start_date"
                showMonthYearPicker={true}
                label={t("sickLeaves.startDate", "From date")}
                required
                showTime
                format24h
                disabled={isLoading}
              />

              <DateTimePicker
                form={form}
                name="end_date"
                showMonthYearPicker={true}
                label={t("sickLeaves.endDate", "To date")}
                required
                showTime
                format24h
                disabled={isLoading}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("sickLeaves.description", "Description")}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder={t(
                        "sickLeaves.descriptionPlaceholder",
                        "Add a description"
                      )}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Files */}
            {showFiles && (
              <FilesSection
                entity_id={modalSickLeaveId}
                showBreadcrumbs={isEditMode}
                showSearch={isEditMode}
                showCreateFolder={false}
                showUpload={isEditMode}
              />
            )}

            <DialogFooter className="flex-col rounded-b-lg sm:flex-row gap-2 fixed bottom-0 left-0 right-0 bg-background p-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                {t("common.cancel", "Cancel")}
              </Button>
              <Button
                type="submit"
                onClick={form.handleSubmit(onSubmit)}
                disabled={isLoading}
              >
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
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export { SickLeaveEditModal };
export default SickLeaveEditModal;
