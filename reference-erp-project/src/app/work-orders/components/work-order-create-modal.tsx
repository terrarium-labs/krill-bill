import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { postWorkOrder } from '@/api/field-service/work-orders/work-orders';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { promptUnsavedChanges } from '@/app/components/forms-elements/modal-unsaved';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelectApi } from '@/app/components/forms-elements/multi-select-api';
import { DateTimePicker } from '@/app/components/forms-elements/date-time-picker';
import { getClients } from '@/api/clients/clients';
import { getClientLocations } from '@/api/clients/locations/locations';
import { ClientAvatar } from '@/app/components/avatars/client-avatar';
import { DynamicIcon, IconName } from 'lucide-react/dynamic';
import FilesSection from '@/app/components/files/files-section';
import { getOrgStatusTemplateStatuses } from '@/api/orgs/status-templates/status-templates';
import { Status } from '@/types/general/status-templates';
import { sortStatusesByCategoryAndPosition } from '@/utils/sorting';
import { getOrgTicketWorkOrderTypes } from '@/api/field-service/tickets-work-orders-types/tickets-work-orders-types';
import { TicketWorkOrderType } from '@/types/field-service/ticket-work-order-types';
import { cn } from '@/lib/utils';
import { getOrgTickets } from '@/api/field-service/tickets/tickets';
import { getWorkOrders } from '@/api/field-service/work-orders/work-orders';
import { TableFilters } from '@/types/general/filters';
import { Ticket, ClipboardCopy, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getSpecialChecksTooltipText } from '@/utils/field-service';
import { getWorkOrderSupervisors, deleteWorkOrderSupervisor } from '@/api/field-service/work-orders/supervisors/supervisors';
import { getWorkOrderAssignees, deleteWorkOrderAssignee } from '@/api/field-service/work-orders/assignees/assignees';
import { getWorkOrderChecklists, deleteWorkOrderChecklist, patchWorkOrderChecklist } from '@/api/field-service/work-orders/checklists/checklists';
import { getWorkOrderHardSkills, postWorkOrderHardSkill } from '@/api/field-service/work-orders/hard-skills/hard-skills';
import { EmployeeAvatar } from '@/app/components/avatars/employee-avatar';
import { Employee } from '@/types/employees/employees';
import { Assignee } from '@/types/field-service/work-orders/assignees';
import { Checklist } from '@/types/field-service/work-orders/checklists';
import { Checklist as GeneralChecklist } from '@/types/general/checklists';
import { ChecklistField } from '@/types/general/checklist-field';
import ChecklistEditorModal from '@/app/admin/pages/ChecklistsPage/components/checklist-editor-modal';
import { Badge } from '@/components/ui/badge';
import { Plus, SquarePen, Trash2 } from 'lucide-react';
import WorkOrderSupervisorAddModal from '../WorkOrderDetailPage/pages/WorkOrderDetailPageSummary/components/modals/work-order-supervisor-add-modal';
import CustomActionsDropdown from '@/app/components/custom-actions-dropdown';
import WorkOrderAssigneeAddModal from '../WorkOrderDetailPage/pages/WorkOrderDetailPageSummary/components/modals/work-order-assignee-add-modal';
import WorkOrderAssigneeEditModal from '../WorkOrderDetailPage/pages/WorkOrderDetailPageSummary/components/modals/work-order-assignee-edit-modal';
import WorkOrderAssigneeDeleteModal from '../WorkOrderDetailPage/pages/WorkOrderDetailPageSummary/components/modals/work-order-assignee-delete-modal';
import WorkOrderChecklistAddModal from '../WorkOrderDetailPage/pages/WorkOrderDetailPageSummary/components/modals/work-order-checklist-add-modal';
import WorkOrderChecklistEditModal from '../WorkOrderDetailPage/pages/WorkOrderDetailPageSummary/components/modals/work-order-checklist-edit-modal';
import { AddSkillModal } from '../WorkOrderDetailPage/pages/WorkOrderDetailPageSummary/components/modals/add-skill-modal';
import WorkOrderHardSkillEditModal from '../WorkOrderDetailPage/pages/WorkOrderDetailPageSummary/components/modals/work-order-hard-skill-edit-modal';
import TicketLabel from '@/app/components/labels/ticket-label';
import WorkOrderLabel from '@/app/components/labels/work-order-label';
import Tag from '@/app/components/tag/tag';
import { Skill } from '@/types/general/skills';
import { getSkillDescriptionForLevel } from '@/utils/skills';
import StarsLabel from '@/app/components/labels/stars-label';

interface WorkOrderCreateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onWorkOrderCreatedOrUpdated?: () => void;
}

// Filter templates for Origin Ticket/WorkOrder MultiSelectApis - prefilter by selected client/location
const clientOnlyFilterTemplate = (clientId: string): TableFilters => ({
    global_operator: "AND",
    filters: [
        {
            key: "client",
            type: "array",
            options: [],
            endpoint: { path: "/orgs/{{org_id}}/clients", key: "clients", type: "list" },
            is_sortable: false,
            operator: "inArray",
            value: [clientId],
        },
    ],
    order_by: null,
    keys: [
        {
            key: "client",
            type: "array",
            options: [],
            endpoint: { path: "/orgs/{{org_id}}/clients", key: "clients", type: "list" },
            is_sortable: false,
            operator: "inArray",
            value: [clientId],
        },
    ],
});

const clientAndLocationFilterTemplate = (clientId: string, locationId: string): TableFilters => ({
    global_operator: "AND",
    filters: [
        {
            key: "client",
            type: "array",
            options: [],
            endpoint: { path: "/orgs/{{org_id}}/clients", key: "clients", type: "list" },
            is_sortable: false,
            operator: "inArray",
            value: [clientId],
        },
        {
            key: "location",
            type: "array",
            options: [],
            endpoint: {
                path: "/orgs/{{org_id}}/client/{{client_id}}/locations",
                key: "locations",
                type: "list",
            },
            is_sortable: false,
            operator: "inArray",
            value: [locationId],
        },
    ],
    order_by: null,
    keys: [
        {
            key: "client",
            type: "array",
            options: [],
            endpoint: { path: "/orgs/{{org_id}}/clients", key: "clients", type: "list" },
            is_sortable: false,
            operator: "inArray",
            value: [clientId],
        },
        {
            key: "location",
            type: "array",
            options: [],
            endpoint: {
                path: "/orgs/{{org_id}}/client/{{client_id}}/locations",
                key: "locations",
                type: "list",
            },
            is_sortable: false,
            operator: "inArray",
            value: [locationId],
        },
    ],
});

