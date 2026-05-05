import { useTranslation } from "react-i18next";
import { UseFormReturn } from "react-hook-form";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MultiSelectApi } from "@/app/components/forms-elements/multi-select-api";
import { DateTimePicker } from "@/app/components/forms-elements/date-time-picker";
import { getOrgTicketWorkOrderTypes } from "@/api/field-service/tickets-work-orders-types/tickets-work-orders-types";
import { useParams } from "react-router-dom";
import WorkOrderSupervisorsEditModal from "./modals/work-order-supervisors-edit-modal";
import WorkOrderAssigneesEditModal from "./modals/work-order-assignees-edit-modal";
import { Users, UserStar, UserPen, FileSearchCorner, IdCardLanyard, ChevronDown, ChevronUp, TriangleAlert, Tag as TagIcon, ClipboardClock, Calendar, CalendarClock, Clock, Timer, Gauge } from "lucide-react";
import PriorityLabel from "@/app/components/labels/priority-label";
import TypeLabel from "@/app/components/labels/type-label";
import StatusLabel from "@/app/components/labels/status-label";
import Tag from "@/app/components/tag/tag";
import DateLabel from "@/app/components/labels/date-label";
import TextLabel from "@/app/components/labels/text-label";
import EmployeeLabel from "@/app/components/labels/employee-label";
import { IconInfoItem } from "@/app/components/custom-labels";
import { useWorkOrder } from "@/app/work-orders/contexts/WorkOrderContext";
import { Button } from "@/components/ui/button";

interface WorkOrderDetailsCardProps {
    form: UseFormReturn<any>;
    submitting: boolean;
    selectedStatusData: any[];
    setSelectedStatusData: (data: any[]) => void;
    selectedTypeData: any[];
    setSelectedTypeData: (data: any[]) => void;
    editMode?: boolean;
}

