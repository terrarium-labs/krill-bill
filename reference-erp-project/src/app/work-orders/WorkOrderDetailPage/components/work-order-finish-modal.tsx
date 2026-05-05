import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { ArrowLeft, Loader2, UserRoundX, XCircle, LucideIcon, CheckCircle, Check } from "lucide-react";
import { useWorkOrder } from "@/app/work-orders/contexts/WorkOrderContext";
import { useOrgMe } from "@/app/contexts/OrgMeContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { WorkOrderReasonNotCompleted } from "@/types/field-service/work-orders/work-orders";
import { ALL_REASONS_NOT_COMPLETED, getReasonNotCompletedName } from "@/utils/field-service";
import { Field, FieldLabel, FieldContent } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { deleteWorkOrderAssignee } from "@/api/field-service/work-orders/assignees/assignees";
import { useChatContext } from "@/app/chat/context/ChatContext";
import { SttTextarea } from "@/app/components/stt-textarea";

interface WorkOrderFinishModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type FinishType =
    | "list"
    | "unassign"
    | "close-completed"
    | "close-not-completed";

const FINISH_STEPS: { id: "reason" | "details"; label: string; translationKey: string }[] = [
    { id: "reason", label: "Reason", translationKey: "workOrders.finishWorkOrder.stepReason" },
    { id: "details", label: "Details", translationKey: "workOrders.finishWorkOrder.stepDetails" },
];

interface FinishOption {
    id: FinishType;
    label: string;
    title: string;
    description: string;
    icon: LucideIcon;
}

