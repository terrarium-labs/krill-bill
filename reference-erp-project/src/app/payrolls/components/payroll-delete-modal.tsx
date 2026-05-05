import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { formatDate, formatCurrency } from "@/utils/miscelanea";
import { Payroll } from "@/types/employees/payrolls";

interface PayrollDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    payroll: Payroll | null;
    onConfirm: () => void;
    isDeleting: boolean;
    amountsVisible?: boolean;
}

const PayrollDeleteModal = ({
    isOpen,
    onClose,
    payroll,
    onConfirm,
    isDeleting,
    amountsVisible = false,
}: PayrollDeleteModalProps) => {
    const { t } = useTranslation();

    const blurClass = amountsVisible ? "" : "blur-sm select-none";

    return (
        <DeleteModal
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            title={t("payrolls.deletePayroll", "Delete Payroll")}
            description={
                <>
                    {t(
                        "payrolls.deletePayrollConfirmation",
                        "Are you sure you want to delete this payroll? This action cannot be undone."
                    )}
                    {payroll && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            {payroll.employee && (
                                <div className="mb-1">
                                    <strong>
                                        {payroll.employee.first_name}{" "}
                                        {payroll.employee.last_name}
                                    </strong>
                                </div>
                            )}
                            <strong>
                                {t("payrolls.payrollPeriod", "Period")}:{" "}
                                {formatDate(payroll.start_date, {
                                    showTime: false,
                                    useUTC: true,
                                })}{" "}
                                -{" "}
                                {formatDate(payroll.end_date, {
                                    showTime: false,
                                    useUTC: true,
                                })}
                            </strong>
                            <div className="text-sm mt-1">
                                {t("payrolls.netAmount", "Net Amount")}:{" "}
                                <span className={blurClass}>
                                    {formatCurrency(
                                        payroll.net_amount_to_receive
                                    )}
                                </span>
                            </div>
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default PayrollDeleteModal;
