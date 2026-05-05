import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { postTimePolicy, patchTimePolicy } from "@/api/orgs/time-policies/time-policies";
import { TimePolicy } from "@/types/general/time-policies";
import IdBadge from "@/app/components/id-badge";

interface TimePolicyEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onTimePolicyCreatedOrUpdated: () => void;
    orgId: string;
    mode: 'create' | 'edit';
    policy?: TimePolicy;
    renderActions?: () => React.ReactNode;
}

const TimePolicyEditModal = ({
    open,
    onOpenChange,
    onTimePolicyCreatedOrUpdated,
    orgId,
    mode,
    policy,
    renderActions,
}: TimePolicyEditModalProps) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        flexibility: 0,
        default_overtime_multiplier: 1.5,
    });

    const isEditMode = mode === 'edit';

    // Reset form when modal opens/closes or policy changes
    useEffect(() => {
        if (open) {
            if (isEditMode && policy) {
                setFormData({
                    name: policy.name,
                    description: policy.description || "",
                    flexibility: policy.flexibility,
                    default_overtime_multiplier: policy.default_overtime_multiplier,
                });
            } else {
                setFormData({
                    name: "",
                    description: "",
                    flexibility: 0,
                    default_overtime_multiplier: 1.5,
                });
            }
        }
    }, [open, policy, isEditMode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error(t("timePolicies.nameRequired", "Policy name is required"));
            return;
        }

        setIsLoading(true);

        try {
            const data = {
                name: formData.name.trim(),
                description: formData.description.trim() || null,
                flexibility: formData.flexibility,
                default_overtime_multiplier: formData.default_overtime_multiplier,
            };

            let response;
            if (isEditMode && policy) {
                response = await patchTimePolicy(orgId, policy.id, data);
            } else {
                response = await postTimePolicy(orgId, data);
            }

            if (response.success) {
                toast.success(
                    isEditMode
                        ? t("timePolicies.policyUpdated", "Time policy updated successfully")
                        : t("timePolicies.policyCreated", "Time policy created successfully")
                );
                onTimePolicyCreatedOrUpdated();
            } else {
                toast.error(
                    response.error ||
                    (isEditMode
                        ? t("timePolicies.errorUpdatingPolicy", "Error updating time policy")
                        : t("timePolicies.errorCreatingPolicy", "Error creating time policy"))
                );
            }
        } catch (error) {
            toast.error(
                isEditMode
                    ? t("timePolicies.errorUpdatingPolicy", "Error updating time policy")
                    : t("timePolicies.errorCreatingPolicy", "Error creating time policy")
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>
                        {isEditMode ? (
                            <div className="flex items-center justify-between w-full">
                                <span>{t("timePolicies.editPolicy", "Edit Time Policy")}</span>
                                <div className="flex items-center gap-2">
                                    {policy && <IdBadge id={policy.id} />}
                                    {renderActions && renderActions()}
                                </div>
                            </div>
                        ) : (
                            t("timePolicies.newPolicy", "New Time Policy")
                        )}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            {t("timePolicies.name", "Name")} *
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder={t("timePolicies.namePlaceholder", "Enter policy name")}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">
                            {t("timePolicies.description", "Description")}
                        </Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder={t("timePolicies.descriptionPlaceholder", "Enter policy description")}
                            disabled={isLoading}
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="flexibility">
                            {t("timePolicies.flexibility", "Flexibility (minutes)")}
                        </Label>
                        <Input
                            id="flexibility"
                            type="number"
                            min="0"
                            value={formData.flexibility}
                            onChange={(e) => setFormData({ ...formData, flexibility: parseInt(e.target.value) || 0 })}
                            placeholder={t("timePolicies.flexibilityPlaceholder", "Enter flexibility in minutes")}
                            disabled={isLoading}
                        />
                        <p className="text-sm text-muted-foreground">
                            {t("timePolicies.flexibilityHelp", "Allow employees to clock in/out within this time window")}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="default_overtime_multiplier">
                            {t("timePolicies.defaultOvertimeMultiplier", "Default Overtime Multiplier")}
                        </Label>
                        <Input
                            id="default_overtime_multiplier"
                            type="number"
                            min="1"
                            step="0.01"
                            value={formData.default_overtime_multiplier}
                            onChange={(e) => setFormData({ ...formData, default_overtime_multiplier: parseFloat(e.target.value) || 1.5 })}
                            placeholder={t("timePolicies.defaultOvertimeMultiplierPlaceholder", "e.g., 1.5")}
                            disabled={isLoading}
                        />
                        <p className="text-sm text-muted-foreground">
                            {t("timePolicies.defaultOvertimeMultiplierHelp", "Default multiplier for overtime calculations (e.g., 1.5 = 150%)")}
                        </p>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            {t("common.cancel", "Cancel")}
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {isEditMode ? t("common.updating", "Updating...") : t("common.creating", "Creating...")}
                                </>
                            ) : (
                                isEditMode ? t("common.update", "Update") : t("common.create", "Create")
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default TimePolicyEditModal;

