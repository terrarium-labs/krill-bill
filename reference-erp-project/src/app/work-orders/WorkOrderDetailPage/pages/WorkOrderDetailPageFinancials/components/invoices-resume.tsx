import { useTranslation } from "@/hooks/useTranslation";
import { useBillableItems } from "../contexts/BillableItemsContext";
import IdBadge from "@/app/components/id-badge";
import DateLabel from "@/app/components/labels/date-label";
import Tag from "@/app/components/tag/tag";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useNavigate, useParams } from "react-router-dom";

const InvoicesResume = () => {
    const { t } = useTranslation();
    const { invoices } = useBillableItems();
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();
    return (
        <div className="max-h-30 overflow-y-auto w-96 max-w-96">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t("common.id", "ID")}</TableHead>
                        <TableHead>{t("invoices.invoiceNumber", "Invoice #")}</TableHead>
                        <TableHead>{t("invoices.invoiceDate", "Invoice Date")}</TableHead>
                        <TableHead>{t("invoices.status", "Status")}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoices.map((invoice) => (
                        <TableRow key={invoice.id} className="cursor-pointer" onClick={() => navigate(`/${orgId}/sales/invoices/${invoice.id}`)}>
                            <TableCell>
                                <IdBadge id={invoice.id} hideIcon />
                            </TableCell>
                            <TableCell>
                                {invoice.invoice_number ? (
                                    <span className="font-medium">{invoice.invoice_number}</span>
                                ) : (
                                    <span className="text-muted-foreground italic">
                                        {t("invoices.draft", "Draft")}
                                    </span>
                                )}
                            </TableCell>
                            <TableCell>
                                <DateLabel
                                    data={invoice.invoice_date}
                                    options={{ hide: ["seconds", "hours", "minutes"] }}
                                />
                            </TableCell>
                            <TableCell>
                                <Tag text={invoice.status} className="capitalize" />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default InvoicesResume;
