import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Check, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { postOrgTicket, patchOrgTicket } from "@/api/field-service/tickets/tickets";
import { Ticket } from "@/types/field-service/tickets/tickets";
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
import { PhoneInput } from "@/app/components/forms-elements/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelectApi } from "@/app/components/forms-elements/multi-select-api";
import { MultiSelectApiHierarchy } from "@/app/components/forms-elements/multi-select-api-hierarchy";
import { getClients } from "@/api/clients/clients";
import { getClientLocations } from "@/api/clients/locations/locations";
import { getClientContacts } from "@/api/clients/contacts/contacts";
import { getClientInventory } from "@/api/clients/inventory/inventory";
import { ClientContact } from "@/types/clients/client";
import { getOrgTicketWorkOrderTypes } from "@/api/field-service/tickets-work-orders-types/tickets-work-orders-types";
import ClientLabel from "@/app/components/labels/client-label";
import LocationLabel from "@/app/components/labels/location-label";
import { promptUnsavedChanges } from "@/app/components/forms-elements/modal-unsaved";
import IdBadge from "@/app/components/id-badge";
import { TicketWorkOrderPriority, TicketWorkOrderType } from "@/types/field-service/ticket-work-order-types";
import { cn } from "@/lib/utils";
import FilesSection from "@/app/components/files/files-section";
import { getOrgTicketSupervisors, deleteOrgTicketSupervisor } from "@/api/field-service/tickets/supervisors/supervisors";
import { Employee } from "@/types/employees/employees";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";
import { Badge } from "@/components/ui/badge";
import TicketSupervisorEditModal from "./ticket-supervisor-edit-modal";
import PriorityLabel from "@/app/components/labels/priority-label";
import Tag from "@/app/components/tag/tag";

// Form validation schema for create mode (no supervisor_id - managed via supervisors tab)
const createTicketSchema = z.object({
  client_reference: z.string().optional(),
  client_id: z.string().min(1, "Client is required"),
  location_id: z.string().optional().or(z.literal("")),
  inventory_id: z.string().optional().or(z.literal("")),
  type_id: z.string().optional().or(z.literal("")),
  priority: z.enum(["urgent", "high", "medium", "low"]),
  status: z.enum(["in_progress", "closed"]),
  description: z.string().optional(),
  contact_first_name: z.string().optional(),
  contact_last_name: z.string().optional(),
  contact_email: z.string().email("Invalid email").optional().or(z.literal("")),
  contact_phone: z.string().optional(),
});

// Wizard steps
type WizardStep = "basic" | "supervisors" | "files";

const STEPS: { id: WizardStep; label: string; translationKey: string }[] = [
  { id: "basic", label: "Basic Info", translationKey: "tickets.steps.basicInfo" },
  { id: "supervisors", label: "Supervisors", translationKey: "tickets.steps.supervisors" },
  { id: "files", label: "Files", translationKey: "tickets.steps.files" },
];

// Form validation schema for edit mode (includes resolution)
const editTicketSchema = createTicketSchema.extend({
  resolution: z.string().optional(),
});

type CreateFormValues = z.infer<typeof createTicketSchema>;
type EditFormValues = z.infer<typeof editTicketSchema>;

export interface TicketEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTicketCreatedOrUpdated?: () => void;
  orgId: string;
  /** Ticket to edit (null for create mode) */
  ticket?: Ticket | null;
  /** Whether we're editing or creating */
  mode: "create" | "edit";
}

