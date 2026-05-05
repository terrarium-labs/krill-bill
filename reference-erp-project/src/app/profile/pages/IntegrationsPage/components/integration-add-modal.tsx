import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { IntegrationType } from "@/types/miscelanea";
import { useIntegrations } from "../utils/integrations";

interface IntegrationAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (type: IntegrationType) => Promise<void>;
  isConnecting: boolean;
  buttonVariant?: "default" | "outline";
}

const IntegrationAddModal = ({
  open,
  onOpenChange,
  onConnect,
  isConnecting,
  buttonVariant = "default",
}: IntegrationAddModalProps) => {
  const { t } = useTranslation();
  const integrations = useIntegrations();
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationType | null>(null);


  const handleConnect = async () => {
    if (!selectedIntegration) return;
    await onConnect(selectedIntegration);
    setSelectedIntegration(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedIntegration(null);
    }
    onOpenChange(open);
  };

  // Reset selection when modal opens
  React.useEffect(() => {
    if (open) {
      setSelectedIntegration(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {t("integrations.newIntegration", "New Integration")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            {t("integrations.connectIntegration", "Connect Integration")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {integrations.map((integration) => {
            const isSelected = selectedIntegration === integration.id;

            return (
              <button
                key={integration.id}
                type="button"
                disabled={isConnecting}
                onClick={() => setSelectedIntegration(integration.id)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-lg border transition-all text-left",
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
                )}
              >
                <div className={cn("p-2 rounded-lg", integration.iconBg)}>
                  {integration.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">{integration.name}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                    {integration.description}
                  </p>
                </div>
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 shrink-0 transition-colors",
                  isSelected
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/30"
                )}>
                  {isSelected && (
                    <Check className="h-full w-full text-white p-0.5" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="w-full sm:w-auto"
            disabled={isConnecting}
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            onClick={handleConnect}
            disabled={isConnecting || !selectedIntegration}
            className="w-full sm:w-auto"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("integrations.connecting", "Connecting...")}
              </>
            ) : (
              t("integrations.connect", "Connect")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IntegrationAddModal;