const WorkOrderDetailsCard = ({
    form,
    submitting,
    selectedStatusData,
    setSelectedStatusData,
    selectedTypeData,
    setSelectedTypeData,
    editMode = false,
}: WorkOrderDetailsCardProps) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [supervisorsModalOpen, setSupervisorsModalOpen] = useState(false);
    const [assigneesModalOpen, setAssigneesModalOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // Get supervisors and assignees from WorkOrderContext
    const { workOrder, supervisors, assignees, statuses } = useWorkOrder();

    // Watch form values to ensure Select components are reactive
    const priorityValue = form.watch('priority');
    const typeOfChargeValue = form.watch('type_of_charge');

    // Extract employee objects from assignees array (assignees have an employee property)
    const assigneesEmployees = assignees?.map((assignee: any) => assignee.employee).filter(Boolean) || [];

    return (
        <>
            <Card className="shadow-none border-border p-0 @container">
                <CardContent className="p-0">
                    {/* Header Row - Always Visible */}
                    <div
                        className={`flex items-center justify-between gap-4 cursor-pointer hover:bg-muted/50 transition-colors ${isExpanded ? 'p-4' : 'p-4'} m-0`}
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Title */}
                            <span className="font-semibold">
                                {t('workorders.details', 'Details')}
                            </span>

                            {/* Tag Labels - Priority, Type, Status, and Due Date with icons - Only show when collapsed */}
                            {!isExpanded && (
                                <div className="flex items-center gap-4 min-w-0">
                                    {/* Priority - transforms to icon-only at very tight spaces */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <TriangleAlert className="h-4 w-4 text-muted-foreground @[450px]:inline-flex hidden" />
                                        <div className="@[450px]:hidden inline-flex">
                                            <PriorityLabel data={workOrder?.priority} variant="icon" />
                                        </div>
                                        <div className="@[450px]:inline-flex hidden">
                                            {workOrder.priority ? <Tag text={workOrder.priority} className="capitalize" /> : <span className="text-xs text-muted-foreground">-</span>}
                                        </div>
                                    </div>

                                    {/* Type - transforms to icon-only at very tight spaces */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <TagIcon className="h-4 w-4 text-muted-foreground @[500px]:inline-flex hidden" />
                                        <div className="@[500px]:hidden inline-flex">
                                            <TypeLabel data={workOrder?.type} variant="icon" />
                                        </div>
                                        <div className="@[500px]:inline-flex hidden">
                                            {workOrder.type ? <Tag text={workOrder.type.name} color={workOrder.type.color || ""} /> : <span className="text-xs text-muted-foreground">-</span>}
                                        </div>
                                    </div>

                                    {/* Status - transforms to icon-only at very tight spaces */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <ClipboardClock className="h-4 w-4 text-muted-foreground @[550px]:inline-flex hidden" />
                                        <div className="@[550px]:hidden inline-flex">
                                            <StatusLabel data={workOrder?.status} variant="icon" />
                                        </div>
                                        <div className="@[550px]:inline-flex hidden">
                                            {workOrder.status ? <Tag text={workOrder.status.name} color={workOrder.status.color || ""} /> : <span className="text-xs text-muted-foreground">-</span>}
                                        </div>
                                    </div>

                                    {/* Due Date - hides at tight spaces */}
                                    <div className="flex items-center gap-1.5 @[700px]:flex hidden shrink-0">
                                        <CalendarClock className="h-4 w-4 text-muted-foreground" />
                                        {workOrder?.due_date ? (
                                            <DateLabel data={workOrder.due_date} options={{ hide: ["hours", "minutes", "seconds"] }} />
                                        ) : (
                                            <span className="text-xs text-muted-foreground">{t('workorders.dueDateNotSet', 'Due date not setted')}</span>
                                        )}
                                    </div>

                                    {/* Supervisors - transforms to icon variant second */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        <UserStar className="h-4 w-4 text-muted-foreground" />
                                        <div className="@[860px]:hidden inline-flex">
                                            <EmployeeLabel data={supervisors} variant="icon" />
                                        </div>
                                        <div className="@[860px]:inline-flex hidden">
                                            <EmployeeLabel data={supervisors} />
                                        </div>
                                    </div>

                                    {/* Assignees - transforms to icon variant FIRST (highest breakpoint) */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <div className="@[960px]:hidden inline-flex">
                                            <EmployeeLabel data={assigneesEmployees} variant="icon" />
                                        </div>
                                        <div className="@[960px]:inline-flex hidden">
                                            <EmployeeLabel data={assigneesEmployees} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>


                        {/* Expand/Collapse Icon */}
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsExpanded(!isExpanded);
                            }}
                        >
                            {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </Button>
                    </div>

                    {/* Expanded View - Full Details */}
                    {isExpanded && (
                        <div className="space-y-6 px-4 pb-4">
                            {/* First Row: Priority, Type, Status, Supervisors, Assignees */}
                            <div className="grid grid-cols-3 gap-4 min-w-0">
                                {/* Priority */}
                                <FormField
                                    control={form.control}
                                    name="priority"
                                    render={({ field }) => (
                                        <FormItem className="min-w-0">
                                            {!editMode ? (
                                                <IconInfoItem
                                                    icon={TriangleAlert}
                                                    label={t('workorders.priority', 'Priority')}
                                                >
                                                    {workOrder.priority ? <Tag text={workOrder.priority} className="capitalize" /> : <span className="text-xs text-muted-foreground">-</span>}
                                                </IconInfoItem>
                                            ) : (
                                                <>
                                                    <FormLabel className="text-xs text-muted-foreground">{t('workorders.priority', 'Priority')}</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={priorityValue ?? ''}
                                                        disabled={submitting}
                                                        key={`priority-${workOrder?.id}-${priorityValue}`}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="w-full min-w-0">
                                                                {priorityValue ? <Tag text={priorityValue} className="capitalize" /> : <span className="text-xs text-muted-foreground">-</span>}
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="urgent">
                                                                <Tag text="urgent" className="capitalize" />
                                                            </SelectItem>
                                                            <SelectItem value="high">
                                                                <Tag text="high" className="capitalize" />
                                                            </SelectItem>
                                                            <SelectItem value="medium">
                                                                <Tag text="medium" className="capitalize" />
                                                            </SelectItem>
                                                            <SelectItem value="low">
                                                                <Tag text="low" className="capitalize" />
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </>
                                            )}
                                        </FormItem>
                                    )}
                                />

                                {/* Type */}
                                <FormField
                                    control={form.control}
                                    name="type_id"
                                    render={({ field }) => (
                                        <FormItem className="min-w-0">
                                            {!editMode ? (
                                                <IconInfoItem
                                                    icon={TagIcon}
                                                    label={t('workorders.type', 'Type')}
                                                >
                                                    {workOrder.type ? <Tag text={workOrder.type.name} color={workOrder.type.color || ""} /> : <span className="text-xs text-muted-foreground">-</span>}
                                                </IconInfoItem>
                                            ) : (
                                                <>
                                                    <FormLabel className="text-xs text-muted-foreground">{t('workorders.type', 'Type')}</FormLabel>
                                                    <FormControl>
                                                        <div className="w-full min-w-0">
                                                            <MultiSelectApi
                                                                fetchOptions={getOrgTicketWorkOrderTypes}
                                                                fetchArgs={[orgId || '']}
                                                                optionsKey="tickets_wo_types"
                                                                className="w-full min-w-0"
                                                                customValueKey={(item) => item.id}
                                                                customLabelKey={(item) => <Tag text={item.name} color={item.color || ""} />}
                                                                placeholder={t('workorders.selectType', 'Select type...')}
                                                                value={field.value ? [field.value] : []}
                                                                onChangeValue={(values) => field.onChange(values[0] || '')}
                                                                onChangeValueWithItem={(_values, itemsMap) => {
                                                                    setSelectedTypeData(Array.from(itemsMap.values()));
                                                                }}
                                                                defaultItems={selectedTypeData}
                                                                maxCount={1}
                                                                disabled={submitting}
                                                                isApiSearchable={true}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </>
                                            )}
                                        </FormItem>
                                    )}
                                />

                                {/* Status */}
                                <FormField
                                    control={form.control}
                                    name="status_id"
                                    render={({ field }) => (
                                        <FormItem className="min-w-0">
                                            {!editMode ? (
                                                <IconInfoItem
                                                    icon={ClipboardClock}
                                                    label={t('workorders.status', 'Status')}
                                                >
                                                    {workOrder.status ? <Tag text={workOrder.status.name} color={workOrder.status.color || ""} /> : <span className="text-xs text-muted-foreground">-</span>}
                                                </IconInfoItem>
                                            ) : (
                                                <>
                                                    <FormLabel className="text-xs text-muted-foreground">{t('workorders.status', 'Status')} *</FormLabel>
                                                    <FormControl>
                                                        <div className="w-full min-w-0">
                                                            <MultiSelectApi
                                                                fetchOptions={async () => ({ success: { statuses } })}
                                                                fetchArgs={[]}
                                                                optionsKey="statuses"
                                                                className="w-full min-w-0"
                                                                customValueKey={(item) => item.id}
                                                                customLabelKey={(item) => <Tag text={item.name} color={item.color || ""} />}
                                                                placeholder={t('workorders.selectStatus', 'Select status...')}
                                                                value={field.value ? [field.value] : []}
                                                                onChangeValue={(values) => field.onChange(values[0] || '')}
                                                                onChangeValueWithItem={(_values, itemsMap) => {
                                                                    setSelectedStatusData(Array.from(itemsMap.values()));
                                                                }}
                                                                defaultItems={selectedStatusData}
                                                                maxCount={1}
                                                                disabled={submitting}
                                                                isApiSearchable={false}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </>
                                            )}
                                        </FormItem>
                                    )}
                                />

                            </div>

                            {/* Second Row: Supervisors and Assignees */}
                            <div className="grid grid-cols-3 gap-4 min-w-0">
                                {/* Supervisors */}
                                <div className="space-y-2 min-w-0">
                                    {!editMode ? (
                                        <IconInfoItem
                                            icon={UserStar}
                                            label={t('workOrdersDetail.supervisors', 'Supervisors')}
                                        >
                                            <EmployeeLabel data={supervisors} />
                                        </IconInfoItem>
                                    ) : (
                                        <>
                                            <FormLabel className="text-xs text-muted-foreground flex items-center gap-1">
                                                <UserStar className="h-3 w-3" />
                                                {t('workOrdersDetail.supervisors', 'Supervisors')}
                                            </FormLabel>
                                            <button
                                                type="button"
                                                onClick={() => setSupervisorsModalOpen(true)}
                                                className="flex items-center h-10 min-w-0 overflow-hidden w-full rounded-md border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-muted/50 cursor-pointer"
                                            >
                                                <EmployeeLabel data={supervisors} />
                                            </button>
                                        </>
                                    )}
                                </div>

                                {/* Assignees */}
                                <div className="space-y-2 min-w-0">
                                    {!editMode ? (
                                        <IconInfoItem
                                            icon={Users}
                                            label={t('workOrdersDetail.assignees', 'Assignees')}
                                        >
                                            <EmployeeLabel data={assigneesEmployees} />
                                        </IconInfoItem>
                                    ) : (
                                        <>
                                            <FormLabel className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                {t('workOrdersDetail.assignees', 'Assignees')}
                                            </FormLabel>
                                            <button
                                                type="button"
                                                onClick={() => setAssigneesModalOpen(true)}
                                                className="flex items-center h-10 min-w-0 overflow-hidden w-full rounded-md border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-muted/50 cursor-pointer"
                                            >
                                                <EmployeeLabel data={assigneesEmployees} />
                                            </button>
                                        </>
                                    )}
                                </div>
                                {/* Number of Technicians */}
                                <FormField
                                    control={form.control}
                                    name="number_of_technicians"
                                    render={({ field }) => (
                                        <FormItem>
                                            {!editMode ? (
                                                <IconInfoItem
                                                    icon={IdCardLanyard}
                                                    label={t('workorders.numberOfTechnicians', 'Number of Technicians')}
                                                >
                                                    <TextLabel data={workOrder?.number_of_technicians?.toString() || ''} />
                                                </IconInfoItem>
                                            ) : (
                                                <>
                                                    <FormLabel className="text-xs text-muted-foreground">{t('workorders.numberOfTechnicians', 'Number of Technicians')}</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            {...field}
                                                            value={field.value ?? ''}
                                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                                            disabled={submitting}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </>
                                            )}
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Second Row: Start Date, Due Date, Completion Time*/}
                            <div className="grid grid-cols-3 gap-4 min-w-0">
                                {/* Start Date */}
                                {!editMode ? (
                                    <IconInfoItem
                                        icon={Calendar}
                                        label={t('workorders.startDate', 'Start Date')}
                                    >
                                        <DateLabel
                                            data={workOrder.start_date}
                                            options={{ hide: ["hours", "minutes", "seconds"] }}
                                        />
                                    </IconInfoItem>
                                ) : (
                                    <DateTimePicker
                                        form={form}
                                        name="start_date"
                                        showMonthYearPicker={true}
                                        label={t('workorders.startDate', 'Start Date')}
                                        labelClassName="text-xs text-muted-foreground"
                                        placeholder={t('workorders.selectStartDate', 'Select start date')}
                                        showTime={false}
                                        disabled={submitting}
                                        onClear={() => form.setValue('start_date', null, { shouldDirty: true })}
                                    />
                                )}

                                {/* Due Date */}
                                {!editMode ? (
                                    <IconInfoItem
                                        icon={Calendar}
                                        label={t('workorders.dueDate', 'Due Date')}
                                    >
                                        <DateLabel data={workOrder.due_date} options={{ hide: ["hours", "minutes", "seconds"] }} />
                                    </IconInfoItem>
                                ) : (
                                    <DateTimePicker
                                        form={form}
                                        name="due_date"
                                        showMonthYearPicker={true}
                                        label={t('workorders.dueDate', 'Due Date')}
                                        labelClassName="text-xs text-muted-foreground"
                                        placeholder={t('workorders.selectDueDate', 'Select due date')}
                                        showTime={false}
                                        disabled={submitting}
                                        onClear={() => form.setValue('due_date', null, { shouldDirty: true })}
                                    />
                                )}

                                {/* Completion Time */}
                                {!editMode ? (
                                    <IconInfoItem
                                        icon={Clock}
                                        label={t('workOrdersDetail.completionTime', 'Completion Time')}
                                    >
                                        <DateLabel data={workOrder.completion_time} options={{ hide: ["seconds"] }} useUTC={false} />
                                    </IconInfoItem>
                                ) : (
                                    <DateTimePicker
                                        form={form}
                                        name="completion_time"
                                        showMonthYearPicker={true}
                                        label={t('workOrdersDetail.completionTime', 'Completion Time')}
                                        labelClassName="text-xs text-muted-foreground"
                                        placeholder={t('workorders.selectCompletionTime', 'Select completion date and time')}
                                        showTime={true}
                                        disabled={submitting}
                                        onClear={() => form.setValue('completion_time', null, { shouldDirty: true })}
                                    />
                                )}
                            </div>

                            {/* Third Row: Number of Technicians, Difficulty, Actual Difficulty, Created On, Created By */}
                            <div className="grid grid-cols-3 gap-4 min-w-0">

                                {/* Time Estimate */}
                                <FormField
                                    control={form.control}
                                    name="time_estimate"
                                    render={({ field }) => (
                                        <FormItem>
                                            {!editMode ? (
                                                <IconInfoItem
                                                    icon={Timer}
                                                    label={t('workorders.timeEstimate', 'Time Estimate (hours)')}
                                                >
                                                    <TextLabel data={workOrder?.time_estimate?.toString() || ''} />
                                                </IconInfoItem>
                                            ) : (
                                                <>
                                                    <FormLabel className="text-xs text-muted-foreground">{t('workorders.timeEstimate', 'Time Estimate (hours)')}</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            {...field}
                                                            value={field.value ?? ''}
                                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                                            disabled={submitting}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </>
                                            )}
                                        </FormItem>
                                    )}
                                />

                                {/* Difficulty */}
                                <FormField
                                    control={form.control}
                                    name="difficulty"
                                    render={({ field }) => (
                                        <FormItem>
                                            {!editMode ? (
                                                <IconInfoItem
                                                    icon={Gauge}
                                                    label={t('workOrdersDetail.difficulty', 'Difficulty (0-10)')}
                                                >
                                                    <TextLabel data={workOrder?.difficulty?.toString() || ''} />
                                                </IconInfoItem>
                                            ) : (
                                                <>
                                                    <FormLabel className="text-xs text-muted-foreground">{t('workOrdersDetail.difficulty', 'Difficulty (0-10)')}</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            {...field}
                                                            value={field.value ?? ''}
                                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                                            disabled={submitting}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </>
                                            )}
                                        </FormItem>
                                    )}
                                />
                                {/* Actual Difficulty */}
                                <FormField
                                    control={form.control}
                                    name="actual_difficulty"
                                    render={({ field }) => (
                                        <FormItem>
                                            {!editMode ? (
                                                <IconInfoItem
                                                    icon={Gauge}
                                                    label={t('workOrdersDetail.actualDifficulty', 'Actual Difficulty')}
                                                >
                                                    <TextLabel data={workOrder?.actual_difficulty?.toString() || ''} />
                                                </IconInfoItem>
                                            ) : (
                                                <>
                                                    <FormLabel className="text-xs text-muted-foreground">{t('workOrdersDetail.actualDifficulty', 'Actual Difficulty')}</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            {...field}
                                                            value={field.value ?? ''}
                                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                                            disabled={submitting}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </>
                                            )}
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Fourth Row: Created On, Created By */}
                            <div className="grid grid-cols-3 gap-4 min-w-0">
                                {/* Created By */}
                                <IconInfoItem
                                    icon={UserPen}
                                    label={t('workOrdersDetail.createdBy', 'Created by')}
                                >
                                    <EmployeeLabel data={workOrder.created_by} />
                                </IconInfoItem>

                                {/* Created On */}
                                <IconInfoItem
                                    icon={Calendar}
                                    label={t('workOrdersDetail.createdAt', 'Created on')}
                                >
                                    <DateLabel data={workOrder.created_at} options={{ hide: ["hours", "minutes", "seconds"] }} />
                                </IconInfoItem>

                                {/* Type of Charge */}
                                <FormField
                                    control={form.control}
                                    name="type_of_charge"
                                    render={({ field }) => (
                                        <FormItem className="min-w-0">
                                            {!editMode ? (
                                                <IconInfoItem
                                                    icon={FileSearchCorner}
                                                    label={t('workorders.typeOfCharge', 'Type of Charge')}
                                                >
                                                    <TextLabel className="capitalize" data={workOrder?.type_of_charge} />
                                                </IconInfoItem>
                                            ) : (
                                                <>
                                                    <FormLabel className="text-xs text-muted-foreground">{t('workorders.typeOfCharge', 'Type of Charge')} *</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={typeOfChargeValue ?? ''}
                                                        disabled={submitting}
                                                        key={`type_of_charge-${workOrder?.id}-${typeOfChargeValue}`}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="w-full min-w-0">
                                                                <SelectValue placeholder={t('workorders.selectTypeOfCharge', 'Select type of charge')} />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="contract">{t('workorders.typeOfCharge.contract', 'Contract')}</SelectItem>
                                                            <SelectItem value="repair">{t('workorders.typeOfCharge.repair', 'Repair')}</SelectItem>
                                                            <SelectItem value="quotation">{t('workorders.typeOfCharge.quotation', 'Quotation')}</SelectItem>
                                                            <SelectItem value="comissioning">{t('workorders.typeOfCharge.comissioning', 'Comissioning')}</SelectItem>
                                                            <SelectItem value="warranty_inspection">{t('workorders.typeOfCharge.warrantyInspection', 'Warranty Inspection')}</SelectItem>
                                                            <SelectItem value="repair_under_warranty">{t('workorders.typeOfCharge.repairUnderWarranty', 'Repair Under Warranty')}</SelectItem>
                                                            <SelectItem value="quotation_under_warranty">{t('workorders.typeOfCharge.quotationUnderWarranty', 'Quotation Under Warranty')}</SelectItem>
                                                            <SelectItem value="inspection">{t('workorders.typeOfCharge.inspection', 'Inspection')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </>
                                            )}
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
            <WorkOrderSupervisorsEditModal
                editMode={editMode}
                open={supervisorsModalOpen}
                onOpenChange={setSupervisorsModalOpen}
            />
            <WorkOrderAssigneesEditModal
                editMode={editMode}
                open={assigneesModalOpen}
                onOpenChange={setAssigneesModalOpen}
            />
        </>
    );
};

export default WorkOrderDetailsCard;