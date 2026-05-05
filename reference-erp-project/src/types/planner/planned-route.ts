/**
 * Planned route types for urgent work order assignment.
 * We receive Mapbox destinations/routes for display; we only send ordered IDs and metadata.
 */

import type { WorkOrder } from "@/types/field-service/work-orders/work-orders";

// --- Mapbox response types (what we receive from Mapbox, not sent to backend) ---

export interface MapboxWaypoint {
    location: [number, number];
    name: string;
}

export interface MapboxRouteGeometry {
    type: "LineString";
    coordinates: [number, number][];
}

export interface MapboxRoute {
    geometry: MapboxRouteGeometry;
    distance: number;
    duration: number;
}

export interface MapboxDirectionsResponse {
    routes: MapboxRoute[];
    waypoints: MapboxWaypoint[];
}

// --- Request: what we send to the backend ---

/**
 * Payload for assigning an urgent work order to a route.
 * We do NOT send the calculated route waypoints/geometry.
 */
export interface PlannedRouteRequest {
    /** Ordered list of work order IDs (including the new urgent one at the desired position) */
    work_order_ids: string[];
    /** Employee ID designated for this route */
    employee_id: string;
    /** 0-based index of the urgent work order in work_order_ids (for backend recalculation) */
    urgent_insert_index: number;
    /** Optional: planned date for the route (ISO string) */
    planned_date?: string;
}

// --- Response: what we get back from the POST ---

/** Minimal employee for display */
export interface RouteEmployee {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    photo_url: string | null;
}

/** One work order step in the route order display */
export interface RouteOrderStep {
    work_order_id: string;
    work_order_name: string | null;
    position: number;
    isNew?: boolean;
    /** Step was removed from route (for edit summary display) */
    isDeleted?: boolean;
    /** Step existed but position changed (for edit summary display) */
    isPositionChanged?: boolean;
    /** Full work order for hover card display (optional, from client-side build) */
    workOrder?: WorkOrder;
}

/**
 * Full route modification - one row: Employee + work order steps.
 * Used for both user input and backend suggestions.
 */
export interface RouteModification {
    employee_id: string;
    employee: RouteEmployee;
    work_order_ids: string[];
    /** Ordered steps for RouteOrderProgressLabel (one step per work order) */
    steps: RouteOrderStep[];
}

/** Type of suggested modification */
export type SuggestedModificationType = "same_employee_optimized" | "different_employee";

export interface SuggestedModification {
    type: SuggestedModificationType;
    modification: RouteModification;
}

/**
 * Response from POST when assigning urgent work order.
 */
export interface PlannedRouteResponse {
    /** Generated or echoed ID for the planned route */
    planned_route_id: string;
    /** User inputted planned route (what we sent) */
    selected_modification: RouteModification;
    /** Backend suggestions: same employee + better order, and/or different employee */
    suggested_modifications: SuggestedModification[];
}
