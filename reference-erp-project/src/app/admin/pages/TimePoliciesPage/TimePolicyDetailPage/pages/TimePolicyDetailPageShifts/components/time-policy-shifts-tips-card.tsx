import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import TipsCard from "@/app/components/cards/tips-card";
import type { TipsCardHiddenPart } from "@/app/components/cards/tips-card";

const SHIFT_TIPS_VARIANTS = ["default", "on_call", "special"] as const;
export type TimePolicyShiftsTipsCardVariant = (typeof SHIFT_TIPS_VARIANTS)[number];

interface TimePolicyShiftsTipsCardProps {
    variant: TimePolicyShiftsTipsCardVariant;
    hidden?: TipsCardHiddenPart | TipsCardHiddenPart[];
    className?: string;
}

const TimePolicyShiftsTipsCard = ({ variant, hidden, className }: TimePolicyShiftsTipsCardProps) => {
    const { t } = useTranslation();

    const summary = useMemo(() => {
        if (variant === "default") {
            return t(
                "timePolicies.shifts.infoDefault",
                "Default work shifts define the usual weekly schedule. Use Add Shift to create time slots per weekday; unscheduled segments show as gaps. Turn on Holiday to view and edit shifts that apply on public holidays."
            );
        }
        if (variant === "on_call") {
            return t(
                "timePolicies.shifts.infoOnCall",
                "On call shifts define coverage windows for on-call duty in the same weekly grid as default shifts. Use the Holiday switch when you need separate on-call rules for holidays."
            );
        }
        return t(
            "timePolicies.shifts.infoSpecial",
            "Special shifts apply on a given date only when an employee has no on-call shift that day. Use them for custom schedules—for example, early summer when every Friday runs only until midday."
        );
    }, [t, variant]);

    return (
        <TipsCard
            summary={summary}
            hidden={hidden}
            className={className}
            doc={{ slug: "pd_admin_time_shifts" }}
        />
    );
};

export default TimePolicyShiftsTipsCard;
