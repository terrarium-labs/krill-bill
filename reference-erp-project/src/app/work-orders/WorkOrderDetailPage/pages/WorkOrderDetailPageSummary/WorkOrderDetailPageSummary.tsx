import * as z from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useEffect, useState, useRef } from "react";
import { Form } from "@/components/ui/form";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { ScrollArea } from "@/components/ui/scroll-area";
import FilesSection from "@/app/components/files/files-section";
import ThreadSection from "@/app/components/thread-section";
import { useWorkOrder } from "../../../contexts/WorkOrderContext";
import WorkOrderItemsCard from "./components/work-order-items-card";
import { patchWorkOrder } from "@/api/field-service/work-orders/work-orders";
import WorkOrderDetailsCard from "./components/work-order-main-details-card";
import WorkOrderSummaryCard from "./components/work-order-main-summary-card";
import WorkOrderClientInfoCard from "./components/work-order-client-info-card";
import WorkOrderChecklists from "./components/work-order-requirements-checklists";
import WorkOrderMainStatusSteps from "./components/work-order-main-status-steps";
import WorkOrderTimeTrackingCard from "./components/work-order-time-tracking-card";
import WorkOrderQuickActionsContainer from "./components/work-order-quick-actions-container";
import WorkOrderClientInventoriesCard from "./components/work-order-client-inventories-card";
import WorkOrderTechnologiesCard from "./components/work-order-requirements-technologies-card";
import WorkOrderSpecialChecks from "./components/work-order-requirements-special-checks";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from "@/components/ui/shadcn-io/tabs";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

interface WorkOrderDetailPageSummaryProps {
    editMode?: boolean;
    onDirtyChange?: (isDirty: boolean) => void;
    onRegisterSaveHandler?: (handler: () => Promise<void>) => void;
    onRegisterResetHandler?: (handler: () => void) => void;
}

