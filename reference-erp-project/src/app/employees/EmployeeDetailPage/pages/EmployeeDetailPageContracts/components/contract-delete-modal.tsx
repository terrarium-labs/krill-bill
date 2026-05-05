import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { deleteEmployeeContract } from "@/api/employees/contracts/contracts";
import { EmployeeContract } from "@/types/employees/contracts";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/miscelanea";
import Tag from "@/app/components/tag/tag";

interface ContractDeleteModalProps {
    contract: EmployeeContract | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: string | undefined;
    employeeId: string | undefined;
    onDeleted: () => void;
}

const ContractDeleteModal: React.FC<ContractDeleteModalProps> = ({
    contract,
    open,
    onOpenChange,
    orgId,
    employeeId,
    onDeleted,
}) => {
    const { t } = useTranslation();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!contract || !orgId || !employeeId || !contract.id) return;

        setIsDeleting(true);
        try {
            const response = await deleteEmployeeContract(orgId, employeeId, contract.id);
            if (response.success) {
                toast.success(t("employees.contracts.contractDeleted", "Contract deleted successfully"));
                onDeleted();
                onOpenChange(false);
            } else {
                toast.error(t("employees.contracts.errorDeletingContract", "Error deleting contract"));
            }
        } catch (error) {
            toast.error(t("employees.contracts.errorDeletingContract", "Error deleting contract"));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>{t("employees.contracts.deleteContract", "Delete Contract")}</DialogTitle>
                    <DialogDescription>
                        {t(
                            "employees.contracts.deleteContractConfirmation",
                            "Are you sure you want to delete this contract? This action cannot be undone."
                        )}
                        {contract && (
                            <div className="mt-2 p-2 bg-muted rounded">
                                <div className="font-medium"><Tag text={contract.type} /></div>
                                <div className="text-sm text-muted-foreground">
                                    {formatDate(contract.start_date, { showTime: false })} -{" "}
                                    {contract.end_date
                                        ? formatDate(contract.end_date, { showTime: false })
                                        : t("common.indefinite", "Indefinite")}
                                </div>
                            </div>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
                        {t("common.cancel", "Cancel")}
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t("common.deleting", "Deleting...")}
                            </>
                        ) : (
                            t("common.delete", "Delete")
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ContractDeleteModal;
