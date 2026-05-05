import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Check, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import ColorPicker from "@/app/components/forms-elements/color-picker";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import {
  postOrgOnCallGroup,
  getOrgOnCallGroupEmployees,
  deleteOrgOnCallGroupEmployee,
} from "@/api/field-service/on-call/groups/groups";
import { Employee } from "@/types/employees/employees";
import OnCallGroupEmployeesAddModal from "../OnCallPageGroupDetailPage/components/on-call-group-employees-add-modal";

const groupFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  color: z.string().min(1, "Color is required"),
});

type GroupFormValues = z.infer<typeof groupFormSchema>;

type WizardStep = "basic" | "employees";

const STEPS: { id: WizardStep; label: string; translationKey: string }[] = [
  { id: "basic", label: "Group Info", translationKey: "on-call.groups.steps.groupInfo" },
  { id: "employees", label: "Employees", translationKey: "on-call.groups.steps.employees" },
];

interface OnCallGroupAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated?: () => void;
}

const OnCallGroupAddModal = ({
  open,
  onOpenChange,
  onGroupCreated,
}: OnCallGroupAddModalProps) => {
  const { t } = useTranslation();
  const { orgId } = useParams<{ orgId: string }>();

  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<WizardStep>("basic");
  const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(new Set());
  const [createdGroupId, setCreatedGroupId] = useState<string | undefined>(undefined);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [addEmployeeModalOpen, setAddEmployeeModalOpen] = useState(false);

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: { name: "", description: "", color: "blue" },
  });

  useEffect(() => {
    if (open) {
      form.reset({ name: "", description: "", color: "blue" });
      setCurrentStep("basic");
      setCompletedSteps(new Set());
      setCreatedGroupId(undefined);
      setEmployees([]);
      setAddEmployeeModalOpen(false);
    }
  }, [open, form]);

  const fetchEmployees = useCallback(async () => {
    if (!orgId || !createdGroupId) return;

    setLoadingEmployees(true);
    try {
      const response = await getOrgOnCallGroupEmployees(
        orgId,
        createdGroupId,
        undefined,
        undefined
      );
      const list =
        (response.success as { employees?: Employee[] })?.employees ?? [];
      if (response.success) {
        setEmployees(list);
      } else {
        toast.error(
          t("on-call.groups.employees.errorLoading", "Failed to load employees")
        );
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error(
        t("on-call.groups.employees.errorLoading", "Failed to load employees")
      );
    } finally {
      setLoadingEmployees(false);
    }
  }, [orgId, createdGroupId, t]);

  useEffect(() => {
    if (open && currentStep === "employees" && createdGroupId) {
      fetchEmployees();
    }
  }, [open, currentStep, createdGroupId, fetchEmployees]);

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!orgId || !createdGroupId) return;

    try {
      const response = await deleteOrgOnCallGroupEmployee(orgId, createdGroupId, {
        employees_ids: [employeeId],
      });
      if (response.error) {
        toast.error(
          t("on-call.groups.employees.errorRemoving", "Error removing employee")
        );
      } else {
        toast.success(
          t("on-call.groups.employees.employeeRemoved", "Employee removed from group")
        );
        setEmployees((prev) => prev.filter((e) => e.id !== employeeId));
      }
    } catch (error) {
      console.error("Error removing employee from group:", error);
      toast.error(
        t("on-call.groups.employees.errorRemoving", "Error removing employee")
      );
    }
  };

  const onSubmitBasicInfo = async (data: GroupFormValues) => {
    if (!orgId) return;

    setSubmitting(true);
    try {
      const response = await postOrgOnCallGroup(orgId, {
        name: data.name,
        description: data.description || null,
        color: data.color,
      });

      const groupId = (response.success as { on_call_group_id?: string })?.on_call_group_id;

      if (response.error || !groupId) {
        toast.error(
          t("on-call.groups.errorCreatingGroup", "Error creating group")
        );
        return;
      }

      toast.success(t("on-call.groups.groupCreated", "Group created"));
      setCreatedGroupId(groupId);
      setCompletedSteps((prev) => new Set(prev).add("basic"));
      setCurrentStep("employees");
    } catch (error) {
      console.error("Error creating on-call group:", error);
      toast.error(
        t("on-call.groups.errorCreatingGroup", "Error creating group")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrevious = () => {
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  };

  const handleFinish = () => {
    onGroupCreated?.();
    form.reset();
    onOpenChange(false);
  };

  const getCurrentStepIndex = () => STEPS.findIndex((s) => s.id === currentStep);
  const isLastStep = () => getCurrentStepIndex() === STEPS.length - 1;
  const isFirstStep = () => getCurrentStepIndex() === 0;

  if (!orgId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {t("on-call.groups.addGroup", "Add Group")}
          </DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between gap-2 px-2 py-2">
          {STEPS.map((step, index) => {
            const isCompleted = completedSteps.has(step.id);
            const isCurrent = step.id === currentStep;
            const isAccessible =
              index === 0 || completedSteps.has(STEPS[index - 1].id);

            return (
              <div key={step.id} className="flex items-center flex-1">
                <button
                  type="button"
                  onClick={() => isAccessible && setCurrentStep(step.id)}
                  disabled={!isAccessible}
                  className={cn(
                    "flex items-center gap-2 text-xs font-medium transition-colors",
                    isCurrent && "text-primary",
                    isCompleted && !isCurrent && "text-muted-foreground",
                    !isCompleted && !isCurrent && !isAccessible && "text-muted-foreground/50",
                    !isCompleted && !isCurrent && isAccessible && "text-muted-foreground hover:text-foreground",
                    isAccessible && "cursor-pointer",
                    !isAccessible && "cursor-not-allowed"
                  )}
                >
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs",
                      isCurrent && "bg-primary text-primary-foreground",
                      isCompleted && !isCurrent && "bg-primary/20 text-primary",
                      !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? <Check className="h-3 w-3" /> : index + 1}
                  </div>
                  <span className="hidden sm:inline">
                    {t(step.translationKey, step.label)}
                  </span>
                </button>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-[2px] flex-1 mx-1",
                      isCompleted ? "bg-primary/50" : "bg-muted"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-2 -mx-2">
          {currentStep === "basic" && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmitBasicInfo)}
                className="space-y-6 py-2"
              >
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>
                          {t("on-call.groups.columns.name", "Name")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t(
                              "on-call.groups.namePlaceholder",
                              "Group name"
                            )}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="color"
                    render={() => (
                      <FormItem>
                        <ColorPicker
                          form={form}
                          name="color"
                          label={t("on-call.groups.types.color", "Color")}
                          required
                        />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t(
                          "on-call.groups.columns.description",
                          "Description"
                        )}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t(
                            "on-call.groups.descriptionPlaceholder",
                            "Optional description"
                          )}
                          rows={3}
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          )}

          {currentStep === "employees" && createdGroupId && orgId && (
            <div className="py-2 space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    {t("on-call.groups.employees.title", "Employees")}
                    <Badge variant="secondary">{employees.length}</Badge>
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAddEmployeeModalOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    {t("on-call.groups.employees.addEmployee", "Add")}
                  </Button>
                </div>
                {loadingEmployees ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : employees.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-6 text-center">
                    {t(
                      "on-call.groups.employees.noEmployeesDescription",
                      "No employees assigned to this group."
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {employees.map((employee) => (
                      <div
                        key={employee.id}
                        className="flex items-center justify-between text-sm py-2 px-2 rounded border"
                      >
                        <EmployeeAvatar
                          employee={employee}
                          showJobTitle={true}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteEmployee(employee.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <OnCallGroupEmployeesAddModal
                  open={addEmployeeModalOpen}
                  onOpenChange={setAddEmployeeModalOpen}
                  groupId={createdGroupId}
                  existingEmployeeIds={employees.map((e) => e.id)}
                  onEmployeesAdded={fetchEmployees}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="flex-col rounded-b-lg sm:flex-row gap-2 border-t pt-2 shrink-0">
          <div className="flex gap-2 justify-between w-full">
            <div className="flex gap-2">
              {!isFirstStep() && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={submitting}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {t("common.previous", "Previous")}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                {createdGroupId
                  ? t("common.close", "Close")
                  : t("common.cancel", "Cancel")}
              </Button>
              {currentStep === "basic" && !createdGroupId && (
                <Button
                  type="submit"
                  onClick={form.handleSubmit(onSubmitBasicInfo)}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("common.creating", "Creating...")}
                    </>
                  ) : (
                    <>
                      {t("common.create", "Create")}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              )}
              {isLastStep() && (
                <Button type="button" onClick={handleFinish}>
                  {t("common.finish", "Finish")}
                  <Check className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OnCallGroupAddModal;
