import { Employee } from "@/types/employees/employees";
import { OnCallGroup } from "./groups";
import { OnCallConfig } from "./configs";

/** Employee status within a shift. */
export type OnCallShiftEmployeeStatus = "on_call" | "cancelled";

export interface OnCallShiftEmployee {
  employee: Employee;
  status: OnCallShiftEmployeeStatus;
}

/**
 * On call shifts shift: a group assigned to a date range.
 * Allows displaying multi-day shifts as one enlarged tile in the calendar.
 */
export interface OnCallShift {
  id: string;
  group: OnCallGroup;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  employees: OnCallShiftEmployee[];
  exception_employees: OnCallShiftEmployee[] | null;
  configuration: OnCallConfig | null;
}

/** Map legacy API shifts (per-employee per-day) to OnCallShift (group + date range). */
export function shiftsToOnCallShifts(
  shifts: Array<{ id: string; employee_id: string; date: string; group_id?: string | null; status?: string }>,
  groupIdByEmployee: Map<string, string>,
  groupsMap: Map<string, OnCallGroup>,
  employeesMap: Map<string, Employee>
): OnCallShift[] {
  const byDateGroup = new Map<string, { employee_id: string; status: OnCallShiftEmployeeStatus }[]>();
  for (const s of shifts) {
    const gid = s.group_id ?? groupIdByEmployee.get(s.employee_id);
    if (!gid) continue;
    const key = `${s.date}|${gid}`;
    if (!byDateGroup.has(key)) byDateGroup.set(key, []);
    byDateGroup.get(key)!.push({
      employee_id: s.employee_id,
      status: (s.status === "cancelled" ? "cancelled" : "on_call") as OnCallShiftEmployeeStatus,
    });
  }
  const result: OnCallShift[] = [];
  byDateGroup.forEach((employeeStatuses, key) => {
    const [date, groupId] = key.split("|");
    const group = groupsMap.get(groupId);
    if (!group) return;
    const employees: OnCallShiftEmployee[] = employeeStatuses
      .map((es) => {
        const employee = employeesMap.get(es.employee_id);
        return employee ? { employee, status: es.status } : null;
      })
      .filter((x): x is OnCallShiftEmployee => x !== null);
    result.push({
      id: `agg_${key}`,
      group,
      start_date: date,
      end_date: date,
      employees,
      exception_employees: null,
      configuration: null,
    });
  });
  return result;
}