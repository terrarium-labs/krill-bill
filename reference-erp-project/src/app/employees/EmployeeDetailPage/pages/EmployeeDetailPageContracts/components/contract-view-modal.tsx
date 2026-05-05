import React from "react";
import { Banknote } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { EmployeeContract } from "@/types/employees/contracts";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import IdBadge from "@/app/components/id-badge";
import FilesSection from "@/app/components/files/files-section";
import CurrencyLabel from "@/app/components/labels/currency-label";
import Tag from "@/app/components/tag/tag";
import DateLabel from "@/app/components/labels/date-label";

interface ContractViewModalProps {
    contract: EmployeeContract | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    renderActions?: React.ReactNode;
    isAdmin?: boolean;
    amountsVisible?: boolean;
}

const ContractViewModal: React.FC<ContractViewModalProps> = ({
    contract,
    open,
    onOpenChange,
    renderActions,
    isAdmin = false,
    amountsVisible = true,
}) => {
    const { t } = useTranslation();

    if (!contract) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="min-h-[70vh] max-h-[70vh] w-full md:max-w-5xl flex flex-col" showCloseButton={false}>
                <DialogHeader>
                    <div className="flex items-start gap-2">
                        <DialogTitle className="flex flex-col items-start gap-1">
                            <span>
                                {t("employees.contracts.contractDetails", "Contract details")}
                            </span>
                        </DialogTitle>
                        <div className="flex items-center gap-2 ml-auto">
                            {contract.is_active && (
                                <Tag text={t("employees.contracts.active", "Active")} color="green" />
                            )}
                            <IdBadge id={contract.id!} />
                            {renderActions}
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 overflow-y-auto max-h-[70vh] px-2 scrollbar-hide">
                    {/* Contract Information */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <h4 className="font-medium text-sm">{t("employees.contracts.type", "Contract Type")}</h4>
                            <Tag text={contract.type} />
                        </div>

                        <div className="space-y-1">
                            <h4 className="font-medium text-sm">{t("employees.contracts.startDate", "Start Date")}</h4>
                            <DateLabel data={contract.start_date} options={{ hide: ["hours", "minutes", "seconds"] }} />
                        </div>

                        <div className="space-y-1">
                            <h4 className="font-medium text-sm">{t("employees.contracts.endDate", "End Date")}</h4>
                            {contract.end_date ? (
                                <DateLabel data={contract.end_date} options={{ hide: ["hours", "minutes", "seconds"] }} />
                            ) : (
                                <span className="text-sm text-muted-foreground">
                                    {t("common.indefinite", "Indefinite")}
                                </span>
                            )}
                        </div>

                        <div className="space-y-1">
                            <h4 className="font-medium text-sm">
                                {t("employees.contracts.annualSalary", "Annual Gross Salary")}
                            </h4>
                            <CurrencyLabel data={contract.annual_gross_salary} />
                        </div>

                        <div className="space-y-1">
                            <h4 className="font-medium text-sm">
                                {t("employees.contracts.paymentsPerYear", "Payments per Year")}
                            </h4>
                            <div className="text-sm flex items-center gap-2">
                                <Banknote className="h-4 w-4" />
                                {contract.num_salary_payments_per_year}{" "}
                                {t("employees.contracts.payments", "payments")}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h4 className="font-medium text-sm">
                                {t("employees.contracts.monthlyGrossSalary", "Monthly Gross Salary")}
                            </h4>
                            <CurrencyLabel
                                data={contract.annual_gross_salary / contract.num_salary_payments_per_year}
                            />
                        </div>

                        {contract.price_per_hour != null && (
                            <div className="space-y-1">
                                <h4 className="font-medium text-sm">
                                    {t("employees.contracts.pricePerHour", "Price per Hour")}
                                </h4>
                                <CurrencyLabel data={contract.price_per_hour} blurred={!amountsVisible} />
                            </div>
                        )}

                        {contract.overtime_price_per_hour != null && (
                            <div className="space-y-1">
                                <h4 className="font-medium text-sm">
                                    {t("employees.contracts.overtimePricePerHour", "Overtime Price per Hour")}
                                </h4>
                                <CurrencyLabel data={contract.overtime_price_per_hour} blurred={!amountsVisible} />
                            </div>
                        )}
                    </div>

                    <Separator className="my-12 mb-4" />
                    <div className="space-y-2">
                        <FilesSection
                            key={`contract-files-${contract.id}`}
                            entity_id={contract.id!}
                            canUpload={!isAdmin}
                            showUpload={!isAdmin}
                            showCreateFolder={!isAdmin}
                            showDelete={!isAdmin}
                            showEdit={!isAdmin}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ContractViewModal;
