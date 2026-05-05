import { Plus, Loader2, Save, ArrowRight } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion";
import { BillableItemsProvider, useBillableItems } from "./contexts/BillableItemsContext";
import { BillableItemRow } from "./components/billable-item-row";
import BillableItemsTotals from "./components/billable-items-totals";
import IndirectCostsSection from "./components/indirect-costs-section";
import CommutingSection from "./components/commuting-section";
import InvoicesResume from "./components/invoices-resume";
import { Card } from "@/components/ui/card";
import CurrencyLabel from "@/app/components/labels/currency-label";

const BillableItemsContent = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();
    const { items, addItem, save, isSaving, hasUnsavedChanges, calculations, commutingCalculations, indirectCostCalculations, invoices, createInvoice, isCreatingInvoice } = useBillableItems();

    const handleCreateInvoice = async () => {
        const invoiceId = await createInvoice();
        if (invoiceId) {
            toast.success(t("salesInvoices.invoiceCreated", "Sales invoice created successfully"));
            navigate(`/${orgId}/sales/invoices/${invoiceId}`);
        }
    };

    const hasCommuting = commutingCalculations.subtotal > 0 || commutingCalculations.totalCostPrice > 0;
    const hasIndirectCosts = indirectCostCalculations.lineItems.some((item) => item.enabled);

    return (
        <div className="flex gap-6 max-h-[calc(100vh-14rem)]">
            <div className="flex flex-col flex-1 min-w-0 overflow-y-auto -mr-2 pr-2">
                <Accordion type="multiple" defaultValue={["billable-items"]}>
                    {/* Billable Items */}
                    <AccordionItem value="billable-items">
                        <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                                <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                                    <div className="flex items-center gap-3 flex-1 justify-between">
                                        {t("workOrders.billableItems", "Billable Items")}
                                        {calculations.total !== 0 && (
                                            <CurrencyLabel data={calculations.total} className="font-medium" />
                                        )}
                                    </div>
                                </AccordionTrigger>
                            </div>
                        </div>
                        <AccordionContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="min-w-48">
                                            {t("workOrders.concept", "Concepto")}
                                        </TableHead>
                                        <TableHead className="min-w-32">
                                            {t("workOrders.description", "Descripción")}
                                        </TableHead>
                                        <TableHead className="w-20">
                                            {t("workOrders.quantity", "Cantidad")}
                                        </TableHead>
                                        <TableHead className="w-24">
                                            {t("workOrders.price", "Precio")}
                                        </TableHead>
                                        <TableHead className="w-20">
                                            {t("workOrders.discount", "Dto. %")}
                                        </TableHead>
                                        <TableHead className="min-w-36">
                                            {t("workOrders.taxes", "Impuestos")}
                                        </TableHead>
                                        <TableHead className="w-24">
                                            {t("workOrders.total", "Total")}
                                        </TableHead>
                                        <TableHead className="w-px p-0 border-l" />
                                        <TableHead className="w-20">
                                            {t("workOrders.costPrice", "PC")}
                                        </TableHead>
                                        <TableHead className="w-20">
                                            {t("workOrders.margin", "Margen")}
                                        </TableHead>
                                        <TableHead className="w-8"></TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {items.length > 0 ? (
                                        items.map((item) => (
                                            <BillableItemRow
                                                key={item.id || `line-${item.order}`}
                                                billableItem={item}
                                            />
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={11}
                                                className="h-32 text-center text-muted-foreground text-sm"
                                            >
                                                {t(
                                                    "workOrders.noBillableItems",
                                                    "No billable items yet. Click 'Add line' to get started."
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>

                            <div className="mt-2 flex justify-end gap-2">
                                <Button variant="outline" size="sm" className="gap-1.5" onClick={addItem}>
                                    <Plus className="h-4 w-4" />
                                    {t("workOrders.addLine", "Add line")}
                                </Button>
                                <Button
                                    onClick={save}
                                    disabled={isSaving || !hasUnsavedChanges}
                                    size="sm"
                                    className="gap-1.5 shrink-0"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            {t("common.saving", "Saving...")}
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            {t("common.save", "Save")}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Commuting */}
                    <AccordionItem value="commuting">
                        <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                            <div className="flex items-center gap-3 flex-1 justify-between">
                                {t("workOrders.commuting", "Commuting")}
                                {hasCommuting && (
                                    <CurrencyLabel data={commutingCalculations.total} className="font-medium" />
                                )}
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <CommutingSection />
                        </AccordionContent>
                    </AccordionItem>

                    {/* Indirect Costs */}
                    <AccordionItem value="indirect-costs">
                        <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                            <div className="flex items-center gap-3 flex-1 justify-between">
                                {t("workOrders.indirectCosts", "Indirect Costs")}
                                {hasIndirectCosts && (
                                    <CurrencyLabel data={indirectCostCalculations.totalIndirectCosts} variant="negative-loss" className="font-medium" />
                                )}
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <IndirectCostsSection />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>

            <div className="flex flex-col gap-4">
                {invoices.length > 0 ? <Card className="p-6 py-4 pt-3 shadow-none border-border shrink-0 self-start sticky top-0">
                    <InvoicesResume />
                </Card> : <Button
                    className="flex justify-center items-center h-12"
                    variant="outline"
                    onClick={handleCreateInvoice}
                    disabled={isCreatingInvoice}
                >
                    {isCreatingInvoice ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <ArrowRight className="w-4 h-4 mr-2" />
                    )}
                    <p className="font-medium">{t("invoices.noInvoices", "Invoice this WorkOrder")}</p>
                </Button>}

                <Card className="p-6 shadow-none border-border shrink-0 self-start sticky top-0">
                    <BillableItemsTotals />
                </Card>
            </div>
        </div>
    );
};

const WorkOrderDetailPageFinancials = () => {
    return (
        <BillableItemsProvider>
            <BillableItemsContent />
        </BillableItemsProvider>
    );
};

export default WorkOrderDetailPageFinancials;
