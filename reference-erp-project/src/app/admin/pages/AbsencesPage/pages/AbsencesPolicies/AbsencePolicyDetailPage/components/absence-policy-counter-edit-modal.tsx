import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import IdBadge from "@/app/components/id-badge";
import { AbsenceCounter } from "@/types/general/absences";
import { promptUnsavedChanges } from "@/app/components/forms-elements/modal-unsaved";
import {
  patchAbsencePolicyCounters,
  postAbsencePolicyCounters,
} from "@/api/orgs/absences/absences";
import {
  type AbsencePolicyCounterFormValues,
  absencePolicyCounterDefaultFormValues,
  createAbsencePolicyCounterFormSchema,
  counterToFormValues,
  buildEditPatchPayload,
} from "./absence-policy-counter-form-types";
import {
  AbsencePolicyCounterFormFields,
  ABSENCE_POLICY_COUNTER_MODAL_FORM_CLASS,
} from "./absence-policy-counter-form-fields";

interface AbsencePolicyCounterEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCounterCreatedOrUpdated?: () => void;
  orgId: string;
  policyId: string;
  counter?: AbsenceCounter;
  /** When `mode` is create, prefill the form from this counter (duplicate flow). */
  duplicateSource?: AbsenceCounter;
  mode: 'create' | 'edit';
  renderActions?: () => React.ReactNode;
}

const AbsencePolicyCounterEditModal: React.FC<AbsencePolicyCounterEditModalProps> = ({
  open,
  onOpenChange,
  onCounterCreatedOrUpdated,
  orgId,
  policyId,
  counter,
  duplicateSource,
  mode,
  renderActions,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  // Determine if we're in edit mode
  const isEditMode = mode === 'edit';

  const formSchema = createAbsencePolicyCounterFormSchema(t);

  const form = useForm<AbsencePolicyCounterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: absencePolicyCounterDefaultFormValues,
  });

  const onSubmit = async (values: AbsencePolicyCounterFormValues) => {
    setIsLoading(true);
    try {
      let response;
      if (isEditMode) {
        const requestData = buildEditPatchPayload(values);
        response = await patchAbsencePolicyCounters(
          orgId,
          policyId,
          requestData,
          counter?.id || ""
        );
      } else {
        // In create mode, send all fields
        // If is_unlimited is true, always set value and max_days to 0
        const requestData = {
          name: values.name,
          description: values.description || null,
          cycle_start: values.cycle_start,
          cycle_start_year: values.cycle_start_year,
          cycle_duration: values.cycle_duration,
          unit: values.unit,
          value: values.is_unlimited ? 0 : values.value,
          is_working_day: values.is_working_day,
          is_unlimited: values.is_unlimited,
          count_if_holiday: values.count_if_holiday,
          is_prorated: values.is_prorated,
          max_days: values.is_unlimited ? 0 : values.max_days,
          negative_counter: values.negative_counter,
          expiration: values.expiration,
          expiration_period: values.expiration_period,
          absence_type_ids: values.absence_type_ids,
          admin_only: values.admin_only,
        };
        response = await postAbsencePolicyCounters(
          orgId,
          policyId,
          requestData
        );
      }

      if (response.success) {
        toast.success(
          isEditMode
            ? t(
                "absence-policies.counters.updatedSuccess",
                "Counter updated successfully"
              )
            : t(
                "absence-policies.counters.createdSuccess",
                "Counter created successfully"
              )
        );
        form.reset();
        onOpenChange(false);
        if (onCounterCreatedOrUpdated) {
          onCounterCreatedOrUpdated();
        }
      } else {
        toast.error(
          response.error ||
            (isEditMode
              ? t("absence-policies.counters.updateError", "Failed to update counter")
              : t("absence-policies.counters.createError", "Failed to create counter"))
        );
      }
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} counter:`,
        error
      );
      toast.error(
        isEditMode
          ? t("absence-policies.counters.updateError", "Failed to update counter")
          : t("absence-policies.counters.createError", "Failed to create counter")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = async (open: boolean) => {
    if (!open) {
      // When trying to close the modal
      if (form.formState.isDirty) {
        const discard = await promptUnsavedChanges();
        if (discard) {
          if (!isEditMode) {
            form.reset();
          }
          onOpenChange(false);
        }
        // If user cancels, do nothing (keep modal open)
      } else {
        // No unsaved changes, close normally
        if (!isEditMode) {
          form.reset();
        }
        onOpenChange(false);
      }
    } else {
      // Opening the modal
      onOpenChange(true);
    }
  };

  const handleInteractOutside = (e: Event) => {
    if (form.formState.isDirty) {
      // Prevent closing on backdrop click if there are unsaved changes
      e.preventDefault();
      // Trigger the prompt manually
      handleOpenChange(false);
    }
  };

  // Reset form when modal opens/closes or when counter/mode changes
  React.useEffect(() => {
    if (open) {
      if (mode === "edit" && counter) {
        form.reset(counterToFormValues(counter));
      } else if (mode === "create" && duplicateSource) {
        form.reset(counterToFormValues(duplicateSource));
      } else {
        form.reset(absencePolicyCounterDefaultFormValues);
      }
    } else {
      form.reset(absencePolicyCounterDefaultFormValues);
    }
  }, [open, mode, counter, duplicateSource, form]);

  const dialogTitle = isEditMode
    ? t("absence-policies.counters.editCounter", "Edit Counter")
    : t("absence-policies.counters.createNew", "Create New Counter");

  const submitButtonText = isEditMode
    ? t("common.update", "Update")
    : t("common.create", "Create");

  const loadingText = isEditMode
    ? t("absence-policies.counters.updatingCounter", "Updating Counter...")
    : t("absence-policies.counters.creatingCounter", "Creating Counter...");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-3xl md:min-w-3xl"
        showCloseButton={false}
        onPointerDownOutside={handleInteractOutside}
        onEscapeKeyDown={handleInteractOutside}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-lg font-semibold mb-4">
            <span>{dialogTitle}</span>
            {isEditMode && counter && renderActions && (
              <div className="flex items-center gap-2">
                <IdBadge id={counter.id} hideIcon={true} />
                {renderActions()}
              </div>
            )}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <AbsencePolicyCounterFormFields
            form={form}
            mode={mode}
            counter={counter}
            orgId={orgId}
            isLoading={isLoading}
            className={ABSENCE_POLICY_COUNTER_MODAL_FORM_CLASS}
          />
        </Form>


        <DialogFooter className="flex-col sm:flex-row gap-2 fixed bottom-0 left-0 right-0 bg-background p-4">
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
                {loadingText}
              </>
            ) : (
              submitButtonText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AbsencePolicyCounterEditModal;
