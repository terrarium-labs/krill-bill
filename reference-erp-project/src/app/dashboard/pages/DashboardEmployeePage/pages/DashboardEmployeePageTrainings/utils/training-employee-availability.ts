import type { EnrollmentStatus, Training } from "@/types/trainings/trainings";
import { getTrainingStatuses } from "@/app/trainings/training-normalize";

const ACTIVE_ENROLLMENT_STATUSES: EnrollmentStatus[] = ["enrolled", "in_progress"];

/** Trainings an employee may browse and request enrollment in (client-side heuristic). */
export function isTrainingOpenForSelfEnrollment(training: Training): boolean {
    if ((training.visibility ?? "public") === "private") return false;
    const statuses = getTrainingStatuses(training);
    return statuses.some((s) => s === "scheduled" || s === "in_progress");
}

export function isTrainingNotFull(training: Training): boolean {
    if (training.max_participants == null) return true;
    const count = training.enrolled_count ?? 0;
    return count < training.max_participants;
}

export function hasActiveEnrollmentForTraining(
    trainingId: string,
    enrollmentStatusByTrainingId: Map<string, EnrollmentStatus>,
): boolean {
    const st = enrollmentStatusByTrainingId.get(trainingId);
    return st != null && ACTIVE_ENROLLMENT_STATUSES.includes(st);
}