const TicketEditModal: React.FC<TicketEditModalProps> = ({
  open,
  onOpenChange,
  onTicketCreatedOrUpdated,
  orgId,
  ticket,
  mode,
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [createdTicketId, setCreatedTicketId] = useState<string | undefined>(undefined);
  const [currentStep, setCurrentStep] = useState<WizardStep>("basic");
  const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(new Set());
  const [filesCount, setFilesCount] = useState(0);
  const [isSupervisorModalOpen, setIsSupervisorModalOpen] = useState(false);
  const [selectedClientContactData, setSelectedClientContactData] = useState<ClientContact[]>([]);
  const [supervisors, setSupervisors] = useState<Employee[]>([]);
  const [loadingSupervisors, setLoadingSupervisors] = useState(false);

  // Store full item data for selected values to display before fetch
  const [selectedClientData, setSelectedClientData] = useState<any[]>([]);
  const [selectedLocationData, setSelectedLocationData] = useState<any[]>([]);
  const [selectedInventoryData, setSelectedInventoryData] = useState<any[]>([]);
  const [selectedTypeData, setSelectedTypeData] = useState<TicketWorkOrderType[]>([]);

  const isEditMode = mode === "edit";
  const ticketId = isEditMode && ticket ? ticket.id : createdTicketId;

  const form = useForm<CreateFormValues | EditFormValues>({
    resolver: zodResolver(isEditMode ? editTicketSchema : createTicketSchema),
    defaultValues: {
      client_reference: "",
      client_id: "",
      location_id: "",
      inventory_id: "",
      type_id: "",
      priority: "low" as TicketWorkOrderPriority,
      status: "in_progress",
      description: "",
      resolution: "",
      contact_first_name: "",
      contact_last_name: "",
      contact_email: "",
      contact_phone: "",
    },
  });

  const watchedClientId = form.watch("client_id");
  const watchedLocationId = form.watch("location_id");

  // Update selected client ID when form value changes
  useEffect(() => {
    setSelectedClientId(watchedClientId || null);
  }, [watchedClientId]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      if (isEditMode && ticket) {
        form.reset({
          client_reference: ticket.client_reference || "",
          client_id: ticket.client?.id || "",
          location_id: ticket.location?.id || "",
          inventory_id: ticket.inventory?.id || "",
          type_id: ticket.type?.id || "",
          priority: ticket.priority as TicketWorkOrderPriority,
          status: ticket.status,
          description: ticket.description || "",
          resolution: ticket.resolution || "",
          contact_first_name: ticket.contact_first_name || "",
          contact_last_name: ticket.contact_last_name || "",
          contact_email: ticket.contact_email || "",
          contact_phone: ticket.contact_phone || "",
        });
        setSelectedClientId(ticket.client?.id || null);
        setSelectedClientData(ticket.client ? [ticket.client] : []);
        setSelectedLocationData(ticket.location ? [ticket.location] : []);
        setSelectedInventoryData(ticket.inventory ? [ticket.inventory] : []);
        setSelectedTypeData(ticket.type ? [ticket.type] : []);
        setSelectedClientContactData([]);
        setCreatedTicketId(undefined);
        setCurrentStep("basic");
        setCompletedSteps(new Set(STEPS.map((s) => s.id))); // Edit mode: all steps accessible
      } else {
        form.reset({
          client_reference: "",
          client_id: "",
          location_id: "",
          inventory_id: "",
          type_id: "",
          priority: "low" as TicketWorkOrderPriority,
          status: "in_progress",
          description: "",
          resolution: "",
          contact_first_name: "",
          contact_last_name: "",
          contact_email: "",
          contact_phone: "",
        });
        setSelectedClientId(null);
        setSelectedClientData([]);
        setSelectedLocationData([]);
        setSelectedInventoryData([]);
        setSelectedTypeData([]);
        setSelectedClientContactData([]);
        setCreatedTicketId(undefined);
        setCurrentStep("basic");
        setCompletedSteps(new Set());
      }
    }
  }, [open, form, isEditMode, ticket]);

  const handleClientContactSelect = (
    _values: string[],
    _itemsMap: Map<string, ClientContact>,
    lastItem?: ClientContact
  ) => {
    if (lastItem) {
      const nameParts = (lastItem.name || "").trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      form.setValue("contact_first_name", firstName);
      form.setValue("contact_last_name", lastName);
      form.setValue("contact_email", lastItem.email || "");
      form.setValue("contact_phone", lastItem.phone || "");
    }
  };

  // Fetch supervisors when entering supervisors step
  const fetchSupervisors = useCallback(async () => {
    if (!orgId || !ticketId) return;
    setLoadingSupervisors(true);
    try {
      const response = await getOrgTicketSupervisors(orgId, ticketId);
      if (response.success && response.success.supervisors) {
        setSupervisors(response.success.supervisors || []);
      } else {
        setSupervisors([]);
      }
    } catch (error) {
      console.error("Error fetching ticket supervisors:", error);
      setSupervisors([]);
    } finally {
      setLoadingSupervisors(false);
    }
  }, [orgId, ticketId]);

  useEffect(() => {
    if (currentStep === "supervisors" && ticketId) {
      fetchSupervisors();
    }
  }, [currentStep, ticketId, fetchSupervisors]);

  const handleDeleteSupervisor = async (supervisorId: string) => {
    if (!orgId || !ticketId) return;
    try {
      await deleteOrgTicketSupervisor(orgId, ticketId, supervisorId);
      toast.success(t("tickets.supervisorDeleted", "Supervisor removed successfully"));
      fetchSupervisors();
    } catch (error) {
      toast.error(t("tickets.errorDeletingSupervisor", "Error removing supervisor"));
    }
  };

  const handleFilesChange = useCallback((files: unknown[]) => {
    setFilesCount(files?.length ?? 0);
  }, []);

  const onSubmitBasicInfo = async (values: CreateFormValues | EditFormValues) => {
    setIsLoading(true);
    try {
      const requestData: any = {
        client_reference: values.client_reference || null,
        client_id: values.client_id,
        location_id: values.location_id || null,
        inventory_id: values.inventory_id || null,
        type_id: values.type_id || null,
        priority: values.priority,
        status: values.status,
        description: values.description || null,
        contact_first_name: values.contact_first_name || null,
        contact_last_name: values.contact_last_name || null,
        contact_email: values.contact_email || null,
        contact_phone: values.contact_phone || null,
      };

      if (isEditMode && "resolution" in values) {
        requestData.resolution = values.resolution || null;
      }

      let response;
      if (isEditMode && ticket) {
        response = await patchOrgTicket(orgId, ticket.id, requestData);
      } else {
        response = await postOrgTicket(orgId, requestData);
      }

      if (response.success) {
        const successMessage = isEditMode
          ? t("tickets.updatedSuccess", "Ticket updated successfully")
          : t("tickets.createdSuccess", "Ticket created successfully");

        toast.success(successMessage);
        if (isEditMode) {
          onTicketCreatedOrUpdated?.();
        } else {
          const createdId = response.success?.ticket_id ?? response.success?.ticket?.id ?? response.success?.id;
          if (createdId) {
            setCreatedTicketId(createdId);
            setCompletedSteps((prev) => new Set(prev).add("basic"));
            setCurrentStep("supervisors");
          } else {
            form.reset();
            onOpenChange(false);
            onTicketCreatedOrUpdated?.();
          }
        }
      } else {
        const errorMessage = isEditMode
          ? response.error || t("tickets.updateError", "Failed to update ticket")
          : response.error || t("tickets.createError", "Failed to create ticket");
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} ticket:`,
        error
      );
      const errorMessage = isEditMode
        ? t("tickets.updateError", "Failed to update ticket")
        : t("tickets.createError", "Failed to create ticket");
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = async () => {
    if (createdTicketId && !isEditMode) {
      onTicketCreatedOrUpdated?.();
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

  const handleOpenChange = async (open: boolean) => {
    if (!open) {
      await handleClose();
    } else {
      onOpenChange(open);
    }
  };

  const handleInteractOutside = (e: Event) => {
    if (form.formState.isDirty || createdTicketId) {
      e.preventDefault();
      handleOpenChange(false);
    }
  };

  const handleNext = () => {
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCompletedSteps((prev) => new Set(prev).add(currentStep));
      setCurrentStep(STEPS[currentIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  };

  const handleFinish = () => {
    onTicketCreatedOrUpdated?.();
    form.reset();
    onOpenChange(false);
  };

  const getCurrentStepIndex = () => STEPS.findIndex((s) => s.id === currentStep);
  const isLastStep = () => getCurrentStepIndex() === STEPS.length - 1;
  const isFirstStep = () => getCurrentStepIndex() === 0;
  const canGoNext = () => !!ticketId;
  const hasCurrentStepInput = () => {
    switch (currentStep) {
      case "files":
        return filesCount > 0;
      case "supervisors":
        return supervisors.length > 0;
      default:
        return false;
    }
  };

  const dialogTitle = isEditMode
    ? t("tickets.editTicket", "Edit Ticket")
    : t("tickets.createTicket", "Create New Ticket");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} key="ticket-edit-modal">
      <DialogContent
        className={cn(
          "max-w-2xl md:min-w-2xl max-h-[90vh] overflow-hidden flex flex-col",
          !isEditMode && "min-h-[90vh]"
        )}
        showCloseButton={false}
        onPointerDownOutside={handleInteractOutside}
        onEscapeKeyDown={handleInteractOutside}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 text-lg font-semibold">
            <span>{dialogTitle}</span>
            {isEditMode && ticket && (
              <div className="flex items-center gap-2">
                <IdBadge id={ticket.id} />
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        {(
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
                    onClick={() =>
                      isAccessible && setCurrentStep(step.id)
                    }
                    disabled={!isAccessible}
                    className={cn(
                      "flex items-center gap-2 text-xs font-medium transition-colors",
                      isCurrent && "text-primary",
                      isCompleted && !isCurrent && "text-muted-foreground",
                      !isCompleted &&
                      !isCurrent &&
                      !isAccessible &&
                      "text-muted-foreground/50",
                      !isCompleted &&
                      !isCurrent &&
                      isAccessible &&
                      "text-muted-foreground hover:text-foreground",
                      isAccessible && "cursor-pointer",
                      !isAccessible && "cursor-not-allowed"
                    )}
                  >
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs",
                        isCurrent && "bg-primary text-primary-foreground",
                        isCompleted && !isCurrent && "bg-primary/20 text-primary",
                        !isCompleted &&
                        !isCurrent &&
                        "bg-muted text-muted-foreground"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        index + 1
                      )}
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
        )}

        {/* Step content */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-2 -mx-2">
          {currentStep === "basic" && (
            <Form {...form}>
              <div className="space-y-6 py-2">
                {/* Client Reference - Optional */}
                <FormField
                  control={form.control}
                  name="client_reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("tickets.clientReference", "Client Reference")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("tickets.clientReferencePlaceholder", "e.g. PO number, reference...")}
                          {...field}
                          value={field.value ?? ""}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Client - Required */}
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("tickets.client", "Client")} *
                      </FormLabel>
                      <FormControl>
                        <MultiSelectApi
                          fetchOptions={getClients}
                          fetchArgs={[orgId]}
                          optionsKey="clients"
                          customValueKey={(item) => item.id}
                          customLabelKey={(item) => <ClientLabel data={item} options={{ showNameExtra: true }} />}
                          placeholder={t(
                            "tickets.selectClient",
                            "Select client..."
                          )}
                          searchPlaceholder={t(
                            "tickets.searchClient",
                            "Search clients..."
                          )}
                          emptyText={t("tickets.noClients", "No clients found")}
                          value={field.value ? [field.value] : []}
                          onChangeValue={(values) => {
                            const selectedValue = values[0] || "";
                            field.onChange(selectedValue);

                            // Clear client data when unselecting
                            if (!values[0]) {
                              setSelectedClientData([]);
                            }

                            // Reset location and inventory when client changes or is cleared
                            form.setValue("location_id", undefined);
                            form.setValue("inventory_id", undefined);
                            setSelectedLocationData([]);
                            setSelectedInventoryData([]);
                          }}
                          onChangeValueWithItem={(_values, itemsMap) => {
                            // Store full item data for display before fetch
                            const selectedItemsData = Array.from(itemsMap.values());
                            setSelectedClientData(selectedItemsData);
                          }}
                          defaultItems={selectedClientData}
                          maxCount={1}
                          disabled={isLoading || isEditMode}
                          className="w-full truncate"
                          isApiSearchable={true}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Location - Optional */}
                <FormField
                  control={form.control}
                  name="location_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("tickets.location", "Location")}</FormLabel>
                      <FormControl>
                        <MultiSelectApi
                          key={`location-${selectedClientId || 'none'}`}
                          fetchOptions={getClientLocations}
                          fetchArgs={[orgId, selectedClientId || ""]}
                          optionsKey="locations"
                          customValueKey={(item) => item.id}
                          customLabelKey={(item) => <LocationLabel data={item} options={{ showCity: true, showCountry: true }} />}
                          placeholder={t(
                            "tickets.selectLocation",
                            "Select location..."
                          )}
                          searchPlaceholder={t(
                            "tickets.searchLocation",
                            "Search locations..."
                          )}
                          emptyText={t("tickets.noLocations", "No locations found")}
                          value={field.value ? [field.value] : []}
                          onChangeValue={(values) => {
                            const selectedValue = values[0] || "";
                            field.onChange(selectedValue);

                            // Clear location data when unselecting
                            if (!values[0]) {
                              setSelectedLocationData([]);
                            }

                            // Reset inventory when location changes or is cleared
                            form.setValue("inventory_id", "");
                            setSelectedInventoryData([]);
                          }}
                          onChangeValueWithItem={(_values, itemsMap) => {
                            // Store full item data for display before fetch
                            const selectedItemsData = Array.from(itemsMap.values());
                            setSelectedLocationData(selectedItemsData);
                          }}
                          defaultItems={selectedLocationData}
                          maxCount={1}
                          disabled={isLoading || !selectedClientId}
                          className="w-full truncate"
                          isApiSearchable={true}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Inventory - Optional, only if client_id is selected */}
                {selectedClientId && (
                  <FormField
                    control={form.control}
                    name="inventory_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("tickets.inventory", "Inventory")}
                        </FormLabel>
                        <FormControl>
                          <MultiSelectApiHierarchy
                            key={`inventory-${selectedClientId || 'none'}-${watchedLocationId || 'none'}`}
                            fetchOptions={getClientInventory}
                            fetchArgs={[
                              orgId,
                              selectedClientId,
                              watchedLocationId || undefined,
                              undefined,
                            ]}
                            optionsKey="inventory"
                            customValueKey={(item) => item.id}
                            customLabelKey={(item) => (
                              <div className="flex items-center gap-2">
                                <span>{item.name}</span>
                                {item.item_name && (
                                  <span className="text-muted-foreground text-xs">
                                    ({item.item_name})
                                  </span>
                                )}
                              </div>
                            )}
                            placeholder={t(
                              "tickets.selectInventory",
                              "Select inventory..."
                            )}
                            searchPlaceholder={t(
                              "tickets.searchInventory",
                              "Search inventory..."
                            )}
                            emptyText={t(
                              "tickets.noInventory",
                              "No inventory found"
                            )}
                            value={field.value ? [field.value] : []}
                            onChangeValue={(values) => {
                              const selectedValue = values[0] || "";
                              field.onChange(selectedValue);

                              // Clear inventory data when unselecting
                              if (!values[0]) {
                                setSelectedInventoryData([]);
                              }
                            }}
                            onChangeValueWithItem={(_values, itemsMap) => {
                              // Store full item data for display before fetch
                              const selectedItemsData = Array.from(itemsMap.values());
                              setSelectedInventoryData(selectedItemsData);
                            }}
                            defaultItems={selectedInventoryData}
                            maxCount={1}
                            disabled={isLoading || !selectedClientId || !watchedLocationId}
                            className="w-full truncate"
                            isApiSearchable={true}
                            parentKey="parent"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}


                {/* Type - Optional */}
                <FormField
                  control={form.control}
                  name="type_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("tickets.type", "Type")}
                      </FormLabel>
                      <FormControl>
                        <MultiSelectApi
                          fetchOptions={getOrgTicketWorkOrderTypes}
                          fetchArgs={[orgId]}
                          optionsKey="tickets_wo_types"
                          customValueKey={(item) => item.id}
                          customLabelKey={(item) => <Tag text={item.name} color={item.color || ""} />}
                          placeholder={t(
                            "tickets.selectType",
                            "Select type..."
                          )}
                          searchPlaceholder={t(
                            "tickets.searchType",
                            "Search types..."
                          )}
                          emptyText={t("tickets.noTypes", "No types found")}
                          value={field.value ? [field.value] : []}
                          onChangeValue={(values) => {
                            const selectedValue = values[0] || "";
                            field.onChange(selectedValue);

                            // Clear type data when unselecting
                            if (!values[0]) {
                              setSelectedTypeData([]);
                            }
                          }}
                          onChangeValueWithItem={(_values, itemsMap) => {
                            // Store full item data for display before fetch
                            const selectedItemsData = Array.from(itemsMap.values());
                            setSelectedTypeData(selectedItemsData);
                          }}
                          defaultItems={selectedTypeData}
                          maxCount={1}
                          disabled={isLoading}
                          className="w-full truncate"
                          isApiSearchable={true}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Priority and Status - Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("tickets.priority.title", "Priority")}
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full" >
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="urgent">
                              <PriorityLabel data="urgent" />
                            </SelectItem>
                            <SelectItem value="high">
                              <PriorityLabel data="high" />
                            </SelectItem>
                            <SelectItem value="medium">
                              <PriorityLabel data="medium" />
                            </SelectItem>
                            <SelectItem value="low">
                              <PriorityLabel data="low" />
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("tickets.status.title", "Status")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full" >
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="in_progress">
                              <Tag text="in progress" className="capitalize" />
                            </SelectItem>
                            <SelectItem value="closed">
                              <Tag text="closed" className="capitalize" />
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("tickets.description", "Description")}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t(
                            "tickets.descriptionPlaceholder",
                            "Enter ticket description..."
                          )}
                          {...field}
                          disabled={isLoading}
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Resolution - Only in edit mode */}
                {isEditMode && (
                  <FormField
                    control={form.control}
                    name="resolution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("tickets.resolution", "Resolution")}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t(
                              "tickets.resolutionPlaceholder",
                              "Enter ticket resolution..."
                            )}
                            {...field}
                            disabled={isLoading}
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Contact Information */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold my-4 text-muted-foreground border-b border-border pb-2 flex-1">
                    {t("tickets.contactInfo", "Contact Information")}
                  </h4>

                  {selectedClientId && (
                    <FormItem>
                      <FormLabel>{t("tickets.selectFromClient", "Select from Client Contacts (optional)")}</FormLabel>
                      <FormControl>
                        <MultiSelectApi
                          key={`client-contacts-${selectedClientId}`}
                          fetchOptions={getClientContacts}
                          fetchArgs={[orgId, selectedClientId, undefined, undefined]}
                          optionsKey="contacts"
                          customValueKey={(item) => item.id}
                          customLabelKey={(item) => (
                            <div className="flex flex-col">
                              <span>{item.name}</span>
                              {item.email && (
                                <span className="text-xs text-muted-foreground">{item.email}</span>
                              )}
                            </div>
                          )}
                          placeholder={t("tickets.selectClientContact", "Select a client contact to auto-fill...")}
                          value={[]}
                          onChangeValue={() => { }}
                          onChangeValueWithItem={(values, itemsMap, lastItem) => {
                            const selectedItems = Array.from(itemsMap.values());
                            setSelectedClientContactData(selectedItems);
                            handleClientContactSelect(values, itemsMap, lastItem);
                          }}
                          defaultItems={selectedClientContactData}
                          className="w-full truncate"
                          maxCount={1}
                          disabled={isLoading}
                          isApiSearchable={true}
                        />
                      </FormControl>
                    </FormItem>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contact_first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("tickets.contactFirstName", "First Name")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("tickets.contactFirstNamePlaceholder", "First name...")}
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contact_last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("tickets.contactLastName", "Last Name")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("tickets.contactLastNamePlaceholder", "Last name...")}
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contact_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("tickets.contactEmail", "Email")}</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder={t("tickets.contactEmailPlaceholder", "Email...")}
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <PhoneInput
                      form={form}
                      name="contact_phone"
                      required={false}
                      label={t("tickets.contactPhone", "Phone")}
                      placeholder={t("tickets.contactPhonePlaceholder", "Phone...")}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            </Form>
          )}

          {currentStep === "supervisors" && ticketId && orgId && (
            <div className="py-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  {t("tickets.supervisors", "Supervisors")}
                  <Badge variant="secondary">{supervisors.length}</Badge>
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSupervisorModalOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  {t("tickets.addSupervisor", "Add")}
                </Button>
              </div>
              {loadingSupervisors ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : supervisors.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">
                  {t("tickets.noSupervisors", "No supervisors yet")}
                </div>
              ) : (
                <div className="space-y-2">
                  {supervisors.map((supervisor) => (
                    <div
                      key={supervisor.id}
                      className="flex items-center justify-between text-sm py-2 px-2 rounded border"
                    >
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
              <TicketSupervisorEditModal
                open={isSupervisorModalOpen}
                onOpenChange={setIsSupervisorModalOpen}
                orgId={orgId}
                ticketId={ticketId}
                onSuccess={fetchSupervisors}
              />
            </div>
          )}

          {currentStep === "files" && ticketId && (
            <div className="py-2">
              <FilesSection
                entity_id={ticketId}
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
        <DialogFooter className="flex-col rounded-b-lg sm:flex-row gap-2 border-t pt-4 shrink-0">
          <div className="flex gap-2 justify-between w-full">
            <div className="flex gap-2">
              {!isEditMode && !isFirstStep() && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={isLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {t("common.previous", "Previous")}
                </Button>
              )}
              {isEditMode && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isLoading}
                >
                  {t("common.cancel", "Cancel")}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {isEditMode ? (
                currentStep === "basic" && (
                  <Button
                    type="submit"
                    onClick={form.handleSubmit(onSubmitBasicInfo)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("tickets.updating", "Updating...")}
                      </>
                    ) : (
                      t("common.update", "Update")
                    )}
                  </Button>
                )
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    disabled={isLoading}
                  >
                    {ticketId
                      ? t("common.close", "Close")
                      : t("common.cancel", "Cancel")}
                  </Button>
                  {currentStep === "basic" && !ticketId && (
                    <Button
                      type="submit"
                      onClick={form.handleSubmit(onSubmitBasicInfo)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t("tickets.creating", "Creating...")}
                        </>
                      ) : (
                        <>
                          {t("common.create", "Create")}
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </Button>
                  )}
                  {currentStep !== "basic" && !isLastStep() && (
                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={!canGoNext()}
                    >
                      {hasCurrentStepInput()
                        ? t("common.next", "Next")
                        : t("common.skip", "Skip")}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                  {currentStep !== "basic" && !isLastStep() && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleFinish}
                      disabled={!canGoNext()}
                    >
                      {t("common.skipAll", "Skip all")}
                    </Button>
                  )}
                  {isLastStep() && (
                    <Button type="button" onClick={handleFinish}>
                      {t("common.finish", "Finish")}
                      <Check className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};

export default TicketEditModal;

