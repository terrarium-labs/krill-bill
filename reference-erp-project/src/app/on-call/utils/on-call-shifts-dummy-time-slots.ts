import type { OnCallShift, OnCallShiftEmployee, OnCallShiftEmployeeStatus } from "@/types/field-service/on-call/on-call-shifts";
import type { OnCallGroup } from "@/types/field-service/on-call/groups";
import type { Employee } from "@/types/employees/employees";

const DUMMY_GROUP_NAMES = [
  "Mañanas grupo 1",
  "Mañanas grupo 2",
  "Tardes grupo 1",
  "Tardes grupo 2",
] as const;

const DUMMY_GROUP_COLORS = ["blue", "green", "purple", "orange"] as const;

/** Dummy group + employees for generating shifts. Groups have no employees in the API; this is for dummy data only. */
export interface DummyOnCallGroupWithEmployees {
  group: OnCallGroup;
  groupEmployees: Employee[];
}

/** Dummy on call shifts groups: id, name, description, color, num_employees. Employees distributed across 4 groups for shift generation. */
export function getDummyOnCallShiftsGroups(employees: Employee[]): DummyOnCallGroupWithEmployees[] {
  if (employees.length === 0) return [];

  const chunkSize = Math.max(1, Math.ceil(employees.length / 4));
  const result: DummyOnCallGroupWithEmployees[] = DUMMY_GROUP_NAMES.map((name, i) => {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, employees.length);
    const groupEmployees = employees.slice(start, end);
    return {
      group: {
        id: `on-call-shifts_grp_${i}`,
        name,
        description: i < 2 ? "Turno de mañana" : "Turno de tarde",
        color: DUMMY_GROUP_COLORS[i % DUMMY_GROUP_COLORS.length],
        num_employees: groupEmployees.length,
      },
      groupEmployees,
    };
  }).filter((g) => g.groupEmployees.length > 0);

  if (result.length === 0 && employees.length > 0) {
    return [{
      group: {
        id: "on-call-shifts_grp_0",
        name: DUMMY_GROUP_NAMES[0],
        description: null,
        color: "blue",
        num_employees: employees.length,
      },
      groupEmployees: employees,
    }];
  }
  return result;
}

/** Days since Unix epoch for date-based cycling. */
function getDaysSinceEpoch(d: Date): number {
  return Math.floor(d.getTime() / 86400000);
}

/** Seeded hash for deterministic status variation. */
function seededStatus(seed: string): OnCallShiftEmployeeStatus {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % 10 === 0 ? "cancelled" : "on_call";
}

/**
 * Generate dummy on call shifts with date ranges.
 * - employees: group members (shift.employees)
 * - exception_employees: null for dummy
 * - Mañanas grupo 1 & 2: each shift lasts 3 days, 1 day gap between each group's period.
 * - Tardes grupo 1 & 2: each shift lasts 5 days, 1 day gap between each group's period.
 */
export function getDummyShifts(
  onCallShiftsGroups: DummyOnCallGroupWithEmployees[],
  fromDate: string,
  toDate: string
): OnCallShift[] {
  const shifts: OnCallShift[] = [];
  const [fromY, fromM, fromD] = fromDate.split("-").map(Number);
  const [toY, toM, toD] = toDate.split("-").map(Number);
  const from = new Date(fromY, (fromM ?? 1) - 1, fromD ?? 1);
  const to = new Date(toY, (toM ?? 1) - 1, toD ?? 1);

  const validGroups = onCallShiftsGroups.filter((g) => g.groupEmployees.length > 0);
  if (validGroups.length === 0) return shifts;

  const mañanasGroups = validGroups.slice(0, 2);
  const tardesGroups = validGroups.slice(2, 4);

  const buildShiftsForGroups = (
    groups: DummyOnCallGroupWithEmployees[],
    shiftDays: number,
    gapDays: number
  ): OnCallShift[] => {
    const result: OnCallShift[] = [];
    const blockLength = shiftDays + gapDays;
    const cycleLength = blockLength * groups.length;

    const d = new Date(from.getTime());
    while (d <= to) {
      const dayNum = getDaysSinceEpoch(d);
      const dayInCycle = ((dayNum % cycleLength) + cycleLength) % cycleLength;
      const blockIndex = Math.floor(dayInCycle / blockLength);
      const positionInBlock = dayInCycle % blockLength;

      if (positionInBlock >= shiftDays) {
        d.setDate(d.getDate() + 1);
        continue;
      }

      const { group, groupEmployees } = groups[blockIndex] ?? {};
      if (!group || !groupEmployees?.length) {
        d.setDate(d.getDate() + 1);
        continue;
      }

      const dateStr = formatDate(d);
      const prevDay = new Date(d);
      prevDay.setDate(prevDay.getDate() - 1);
      const last = result[result.length - 1];
      if (last && last.group.id === group.id && last.end_date === formatDate(prevDay)) {
        last.end_date = dateStr;
        last.id = `dummy_${last.group.id}_${last.start_date}_${dateStr}`;
      } else {
        const employees: OnCallShiftEmployee[] = groupEmployees.map((emp, idx) => ({
          employee: emp,
          status: seededStatus(`${dateStr}_${group.id}_${idx}`),
        }));
        result.push({
          id: `dummy_${group.id}_${dateStr}`,
          group,
          start_date: dateStr,
          end_date: dateStr,
          employees,
          exception_employees: null,
          configuration: null,
        });
      }
      d.setDate(d.getDate() + 1);
    }
    return result;
  };

  if (mañanasGroups.length > 0) {
    shifts.push(...buildShiftsForGroups(mañanasGroups, 3, 1));
  }
  if (tardesGroups.length > 0) {
    shifts.push(...buildShiftsForGroups(tardesGroups, 5, 1));
  }

  return shifts;
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