// Form input schema - matches POST API expectations
const formInputSchema = z.object({
    name: z.string().min(1, 'Name is required').trim(),
    status_id: z.string().min(1, 'Status is required'),
    type_of_charge: z.string().min(1, 'Type of charge is required'),
    client_id: z.string().min(1, 'Client is required'),
    location_id: z.string().optional(),
    type_id: z.string().optional(),
    priority: z.enum(['urgent', 'high', 'medium', 'low']).optional().nullable(),
    time_estimate: z.number().optional().nullable(),
    start_date: z.date().optional().nullable(),
    due_date: z.date().optional().nullable(),
    description: z.string().optional(),
    origin_type: z.enum(['none', 'ticket', 'work_order']).optional(),
    origin_id: z.string().optional(),
    parent_work_order_id: z.string().optional(),
    difficulty: z.number().min(0).max(10).optional().nullable(),
    number_of_technicians: z.number().min(0).optional().nullable(),
    client_reference: z.string().optional(),
    special_checks: z.string().optional(),
});

type FormInputs = z.infer<typeof formInputSchema>;

// Steps in the wizard
type WizardStep = 'basic' | 'assignees' | 'requirements' | 'files';

const STEPS: { id: WizardStep; label: string; translationKey: string }[] = [
    { id: 'basic', label: 'Basic Info', translationKey: 'workorders.steps.basicInfo' },
    { id: 'assignees', label: 'Assignees', translationKey: 'workorders.steps.assignees' },
    { id: 'requirements', label: 'Requirements', translationKey: 'workorders.steps.requirements' },
    { id: 'files', label: 'Files', translationKey: 'workorders.steps.files' },
];

