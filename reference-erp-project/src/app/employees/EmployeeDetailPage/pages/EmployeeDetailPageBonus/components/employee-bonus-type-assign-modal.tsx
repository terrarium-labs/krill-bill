import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { getBonusTypes } from "@/api/orgs/bonus-types/bonus-types";
import { postEmployeeBonusType, patchEmployeeBonusType } from "@/api/employees/bonus-types/bonus-types";
import { MultiSelectApi } from "@/app/components/forms-elements/multi-select-api";
import { BonusTypeEmployee } from "@/types/employees/bonus-types";
import { BonusType } from "@/types/general/bonus-types";
import { useOrg } from "@/app/contexts/OrgContext";
import { formatCurrency } from "@/utils/miscelanea";

interface EmployeeBonusTypeAssignModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employeeId: string;
    onSuccess: () => void;
    bonusTypeEmployeeToEdit?: BonusTypeEmployee | null;
    mode?: "create" | "edit";
}

const EmployeeBonusTypeAssignModal = ({
    open,
    onOpenChange,
    employeeId,
    onSuccess,
    bonusTypeEmployeeToEdit,
    mode = "create",
}: EmployeeBonusTypeAssignModalProps) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const { org } = useOrg();
    const currency = org?.currency ?? "EUR";
    const [isLoading, setIsLoading] = useState(false);
    const [selectedBonusTypeId, setSelectedBonusTypeId] = useState<string[]>([]);
    const [selectedBonusType, setSelectedBonusType] = useState<BonusType | null>(null);
    const [amount, setAmount] = useState<string>("");

    useEffect(() => {
        if (open) {
            if (mode === "edit" && bonusTypeEmployeeToEdit) {
                setSelectedBonusTypeId([bonusTypeEmployeeToEdit.org_bonus_type.id]);
                setSelectedBonusType(bonusTypeEmployeeToEdit.org_bonus_type);
                setAmount(
                    bonusTypeEmployeeToEdit.amount != null
                        ? String(bonusTypeEmployeeToEdit.amount)
                        : ""
                );
            } else {
                setSelectedBonusTypeId([]);
                setSelectedBonusType(null);
                setAmount("");
            }
        }
    }, [open, mode, bonusTypeEmployeeToEdit]);

    const handleClose = () => {
        setSelectedBonusTypeId([]);
        setSelectedBonusType(null);
        setAmount("");
        onOpenChange(false);
    };

    const handleSubmit = async () => {
        if (!orgId) return;
        if (!selectedBonusTypeId[0]) {
            toast.error(t("employees.bonusTypes.selectBonusType", "Please select a bonus type"));
            return;
        }

        const parsedAmount = amount !== "" ? parseFloat(amount) : null;
        if (amount !== "" && isNaN(parsedAmount!)) {
            toast.error(t("employees.bonusTypes.invalidAmount", "Amount must be a valid number"));
            return;
        }

        setIsLoading(true);
        try {
            let response;
            if (mode === "edit" && bonusTypeEmployeeToEdit) {
                response = await patchEmployeeBonusType(
                    orgId,
                    employeeId,
                    bonusTypeEmployeeToEdit.id,
                    {
                        bonus_type_id: selectedBonusTypeId[0],
                        amount: parsedAmount,
                    }
                );
            } else {
                response = await postEmployeeBonusType(orgId, employeeId, {
                    bonus_type_id: selectedBonusTypeId[0],
                    amount: parsedAmount,
                });
            }

            if (response.success) {
                const successMessage =
                    mode === "edit"
                        ? t("employees.bonusTypes.bonusTypeUpdated", "Bonus type updated successfully")
                        : t("employees.bonusTypes.bonusTypeAssigned", "Bonus type assigned successfully");
                toast.success(successMessage);
                handleClose();
                onSuccess();
            } else {
                const errorMessage =
                    mode === "edit"
                        ? t("employees.bonusTypes.errorUpdatingBonusType", "Error updating bonus type")
                        : t("employees.bonusTypes.errorAssigningBonusType", "Error assigning bonus type");
                toast.error(response.error || errorMessage);
            }
        } catch {
            const errorMessage =
                mode === "edit"
                    ? t("employees.bonusTypes.errorUpdatingBonusType", "Error updating bonus type")
                    : t("employees.bonusTypes.errorAssigningBonusType", "Error assigning bonus type");
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); else onOpenChange(true); }}>
            <DialogContent className="sm:max-w-[425px]" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>
                        {mode === "edit"
                            ? t("employees.bonusTypes.editBonusType", "Edit Bonus Type")
                            : t("employees.bonusTypes.assignBonusType", "Assign Bonus Type")}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>{t("admin.bonusTypes.name", "Bonus Type")} *</Label>
                        <MultiSelectApi
                            fetchOptions={getBonusTypes}
                            fetchArgs={[orgId!]}
                            optionsKey="bonus_types"
                            customValueKey={(item) => item.id}
                            customLabelKey={(item) =>
                                item.amount != null
                                    ? `${item.name} — ${formatCurrency(item.amount, currency)}`
                                    : item.name
                            }
                            placeholder={t("employees.bonusTypes.selectBonusTypePlaceholder", "Select a bonus type...")}
                            searchPlaceholder={t("employees.bonusTypes.searchBonusTypes", "Search bonus types...")}
                            emptyText={t("employees.bonusTypes.noBonusTypesAvailable", "No bonus types available")}
                            value={selectedBonusTypeId}
                            onChangeValue={setSelectedBonusTypeId}
                            onChangeValueWithItem={(_value, _map, lastItem) => {
                                setSelectedBonusType(lastItem as BonusType ?? null);
                            }}
                            maxCount={1}
                            disabled={isLoading}
                            className="w-full"
                        />
                        {selectedBonusType && (
                            <p className="text-xs text-muted-foreground">
                                {t("employees.bonusTypes.defaultAmount", "Default amount")}{": "}
                                <span className="font-medium text-foreground">
                                    {formatCurrency(selectedBonusType.amount, currency)}
                                </span>
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>{t("admin.bonusTypes.amount", "Amount Override")}</Label>
                        <Input
                            type="number"
                            step="0.01"
                            placeholder={
                                selectedBonusType
                                    ? t(
                                          "employees.bonusTypes.amountPlaceholderWithDefault",
                                          "Default: {{amount}} — leave empty to use it",
                                          { amount: formatCurrency(selectedBonusType.amount, currency) }
                                      )
                                    : t("employees.bonusTypes.amountPlaceholder", "Leave empty to use default amount")
                            }
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            disabled={isLoading}
                        />
                        <p className="text-xs text-muted-foreground">
                            {t("employees.bonusTypes.amountHint", "Optional. Overrides the default amount from the bonus type.")}
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                        {t("common.cancel", "Cancel")}
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || selectedBonusTypeId.length === 0}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {mode === "edit" ? t("admin.bonusTypes.update", "Update") : t("common.assign", "Assign")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EmployeeBonusTypeAssignModal;
