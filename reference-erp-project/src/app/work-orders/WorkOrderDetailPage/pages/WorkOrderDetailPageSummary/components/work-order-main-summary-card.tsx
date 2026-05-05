import { useState, useMemo } from "react";
import { Sparkles, FileText, AlignLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useWorkOrder } from "@/app/work-orders/contexts/WorkOrderContext";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/shadcn-io/tabs";
import MarkdownRenderer from "@/app/components/MarkdownRenderer";
import { ALL_REASONS_NOT_COMPLETED, getReasonNotCompletedName } from "@/utils/field-service";

interface WorkOrderSummaryCardProps {
    editMode?: boolean;
    form?: UseFormReturn<any>;
    submitting?: boolean;
}

const WorkOrderSummaryCard: React.FC<WorkOrderSummaryCardProps> = ({
    editMode = false,
    form,
    submitting = false,
}) => {
    const { t } = useTranslation();
    const { workOrder } = useWorkOrder();

    const reasonOptionsAll = useMemo(
        () =>
            ALL_REASONS_NOT_COMPLETED.map((reason) => ({
                value: reason,
                label: getReasonNotCompletedName((k, fb) => t(k, fb ?? ""), reason),
            })),
        [t]
    );

    // Check if data exists for each tab
    const hasResolutionData = (workOrder?.resolution_comment || workOrder?.internal_resolution_comment || workOrder?.reason_not_completed);

    const hasTicketDescriptionData = workOrder?.ticket_description;
    const showResolutionTab = editMode || hasResolutionData;
    const showTicketDescriptionTab = hasTicketDescriptionData;

    // Determine default tab: resolution if it has data, otherwise description, otherwise insights
    const getDefaultTab = (): 'insights' | 'resolution' | 'description' | 'ticket-description' => {
        if (hasResolutionData) return 'resolution';
        if (workOrder?.ai_insights) return 'insights';
        if (workOrder?.description) return 'description';
        if (workOrder?.ticket_description) return 'ticket-description';
        return 'description';
    };

    const [activeTab, setActiveTab] = useState<'insights' | 'resolution' | 'description' | 'ticket-description'>(getDefaultTab());

    return (
        <div className="flex gap-4 border border-border rounded-xl">
            {/* AI Insights / Resolution Section */}
            <div className="p-5 flex-1 min-w-0">
                {/* Show tabs when there's resolution/description data OR in edit mode */}
                <Tabs value={activeTab} >
                    <TabsList className="w-full justify-start mb-4 h-auto p-0 bg-transparent">

                        {/* Resolution Tab */}
                        {showResolutionTab && (
                            <TabsTrigger
                                type="button"
                                value="resolution"
                                className="py-0 px-0 mr-4 data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-0 h-auto pb-2 data-[state=active]:border-b-2 data-[state=active]:border-primary"
                                onClick={() => setActiveTab('resolution')}
                            >
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 flex-shrink-0 " />
                                    <span className={`text-sm  ${activeTab === 'resolution' ? "font-medium" : ""}`}>
                                        {t("workorders.resolution.title", "Resolution")}
                                    </span>
                                </div>
                            </TabsTrigger>
                        )}

                        {/* AI Insights Tab */}
                        {workOrder?.ai_insights && <TabsTrigger
                            type="button"
                            value="insights"
                            className="py-0 px-0 mr-4 data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-0 h-auto pb-2 data-[state=active]:border-b-2 data-[state=active]:border-primary"
                            onClick={() => setActiveTab('insights')}
                        >
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 flex-shrink-0 " />
                                <span className={`text-sm  ${activeTab === 'insights' ? 'font-medium' : ''
                                    }`}>
                                    {t("workorders.insights.title", "AI Insights")}
                                </span>
                            </div>
                        </TabsTrigger>}

                        {/* Description Tab */}
                        <TabsTrigger
                            type="button"
                            value="description"
                            className="py-0 px-0 mr-4 data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-0 h-auto pb-2 data-[state=active]:border-b-2 data-[state=active]:border-primary"
                            onClick={() => setActiveTab('description')}
                        >
                            <div className="flex items-center gap-2">
                                <AlignLeft className="h-4 w-4 flex-shrink-0 " />
                                <span className={`text-sm  ${activeTab === 'description' ? 'font-medium' : ''}`}>
                                    {t("workorders.description", "Description")}
                                </span>
                            </div>
                        </TabsTrigger>

                        {/* Ticket Description Tab */}
                        {showTicketDescriptionTab && (
                            <TabsTrigger
                                type="button"
                                value="ticket-description"
                                className="py-0 px-0 mr-4 data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-0 h-auto pb-2 data-[state=active]:border-b-2 data-[state=active]:border-primary"
                                onClick={() => setActiveTab('ticket-description')}
                            >
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 flex-shrink-0 " />
                                    <span className={`text-sm  ${activeTab === 'ticket-description' ? 'font-medium' : ''}`}>
                                        {t("workorders.ticketDescription", "Ticket Description")}
                                    </span>
                                </div>
                            </TabsTrigger>
                        )}

                    </TabsList>

                    {/* Conditionally render only the active tab content */}
                    <div className="mt-0">
                        {activeTab === 'insights' && (
                            <div className="text-sm  leading-relaxed">
                                {workOrder?.ai_insights ? (
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <MarkdownRenderer breakAll={false} content={workOrder.ai_insights} textSizeMultiplier={0.9} />
                                    </div>
                                ) : null}
                            </div>
                        )}

                        {activeTab === 'resolution' && (
                            <div className="space-y-3">
                                {editMode && form ? (
                                    <>
                                        {/* Resolution Comment - Editable (Edit Mode) — shared with client */}
                                        <FormField
                                            control={form.control}
                                            name="resolution_comment"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-medium ">
                                                        {t("workorders.resolutionComment", "Resolution Comment")}
                                                    </FormLabel>
                                                    <FormDescription>
                                                        {t("workorders.resolutionCommentDescription", "Visible to the client")}
                                                    </FormDescription>
                                                    <FormControl>
                                                        <Textarea
                                                            {...field}
                                                            value={field.value || ''}
                                                            rows={3}
                                                            disabled={submitting}
                                                            placeholder={t('workorders.resolutionCommentPlaceholder', 'Enter resolution comments')}
                                                            className="text-sm"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        {/* Internal Resolution Comment - Editable (Edit Mode) — internal use only */}
                                        <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-3">
                                            <FormField
                                                control={form.control}
                                                name="internal_resolution_comment"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-medium flex items-center gap-2">
                                                            {t("workorders.resolutionComment", "Resolution Comment")}
                                                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 font-normal">
                                                                {t("workorders.internal", "Internal")}
                                                            </Badge>
                                                        </FormLabel>
                                                        <FormDescription>
                                                            {t("workorders.internalResolutionCommentDescription", "Not shared with the client — internal use only")}
                                                        </FormDescription>
                                                        <FormControl>
                                                            <Textarea
                                                                {...field}
                                                                value={field.value || ''}
                                                                rows={3}
                                                                disabled={submitting}
                                                                placeholder={t('workorders.internalResolutionCommentPlaceholder', 'Enter internal resolution comments...')}
                                                                className="text-sm"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        {/* Reason Not Completed - Editable (Edit Mode) */}
                                        <FormField
                                            control={form.control}
                                            name="reason_not_completed"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-medium ">
                                                        {t("workorders.reasonNotCompleted", "Reason Not Completed")}
                                                    </FormLabel>
                                                    <Select
                                                        onValueChange={(value) => field.onChange(value === "__none__" ? null : value)}
                                                        value={field.value ?? "__none__"}
                                                        disabled={submitting}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder={t('workorders.reasonNotCompletedPlaceholder', 'Select reason...')} />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="__none__">
                                                                {t('workorders.noReason', 'None')}
                                                            </SelectItem>
                                                            {reasonOptionsAll.map((opt) => (
                                                                <SelectItem key={opt.value} value={opt.value}>
                                                                    {opt.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </>
                                ) : (
                                    <>
                                        {/* Read-only display mode (Operator View OR no form) */}
                                        <div className="text-sm  leading-relaxed space-y-3">
                                            {workOrder.resolution_comment && (
                                                <div>
                                                    <div className="font-medium mb-1 flex items-center gap-2">
                                                        {t("workorders.resolutionComment", "Resolution Comment")}
                                                        <span className="text-muted-foreground font-normal text-xs">
                                                            ({t("workorders.visibleToClient", "visible to client")})
                                                        </span>
                                                    </div>
                                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                                        <MarkdownRenderer breakAll={false} content={workOrder.resolution_comment} textSizeMultiplier={0.9} />
                                                    </div>
                                                </div>
                                            )}
                                            {workOrder.internal_resolution_comment && (
                                                <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-3">
                                                    <div className="font-medium mb-1 flex items-center gap-2">
                                                        {t("workorders.resolutionComment", "Resolution Comment")}
                                                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 font-normal">
                                                            {t("workorders.internal", "Internal")}
                                                        </Badge>
                                                    </div>
                                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                                        <MarkdownRenderer breakAll={false} content={workOrder.internal_resolution_comment} textSizeMultiplier={0.9} />
                                                    </div>
                                                </div>
                                            )}
                                            {workOrder.reason_not_completed && (
                                                <div>
                                                    <div className="font-medium mb-1">{t("workorders.reasonNotCompleted", "Reason Not Completed")}:</div>
                                                    <div className="text-sm">
                                                        {getReasonNotCompletedName((k, fb) => t(k, fb ?? ""), workOrder.reason_not_completed)}
                                                    </div>
                                                </div>
                                            )}
                                            {!workOrder.resolution_comment && !workOrder.internal_resolution_comment && !workOrder.reason_not_completed && (
                                                <div>{t('workorders.noResolutionComment', 'No resolution comment provided')}</div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === 'description' && (
                            <div className="space-y-3">
                                {editMode && form ? (
                                    <>
                                        {/* Description - Editable (Edit Mode) */}
                                        <FormField
                                            control={form.control}
                                            name="description"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-medium ">
                                                        {t("workorders.description", "Description")}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            {...field}
                                                            value={field.value || ''}
                                                            rows={6}
                                                            disabled={submitting}
                                                            placeholder={t('workorders.descriptionPlaceholder', 'Enter work order description')}
                                                            className="text-sm"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </>
                                ) : (
                                    <>
                                        {/* Read-only display mode (Operator View OR no form) */}
                                        <div className="text-sm  leading-relaxed">
                                            {workOrder?.description ? (
                                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                                    <MarkdownRenderer breakAll={false} content={workOrder.description} textSizeMultiplier={0.9} />
                                                </div>
                                            ) : (
                                                t('workorders.noDescription', 'No description provided')
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === 'ticket-description' && (
                            <div className="space-y-3">
                                {/* Ticket Description is always read-only */}
                                <div className="text-sm  leading-relaxed">
                                    {workOrder?.ticket_description ? (
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <MarkdownRenderer breakAll={false} content={workOrder.ticket_description} textSizeMultiplier={0.9} />
                                        </div>
                                    ) : (
                                        t('workorders.noTicketDescription', 'No ticket description provided')
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </Tabs>
            </div>
        </div>
    );
};

export default WorkOrderSummaryCard;
