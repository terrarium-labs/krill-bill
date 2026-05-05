import React from "react";
import { Mail, Phone } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { ClientStakeholder } from "@/types/clients/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import IdBadge from "@/app/components/id-badge";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";

interface StakeholderInfoModalProps {
  stakeholder: ClientStakeholder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}

const StakeholderInfoModal: React.FC<StakeholderInfoModalProps> = ({
  stakeholder,
  open,
  onOpenChange,
}) => {
  const { t } = useTranslation();

  if (!stakeholder) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-start gap-2">
            <DialogTitle className="flex items-start gap-2">
              <EmployeeAvatar employee={stakeholder.employee} showName={true} size="sm" variant="full" />
            </DialogTitle>
            <div className="flex items-center gap-2 ml-auto">
              <IdBadge id={stakeholder.id} />
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            {stakeholder.employee?.email && (
              <div
                className="flex items-center gap-3 hover:underline cursor-pointer text-blue-500"
                onClick={() => window.open(`mailto:${stakeholder.employee?.email}`, "_blank")}
              >
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{stakeholder.employee.email}</span>
              </div>
            )}
            {stakeholder.employee?.phone && (
              <div
                className="flex items-center gap-3 hover:underline cursor-pointer text-blue-500"
                onClick={() => window.open(`tel:${stakeholder.employee?.phone}`, "_blank")}
              >
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{stakeholder.employee.phone}</span>
              </div>
            )}
            {!stakeholder.employee?.email && !stakeholder.employee?.phone && (
              <p className="text-sm text-muted-foreground">{t("clients.noContactInfo", "No contact information available")}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StakeholderInfoModal;
