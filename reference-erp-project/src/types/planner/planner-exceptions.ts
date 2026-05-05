import { Employee } from "../employees/employees";
import { Vehicle } from "../general/vehicles";
import { Workplace } from "../general/workplaces";
import { Group } from "../general/groups";
import { OnCallGroup } from "../field-service/on-call/groups";
import { Client } from "../clients/client";

export type PlannerExceptionEntityType = "employee" 
| "vehicle" 
| "workplace" 
| "group" 
| "on_call_group"
| "client";

export type PlannerExceptionEntity = Employee 
| Vehicle 
| Workplace 
| Group 
| OnCallGroup 
| Client
| null;

export interface PlannerException {
    id: string;  
    entity_type: PlannerExceptionEntityType;
    entity?: PlannerExceptionEntity;
    created_at: string;
    updated_at: string;
    start_date: string;
    end_date: string;
    notes: string | null;
}