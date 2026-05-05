import { useTranslation } from "react-i18next";
import { useOrg } from "@/app/contexts/OrgContext";
import { useNavigate, useParams } from "react-router";
import { CreditCard, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

const PaymentGuidesSection = () => {
    const { t } = useTranslation();
    const { org } = useOrg();
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();

    if (!org.payment_guides) return null;

    return (
        <div className="border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    <span className="text-sm">
                        {t("invoices.paymentGuides", "Payment Guides")}
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => navigate(`/${orgId}/admin/org`)}
                    title={t("invoices.editPaymentGuides", "Edit payment guides")}
                >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
            </div>
            <p className="text-sm whitespace-pre-wrap">{org.payment_guides}</p>
        </div>
    );
};

export default PaymentGuidesSection;
