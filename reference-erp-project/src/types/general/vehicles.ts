import { Employee } from "../employees/employees";
import { BasicLocation } from "./location";
import { Workplace } from "./workplaces";

export interface Driver {
    id: string;
    employee: Employee;
    valid_from: string | null;
    valid_to: string | null;
}

export interface Vehicle {
    id: string;
    name: string;
    plate_number: string;
    plate_number_country: string;
    vehicle_type: "van" | "truck" | "car" | "motorcycle";
    chassis_number: string;
    origin_address_line_1: string;
    origin_address_line_2: string;
    origin_city: string;
    origin_state_province: string;
    origin_postal_code: string;
    origin_country: string;
    location: BasicLocation;
    workplace: Workplace | null;
    active_employees: Employee[];
    status: "active" | "inactive" | "maintenance" | "out_of_service";
}

export interface VehicleMaintenance {
    id: string;
    from_date: string;
    to_date: string;
    notes: string | null;
}

export interface VehicleKilometersOverview {
    id: string;
    day: string;
    real_kilometers: number;
    predicted_kilometers: number;
    cost_per_km?: number | null;
    drivers?: Employee[];
}

export interface VehicleCoordinates {
    id: string;
    latitude: number;
    longitude: number;
    created_at: string;
}

export interface VehicleEmployeeRecord {
    id: string;
    employee: Employee;
    valid_from: string | null;
    valid_to: string | null;
}