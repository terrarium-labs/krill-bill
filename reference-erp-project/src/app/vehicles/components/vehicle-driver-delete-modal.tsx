import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";
import type { Employee } from "@/types/employees/employees";

export interface VehicleDriver {
    id: string;
    employee: Employee;
}

interface VehicleDriverDeleteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    driver: VehicleDriver | null;
    orgId: string;
    vehicleId: string;
    onConfirm: (vehicleEmployeeId: string) => Promise<void>;
    isDeleting: boolean;
}

const VehicleDriverDeleteModal: React.FC<VehicleDriverDeleteModalProps> = ({
    open,
    onOpenChange,
    driver,
    onConfirm,
    isDeleting,
}) => {
    const { t } = useTranslation();

    const handleConfirm = async () => {
        if (driver) {
            await onConfirm(driver.id);
        }
    };

    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={t("vehicles.removeDriver", "Remove Driver")}
            description={
                <>
                    {t(
                        "vehicles.removeDriverConfirmation",
                        "Are you sure you want to remove this driver from the vehicle?"
                    )}
                    {driver && (
                        <div className="mt-4 p-3 bg-muted rounded-md">
                            <EmployeeAvatar
                                employee={driver.employee}
                                showName={true}
                                showJobTitle={true}
                            />
                        </div>
                    )}
                </>
            }
            deleteText={t("vehicles.removeDriver", "Remove")}
            deletingText={t("common.removing", "Removing...")}
            onConfirm={handleConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default VehicleDriverDeleteModal;
