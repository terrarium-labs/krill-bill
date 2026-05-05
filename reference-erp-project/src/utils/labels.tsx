import { ReactNode } from "react";
import IdBadge from "@/app/components/id-badge";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";
import { IconLabel } from "@/app/components/custom-labels";
import { DynamicIcon } from "lucide-react/dynamic";
import { ClientAvatar } from "@/app/components/avatars/client-avatar";
import { SupplierAvatar } from "@/app/components/avatars/supplier-avatar";
import { OrgUserAvatar } from "@/app/components/avatars/org-user-avatar";
import LocationLabel from "@/app/components/labels/location-label";
import Tag from "@/app/components/tag/tag";
import WorkOrderLabel from "@/app/components/labels/work-order-label";
import TicketLabel from "@/app/components/labels/ticket-label";
import VehicleLabel from "@/app/components/labels/vehicle-label";
import type { PlannerExceptionEntityType } from "@/types/planner/planner-exceptions";

/**
 * Maps endpoint keys to custom label renderers for MultiSelectApi components.
 *
 * @param endpointKey - The key from the filter field's endpoint property
 * @returns A render function that takes an option and returns a custom label, or undefined for default rendering
 *
 * @example
 * const renderLabel = useLabelRenderer('managers');
 * <MultiSelectApi renderLabel={renderLabel} />
 */
export const useLabelRenderer = (
  endpointKey?: string
): ((option: any) => ReactNode) | undefined => {
  if (!endpointKey) return undefined;

  // Map endpoint keys to their custom label renderers
  const labelRenderers: Record<string, (option: any) => ReactNode> = {
    // Org users
    org_users: (option) => {
      return <OrgUserAvatar orgUser={option} />;
    },
    // Managers
    managers: (option) => {
      return <EmployeeAvatar employee={option} />;
    },

    // Employees
    employees: (option) => {
      return <EmployeeAvatar employee={option} />;
    },

    // Clients
    clients: (option) => {
      return <ClientAvatar client={option} />;
    },

    // Suppliers
    suppliers: (option) => {
      return <SupplierAvatar supplier={option} />;
    },

    // Absence counter types
    absence_types: (option) => {
      return (
        <IconLabel
          icon={option.icon_url}
          color={option.color}
          text={option.name}
        />
      );
    },

    // Job titles
    job_titles: (option) => {
      return <Tag text={option.name || option} />;
    },

    // Workplaces
    workplaces: (option) => {
      return (
        <div className="font-medium text-sm flex items-center gap-2">
          <DynamicIcon name={option.icon_url as any} className="h-4 w-4" />
          <span className="text-sm">{option.name}</span>
        </div>
      );
    },

    // Groups
    groups: (option) => {
      return (
        <div className="font-medium text-sm flex items-center gap-2">
          <DynamicIcon name={option.icon_url as any} className="h-4 w-4" />
          <span className="text-sm">{option.name}</span>
        </div>
      );
    },

    // Vehicles
    vehicles: (option) => {
      return <VehicleLabel data={option} hide={["icon", "type"]} />;
    },

    // On-call groups
    on_call_groups: (option) => {
      return <span className="font-medium text-sm">{option.name}</span>;
    },

    // Item hierarchies
    items_hierarchies: (option) => {
      return (
        <IconLabel
          icon={option.icon}
          color={option.color}
          text={option.name}
          showEmptyColor={false}
        />
      );
    },

    // Locations
    locations: (option) => {
      return <LocationLabel data={option} />;
    },

    // Statuses
    statuses: (option) => {
      return <Tag text={option.name || option} color={option.color || ""} />;
    },

    // Status
    status: (option) => {
      return <Tag text={option.name || option} color={option.color || ""} />;
    },

    // Verification Status
    verification_status: (option) => {
      return <Tag text={option.name || option} color={option.color || ""} />;
    },

    // Lists
    lists: (option) => {
      return <div className="font-medium text-sm flex items-center gap-2">
        <IdBadge id={option.id} />
        <span className="text-sm">{option.name || option}</span>
        {option.status_template && <Tag text={option.status_template.name} color={option.status_template.color || ""} />}
      </div>
    },

    // Work Orders
    work_orders: (option) => {
      return <WorkOrderLabel data={option} icons={["priority"]} />
    },

    // Tickets
    tickets: (option) => {
      return <TicketLabel data={option} icons={["priority"]} />
    },

    // Tickets/Work Orders Types
    tickets_wo_types: (option) => {
      return <Tag text={option.name || option} color={option.color || ""} />
    },

    // Priority
    priority: (option) => {
      return <Tag text={option.name || option} className="capitalize" />
    },

    // Request Methods
    req_method: (option) => {
      return <Tag text={option.name || option} className="capitalize" />
    },

    // Add more mappings as needed
    default: (option) => option?.name || option || "Unknown",
  };

  return labelRenderers[endpointKey];
};

/** Maps planner entity types to endpoint keys for label rendering */
const PLANNER_ENTITY_TO_ENDPOINT: Record<PlannerExceptionEntityType, string> = {
  employee: "employees",
  vehicle: "vehicles",
  workplace: "workplaces",
  group: "groups",
  on_call_group: "on_call_groups",
  client: "clients",
};

/**
 * Returns a label renderer for planner exception entity types.
 * Use with MultiSelectApiEntity to render entities consistently.
 */
export const getPlannerEntityLabelRenderer = (
  entityType?: PlannerExceptionEntityType
): ((option: any) => ReactNode) | undefined => {
  if (!entityType) return undefined;
  const endpointKey = PLANNER_ENTITY_TO_ENDPOINT[entityType];
  return useLabelRenderer(endpointKey);
};
