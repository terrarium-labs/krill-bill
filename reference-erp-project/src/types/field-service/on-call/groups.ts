/** On call group: id, name, description, color, and num_employees. No employees array – roster comes from shift.employees (group members) and shift.exception_employees (non-group). */
export interface OnCallGroup {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  num_employees: number;
}
  