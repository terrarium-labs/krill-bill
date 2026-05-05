import { Employee } from "./employees";

export type PayrollLineType = "earning" | "deduction" | "employer_cost";

export type PayrollLineSubType =
  | "base_salary"
  | "fixed_salary_allowance"
  | "variable_salary_allowance"
  | "overtime_hours"
  | "prorated_extra_payments"
  | "non_salary_earning"
  | "per_diems"
  | "mileage_compensation"
  | "reimbursed_expense"
  | "compensation_or_severance_payment"
  | "collective_agreement_salary_bonus"
  | "collective_agreement_non_salary_bonus"
  | "employee_social_security_common_contingencies"
  | "employee_social_security_unemployment"
  | "employee_social_security_professional_training"
  | "employee_social_security_overtime"
  | "income_tax_withholding"
  | "salary_advance"
  | "court_ordered_garnishment"
  | "company_loan_repayment"
  | "union_fee"
  | "other_voluntary_deduction"
  | "employer_social_security_common_contingencies"
  | "employer_social_security_accidents_occupational_illness"
  | "employer_social_security_unemployment"
  | "employer_social_security_professional_training"
  | "employer_social_security_fogasa"
  | "employer_social_security_mei_contribution"
  | "employer_social_security_overtime"
  | "group_insurance"
  | "pension_plan_contribution"
  | "social_benefit_expense"
  | "other";

export interface PayrollLine {
  id: string;
  concept: string;
  amount: number;
  type: PayrollLineType;
  sub_type: PayrollLineSubType;
  order: number;
}

export interface PayrollLineMapping {
  /** May be undefined while the amount cell is cleared in the import UI */
  amount: number | undefined;
  concept: string | null;
  type: "earning" | "deduction" | "employer_cost";
  sub_type: PayrollLineSubType;
}

export interface PayrollMappingValidate {
  payment_date: string | null;
  start_date: string;
  end_date: string;
  national_id_number: string;
  employee_name: string | null;
  lines: PayrollLineMapping[];
}

export interface Payroll {
  id: string;
  employee: Employee | null;
  start_date: string;
  end_date: string;
  payment_date: string;
  lines: PayrollLine[] | null;
  earnings_total: number;
  deductions_total: number;
  net_amount_to_receive: number;
  company_costs_total: number;
  gross_payroll_amount: number;
}
