import React from "react";
import { useTranslation } from "react-i18next";
import { VehicleMaintenance } from "@/types/general/vehicles";
import { formatDate } from "@/utils/miscelanea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import IdBadge from "@/app/components/id-badge";
import FilesSection from "@/app/components/files/files-section";

interface MaintenanceViewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    maintenance: VehicleMaintenance | null;
    renderActions?: (maintenance: VehicleMaintenance) => React.ReactNode;
}

const MaintenanceViewModal: React.FC<MaintenanceViewModalProps> = ({
    open,
    onOpenChange,
    maintenance,
    renderActions,
}) => {
    const { t } = useTranslation();

    const format = (dateString: string) =>
        formatDate(new Date(dateString), {
            showTime: false,
            showYear: true,
            useUTC: true,
        });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full md:max-w-2xl" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between gap-2 text-lg font-semibold">
                        <span>{t("maintenance.viewTitle", "Maintenance Details")}</span>
                        {maintenance && (
                            <div className="flex items-center gap-2">
                                <IdBadge id={maintenance.id} />
                                {renderActions?.(maintenance)}
                            </div>
                        )}
                    </DialogTitle>
                </DialogHeader>

                {!maintenance ? (
                    <div className="flex items-center justify-center py-12">
                        <p className="text-muted-foreground">
                            {t("maintenance.notFound", "Maintenance record not found")}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6 overflow-y-auto max-h-[60vh] px-2 scrollbar-hide">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <h4 className="font-medium text-sm">
                                    {t("maintenance.fromDate", "From date")}
                                </h4>
                                <span className="text-sm">{format(maintenance.from_date)}</span>
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-medium text-sm">
                                    {t("maintenance.toDate", "To date")}
                                </h4>
                                <span className="text-sm">{format(maintenance.to_date)}</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h4 className="font-medium text-sm">
                                {t("maintenance.notes", "Notes")}
                            </h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {maintenance.notes || "-"}
                            </p>
                        </div>

                        <Separator />

                        <FilesSection
                            entity_id={maintenance.id}
                            showBreadcrumbs={true}
                            showSearch={true}
                            showCreateFolder={false}
                            showUpload={true}
                        />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default MaintenanceViewModal;