const WorkOrderCreateModal: React.FC<WorkOrderCreateModalProps> = ({
    open,
    onOpenChange,
    onWorkOrderCreatedOrUpdated,
}) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [createdWorkOrderId, setCreatedWorkOrderId] = useState<string | undefined>(undefined);
    const [currentStep, setCurrentStep] = useState<WizardStep>('basic');
    const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(new Set());

    // Store full item data for selected values
    const [selectedClientData, setSelectedClientData] = useState<any[]>([]);
    const [selectedLocationData, setSelectedLocationData] = useState<any[]>([]);
    const [statuses, setStatuses] = useState<Status[]>([]);
    const [types, setTypes] = useState<TicketWorkOrderType[]>([]);
    const [selectedStatusData, setSelectedStatusData] = useState<any[]>([]);
    const [selectedTypeData, setSelectedTypeData] = useState<TicketWorkOrderType[]>([]);
    const [selectedOriginWorkOrder, setSelectedOriginWorkOrder] = useState<any | null>(null);
    const [filesCount, setFilesCount] = useState(0);

    // State for additional wizard steps
    const [supervisors, setSupervisors] = useState<Employee[]>([]);
    const [assignees, setAssignees] = useState<Assignee[]>([]);
    const [checklists, setChecklists] = useState<Checklist[]>([]);
    const [skills, setSkills] = useState<Skill[]>([]);
    const [loadingSupervisors, setLoadingSupervisors] = useState(false);
    const [loadingAssignees, setLoadingAssignees] = useState(false);
    const [loadingChecklists, setLoadingChecklists] = useState(false);
    const [loadingSkills, setLoadingSkills] = useState(false);
    const [isSupervisorModalOpen, setIsSupervisorModalOpen] = useState(false);
    const [isAssigneeModalOpen, setIsAssigneeModalOpen] = useState(false);
    const [editingAssignee, setEditingAssignee] = useState<Assignee | null>(null);
    const [assigneeToUnassign, setAssigneeToUnassign] = useState<Assignee | null>(null);
    const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
    const [isChecklistEditorModalOpen, setIsChecklistEditorModalOpen] = useState(false);
    const [isChecklistEditModalOpen, setIsChecklistEditModalOpen] = useState(false);
    const [editingChecklist, setEditingChecklist] = useState<GeneralChecklist | null>(null);
    const [deletingChecklist, setDeletingChecklist] = useState(false);
    const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
    const [isSkillEditModalOpen, setIsSkillEditModalOpen] = useState(false);
    const [skillToEdit, setSkillToEdit] = useState<Skill | null>(null);

    const form = useForm<FormInputs>({
        resolver: zodResolver(formInputSchema),
        defaultValues: {
            name: '',
            status_id: '',
            type_of_charge: 'contract',
            client_id: '',
            location_id: '',
            type_id: '',
            priority: null,
            time_estimate: null,
            start_date: null,
            due_date: null,
            description: '',
            origin_type: 'none',
            origin_id: '',
            parent_work_order_id: '',
            difficulty: null,
            number_of_technicians: null,
            client_reference: '',
            special_checks: '',
        },
    });

    const watchedOriginType = form.watch('origin_type');

    const watchedClientId = form.watch('client_id');

    // Update selected client ID when form value changes
    useEffect(() => {
        setSelectedClientId(watchedClientId || null);
    }, [watchedClientId]);

    // Fetch work-orders status template and types when modal opens (like WorkOrderContext)
    useEffect(() => {
        const fetchStatuses = async () => {
            if (!orgId || !open) return;

            try {
                const response = await getOrgStatusTemplateStatuses(orgId, 'work-orders');
                if (response.success && response.success.statuses) {
                    const sortedStatuses = sortStatusesByCategoryAndPosition<Status>(response.success.statuses || []);
                    setStatuses(sortedStatuses);
                }
            } catch (error) {
                console.error('Error fetching work order statuses:', error);
            }
        };

        const fetchTypes = async () => {
            if (!orgId || !open) return;

            try {
                const response = await getOrgTicketWorkOrderTypes(orgId);
                if (response.success && response.success.tickets_wo_types) {
                    setTypes(response.success.tickets_wo_types || []);
                }
            } catch (error) {
                console.error('Error fetching work order types:', error);
            }
        };

        fetchStatuses();
        fetchTypes();
    }, [orgId, open]);

    // Reset form when modal opens
    useEffect(() => {
        if (open) {
            form.reset({
                name: '',
                status_id: '',
                type_of_charge: 'contract',
                client_id: '',
                location_id: '',
                type_id: '',
                priority: 'medium',
                time_estimate: null,
                start_date: null,
                due_date: null,
                description: '',
                origin_type: 'none',
                origin_id: '',
                parent_work_order_id: '',
                difficulty: null,
                number_of_technicians: null,
                client_reference: '',
                special_checks: '',
            });
            setSelectedClientId(null);
            setSelectedClientData([]);
            setSelectedLocationData([]);
            setSelectedStatusData([]);
            setSelectedTypeData([]);
            setSelectedOriginWorkOrder(null);
            setFilesCount(0);
            setCreatedWorkOrderId(undefined);
            setCurrentStep('basic');
            setCompletedSteps(new Set());
        }
    }, [open, form]);

    // Apply default status (first in position in not_started category) and type when loaded
    useEffect(() => {
        if (!open) return;

        if (statuses.length > 0) {
            const pendingStatuses = statuses.filter((s) => s.category === 'not_started');
            const statusesToPick = pendingStatuses.length > 0 ? pendingStatuses : statuses;
            const defaultStatus = statusesToPick.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))[0];
            if (defaultStatus) {
                form.setValue('status_id', defaultStatus.id);
                setSelectedStatusData([defaultStatus]);
            }
        }

        if (types.length > 0) {
            const defaultType = types[0];
            if (defaultType) {
                form.setValue('type_id', defaultType.id);
                setSelectedTypeData([defaultType]);
            }
        }
    }, [open, statuses, types, form]);

    // Handle form submission for basic info step
    const onSubmitBasicInfo = async (data: FormInputs) => {
        if (!orgId) return;

        setSubmitting(true);
        try {
            const payload: any = {
                name: data.name,
                status_id: data.status_id,
                type_of_charge: data.type_of_charge,
            };

            // Add optional fields if they have values
            if (data.client_id) payload.client_id = data.client_id;
            if (data.location_id) payload.location_id = data.location_id;
            if (data.type_id) payload.type_id = data.type_id;
            if (data.priority) payload.priority = data.priority;
            if (data.time_estimate !== null && data.time_estimate !== undefined) payload.time_estimate = data.time_estimate;
            if (data.start_date) payload.start_date = data.start_date.toISOString();
            if (data.due_date) payload.due_date = data.due_date.toISOString();
            if (data.description) payload.description = data.description;

            // Handle origin: pass origin_type and origin_id (not "origin")
            if (data.origin_type === 'ticket' && data.origin_id) {
                payload.origin_type = 'ticket';
                payload.origin_id = data.origin_id; // ticket.id
            } else if (data.origin_type === 'work_order') {
                if (data.parent_work_order_id) {
                    payload.parent_work_order_id = data.parent_work_order_id;
                }
                // If selected work order has origin, share the same origin
                if (selectedOriginWorkOrder?.origin) {
                    payload.origin_type = selectedOriginWorkOrder.origin.type;
                    payload.origin_id = selectedOriginWorkOrder.origin.id;
                }
            }

            if (data.difficulty !== null && data.difficulty !== undefined) payload.difficulty = data.difficulty;
            if (data.number_of_technicians !== null && data.number_of_technicians !== undefined) payload.number_of_technicians = data.number_of_technicians;
            if (data.client_reference) payload.client_reference = data.client_reference;
            if (data.special_checks) payload.special_checks = data.special_checks;

            const response = await postWorkOrder(orgId, payload);

            if (response.success) {
                if (response.success.work_order_id) {
                    setCreatedWorkOrderId(response.success.work_order_id);
                }

                toast.success(t('workorders.workOrderCreated', 'Work order created successfully'));

                // Mark basic step as completed and move to assignees step
                setCompletedSteps(prev => new Set(prev).add('basic'));
                setCurrentStep('assignees');
            } else {
                toast.error(t('workorders.errorCreatingWorkOrder', 'Error creating work order'));
            }
        } catch (error) {
            toast.error(t('workorders.errorCreatingWorkOrder', 'Error creating work order'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = async () => {
        // If work order was created, don't prompt for unsaved changes
        if (createdWorkOrderId) {
            onWorkOrderCreatedOrUpdated?.();
            form.reset();
            onOpenChange(false);
            return;
        }

        const isDirty = form.formState.isDirty;
        if (isDirty) {
            const shouldClose = await promptUnsavedChanges();
            if (shouldClose) {
                form.reset();
                onOpenChange(false);
            }
        } else {
            form.reset();
            onOpenChange(false);
        }
    };

    const handleNext = () => {
        const currentIndex = STEPS.findIndex(s => s.id === currentStep);
        if (currentIndex < STEPS.length - 1) {
            // Mark current step as completed
            setCompletedSteps(prev => new Set(prev).add(currentStep));
            setCurrentStep(STEPS[currentIndex + 1].id);
        }
    };

    const handlePrevious = () => {
        const currentIndex = STEPS.findIndex(s => s.id === currentStep);
        if (currentIndex > 0) {
            setCurrentStep(STEPS[currentIndex - 1].id);
        }
    };

    const handleFinish = () => {
        onWorkOrderCreatedOrUpdated?.();
        form.reset();
        onOpenChange(false);
        if (orgId && createdWorkOrderId) {
            navigate(`/${orgId}/work-orders/${createdWorkOrderId}`);
        }
    };

    const getCurrentStepIndex = () => {
        return STEPS.findIndex(s => s.id === currentStep);
    };

    const isLastStep = () => {
        return getCurrentStepIndex() === STEPS.length - 1;
    };

    const isFirstStep = () => {
        return getCurrentStepIndex() === 0;
    };

    const canGoNext = () => {
        // Can only go next if work order has been created
        return !!createdWorkOrderId;
    };

    const hasCurrentStepInput = () => {
        switch (currentStep) {
            case 'files':
                return filesCount > 0;
            case 'assignees':
                return supervisors.length > 0 || assignees.length > 0;
            case 'requirements':
                return checklists.length > 0 || skills.length > 0;
            default:
                return false;
        }
    };

    const handleSkipAll = () => {
        handleFinish();
    };

    // Fetch functions for wizard steps
    const fetchSupervisors = async () => {
        if (!orgId || !createdWorkOrderId) return;
        setLoadingSupervisors(true);
        try {
            const response = await getWorkOrderSupervisors(orgId, createdWorkOrderId);
            if (response.success) {
                setSupervisors(response.success.supervisors || []);
            }
        } catch (error) {
            console.error('Error fetching supervisors:', error);
        } finally {
            setLoadingSupervisors(false);
        }
    };

    const fetchAssignees = async () => {
        if (!orgId || !createdWorkOrderId) return;
        setLoadingAssignees(true);
        try {
            const response = await getWorkOrderAssignees(orgId, createdWorkOrderId);
            if (response.success) {
                setAssignees(response.success.assignees || []);
            }
        } catch (error) {
            console.error('Error fetching assignees:', error);
        } finally {
            setLoadingAssignees(false);
        }
    };

    const fetchChecklists = async () => {
        if (!orgId || !createdWorkOrderId) return;
        setLoadingChecklists(true);
        try {
            const response = await getWorkOrderChecklists(orgId, createdWorkOrderId);
            if (response.success) {
                setChecklists(response.success.checklists || []);
            }
        } catch (error) {
            console.error('Error fetching checklists:', error);
        } finally {
            setLoadingChecklists(false);
        }
    };

    const fetchSkills = async () => {
        if (!orgId || !createdWorkOrderId) return;
        setLoadingSkills(true);
        try {
            const response = await getWorkOrderHardSkills(orgId, createdWorkOrderId);
            if (response.success) {
                setSkills(response.success.hard_skills || []);
            }
        } catch (error) {
            console.error('Error fetching skills:', error);
        } finally {
            setLoadingSkills(false);
        }
    };

    // Fetch data when entering specific steps
    useEffect(() => {
        if (currentStep === 'assignees' && createdWorkOrderId) {
            fetchSupervisors();
            fetchAssignees();
        } else if (currentStep === 'requirements' && createdWorkOrderId) {
            fetchChecklists();
            fetchSkills();
        }
    }, [currentStep, createdWorkOrderId, orgId]);

    const handleFilesChange = useCallback((files: unknown[]) => {
        setFilesCount(files?.length ?? 0);
    }, []);

    // Delete handlers
    const handleDeleteSupervisor = async (supervisorId: string) => {
        if (!orgId || !createdWorkOrderId) return;
        try {
            await deleteWorkOrderSupervisor(orgId, createdWorkOrderId, supervisorId);
            toast.success(t('workorders.supervisorDeleted', 'Supervisor removed successfully'));
            fetchSupervisors();
        } catch (error) {
            toast.error(t('workorders.errorDeletingSupervisor', 'Error removing supervisor'));
        }
    };

    const handleOpenUnassignModal = (assignee: Assignee) => {
        setAssigneeToUnassign(assignee);
    };

    const handleConfirmUnassign = async (notes: string) => {
        if (!orgId || !createdWorkOrderId || !assigneeToUnassign) return;
        try {
            const response = await deleteWorkOrderAssignee(orgId, createdWorkOrderId, assigneeToUnassign.employee.id, {
                notes,
            });
            if (response?.success !== false) {
                toast.success(t('workorders.assigneeDeleted', 'Employee removed successfully'));
                fetchAssignees();
                setAssigneeToUnassign(null);
                if (editingAssignee?.employee.id === assigneeToUnassign.employee.id) {
                    setIsAssigneeModalOpen(false);
                    setEditingAssignee(null);
                }
            } else {
                toast.error(response?.error ?? t('workorders.errorDeletingAssignee', 'Error removing employee'));
                throw new Error(response?.error);
            }
        } catch (error) {
            toast.error(t('workorders.errorDeletingAssignee', 'Error removing employee'));
            throw error;
        }
    };

    const handleDeleteChecklist = async (checklistId: string) => {
        if (!orgId || !createdWorkOrderId) return;
        try {
            await deleteWorkOrderChecklist(orgId, createdWorkOrderId, checklistId);
            toast.success(t('workorders.checklistDeleted', 'Checklist removed successfully'));
            fetchChecklists();
        } catch (error) {
            toast.error(t('workorders.errorDeletingChecklist', 'Error removing checklist'));
        }
    };

    const handleEditChecklist = (checklist: Checklist) => {
        const generalChecklist: GeneralChecklist = {
            id: checklist.id,
            name: checklist.name,
            description: checklist.description || '',
            data: checklist.data,
        };
        setEditingChecklist(generalChecklist);
        setIsChecklistEditorModalOpen(true);
    };

    const handleChecklistEditorUpdated = () => {
        setIsChecklistEditorModalOpen(false);
        setEditingChecklist(null);
        fetchChecklists();
    };

    const handleDeleteChecklistFromEditor = async () => {
        if (!editingChecklist || !orgId || !createdWorkOrderId) return;
        setDeletingChecklist(true);
        try {
            const response = await deleteWorkOrderChecklist(orgId, createdWorkOrderId, editingChecklist.id);
            if (response.success) {
                toast.success(t('workorders.checklist.deletedSuccessfully', 'Checklist removed successfully'));
                handleChecklistEditorUpdated();
            } else {
                toast.error(response.error as string || t('workorders.checklist.errorDeleting', 'Error removing checklist'));
            }
        } catch (error) {
            console.error('Error deleting checklist:', error);
            toast.error(t('workorders.checklist.errorDeleting', 'Error removing checklist'));
        } finally {
            setDeletingChecklist(false);
        }
    };

    const handleChecklistSave = async (checklistId: string, data: { name: string; description: string; data: { fields: ChecklistField[] } }) => {
        if (!orgId || !createdWorkOrderId) {
            throw new Error('Organization ID or Work Order ID is required');
        }
        return await patchWorkOrderChecklist(orgId, createdWorkOrderId, checklistId, data);
    };

    const handleDeleteSkill = async (skillId: string) => {
        if (!orgId || !createdWorkOrderId) return;
        try {
            // Pass remaining skills - API replaces with what is passed
            const remaining = skills
                .filter((s) => s.id !== skillId)
                .map((s) => ({ id: s.id, level: s.level ?? 1 }));
            await postWorkOrderHardSkill(orgId, createdWorkOrderId, { skills: remaining });
            toast.success(t('workorders.skillDeleted', 'Skill removed successfully'));
            fetchSkills();
        } catch (error) {
            toast.error(t('workorders.errorDeletingSkill', 'Error removing skill'));
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                className="max-w-2xl md:min-w-4xl w-full max-h-[90vh] min-h-[90vh] overflow-hidden flex flex-col"
                showCloseButton={false}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between gap-2 text-lg font-semibold">
                        <span>{t('workorders.addWorkOrder', 'Add Work Order')}</span>
                    </DialogTitle>
                </DialogHeader>

                {/* Step Indicator */}
                <div className="flex items-center justify-between gap-2 px-2 py-2">
                    {STEPS.map((step, index) => {
                        const isCompleted = completedSteps.has(step.id);
                        const isCurrent = step.id === currentStep;
                        const isAccessible = index === 0 || completedSteps.has(STEPS[index - 1].id);

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
                                    <div className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs",
                                        isCurrent && "bg-primary text-primary-foreground",
                                        isCompleted && !isCurrent && "bg-primary/20 text-primary",
                                        !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                                    )}>
                                        {isCompleted ? <Check className="h-3 w-3" /> : index + 1}
                                    </div>
                                    <span className="hidden sm:inline">{t(step.translationKey, step.label)}</span>
                                </button>
                                {index < STEPS.length - 1 && (
                                    <div className={cn(
                                        "h-[2px] flex-1 mx-1",
                                        isCompleted ? "bg-primary/50" : "bg-muted"
                                    )} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Step Content */}
                <div className="flex-1 overflow-y-auto scrollbar-hide px-2 -mx-2">
                    {currentStep === 'basic' && (
                        <Form {...form}>
                            <div className="space-y-6 py-2">

                                {/* Client Info Section */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                                        {t('workorders.sections.orderDetails', 'Order Details')}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Client */}
                                        <FormField
                                            control={form.control}
                                            name="client_id"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('workorders.client', 'Client')} *</FormLabel>
                                                    <FormControl>
                                                        <MultiSelectApi
                                                            fetchOptions={getClients}
                                                            fetchArgs={[orgId]}
                                                            optionsKey="clients"
                                                            customValueKey={(item) => item.id}
                                                            customLabelKey={(item) => (
                                                                <ClientAvatar client={item} showNameExtra={true} />
                                                            )}
                                                            placeholder={t('workorders.selectClient', 'Select client...')}
                                                            searchPlaceholder={t('workorders.searchClient', 'Search clients...')}
                                                            emptyText={t('workorders.noClients', 'No clients found')}
                                                            value={field.value ? [field.value] : []}
                                                            onChangeValue={(values) => {
                                                                const selectedValue = values[0] || '';
                                                                field.onChange(selectedValue);

                                                                if (!values[0]) {
                                                                    setSelectedClientData([]);
                                                                }

                                                                form.setValue('location_id', '');
                                                                setSelectedLocationData([]);
                                                            }}
                                                            onChangeValueWithItem={(_values, itemsMap) => {
                                                                const selectedItemsData = Array.from(itemsMap.values());
                                                                setSelectedClientData(selectedItemsData);
                                                            }}
                                                            defaultItems={selectedClientData}
                                                            maxCount={1}
                                                            disabled={submitting}
                                                            className="w-full truncate"
                                                            isApiSearchable={true}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Location */}
                                        <FormField
                                            control={form.control}
                                            name="location_id"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('workorders.location', 'Location')}</FormLabel>
                                                    <FormControl>
                                                        <MultiSelectApi
                                                            key={`location-${selectedClientId || 'none'}`}
                                                            fetchOptions={getClientLocations}
                                                            fetchArgs={[orgId, selectedClientId || '']}
                                                            optionsKey="locations"
                                                            customValueKey={(item) => item.id}
                                                            customLabelKey={(item) => (
                                                                <div className="flex items-center gap-2">
                                                                    {item.icon_url && (
                                                                        <DynamicIcon
                                                                            name={item.icon_url as IconName}
                                                                            className="h-4 w-4 text-foreground"
                                                                        />
                                                                    )}
                                                                    <span>{item.name}</span>
                                                                </div>
                                                            )}
                                                            placeholder={t('workorders.selectLocation', 'Select location...')}
                                                            searchPlaceholder={t('workorders.searchLocation', 'Search locations...')}
                                                            emptyText={t('workorders.noLocations', 'No locations found')}
                                                            value={field.value ? [field.value] : []}
                                                            onChangeValue={(values) => {
                                                                const selectedValue = values[0] || '';
                                                                field.onChange(selectedValue);

                                                                if (!values[0]) {
                                                                    setSelectedLocationData([]);
                                                                }
                                                            }}
                                                            onChangeValueWithItem={(_values, itemsMap) => {
                                                                const selectedItemsData = Array.from(itemsMap.values());
                                                                setSelectedLocationData(selectedItemsData);
                                                            }}
                                                            defaultItems={selectedLocationData}
                                                            maxCount={1}
                                                            disabled={submitting || !selectedClientId}
                                                            className="w-full truncate"
                                                            isApiSearchable={true}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Client Reference */}
                                        <FormField
                                            control={form.control}
                                            name="client_reference"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('workorders.clientReference', 'Client Reference')}</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder={t('workorders.clientReferencePlaceholder', 'Enter client reference')} disabled={submitting} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Order Details Section */}
                                <div className="space-y-4">
                                    {/* Name + Type of Charge - 3 column grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                                        {/* Name - Takes 2 columns */}
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem className="md:col-span-2">
                                                    <FormLabel>{t('workorders.name', 'Name')} *</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder={t('workorders.namePlaceholder', 'Enter work order name')} disabled={submitting} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Status, Type, Priority - 3 column grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                        {/* Status */}
                                        <FormField
                                            control={form.control}
                                            name="status_id"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('workorders.status', 'Status')} *</FormLabel>
                                                    <FormControl>
                                                        <MultiSelectApi
                                                            fetchOptions={async () => ({ success: { statuses } })}
                                                            fetchArgs={[]}
                                                            optionsKey="statuses"
                                                            customValueKey={(item) => item.id}
                                                            customLabelKey={(item) => (
                                                                <Tag text={item.name} color={item.color || ""} className="capitalize" />
                                                            )}
                                                            placeholder={t('workorders.selectStatus', 'Select status...')}
                                                            searchPlaceholder={t('workorders.searchStatus', 'Search statuses...')}
                                                            emptyText={t('workorders.noStatuses', 'No statuses found')}
                                                            value={field.value ? [field.value] : []}
                                                            onChangeValue={(values) => {
                                                                const selectedValue = values[0] || '';
                                                                field.onChange(selectedValue);

                                                                if (!values[0]) {
                                                                    setSelectedStatusData([]);
                                                                }
                                                            }}
                                                            onChangeValueWithItem={(_values, itemsMap) => {
                                                                const selectedItemsData = Array.from(itemsMap.values());
                                                                setSelectedStatusData(selectedItemsData);
                                                            }}
                                                            defaultItems={selectedStatusData}
                                                            maxCount={1}
                                                            disabled={submitting}
                                                            className="w-full truncate"
                                                            isApiSearchable={false}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Type */}
                                        <FormField
                                            control={form.control}
                                            name="type_id"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('workorders.type', 'Type')}</FormLabel>
                                                    <FormControl>
                                                        <MultiSelectApi
                                                            fetchOptions={getOrgTicketWorkOrderTypes}
                                                            fetchArgs={[orgId || '']}
                                                            optionsKey="tickets_wo_types"
                                                            customValueKey={(item) => item.id}
                                                            customLabelKey={(item) => (
                                                                <Tag text={item.name} color={item.color || ""} />
                                                            )}
                                                            placeholder={t('workorders.selectType', 'Select type...')}
                                                            value={field.value ? [field.value] : []}
                                                            onChangeValue={(values) => field.onChange(values[0] || '')}
                                                            onChangeValueWithItem={(_values, itemsMap) => {
                                                                setSelectedTypeData(Array.from(itemsMap.values()));
                                                            }}
                                                            defaultItems={selectedTypeData}
                                                            maxCount={1}
                                                            className="w-full truncate"
                                                            disabled={submitting}
                                                            isApiSearchable={true}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Priority */}
                                        <FormField
                                            control={form.control}
                                            name="priority"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('workorders.priority', 'Priority')}</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value || ''} disabled={submitting}>
                                                        <FormControl>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder={t('workorders.selectPriority', 'Select priority')} />
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
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Start Date and Due Date - 2 columns */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <DateTimePicker
                                            form={form}
                                            name="start_date"
                                            showMonthYearPicker={true}
                                            label={t('workorders.startDate', 'Start Date')}
                                            placeholder={t('workorders.selectStartDate', 'Select start date')}
                                            required={false}
                                            showTime={false}
                                            disabled={submitting}
                                        />
                                        <DateTimePicker
                                            form={form}
                                            name="due_date"
                                            showMonthYearPicker={true}
                                            label={t('workorders.dueDate', 'Due Date')}
                                            placeholder={t('workorders.selectDueDate', 'Select due date')}
                                            required={false}
                                            showTime={false}
                                            disabled={submitting}
                                        />
                                        {/* Type of Charge*/}
                                        <FormField
                                            control={form.control}
                                            name="type_of_charge"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('workorders.typeOfCharge', 'Type of Charge')} *</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value || ''} disabled={submitting}>
                                                        <FormControl>
                                                            <SelectTrigger className="w-full">
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
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Description - Full Width */}
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('workorders.description', 'Description')}</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        {...field}
                                                        placeholder={t('workorders.descriptionPlaceholder', 'Enter work order description')}
                                                        rows={4}
                                                        disabled={submitting}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Origin Section */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                                        {t('workorders.sections.origin', 'Origin')}
                                    </h3>

                                    {/* Origin Type Selector - no label, section title is "Origin" */}
                                    <FormField
                                        control={form.control}
                                        name="origin_type"
                                        render={({ field }) => (
                                            <FormItem className="space-y-3">
                                                <FormControl>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                        <Button
                                                            type="button"
                                                            variant={(field.value ?? 'none') === 'none' ? 'default' : 'outline'}
                                                            className="flex-1"
                                                            onClick={() => {
                                                                field.onChange('none');
                                                                form.setValue('origin_id', '');
                                                                form.setValue('parent_work_order_id', '');
                                                                setSelectedOriginWorkOrder(null);
                                                            }}
                                                            disabled={submitting}
                                                        >
                                                            {t('workorders.originNone', 'None')}
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant={(field.value ?? 'none') === 'ticket' ? 'default' : 'outline'}
                                                            className="flex-1"
                                                            onClick={() => {
                                                                field.onChange('ticket');
                                                                form.setValue('parent_work_order_id', '');
                                                                setSelectedOriginWorkOrder(null);
                                                                form.setValue('origin_id', '');
                                                            }}
                                                            disabled={submitting || !selectedClientId}
                                                        >
                                                            <Ticket className="h-4 w-4 mr-2 shrink-0" />
                                                            {t('workorders.originTicket', 'Ticket')}
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant={(field.value ?? 'none') === 'work_order' ? 'default' : 'outline'}
                                                            className="flex-1"
                                                            onClick={() => {
                                                                field.onChange('work_order');
                                                                form.setValue('origin_id', '');
                                                                setSelectedOriginWorkOrder(null);
                                                            }}
                                                            disabled={submitting || !selectedClientId}
                                                        >
                                                            <ClipboardCopy className="h-4 w-4 mr-2 shrink-0" />
                                                            {t('workorders.originWorkOrder', 'Work Order')}
                                                        </Button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Conditional Ticket Selector */}
                                    {watchedOriginType === 'ticket' && (
                                        <FormField
                                            control={form.control}
                                            name="origin_id"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('workorders.selectTicket', 'Select Ticket')}</FormLabel>
                                                    <FormControl>
                                                        <MultiSelectApi
                                                            key={`ticket-origin-${selectedClientId || 'none'}-${form.watch('location_id') || 'none'}`}
                                                            fetchOptions={getOrgTickets}
                                                            fetchArgs={[orgId || '', undefined, undefined]}
                                                            optionsKey="tickets"
                                                            customValueKey={(item) => item.id}
                                                            customLabelKey={(item) => <TicketLabel data={item} textClassName="max-w-xs truncate" icons={["priority"]} />}
                                                            placeholder={t('workorders.searchTicket', 'Search tickets...')}
                                                            searchPlaceholder={t('workorders.searchTicket', 'Search tickets...')}
                                                            emptyText={t('workorders.noTickets', 'No tickets found')}
                                                            value={field.value ? [field.value] : []}
                                                            onChangeValue={(values) => field.onChange(values[0] || '')}
                                                            maxCount={1}
                                                            className="w-full truncate"
                                                            disabled={submitting}
                                                            isApiSearchable={true}
                                                            enableParams="hidden"
                                                            defaultParams={selectedClientId
                                                                ? (() => {
                                                                    const locId = form.getValues('location_id');
                                                                    return locId
                                                                        ? clientAndLocationFilterTemplate(selectedClientId, locId)
                                                                        : clientOnlyFilterTemplate(selectedClientId);
                                                                })()
                                                                : null
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    {/* Conditional Work Order Selector */}
                                    {watchedOriginType === 'work_order' && (
                                        <FormField
                                            control={form.control}
                                            name="parent_work_order_id"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('workorders.selectParentWorkOrder', 'Select Parent Work Order')}</FormLabel>
                                                    <FormControl>
                                                        <MultiSelectApi
                                                            key={`workorder-origin-${selectedClientId || 'none'}-${form.watch('location_id') || 'none'}`}
                                                            fetchOptions={getWorkOrders}
                                                            fetchArgs={[orgId || '']}
                                                            optionsKey="work_orders"
                                                            customValueKey={(item) => item.id}
                                                            customLabelKey={(item) => <WorkOrderLabel data={item} textClassName="max-w-xs truncate" icons={["priority"]} />}
                                                            placeholder={t('workorders.searchWorkOrder', 'Search work orders...')}
                                                            searchPlaceholder={t('workorders.searchWorkOrder', 'Search work orders...')}
                                                            emptyText={t('workorders.noWorkOrders', 'No work orders found')}
                                                            value={field.value ? [field.value] : []}
                                                            onChangeValue={(values) => field.onChange(values[0] || '')}
                                                            onChangeValueWithItem={(values, itemsMap) => {
                                                                const workOrder = values[0] ? Array.from(itemsMap.values())[0] : null;
                                                                setSelectedOriginWorkOrder(workOrder);
                                                            }}
                                                            maxCount={1}
                                                            className="w-full truncate"
                                                            disabled={submitting}
                                                            isApiSearchable={true}
                                                            enableParams="hidden"
                                                            defaultParams={selectedClientId
                                                                ? (() => {
                                                                    const locId = form.getValues('location_id');
                                                                    return locId
                                                                        ? clientAndLocationFilterTemplate(selectedClientId, locId)
                                                                        : clientOnlyFilterTemplate(selectedClientId);
                                                                })()
                                                                : null
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>

                                {/* Advanced Details Section */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                                        {t('workorders.sections.advancedDetails', 'Advanced Details')}
                                    </h3>

                                    {/* Second Row: Time Estimate, Difficulty, Number of Technicians - 3 columns */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Time Estimate */}
                                        <FormField
                                            control={form.control}
                                            name="time_estimate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('workorders.timeEstimate', 'Time Estimate (hours)')}</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            {...field}
                                                            value={field.value ?? ''}
                                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                                            placeholder={t('workorders.timeEstimatePlaceholder', 'Enter estimated hours')}
                                                            disabled={submitting}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Difficulty */}
                                        <FormField
                                            control={form.control}
                                            name="difficulty"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('workorders.difficulty', 'Difficulty (0-10)')}</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="10"
                                                            {...field}
                                                            value={field.value ?? ''}
                                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                                            placeholder={t('workorders.difficultyPlaceholder', 'Enter difficulty level')}
                                                            disabled={submitting}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Number of Technicians */}
                                        <FormField
                                            control={form.control}
                                            name="number_of_technicians"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('workorders.numberOfTechnicians', 'Number of Technicians')}</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            {...field}
                                                            value={field.value ?? ''}
                                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                                            placeholder={t('workorders.numberOfTechniciansPlaceholder', 'Enter number of technicians')}
                                                            disabled={submitting}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Special Checks - Full Width */}
                                    <FormField
                                        control={form.control}
                                        name="special_checks"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-1.5">
                                                    {t('workorders.specialChecks', 'Special Checks')}
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Info className="h-4 w-4 text-muted-foreground shrink-0 cursor-help" />
                                                            </TooltipTrigger>
                                                            <TooltipContent className="max-w-sm">
                                                                <p>{getSpecialChecksTooltipText((k, fb) => t(k, fb ?? ''))}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        {...field}
                                                        placeholder={t('workorders.specialChecksPlaceholder', 'Enter special checks or notes')}
                                                        rows={3}
                                                        disabled={submitting}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </Form>
                    )}

                    {currentStep === 'assignees' && createdWorkOrderId && orgId && (
                        <div className="py-2 space-y-10 gap-10">
                            {/* Supervisors section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        {t('workorders.supervisors', 'Supervisors')}
                                        <Badge variant="secondary">{supervisors.length}</Badge>
                                    </h3>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsSupervisorModalOpen(true)}
                                    >
                                        <Plus className="h-4 w-4" />
                                        {t('workorders.addSupervisor', 'Add')}
                                    </Button>
                                </div>
                                {loadingSupervisors ? (
                                    <div className="flex items-center justify-center p-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : supervisors.length === 0 ? (
                                    <div className="text-sm text-muted-foreground py-6 text-center">
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {supervisors.map((supervisor) => (
                                            <div key={supervisor.id} className="flex items-center justify-between text-sm py-2 px-2 rounded border">
                                                <EmployeeAvatar
                                                    employee={supervisor as any}
                                                    showJobTitle={true}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleDeleteSupervisor(supervisor.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <WorkOrderSupervisorAddModal
                                    open={isSupervisorModalOpen}
                                    onOpenChange={setIsSupervisorModalOpen}
                                    orgId={orgId}
                                    workOrderId={createdWorkOrderId}
                                    onSuccess={fetchSupervisors}
                                />
                            </div>

                            {/* Assignees (employees) section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        {t('workorders.employees', 'Employees')}
                                        <Badge variant="secondary">{assignees.length}</Badge>
                                    </h3>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setEditingAssignee(null);
                                            setIsAssigneeModalOpen(true);
                                        }}
                                    >
                                        <Plus className="h-4 w-4" />
                                        {t('workorders.addEmployee', 'Add')}
                                    </Button>
                                </div>
                                {loadingAssignees ? (
                                    <div className="flex items-center justify-center p-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : assignees.length === 0 ? (
                                    <div className="text-sm text-muted-foreground py-6 text-center">
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {assignees.map((assignee) => (
                                            <div key={assignee.employee.id} className="flex items-center justify-between text-sm py-2 px-2 rounded border">
                                                <div className="flex-1 min-w-0">
                                                    <EmployeeAvatar
                                                        employee={assignee.employee as any}
                                                        showJobTitle={true}
                                                    />
                                                    {assignee.notes && (
                                                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                            {assignee.notes}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => {
                                                            setEditingAssignee(assignee);
                                                            setIsAssigneeModalOpen(true);
                                                        }}
                                                    >
                                                        <SquarePen className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleOpenUnassignModal(assignee)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <WorkOrderAssigneeAddModal
                                    open={isAssigneeModalOpen && editingAssignee === null}
                                    onOpenChange={(open) => {
                                        setIsAssigneeModalOpen(open);
                                        if (!open) setEditingAssignee(null);
                                    }}
                                    orgId={orgId}
                                    workOrderId={createdWorkOrderId}
                                    onSuccess={fetchAssignees}
                                />
                                <WorkOrderAssigneeEditModal
                                    open={isAssigneeModalOpen && editingAssignee !== null}
                                    onOpenChange={(open) => {
                                        setIsAssigneeModalOpen(open);
                                        if (!open) setEditingAssignee(null);
                                    }}
                                    orgId={orgId}
                                    workOrderId={createdWorkOrderId}
                                    assignee={editingAssignee}
                                    onSuccess={fetchAssignees}
                                    renderActions={
                                        editingAssignee ? (
                                            <CustomActionsDropdown
                                                items={[
                                                    {
                                                        label: t('common.unassign', 'Unassign'),
                                                        icon: 'user-round-x',
                                                        onClick: () => handleOpenUnassignModal(editingAssignee),
                                                        variant: 'destructive',
                                                    },
                                                ]}
                                            />
                                        ) : undefined
                                    }
                                />
                                <WorkOrderAssigneeDeleteModal
                                    open={!!assigneeToUnassign}
                                    onOpenChange={(open) => !open && setAssigneeToUnassign(null)}
                                    assignee={assigneeToUnassign}
                                    onConfirm={handleConfirmUnassign}
                                />
                            </div>
                        </div>
                    )}

                    {currentStep === 'requirements' && createdWorkOrderId && orgId && (
                        <div className="py-2 space-y-6">
                            {/* Technologies section - first */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        {t('workorders.technologies', 'Technologies')}
                                        <Badge variant="secondary">{skills.length}</Badge>
                                    </h3>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsSkillModalOpen(true)}
                                    >
                                        <Plus className="h-4 w-4" />
                                        {t('workorders.addTechnology', 'Add')}
                                    </Button>
                                </div>
                                {loadingSkills ? (
                                    <div className="flex items-center justify-center p-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : skills.length === 0 ? (
                                    <div className="text-sm text-muted-foreground py-6 text-center">
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {skills.map((skill) => (
                                            <div key={skill.id} className="flex items-center justify-between gap-2 text-sm py-2 px-2 rounded border">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium">{skill.name}</div>
                                                    {getSkillDescriptionForLevel(skill.description, skill.level ?? 1) && (
                                                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                            {getSkillDescriptionForLevel(skill.description, skill.level ?? 1)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <StarsLabel level={skill.level ?? 1} variant="default" size="md" />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => {
                                                            setSkillToEdit(skill);
                                                            setIsSkillEditModalOpen(true);
                                                        }}
                                                    >
                                                        <SquarePen className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDeleteSkill(skill.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <AddSkillModal
                                    open={isSkillModalOpen}
                                    onOpenChange={setIsSkillModalOpen}
                                    orgId={orgId}
                                    workOrderId={createdWorkOrderId}
                                    currentSkills={skills}
                                    onSuccess={fetchSkills}
                                />
                                <WorkOrderHardSkillEditModal
                                    open={isSkillEditModalOpen}
                                    onOpenChange={(open) => {
                                        setIsSkillEditModalOpen(open);
                                        if (!open) setSkillToEdit(null);
                                    }}
                                    orgId={orgId}
                                    workOrderId={createdWorkOrderId}
                                    skill={skillToEdit}
                                    currentSkills={skills}
                                    onSuccess={fetchSkills}
                                />
                            </div>

                            {/* Checklists section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        {t('workorders.checklists', 'Checklists')}
                                        <Badge variant="secondary">{checklists.length}</Badge>
                                    </h3>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsChecklistModalOpen(true)}
                                    >
                                        <Plus className="h-4 w-4" />
                                        {t('workorders.addChecklist', 'Add')}
                                    </Button>
                                </div>
                                {loadingChecklists ? (
                                    <div className="flex items-center justify-center p-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : checklists.length === 0 ? (
                                    <div className="text-sm text-muted-foreground py-6 text-center">
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {checklists.map((checklist) => (
                                            <div key={checklist.id} className="flex items-center justify-between text-sm py-2 px-2 rounded border">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium">{checklist.name}</div>
                                                    {checklist.description && (
                                                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                            {checklist.description}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => handleEditChecklist(checklist)}
                                                    >
                                                        <SquarePen className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDeleteChecklist(checklist.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <WorkOrderChecklistAddModal
                                    open={isChecklistModalOpen}
                                    onOpenChange={setIsChecklistModalOpen}
                                    orgId={orgId}
                                    workOrderId={createdWorkOrderId}
                                    onChecklistUpdated={fetchChecklists}
                                />
                                <ChecklistEditorModal
                                    open={isChecklistEditorModalOpen}
                                    onOpenChange={(open) => {
                                        if (!open) {
                                            setEditingChecklist(null);
                                        }
                                        setIsChecklistEditorModalOpen(open);
                                    }}
                                    checklist={editingChecklist}
                                    onChecklistUpdated={handleChecklistEditorUpdated}
                                    renderActions={() => (
                                        <CustomActionsDropdown
                                            items={[
                                                {
                                                    label: t('workorders.checklist.editNameDescription', 'Edit name & description'),
                                                    icon: 'edit',
                                                    onClick: () => setIsChecklistEditModalOpen(true),
                                                },
                                                {
                                                    label: t('common.actions.delete', 'Delete'),
                                                    icon: 'trash-2',
                                                    onClick: () => {
                                                        if (!deletingChecklist) handleDeleteChecklistFromEditor();
                                                    },
                                                    variant: 'destructive',
                                                },
                                            ]}
                                        />
                                    )}
                                    onSave={handleChecklistSave}
                                />
                                <WorkOrderChecklistEditModal
                                    open={isChecklistEditModalOpen}
                                    onOpenChange={(open) => {
                                        setIsChecklistEditModalOpen(open);
                                    }}
                                    checklist={editingChecklist ? checklists.find((c) => c.id === editingChecklist.id) ?? null : null}
                                    onChecklistUpdated={fetchChecklists}
                                    orgId={orgId}
                                    workOrderId={createdWorkOrderId}
                                />
                            </div>
                        </div>
                    )}

                    {currentStep === 'files' && createdWorkOrderId && (
                        <div className="py-2">
                            <FilesSection
                                entity_id={createdWorkOrderId}
                                showBreadcrumbs={true}
                                showSearch={true}
                                showCreateFolder={false}
                                showUpload={true}
                                onFilesChange={handleFilesChange}
                            />
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
                                    {t('common.previous', 'Previous')}
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={submitting}
                            >
                                {createdWorkOrderId ? t('common.close', 'Close') : t('common.cancel', 'Cancel')}
                            </Button>
                            {currentStep === 'basic' && !createdWorkOrderId && (
                                <Button
                                    type="submit"
                                    onClick={form.handleSubmit(onSubmitBasicInfo)}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            {t('common.creating', 'Creating...')}
                                        </>
                                    ) : (
                                        <>
                                            {t('common.create', 'Create')}
                                            <ChevronRight className="h-4 w-4 ml-1" />
                                        </>
                                    )}
                                </Button>
                            )}
                            {currentStep !== 'basic' && !isLastStep() && (
                                <Button
                                    type="button"
                                    onClick={handleNext}
                                    disabled={!canGoNext()}
                                >
                                    {hasCurrentStepInput() ? t('common.next', 'Next') : t('common.skip', 'Skip')}
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            )}
                            {currentStep !== 'basic' && !isLastStep() && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleSkipAll}
                                    disabled={!canGoNext()}
                                >
                                    {t('common.skipAll', 'Skip all')}
                                </Button>
                            )}
                            {isLastStep() && (
                                <Button
                                    type="button"
                                    onClick={handleFinish}
                                >
                                    {t('common.finish', 'Finish')}
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

export default WorkOrderCreateModal;
