import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import TipsCard from "@/app/components/cards/tips-card";
import type { TipsCardHiddenPart } from "@/app/components/cards/tips-card";

const EMPLOYEE_TIME_TIPS_VARIANTS = ["activity", "absences", "schedule"] as const;
export type EmployeeTimeTipsCardVariant = (typeof EMPLOYEE_TIME_TIPS_VARIANTS)[number];

interface EmployeeTimeTipsCardProps {
    variant: EmployeeTimeTipsCardVariant;
    hidden?: TipsCardHiddenPart | TipsCardHiddenPart[];
    className?: string;
}

const EmployeeTimeTipsCard = ({ variant, hidden, className }: EmployeeTimeTipsCardProps) => {
    const { t } = useTranslation();

    const summary = useMemo(() => {
        if (variant === "activity") {
            return t(
                "employeesDetail.timeTips.activity",
                "Review attendance summaries and check-in/check-out activity to quickly spot delays, missed entries, or unusual work patterns."
            );
        }
        if (variant === "absences") {
            return t(
                "employeesDetail.timeTips.absences",
                "Track approved and pending absences to understand availability and avoid overlap with key schedule periods."
            );
        }
        return t(
            "employeesDetail.timeTips.schedule",
            "The schedule shows expected shifts based on the assigned time policy so you can compare planned hours against real activity."
        );
    }, [t, variant]);

    const doc = useMemo(() => {
        if (variant === "activity") return { slug: "pd_mod_time_records" };
        if (variant === "absences") return { slug: "pd_mod_absences" };
        return { slug: "pd_admin_time_shifts" };
    }, [variant]);

    return (
        <TipsCard
            summary={summary}
            hidden={hidden}
            className={className}
            doc={doc}
        />
    );
};

export default EmployeeTimeTipsCard;
