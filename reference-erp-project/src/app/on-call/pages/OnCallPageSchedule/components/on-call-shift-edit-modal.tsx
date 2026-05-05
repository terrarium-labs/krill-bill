import * as React from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { MultiSelectApi } from "@/app/components/forms-elements/multi-select-api";
import { getOrgOnCallGroups } from "@/api/field-service/on-call/groups/groups";
import { postOrgOnCallShift, patchOrgOnCallShift } from "@/api/field-service/on-call/on-call-shifts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { DateTimePicker } from "@/app/components/forms-elements/date-time-picker";
import { Loader2 } from "lucide-react";
import IdBadge from "@/app/components/id-badge";
import type { OnCallShift } from "@/types/field-service/on-call/on-call-shifts";

export interface OnCallShiftCreatePayload {
  group_id: string;
  start_date: string;
  end_date: string;
}

const shiftFormSchema = z.object({
  group_id: z.string().min(1, "Group is required"),
  start_date: z.date(),
  end_date: z.date(),
}).refine((data) => data.end_date >= data.start_date, {
  message: "End date must be on or after start date",
  path: ["end_date"],
});

type ShiftFormValues = z.infer<typeof shiftFormSchema>;

interface OnCallShiftEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Shift to edit. When provided, modal is in edit mode (PATCH). */
  shift?: OnCallShift | null;
  /** Initial payload for create mode. Dates as ISO strings. */
  initialPayload?: Partial<OnCallShiftCreatePayload>;
  onSuccess?: () => void;
  /** Render custom action buttons in the header (right side, next to ID badge). Receives the shift and a close function. */
  renderActions?: (shift: OnCallShift, closeModal: () => void) => React.ReactNode;
}

const OnCallShiftEditModal = ({
  open,
  onOpenChange,
  shift,
  initialPayload,
  onSuccess,
  renderActions,
}: OnCallShiftEditModalProps) => {
  const { t } = useTranslation();
  const { orgId } = useParams<{ orgId: string }>();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: {
      group_id: "",
      start_date: new Date(),
      end_date: new Date(),
    },
  });

  const isEditMode = !!shift;

  React.useEffect(() => {
    if (open && shift) {
      form.reset({
        group_id: shift.group.id,
        start_date: new Date(shift.start_date),
        end_date: new Date(shift.end_date),
      });
    } else if (open && initialPayload) {
      form.reset({
        group_id: initialPayload.group_id ?? "",
        start_date: initialPayload.start_date
          ? new Date(initialPayload.start_date)
          : new Date(),
        end_date: initialPayload.end_date
          ? new Date(initialPayload.end_date)
          : new Date(),
      });
    } else if (open) {
      form.reset({
        group_id: "",
        start_date: new Date(),
        end_date: new Date(),
      });
    }
  }, [open, shift, initialPayload, form]);

  const handleSubmit = async (values: ShiftFormValues) => {
    if (!orgId) return;
    setIsSubmitting(true);
    try {
      const payload: OnCallShiftCreatePayload = {
        group_id: values.group_id,
        start_date: values.start_date.toISOString(),
        end_date: values.end_date.toISOString(),
      };
      const response = isEditMode && shift
        ? await patchOrgOnCallShift(orgId, shift.id, payload)
        : await postOrgOnCallShift(orgId, payload);
      if (response.success) {
        toast.success(
          isEditMode
            ? t("on-call.shifts.updated", "Shift updated")
            : t("on-call.shifts.created", "Shift created")
        );
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(
          isEditMode
            ? t("on-call.shifts.errorUpdating", "Error updating shift")
            : t("on-call.shifts.errorCreating", "Error creating shift")
        );
      }
    } catch (error) {
      console.error(isEditMode ? "Error updating shift:" : "Error creating shift:", error);
      toast.error(
        isEditMode
          ? t("on-call.shifts.errorUpdating", "Error updating shift")
          : t("on-call.shifts.errorCreating", "Error creating shift")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full md:max-w-2xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 text-lg font-semibold">
            <span>
              {isEditMode
                ? t("on-call.shifts.editShift", "Edit shift")
                : t("on-call.shifts.addShift", "Add shift")}
            </span>
            {isEditMode && shift && (
              <div className="flex items-center gap-2">
                <IdBadge id={shift.id} />
                {renderActions?.(shift, () => onOpenChange(false))}
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="space-y-6 overflow-y-auto max-h-[70vh] px-2 scrollbar-hide mb-12">
              <FormField
                control={form.control}
                name="group_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("on-call.groups.title", "Group")}</FormLabel>
                    <FormControl>
                      <MultiSelectApi
                        fetchOptions={getOrgOnCallGroups}
                        fetchArgs={orgId ? [orgId] : []}
                        optionsKey="on_call_groups"
                        customValueKey={(item) => item.id}
                        customLabelKey={(item) => item.name}
                        value={field.value ? [field.value] : []}
                        onChangeValue={(values) => field.onChange(values[0] ?? "")}
                        defaultItems={shift?.group ? [shift.group] : undefined}
                        placeholder={t("on-call.shifts.selectGroup", "Select a group")}
                        searchPlaceholder={t("common.search", "Search...")}
                        emptyText={t("on-call.groups.noGroups", "No groups found")}
                        maxCount={1}
                        disabled={isSubmitting || isEditMode}
                        className="w-full truncate"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("on-call.shifts.startDate", "Start date")}
                      </FormLabel>
                      <FormControl>
                        <DateTimePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={t("on-call.shifts.selectStartDateTime", "Select start date and time")}
                          showTime={true}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("on-call.shifts.endDate", "End date")}
                      </FormLabel>
                      <FormControl>
                        <DateTimePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={t("on-call.shifts.selectEndDateTime", "Select end date and time")}
                          showTime={true}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <DialogFooter className="flex-col rounded-b-lg sm:flex-row gap-2 fixed bottom-0 left-0 right-0 bg-background p-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {t("common.cancel", "Cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("common.saving", "Saving...")}
                  </>
                ) : (
                  t("common.save", "Save")
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default OnCallShiftEditModal;
