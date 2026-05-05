import { SectionField } from "../general/custom_fields";
import { JobTitle } from "../general/job-titles";
import { Group } from "../general/groups";
import { Workplace } from "../general/workplaces";
import { AbsencePolicy } from "../general/absences";
import { TimePolicy } from "../general/time-policies";

export type StatusEmployee = "active" | "inactive" | "absence" | "sick_leave";

export interface Employee {
  id: string;
  org_user_id: string;
  first_name: string;
  last_name: string;
  job_title: JobTitle | null;
  photo_url: string | null;
  email: string;
  national_id_number: string | null;
  tax_id_number: string | null;
  phone: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  country: string | null;
  notes: string | null;
  sections: SectionField[];
  org_user_workplace: Workplace | null;
  org_absence_policy: AbsencePolicy | null;
  org_time_policy: TimePolicy | null;
  reporting_to: Employee | null;
  reporting_absence_to: Employee[] | null;
  groups: Group[]
  //fields for post and patch requests
  job_title_id: string | null;
  org_user_workplace_id: string | null;
  org_absence_policy_id: string | null;
  org_time_policy_id: string | null;
  reporting_to_id: string | null;
  reporting_absence_to_ids: string[] | null;
  groups_ids: string[] | null;
  fields: object | null;
  is_supervisor?: boolean;
  is_absence_supervisor?: boolean;
  status?: StatusEmployee;
}

export interface EmployeePaymentMethod {
  id: string;
  bank: string;
  iban?: string;
  swift_bic?: string;
  notes?: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EmployeeEmergencyContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  created_at?: string;
  updated_at?: string;
}


export default Employee;