import { useTranslation } from "react-i18next";
import { Check, Circle, FileText, Loader2 } from "lucide-react";

import type { EnrollmentSessionCompletion } from "@/types/trainings/trainings";
import { Badge } from "@/components/ui/badge";
import DateLabel from "@/app/components/labels/date-label";

interface EnrollmentSessionProgressPanelProps {
    isLoading: boolean;
    completions: EnrollmentSessionCompletion[] | undefined;
}

export function EnrollmentSessionProgressPanel({
    isLoading,
    completions,
}: EnrollmentSessionProgressPanelProps) {
    const { t } = useTranslation();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                    {t("trainings.enrollments.expand.loading", "Loading progress…")}
                </span>
            </div>
        );
    }

    if (!completions || completions.length === 0) {
        return (
            <p className="px-4 py-4 text-sm text-muted-foreground">
                {t(
                    "trainings.enrollments.expand.noSessions",
                    "No session progress recorded yet.",
                )}
            </p>
        );
    }

    return (
        <div className="space-y-4 px-4 py-3 text-sm">
            {completions.map((session, idx) => (
                <div
                    key={session.session_id ?? `${session.session_title}-${idx}`}
                    className="space-y-2"
                >
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-medium text-foreground">
                            {session.session_title}
                        </span>
                        {session.completed ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                <Check className="h-3.5 w-3.5" />
                                {t(
                                    "trainings.enrollments.expand.sessionCompleted",
                                    "Completed",
                                )}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <Circle className="h-3 w-3" />
                                {t(
                                    "trainings.enrollments.expand.sessionIncomplete",
                                    "Not completed",
                                )}
                            </span>
                        )}
                        {session.completed_at ? (
                            <DateLabel
                                data={session.completed_at}
                                className="text-xs text-muted-foreground"
                            />
                        ) : null}
                    </div>
                    {session.session_materials && session.session_materials.length > 0 ? (
                        <ul className="ml-1 space-y-1.5 border-l-2 border-border pl-3">
                            {session.session_materials.map((mat) => (
                                <li
                                    key={mat.id}
                                    className="flex flex-wrap items-center gap-x-2 gap-y-1"
                                >
                                    <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                    <span className="min-w-0">{mat.name}</span>
                                    {mat.read_required ? (
                                        <Badge variant="secondary" className="text-[10px] font-normal">
                                            {t(
                                                "trainings.enrollments.expand.mandatory",
                                                "Mandatory",
                                            )}
                                        </Badge>
                                    ) : null}
                                    {mat.read_at ? (
                                        <span className="text-xs text-green-600 dark:text-green-400">
                                            {t("trainings.enrollments.expand.read", "Read")}{" "}
                                            <DateLabel
                                                data={mat.read_at}
                                                className="text-xs text-muted-foreground"
                                            />
                                        </span>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">
                                            {t(
                                                "trainings.enrollments.expand.notRead",
                                                "Not read",
                                            )}
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="ml-4 text-xs text-muted-foreground">
                            {t(
                                "trainings.enrollments.expand.noMaterials",
                                "No materials for this session.",
                            )}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}
