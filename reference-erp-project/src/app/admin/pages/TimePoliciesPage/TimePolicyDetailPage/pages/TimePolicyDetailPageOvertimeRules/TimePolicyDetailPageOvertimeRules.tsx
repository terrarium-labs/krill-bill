import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { toast } from "sonner";
import { useTimePolicy } from "../../../context/TimePolicyContext";
import TimePolicyOvertimeRulesSection from "./components/time-policy-overtime-rules-section";
import TimePolicyOvertimeRuleEditModal from "./components/time-policy-overtime-rule-edit-modal";
import TimePolicyOvertimeRuleDeleteModal from "./components/time-policy-overtime-rule-delete-modal";
import { OvertimeRule } from "@/types/general/time-policies";
import { deleteOvertimeRule } from "@/api/orgs/time-policies/overtime-rules/overtime-rules";

const TimePolicyDetailPageOvertimeRules = () => {
    const { t } = useTranslation();
    const { timePolicy, refetchTimePolicy } = useTimePolicy();
    const { orgId } = useParams<{ orgId: string }>();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOvertimeRule, setSelectedOvertimeRule] = useState<OvertimeRule | undefined>(undefined);
    const [defaultIsHoliday, setDefaultIsHoliday] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [overtimeRuleToDelete, setOvertimeRuleToDelete] = useState<OvertimeRule | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    if (!timePolicy) return null;

    const handleAddOvertimeRule = (isHoliday: boolean) => {
        setSelectedOvertimeRule(undefined);
        setDefaultIsHoliday(isHoliday);
        setIsModalOpen(true);
    };

    const handleEditOvertimeRule = (overtimeRule: OvertimeRule) => {
        setSelectedOvertimeRule(overtimeRule);
        setDefaultIsHoliday(overtimeRule.is_holiday);
        setIsModalOpen(true);
    };

    const handleDeleteOvertimeRule = (overtimeRule: OvertimeRule) => {
        setOvertimeRuleToDelete(overtimeRule);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!overtimeRuleToDelete || !orgId || !timePolicy) return;

        setIsDeleting(true);
        try {
            const response = await deleteOvertimeRule(orgId, timePolicy.id, overtimeRuleToDelete.id);
            if (response.success) {
                toast.success(t("timePolicies.overtimeRules.deleteSuccess", "Overtime rule deleted successfully"));
                await refetchTimePolicy();
            } else {
                toast.error(
                    response.error || t("timePolicies.overtimeRules.deleteError", "Failed to delete overtime rule")
                );
            }
        } catch (error) {
            console.error("Error deleting overtime rule:", error);
            toast.error(t("timePolicies.overtimeRules.deleteError", "Failed to delete overtime rule"));
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
            setOvertimeRuleToDelete(null);
        }
    };

    const handleOvertimeRuleSaved = async () => {
        await refetchTimePolicy();
        setIsModalOpen(false);
        setSelectedOvertimeRule(undefined);
    };

    return (
        <>
            <div className="space-y-6">
                <TimePolicyOvertimeRulesSection
                    overtimeRules={timePolicy.overtime_rules || []}
                    onAddOvertimeRule={handleAddOvertimeRule}
                    onEditOvertimeRule={handleEditOvertimeRule}
                    onDeleteOvertimeRule={handleDeleteOvertimeRule}
                />
            </div>

            {/* Overtime Rule Modal */}
            {orgId && timePolicy && (
                <TimePolicyOvertimeRuleEditModal
                    open={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    onOvertimeRuleSaved={handleOvertimeRuleSaved}
                    orgId={orgId}
                    timePolicyId={timePolicy.id}
                    overtimeRule={selectedOvertimeRule}
                    defaultIsHoliday={defaultIsHoliday}
                    defaultMultiplier={timePolicy.default_overtime_multiplier}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <TimePolicyOvertimeRuleDeleteModal
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                overtimeRule={overtimeRuleToDelete}
                onConfirm={handleDeleteConfirm}
                isDeleting={isDeleting}
            />
        </>
    );
};

export default TimePolicyDetailPageOvertimeRules;

