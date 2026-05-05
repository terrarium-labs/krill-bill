import type { TableFilters } from "@/types/general/filters";
import type { TrainingEnrollment } from "@/types/trainings/trainings";

/**
 * Applies table filter + sort state to enrollment rows (client-side).
 * The training enrollments list API does not yet take `params` like clients.
 */
export function applyEnrollmentsTableFilters(
    rows: TrainingEnrollment[],
    tableFilters: TableFilters | null,
): TrainingEnrollment[] {
    if (!tableFilters) return rows;
    let out = [...rows];
    const filterList = tableFilters.filters;

    if (filterList && filterList.length > 0) {
        for (const f of filterList) {
            if (!f?.key) continue;

            if (f.key === "status" && f.type === "array") {
                const vals = (f.value ?? []).filter(
                    (v): v is string => typeof v === "string" && v.length > 0,
                );
                if (vals.length === 0) continue;
                if (f.operator === "inArray") {
                    out = out.filter((e) => vals.includes(e.status));
                } else if (f.operator === "notInArray") {
                    out = out.filter((e) => !vals.includes(e.status));
                }
                continue;
            }

            if (f.key === "attendance_confirmed" && f.type === "boolean") {
                const v = f.value?.[0];
                if (v === undefined || v === null) continue;
                const want = Boolean(v);
                if (f.operator === "eq") {
                    out = out.filter((e) => Boolean(e.attendance_confirmed) === want);
                }
                continue;
            }

            if (f.key === "enrolled_at" && f.type === "date" && f.operator === "gte") {
                const raw = f.value?.[0];
                if (raw == null || raw === "") continue;
                const min = String(raw);
                out = out.filter((e) => e.enrolled_at && e.enrolled_at.slice(0, 10) >= min.slice(0, 10));
                continue;
            }

            if (f.key === "completion_date" && f.type === "date" && f.operator === "gte") {
                const raw = f.value?.[0];
                if (raw == null || raw === "") continue;
                const min = String(raw).slice(0, 10);
                out = out.filter(
                    (e) => e.completion_date && e.completion_date.slice(0, 10) >= min,
                );
                continue;
            }

            if (f.key === "score" && f.type === "number" && f.operator === "gte") {
                const min = Number(f.value?.[0]);
                if (Number.isNaN(min)) continue;
                out = out.filter((e) => e.score != null && e.score >= min);
            }
        }
    }

    const ob = tableFilters.order_by?.[0];
    if (ob) {
        const dir = ob.direction === "DESC" ? -1 : 1;
        const key = ob.key;
        out.sort((a, b) => {
            let cmp = 0;
            switch (key) {
                case "enrolled_at":
                    cmp = (a.enrolled_at ?? "").localeCompare(b.enrolled_at ?? "");
                    break;
                case "completion_date":
                    cmp = (a.completion_date ?? "").localeCompare(b.completion_date ?? "");
                    break;
                case "status":
                    cmp = a.status.localeCompare(b.status);
                    break;
                case "score": {
                    const sa = a.score ?? -1;
                    const sb = b.score ?? -1;
                    cmp = sa - sb;
                    break;
                }
                default:
                    return 0;
            }
            return cmp * dir;
        });
    }

    return out;
}
