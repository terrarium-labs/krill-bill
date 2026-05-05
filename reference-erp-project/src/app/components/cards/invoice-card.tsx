import { FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import IdBadge from "@/app/components/id-badge";
import { ClientAvatar } from "@/app/components/avatars/client-avatar";
import { SupplierAvatar } from "@/app/components/avatars/supplier-avatar";
import Tag from "@/app/components/tag/tag";
import type { SaleInvoice, PurchaseInvoice, Invoice } from "@/types/invoices/invoices";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";

interface InvoiceCardProps {
    invoice: SaleInvoice | PurchaseInvoice | Invoice;
    isSelected?: boolean;
    className?: string;
}

function InvoiceCard({ invoice, isSelected, className }: InvoiceCardProps) {
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();

    const isSale = "client" in invoice;
    const handleClick = () => {
        if (orgId) {
            navigate(`/${orgId}/${isSale ? "sales" : "purchases"}/invoices/${invoice.id}`);
        }
    };

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={(e) => e.key === "Enter" && handleClick()}
            className={cn(
                "px-4 py-3 rounded-lg border bg-background shadow-md min-w-[280px] w-[420px] max-w-full transition-all hover:shadow-lg hover:border-primary cursor-pointer text-left",
                isSelected ? "shadow-lg border-primary" : "border-border",
                className
            )}
        >
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                    <FileText className="h-5 w-5 shrink-0" />
                    <div className="min-w-0 flex-1">
                        {isSale && "client" in invoice ? (
                            <ClientAvatar client={invoice.client} showName={true} />
                        ) : "supplier" in invoice ? (
                            <SupplierAvatar supplier={invoice.supplier} showName={true} />
                        ) : (
                            <span className="font-semibold text-sm truncate">{invoice.invoice_number}</span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <IdBadge id={invoice.id} />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleClick();
                        }}
                        title="Navigate"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">{invoice.invoice_number}</span>
                <Tag text={invoice.status} className="capitalize" />
                <span className="text-xs font-medium">{invoice.currency} {invoice.total.toLocaleString()}</span>
            </div>
        </div>
    );
}

export default InvoiceCard;