const WorkOrderFinishModal = ({ open, onOpenChange }: WorkOrderFinishModalProps) => {
    const { t } = useTranslation();
    const { orgId, workOrderId } = useParams<{ orgId: string; workOrderId: string }>();
    const { assignees, refreshAssignees } = useWorkOrder();
    const { autoSendMessage } = useChatContext();
    const { me } = useOrgMe();
    const isCurrentUserAssignee = useMemo(
        () => assignees.some((a) => a.employee?.id === me?.employee?.id) ?? false,
        [assignees, me?.employee?.id]
    );
    const [activeTab, setActiveTab] = useState<FinishType>("list");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<Record<FinishType, string>>({
        list: "",
        unassign: "",
        "close-completed": "",
        "close-not-completed": "",
    });
    const [selectedReason, setSelectedReason] = useState<WorkOrderReasonNotCompleted | null>(null);

    const allFinishOptions: FinishOption[] = [
        {
            id: "close-completed",
            label: t("workOrders.finishWorkOrder.closeCompleted", "Close as completed"),
            title: t("workOrders.finishWorkOrder.closeCompletedTitle", "Close as Completed"),
            description: t(
                "workOrders.finishWorkOrder.closeCompletedDescription",
                "Explain why this work order has been completed."
            ),
            icon: CheckCircle,
        },
        {
            id: "close-not-completed",
            label: t("workOrders.finishWorkOrder.closeNotCompleted", "Close as not completed"),
            title: t("workOrders.finishWorkOrder.closeNotCompletedTitle", "Close as Not Completed"),
            description: t(
                "workOrders.finishWorkOrder.closeNotCompletedDescription",
                "Explain why this work order cannot be completed."
            ),
            icon: XCircle,
        },
        {
            id: "unassign",
            label: t("workOrders.finishWorkOrder.unassignYourself", "Unassign yourself from this Work Order"),
            title: t("workOrders.finishWorkOrder.unassignTitle", "Unassign Yourself"),
            description: t(
                "workOrders.finishWorkOrder.unassignDescription",
                "Please provide a reason for unassigning yourself from this work order."
            ),
            icon: UserRoundX,
        },
    ];
    // Unassign option only shown when current user is in assignees
    const finishOptions: FinishOption[] = allFinishOptions.filter(
        (opt) => opt.id !== "unassign" || isCurrentUserAssignee
    );

    const handleFinishSelect = (finishId: FinishType) => {
        setActiveTab(finishId);
    };

    const handleBack = () => {
        setActiveTab("list");
    };

    const isStep1Reason = activeTab === "list";
    const isStep2Details = activeTab !== "list";
    const currentOption = finishOptions.find((opt) => opt.id === activeTab);

    const handleSubmit = async (finishType: FinishType) => {
        if (!orgId || !workOrderId) return;

        const details = formData[finishType];
        if (!details.trim()) {
            toast.error(t("workOrders.finishWorkOrder.errorEmptyDetails", "Please provide details about the finish"));
            return;
        }

        setIsSubmitting(true);
        try {
            if (finishType === "unassign") {
                const assigneeEmployeeId = me?.employee?.id;
                if (!assigneeEmployeeId) {
                    toast.error(t("workOrders.finishWorkOrder.error", "Error reporting reason"));
                    return;
                }
                const response = await deleteWorkOrderAssignee(orgId, workOrderId, assigneeEmployeeId, {
                    notes: details.trim(),
                });
                if (response?.success !== false) {
                    toast.success(t("workOrders.finishWorkOrder.unassignSuccess", "You have been unassigned from this work order"));
                    await refreshAssignees();
                    setFormData({ list: "", unassign: "", "close-completed": "", "close-not-completed": "" });
                    setSelectedReason(null);
                    setActiveTab("list");
                    onOpenChange(false);
                } else {
                    toast.error(response?.error ?? t("workOrders.finishWorkOrder.error", "Error reporting reason"));
                }
                return;
            }

            // Send message to @Steve for close as completed / close as not completed
            const baseMessage =
                "@Steve" + t("workOrders.finishWorkOrder.closeWorkOrderMessage", " Cierra el WorkOrder con el id ") +
                workOrderId +
                (finishType === "close-completed"
                    ? t("workOrders.finishWorkOrder.closeWorkOrderMessageCompleted", " como Completado")
                    : t("workOrders.finishWorkOrder.closeWorkOrderMessageNotCompleted", " como No Completado")
                ) +
                t("workOrders.finishWorkOrder.closeWorkOrderMessageDetails", ", con estos detalles para cerrarla: ");
            if (finishType === "close-completed") {
                autoSendMessage(
                    baseMessage +
                    t("workOrders.finishWorkOrder.closeWorkOrderMessageCompletionDetails", "Detalles (resolution_comment): ") +
                    details.trim()
                );
            } else {
                const reasonValue = selectedReason ?? "";
                autoSendMessage(
                    baseMessage +
                    t("workOrders.finishWorkOrder.closeWorkOrderMessageReasonNotCompleted", "Motivo por el que no se ha completado (reason_not_completed): ") +
                    reasonValue +
                    (details.trim()
                        ? t("workOrders.finishWorkOrder.closeWorkOrderMessageDetails", ". Detalles (resolution_comment): ") + details.trim()
                        : ""
                    )
                );
            }

            // TODO: Replace with actual API calls for close-completed / close-not-completed
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success(t("workOrders.finishWorkOrder.success", "Work order closed successfully"));

            setFormData({
                list: "",
                unassign: "",
                "close-completed": "",
                "close-not-completed": "",
            });
            setSelectedReason(null);
            setActiveTab("list");
            onOpenChange(false);
        } catch (error) {
            console.error("Error reporting reason:", error);
            toast.error(t("workOrders.finishWorkOrder.error", "Error closing work order"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = (open: boolean) => {
        if (!open) {
            setActiveTab("list");
            setSelectedReason(null);
        }
        onOpenChange(open);
    };

    const translate = (key: string, fallback?: string) => t(key, fallback ?? "");
    const reasonOptionsAll = useMemo(
        () =>
            ALL_REASONS_NOT_COMPLETED.map((reason) => ({
                value: reason,
                label: getReasonNotCompletedName(translate, reason),
            })),
        [t]
    );

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                className="max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col p-0"
                showCloseButton={false}
            >
                <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
                    <DialogTitle>
                        {activeTab === "list"
                            ? t("workOrders.finishWorkOrder.title", "Finish Work Order")
                            : currentOption?.title
                        }
                    </DialogTitle>
                </DialogHeader>

                {/* Step indicator: Reason (list of options) | Details (form) */}
                <div className="flex items-center justify-between gap-2 px-6 py-2 shrink-0">
                    {FINISH_STEPS.map((step, index) => {
                        const isStep1 = step.id === "reason";
                        const isCompleted = isStep1 && isStep2Details;
                        const isCurrent = (isStep1 && isStep1Reason) || (!isStep1 && isStep2Details);

                        return (
                            <div key={step.id} className="flex items-center flex-1">
                                <div
                                    className={cn(
                                        "flex items-center gap-2 text-xs font-medium transition-colors",
                                        isCurrent && "text-primary",
                                        isCompleted && !isCurrent && "text-muted-foreground",
                                        !isCompleted && !isCurrent && "text-muted-foreground"
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
                                    <span>{t(step.translationKey, step.label)}</span>
                                </div>
                                {index < FINISH_STEPS.length - 1 && (
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

                {/* Step content - height depends on active step */}
                <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4">
                    {/* Step 1 Reason: Close as completed | Close as not completed | Unassign yourself */}
                    {isStep1Reason && (
                        <div className="space-y-2 py-2">
                            {finishOptions.map((option) => {
                                const IconComponent = option.icon;
                                return (
                                    <Button
                                        key={option.id}
                                        type="button"
                                        variant="outline"
                                        className="w-full justify-start text-left h-auto py-3 px-4"
                                        onClick={() => handleFinishSelect(option.id)}
                                    >
                                        <IconComponent className="h-4 w-4 mr-3 flex-shrink-0" />
                                        <span>{option.label}</span>
                                    </Button>
                                );
                            })}
                        </div>
                    )}

                    {/* Step 2 Details: form for selected option */}
                    {isStep2Details && currentOption && (
                        <div className="space-y-4 py-2">
                            <p className="text-sm text-muted-foreground">{currentOption.description}</p>
                            {activeTab === "close-not-completed" && (
                                <Field>
                                    <FieldLabel>
                                        {t("workOrders.finishWorkOrder.reasons", "Reasons")} <span>*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <Select
                                            value={selectedReason ?? ""}
                                            onValueChange={(value) =>
                                                setSelectedReason((value || null) as WorkOrderReasonNotCompleted | null)
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder={t("workOrders.finishWorkOrder.selectReasons", "Select reason...")} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {reasonOptionsAll.map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FieldContent>
                                </Field>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor={`details-${activeTab}`}>
                                    {t("workOrders.finishWorkOrder.details", "Details")} <span>*</span>
                                </Label>
                                <SttTextarea
                                    id={`details-${activeTab}`}
                                    placeholder={t(
                                        "workOrders.finishWorkOrder.detailsPlaceholder",
                                        "Provide additional details..."
                                    )}
                                    value={formData[activeTab]}
                                    onChange={(val) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            [activeTab]: val,
                                        }))
                                    }
                                    rows={8}
                                    className="resize-none"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer: Back + Submit - only on Step 2 Details */}
                {isStep2Details && (
                    <div className="flex-shrink-0 flex items-center gap-2 px-6 py-4 border-t bg-background">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleBack}
                            disabled={isSubmitting}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            {t("common.back", "Back")}
                        </Button>
                        <Button
                            type="button"
                            onClick={() => handleSubmit(activeTab)}
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {t("common.submitting", "Submitting...")}
                                </>
                            ) : (
                                t("common.submit", "Submit")
                            )}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default WorkOrderFinishModal;
