import Employee from "./employees";
import { AbsenceType, AbsenceCounter, Unit } from "../general/absences";

export type AbsenceStatus = "approved" | "rejected" | "pending" | "cancelled";

export interface Absence {
  id: string;
  employee: Employee;
  absence_counter: AbsenceCounter;
  absence_type: AbsenceType;
  status: AbsenceStatus;
  responded_by: Employee | null;
  modified_by: Employee | null;
  responded_at: string | null;
  start_date: string;
  end_date: string;
  notes: string | null;
  reason: string | null;
  num_files: number;
}

export interface AbsenceTracker {
  total: number;
  used: number;
  remaining: number;
  adjustment: number;
  unit: Unit;
  counter: AbsenceCounter;
  is_unlimited: boolean;
  days_that_expire: number | null;
  expiration_date: string | null;
}

export interface AbsenceCounterType {
  counter_id: string;
  absence_type_id?: string;
  name: string;
  start_date: string;
  end_date: string;
  theoretical_end_date: string;
  unit: Unit;
  absence_type: AbsenceType;
}