const formSchema = z.object({
    name: z.string().min(1, 'Name is required').trim(),
    status_id: z.string().min(1, 'Status is required'),
    type_of_charge: z.string().min(1, 'Type of charge is required'),
    client_id: z.string().optional(),
    location_id: z.string().optional(),
    type_id: z.string().optional(),
    priority: z.enum(['urgent', 'high', 'medium', 'low']).optional().nullable(),
    time_estimate: z.number().optional().nullable(),
    start_date: z.date().optional().nullable(),
    due_date: z.date().optional().nullable(),
    completion_time: z.date().optional().nullable(),
    description: z.string().optional(),
    difficulty: z.number().min(0).max(10).optional().nullable(),
    number_of_technicians: z.number().min(0).optional().nullable(),
    actual_difficulty: z.number().min(0).max(10).optional().nullable(),
    resolution_comment: z.string().optional().nullable(),
    internal_resolution_comment: z.string().optional().nullable(),
    ticket_description: z.string().optional().nullable(),
    client_reference: z.string().optional(),
    special_checks: z.string().optional().nullable(),
    reason_not_completed: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

const WorkOrderDetailPageSummary: React.FC<WorkOrderDetailPageSummaryProps> = ({
    editMode = false,
    onDirtyChange,
    onRegisterSaveHandler,
    onRegisterResetHandler
}) => {
    const { workOrder, refreshWorkOrder } = useWorkOrder();
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [submitting, setSubmitting] = useState(false);
    const [selectedStatusData, setSelectedStatusData] = useState<any[]>([]);
    const [selectedTypeData, setSelectedTypeData] = useState<any[]>([]);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const sidebarPanelRef = useRef<any>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            status_id: '',
            type_of_charge: '',
            client_id: '',
            location_id: '',
            type_id: '',
            priority: undefined,
            time_estimate: null,
            start_date: null,
            due_date: null,
            completion_time: null,
            description: '',
            difficulty: null,
            number_of_technicians: null,
            actual_difficulty: null,
            client_reference: '',
            special_checks: null,
            reason_not_completed: null,
            resolution_comment: null,
            internal_resolution_comment: null,
            ticket_description: null,
        },
    })

    // Load work order data
    useEffect(() => {
        if (workOrder) {
            form.reset({
                name: workOrder.name || '',
                status_id: workOrder.status?.id || '',
                type_of_charge: workOrder.type_of_charge || '',
                client_id: workOrder.client?.id || '',
                location_id: workOrder.location?.id || '',
                type_id: workOrder.type?.id || '',
                priority: workOrder.priority ?? null,
                time_estimate: workOrder.time_estimate ?? null,
                start_date: workOrder.start_date ? new Date(workOrder.start_date) : null,
                due_date: workOrder.due_date ? new Date(workOrder.due_date) : null,
                completion_time: workOrder.completion_time
                    ? new Date(typeof workOrder.completion_time === 'number' ? workOrder.completion_time * 1000 : workOrder.completion_time)
                    : null,
                description: workOrder.description || '',
                difficulty: workOrder.difficulty ?? null,
                number_of_technicians: workOrder.number_of_technicians ?? null,
                actual_difficulty: workOrder.actual_difficulty ?? null,
                internal_resolution_comment: workOrder.internal_resolution_comment || '',
                client_reference: workOrder.client_reference || '',
                special_checks: workOrder.special_checks ?? null,
                reason_not_completed: workOrder.reason_not_completed ?? null,
                resolution_comment: workOrder.resolution_comment ?? null,
                ticket_description: workOrder.ticket_description ?? null,
            });
            setSelectedStatusData(workOrder.status ? [workOrder.status] : []);
            setSelectedTypeData(workOrder.type ? [workOrder.type] : []);
        }
    }, [workOrder, form]);

    // Register save handler with parent
    useEffect(() => {
        if (onRegisterSaveHandler) {
            onRegisterSaveHandler(async () => {
                await form.handleSubmit(onSubmit)();
            });
        }
    }, [onRegisterSaveHandler, form]);

    // Register reset handler with parent
    useEffect(() => {
        if (onRegisterResetHandler) {
            onRegisterResetHandler(() => {
                if (workOrder) {
                    form.reset({
                        name: workOrder.name || '',
                        status_id: workOrder.status?.id || '',
                        type_of_charge: workOrder.type_of_charge || '',
                        client_id: workOrder.client?.id || '',
                        location_id: workOrder.location?.id || '',
                        type_id: workOrder.type?.id || '',
                        priority: workOrder.priority ?? null,
                        time_estimate: workOrder.time_estimate ?? null,
                        start_date: workOrder.start_date ? new Date(workOrder.start_date) : null,
                        due_date: workOrder.due_date ? new Date(workOrder.due_date) : null,
                        completion_time: workOrder.completion_time
                            ? new Date(typeof workOrder.completion_time === 'number' ? workOrder.completion_time * 1000 : workOrder.completion_time)
                            : null,
                        description: workOrder.description || '',
                        difficulty: workOrder.difficulty ?? null,
                        number_of_technicians: workOrder.number_of_technicians ?? null,
                        actual_difficulty: workOrder.actual_difficulty ?? null,
                        internal_resolution_comment: workOrder.internal_resolution_comment || '',
                        client_reference: workOrder.client_reference || '',
                        special_checks: workOrder.special_checks ?? null,
                        reason_not_completed: workOrder.reason_not_completed ?? null,
                        resolution_comment: workOrder.resolution_comment ?? null,
                        ticket_description: workOrder.ticket_description ?? null,
                    });
                }
            });
        }
    }, [onRegisterResetHandler, workOrder, form]);

    // Notify parent of dirty state changes
    useEffect(() => {
        if (onDirtyChange) {
            onDirtyChange(form.formState.isDirty);
        }
    }, [form.formState.isDirty, onDirtyChange]);

    const onSubmit = async (data: FormValues) => {
        if (!orgId || !workOrder?.id) return;

        setSubmitting(true);
        try {
            const payload: any = {
                name: data.name,
                status_id: data.status_id,
                type_of_charge: data.type_of_charge,
            };

            // Helper function to check if value has changed
            const hasChanged = (newValue: any, oldValue: any) => {
                // Normalize null/undefined/empty string as null for comparison
                const normalizeValue = (val: any) => {
                    if (val === undefined || val === null || val === '') return null;
                    return val;
                };
                return normalizeValue(newValue) !== normalizeValue(oldValue);
            };

            // Only include changed fields
            if (data.client_id !== workOrder.client?.id) payload.client_id = data.client_id || null;
            if (data.location_id !== workOrder.location?.id) payload.location_id = data.location_id || null;
            if (data.type_id !== workOrder.type?.id) payload.type_id = data.type_id || null;
            if (hasChanged(data.priority, workOrder.priority)) payload.priority = data.priority;
            if (hasChanged(data.time_estimate, workOrder.time_estimate)) payload.time_estimate = data.time_estimate;

            // Handle dates
            const originalStartDate = workOrder.start_date ? new Date(workOrder.start_date).toISOString() : null;
            const newStartDate = data.start_date ? data.start_date.toISOString() : null;
            if (originalStartDate !== newStartDate) payload.start_date = newStartDate;

            const originalDueDate = workOrder.due_date ? new Date(workOrder.due_date).toISOString() : null;
            const newDueDate = data.due_date ? data.due_date.toISOString() : null;
            if (originalDueDate !== newDueDate) payload.due_date = newDueDate;

            const originalCompletionTime = workOrder.completion_time
                ? (typeof workOrder.completion_time === 'number'
                    ? new Date(workOrder.completion_time * 1000).toISOString()
                    : new Date(workOrder.completion_time).toISOString())
                : null;
            const newCompletionTime = data.completion_time ? data.completion_time.toISOString() : null;
            if (originalCompletionTime !== newCompletionTime) payload.completion_time = newCompletionTime;

            if (hasChanged(data.description, workOrder.description)) payload.description = data.description || null;
            if (hasChanged(data.difficulty, workOrder.difficulty)) payload.difficulty = data.difficulty;
            if (hasChanged(data.number_of_technicians, workOrder.number_of_technicians)) payload.number_of_technicians = data.number_of_technicians;
            if (hasChanged(data.actual_difficulty, workOrder.actual_difficulty)) payload.actual_difficulty = data.actual_difficulty;
            if (hasChanged(data.resolution_comment, workOrder.resolution_comment)) payload.resolution_comment = data.resolution_comment || null;
            if (hasChanged(data.internal_resolution_comment, workOrder.internal_resolution_comment)) payload.internal_resolution_comment = data.internal_resolution_comment || null;
            if (hasChanged(data.ticket_description, workOrder.ticket_description)) payload.ticket_description = data.ticket_description || null;
            if (hasChanged(data.client_reference, workOrder.client_reference)) payload.client_reference = data.client_reference || null;
            if (hasChanged(data.special_checks, workOrder.special_checks)) payload.special_checks = data.special_checks;
            if (hasChanged(data.reason_not_completed, workOrder.reason_not_completed)) payload.reason_not_completed = data.reason_not_completed || null;

            const response = await patchWorkOrder(orgId, workOrder.id, payload);

            if (response.success) {
                toast.success(t('workorders.workOrderUpdated', 'Work order updated successfully'));
                refreshWorkOrder();
                form.reset(data); // Reset form state to mark as not dirty
            } else {
                toast.error(t('workorders.errorUpdatingWorkOrder', 'Error updating work order'));
            }
        } catch (error) {
            toast.error(t('workorders.errorUpdatingWorkOrder', 'Error updating work order'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="relative">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    {/* Status Steps Indicator */}
                    <div className="mb-6">
                        <WorkOrderMainStatusSteps variant="detail-single" colorVariant="detail-single" hideCategory={['closed']} />
                    </div>

                    <ResizablePanelGroup direction="horizontal" className="max-h-full min-h-[calc(100vh-12rem)]">
                        {/* Left side: Main Content */}
                        <ResizablePanel defaultSize={60} minSize={40}>
                            <div className={`flex flex-col gap-4 min-w-0 ${isSidebarCollapsed ? '' : 'pr-4'}`}>
                                <WorkOrderQuickActionsContainer
                                    isSidebarCollapsed={isSidebarCollapsed}
                                    onToggleSidebar={() => {
                                        if (sidebarPanelRef.current) {
                                            if (isSidebarCollapsed) {
                                                sidebarPanelRef.current.expand();
                                            } else {
                                                sidebarPanelRef.current.collapse();
                                            }
                                        }
                                    }}
                                />
                                <div className="flex flex-col gap-4 min-w-0">
                                    <WorkOrderSummaryCard
                                        editMode={editMode}
                                        form={form}
                                        submitting={submitting}
                                    />
                                    <WorkOrderDetailsCard
                                        form={form}
                                        submitting={submitting}
                                        selectedStatusData={selectedStatusData}
                                        setSelectedStatusData={setSelectedStatusData}
                                        selectedTypeData={selectedTypeData}
                                        setSelectedTypeData={setSelectedTypeData}
                                        editMode={editMode}
                                    />
                                    <WorkOrderTimeTrackingCard />
                                    <WorkOrderItemsCard editMode={editMode} />
                                </div>
                            </div>
                        </ResizablePanel>

                        {!isSidebarCollapsed && <ResizableHandle />}

                        {/* Right side: Tabs Section */}
                        <ResizablePanel
                            ref={sidebarPanelRef}
                            defaultSize={40}
                            minSize={25}
                            maxSize={40}
                            collapsible={true}
                            collapsedSize={0}
                            onCollapse={() => setIsSidebarCollapsed(true)}
                            onExpand={() => setIsSidebarCollapsed(false)}
                        >
                            <div className="flex flex-col gap-4 pl-4">
                                <Tabs defaultValue="client">
                                    <TabsList className="w-full justify-start border-b-2 border-border bg-background" activeClassName='border-b-2 border-primary -mb-1.5'>
                                        <TabsTrigger type="button" className="py-0" value="client">{t("workorders.tabs.client", "Client")}</TabsTrigger>
                                        <TabsTrigger type="button" className="py-0" value="messages">{t("workorders.tabs.messages", "Messages")}</TabsTrigger>
                                        <TabsTrigger type="button" className="py-0" value="checklists">{t("workorders.tabs.requirements", "Requirements")}</TabsTrigger>
                                        <TabsTrigger type="button" className="py-0" value="files">{t("workOrdersDetail.files", "Files")}</TabsTrigger>
                                    </TabsList>
                                    <TabsContents transition={{ duration: 0 }} className="mt-2">
                                        <TabsContent value="client" transition={{ duration: 0 }}>
                                            <div className="flex flex-col gap-4 pr-4">
                                                <WorkOrderClientInfoCard
                                                    workOrder={workOrder}
                                                    editMode={editMode}
                                                />
                                                <WorkOrderClientInventoriesCard
                                                    workOrder={workOrder}
                                                    editMode={editMode}
                                                />
                                            </div>
                                        </TabsContent>
                                        <TabsContent value="messages" transition={{ duration: 0 }}>
                                            <div className="w-full h-[calc(100vh-14rem)]">
                                                <ThreadSection
                                                    entityId={workOrder?.id || ''}
                                                    edit={true}
                                                />
                                            </div>
                                        </TabsContent>
                                        <TabsContent value="checklists" transition={{ duration: 0 }}>
                                            <ScrollArea className="h-[calc(100vh-14rem)]">
                                                <div className="space-y-6 pr-4">
                                                    <WorkOrderSpecialChecks editMode={editMode} form={form} submitting={submitting} />
                                                    <WorkOrderTechnologiesCard editMode={editMode} />
                                                    <WorkOrderChecklists editMode={editMode} />
                                                </div>
                                            </ScrollArea>
                                        </TabsContent>
                                        <TabsContent value="files" transition={{ duration: 0 }}>
                                            <div className="w-full h-[calc(100vh-14rem)]">
                                                <FilesSection
                                                    key={`work-order-files-${workOrder?.id}`}
                                                    entity_id={workOrder?.id || ""}
                                                    showCreateFolder={false}
                                                    showBreadcrumbs={false}
                                                />
                                            </div>
                                        </TabsContent>
                                    </TabsContents>
                                </Tabs>
                            </div>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </form>
            </Form>
        </div>
    );
};

export default WorkOrderDetailPageSummary;
