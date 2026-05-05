import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import TipsCard from "@/app/components/cards/tips-card";
import type { TipsCardHiddenPart } from "@/app/components/cards/tips-card";

const FILES_TIP_VARIANTS = ["files", "pending-signatures"] as const;
export type DashboardEmployeeFilesTipsCardVariant = (typeof FILES_TIP_VARIANTS)[number];

interface DashboardEmployeeFilesTipsCardProps {
    variant: DashboardEmployeeFilesTipsCardVariant;
    hidden?: TipsCardHiddenPart | TipsCardHiddenPart[];
    className?: string;
}

const DashboardEmployeeFilesTipsCard = ({
    variant,
    hidden,
    className,
}: DashboardEmployeeFilesTipsCardProps) => {
    const { t } = useTranslation();

    const summary = useMemo(() => {
        if (variant === "files") {
            return t(
                "employeesDetail.filesTips.files",
                "Your personal files from the organization—documents shared with you, uploads, and anything you need to keep handy in one place."
            );
        }
        return t(
            "employeesDetail.filesTips.pendingSignatures",
            "Documents the organization has sent you to sign. Open each request to review and complete your signature when something is missing."
        );
    }, [t, variant]);

    const doc = useMemo(() => {
        if (variant === "files") return { slug: "pd_employee_dashboard" };
        return { slug: "pd_mod_signing_requests" };
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

export default DashboardEmployeeFilesTipsCard;
