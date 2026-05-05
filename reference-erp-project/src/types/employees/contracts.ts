export type ContractType =
  | "permanent"
  | "temporary"
  | "internship"
  | "contractor"
  | "agency_worker"
  | "apprenticeship";

export interface EmployeeContract {
  id: string;
  num_salary_payments_per_year: 12 | 14;
  annual_gross_salary: number;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  type: ContractType;
  price_per_hour?: number | null;
  overtime_price_per_hour?: number | null;
}
