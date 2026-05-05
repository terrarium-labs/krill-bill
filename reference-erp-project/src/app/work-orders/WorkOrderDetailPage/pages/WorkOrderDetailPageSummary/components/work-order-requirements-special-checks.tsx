import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useWorkOrder } from "@/app/work-orders/contexts/WorkOrderContext";
import { getSpecialChecksTooltipText } from "@/utils/field-service";

interface WorkOrderSpecialChecksProps {
    editMode?: boolean;
    form?: UseFormReturn<any>;
    submitting?: boolean;
}

const SpecialRequirementsHeader = () => {
    const { t } = useTranslation();
    return (
        <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-lg flex items-center gap-2">
                {t("workorders.specialChecks.title", "Special requirements")}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info className="h-4 w-4 shrink-0 cursor-help text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                            <p>{getSpecialChecksTooltipText((k, fb) => t(k, fb ?? ""))}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </h3>
        </div>
    );
};

const WorkOrderSpecialChecks = ({
    editMode = false,
    form,
    submitting = false,
}: WorkOrderSpecialChecksProps) => {
    const { t } = useTranslation();
    const { workOrder } = useWorkOrder();

    if (editMode && form) {
        return (
            <FormField
                control={form.control}
                name="special_checks"
                render={({ field }) => (
                    <FormItem>
                        <div className="w-full space-y-4">
                            <SpecialRequirementsHeader />
                            <div>
                                <FormControl>
                                    <Textarea
                                        {...field}
                                        value={field.value || ""}
                                        placeholder={t(
                                            "workorders.specialChecks.placeholder",
                                            "Enter special checks or warnings..."
                                        )}
                                        disabled={submitting}
                                        className="min-h-[4.5rem] w-full resize-none bg-transparent border-0 px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                        rows={3}
                                    />
                                </FormControl>
                                <FormMessage />
                            </div>
                        </div>
                    </FormItem>
                )}
            />
        );
    }

    if (workOrder?.special_checks) {
        return (
            <div className="w-full space-y-4">
                <SpecialRequirementsHeader />
                <div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                        {workOrder.special_checks}
                    </p>
                </div>
            </div>
        );
    }

    return null;
};

export default WorkOrderSpecialChecks;
