import React, { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { useTranslation } from "@/hooks/useTranslation";
import { getEmployeePayroll } from "@/api/employees/payrolls/payrolls";
import { PayrollLine, PayrollLineType, PayrollLineSubType } from "@/types/employees/payrolls";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import IdBadge from "@/app/components/id-badge";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from "@/components/ui/shadcn-io/tabs";
import FilesSection from "@/app/components/files/files-section";
import { formatDate } from "@/utils/miscelanea";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import CurrencyLabel from "@/app/components/labels/currency-label";

interface PayrollViewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: string;
    employeeId: string;
    payrollId: string;
}

const PayrollViewModal: React.FC<PayrollViewModalProps> = ({
    open,
    onOpenChange,
    orgId,
    employeeId,
    payrollId,
}) => {
    const { t } = useTranslation();
    const [isFetchingPayroll, setIsFetchingPayroll] = useState(false);
    const [payrollLines, setPayrollLines] = useState<PayrollLine[]>([]);
    const [payrollData, setPayrollData] = useState<{
        start_date: string;
        end_date: string;
        payment_date: string;
    } | null>(null);
    const [activeTab, setActiveTab] = useState<string>("payroll-lines");

    const handleTabChange = useCallback((value: string) => {
        setActiveTab(value);
    }, []);

    const getTypeLabel = useCallback((type: PayrollLineType): string => {
        const labels: Record<PayrollLineType, string> = {
            earning: t("payrolls.types.earning", "Earning"),
            deduction: t("payrolls.types.deduction", "Deduction"),
            employer_cost: t("payrolls.types.employerCost", "Company Cost"),
        };
        return labels[type] || type;
    }, [t]);

    const getSubTypeLabel = useCallback((subType: PayrollLineSubType): string => {
        const labels: Record<PayrollLineSubType, string> = {
            base_salary: "Base Salary",
            fixed_salary_allowance: "Fixed Allowance",
            variable_salary_allowance: "Variable Allowance",
            overtime_hours: "Overtime",
            prorated_extra_payments: "Prorated Extra",
            non_salary_earning: "Non-Salary",
            per_diems: "Per Diems",
            mileage_compensation: "Mileage",
            reimbursed_expense: "Reimbursement",
            compensation_or_severance_payment: "Severance",
            collective_agreement_salary_bonus: "Collective Bonus",
            collective_agreement_non_salary_bonus: "Non-Salary Bonus",
            employee_social_security_common_contingencies: "SS Common",
            employee_social_security_unemployment: "SS Unemployment",
            employee_social_security_professional_training: "SS Training",
            employee_social_security_overtime: "SS Overtime",
            income_tax_withholding: "IRPF",
            salary_advance: "Salary Advance",
            court_ordered_garnishment: "Garnishment",
            company_loan_repayment: "Loan Repayment",
            union_fee: "Union Fee",
            other_voluntary_deduction: "Other Deduction",
            employer_social_security_common_contingencies: "Employer SS Common",
            employer_social_security_accidents_occupational_illness: "Employer SS Accidents",
            employer_social_security_unemployment: "Employer SS Unemployment",
            employer_social_security_professional_training: "Employer SS Training",
            employer_social_security_fogasa: "FOGASA",
            employer_social_security_mei_contribution: "MEI",
            employer_social_security_overtime: "Employer SS Overtime",
            group_insurance: "Group Insurance",
            pension_plan_contribution: "Pension Plan",
            social_benefit_expense: "Social Benefit",
            other: "Other",
        };
        return labels[subType] || subType;
    }, []);

    // Fetch payroll data when modal opens
    useEffect(() => {
        const fetchPayrollData = async () => {
            if (!open || !payrollId || !employeeId) return;

            setIsFetchingPayroll(true);
            try {
                const response = await getEmployeePayroll(orgId, employeeId, payrollId);
                if (response.success) {
                    const payroll = response.success.payroll;

                    setPayrollData({
                        start_date: payroll.start_date,
                        end_date: payroll.end_date,
                        payment_date: payroll.payment_date,
                    });

                    // Set lines for display
                    if (payroll.lines) {
                        const sortedLines = [...payroll.lines].sort((a: PayrollLine, b: PayrollLine) => a.order - b.order);
                        setPayrollLines(sortedLines);
                    }
                }
            } catch (error) {
                console.error("Error fetching payroll:", error);
                toast.error(t("payrolls.fetchError", "Failed to load payroll data"));
            } finally {
                setIsFetchingPayroll(false);
            }
        };

        if (open && payrollId) {
            fetchPayrollData();
        }
    }, [open, payrollId, employeeId, orgId, t]);

    // Reset state when modal closes
    useEffect(() => {
        if (!open) {
            setPayrollData(null);
            setPayrollLines([]);
            setActiveTab("payroll-lines");
        }
    }, [open]);

    const totals = useMemo(() => {
        const earnings = payrollLines.filter((l) => l.type === "earning").reduce((sum, l) => sum + l.amount, 0);
        const deductions = payrollLines.filter((l) => l.type === "deduction").reduce((sum, l) => sum + l.amount, 0);
        const employerCosts = payrollLines.filter((l) => l.type === "employer_cost").reduce((sum, l) => sum + l.amount, 0);
        return { earnings, deductions, employerCosts, net: earnings - deductions, totalCost: earnings + employerCosts };
    }, [payrollLines]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-2xl md:min-w-4xl w-full max-h-[90vh] min-h-[90vh] overflow-y-auto flex flex-col"
                showCloseButton={false}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between gap-2 text-lg font-semibold">
                        <span>{t("payrolls.viewPayroll", "View Payroll")}</span>
                        {payrollId && <IdBadge id={payrollId} />}
                    </DialogTitle>
                </DialogHeader>

                {isFetchingPayroll ? (
                    <div className="flex items-center justify-center py-12 flex-1">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-4 overflow-y-auto max-h-[90vh] px-2 scrollbar-hide mb-16">
                        {/* Payroll Information */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <h4 className="font-medium text-sm">{t("payrolls.startDate", "Start Date")}</h4>
                                <span className="text-sm">
                                    {payrollData?.start_date ? formatDate(payrollData.start_date, { showTime: false, useUTC: true }) : <span className="text-muted-foreground">-</span>}
                                </span>
                            </div>

                            <div className="space-y-1">
                                <h4 className="font-medium text-sm">{t("payrolls.endDate", "End Date")}</h4>
                                <span className="text-sm">
                                    {payrollData?.end_date ? formatDate(payrollData.end_date, { showTime: false, useUTC: true }) : <span className="text-muted-foreground">-</span>}
                                </span>
                            </div>

                            <div className="space-y-1">
                                <h4 className="font-medium text-sm">{t("payrolls.paymentDate", "Payment Date")}</h4>
                                <span className="text-sm">
                                    {payrollData?.payment_date ? formatDate(payrollData.payment_date, { showTime: false, useUTC: true }) : <span className="text-muted-foreground">-</span>}
                                </span>
                            </div>
                        </div>

                        <Tabs value={activeTab} onValueChange={handleTabChange}>
                            <TabsList className="w-full justify-start border-b-2 border-border bg-background" activeClassName='border-b-2 border-primary -mb-1.5'>
                                <TabsTrigger className="py-0" value="payroll-lines">{t("payrolls.tabs.payrollLines", "Payroll Lines")}</TabsTrigger>
                                <TabsTrigger className="py-0" value="files">{t("payrolls.tabs.files", "Files")}</TabsTrigger>
                            </TabsList>
                            <TabsContents transition={{ duration: 0 }}>
                                <TabsContent value="payroll-lines" transition={{ duration: 0 }}>
                                    <div className="mt-2">
                                        {/* Read-only payroll lines display */}
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="hover:bg-transparent">
                                                    <TableHead className="w-32">{t("payrolls.lines.type", "Type")}</TableHead>
                                                    <TableHead className="w-48">{t("payrolls.lines.category", "Category")}</TableHead>
                                                    <TableHead>{t("payrolls.lines.description", "Description")}</TableHead>
                                                    <TableHead className="w-32 text-right">{t("payrolls.lines.amount", "Amount")}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {payrollLines.length > 0 ? (
                                                    payrollLines.map((line) => (
                                                        <TableRow key={line.id} className="hover:bg-muted/50">
                                                            <TableCell className={cn(
                                                                "w-32 text-sm font-medium",
                                                                line.type === "earning" && "text-green-600",
                                                                line.type === "deduction" && "text-orange-600",
                                                                line.type === "employer_cost" && "text-foreground"
                                                            )}>
                                                                {getTypeLabel(line.type)}
                                                            </TableCell>
                                                            <TableCell className="w-48 text-sm">
                                                                {getSubTypeLabel(line.sub_type)}
                                                            </TableCell>
                                                            <TableCell className="text-sm">
                                                                {line.concept || <span className="text-muted-foreground">-</span>}
                                                            </TableCell>
                                                            <TableCell className={cn(
                                                                "w-32 text-right text-sm font-medium tabular-nums",
                                                                line.type === "earning" && "text-green-600",
                                                                line.type === "deduction" && "text-orange-600",
                                                                line.type === "employer_cost" && "text-foreground"
                                                            )}>
                                                                <CurrencyLabel data={line.amount} />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                                            {t("payrolls.noLines", "No payroll lines")}
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                            <TableFooter>
                                                <TableRow className="hover:bg-transparent bg-muted/50">
                                                    <TableCell colSpan={3} className="text-right">
                                                        {t("payrolls.summary.netSalary", "Net Salary")}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold tabular-nums text-base">
                                                        <CurrencyLabel data={totals.net} />
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow className="hover:bg-transparent bg-muted/50 text-muted-foreground">
                                                    <TableCell colSpan={3} className="text-right">
                                                        {t("payrolls.summary.totalCost", "Total Company Cost")}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold tabular-nums text-base">
                                                        <CurrencyLabel data={totals.totalCost} />
                                                    </TableCell>
                                                </TableRow>
                                            </TableFooter>
                                        </Table>
                                    </div>
                                </TabsContent>
                                <TabsContent value="files" transition={{ duration: 0 }}>
                                    <div className="mt-2">
                                        <FilesSection
                                            entity_id={payrollId}
                                            showBreadcrumbs={false}
                                            showSearch={true}
                                            showCreateFolder={false}
                                            showUpload={false}
                                            showDelete={false}
                                            showEdit={false}
                                        />
                                    </div>
                                </TabsContent>
                            </TabsContents>
                        </Tabs>

                        <div className="flex-col rounded-b-lg sm:flex-row gap-2 fixed bottom-0 left-0 right-0 bg-background p-4 flex justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                {t("common.close", "Close")}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default PayrollViewModal;

