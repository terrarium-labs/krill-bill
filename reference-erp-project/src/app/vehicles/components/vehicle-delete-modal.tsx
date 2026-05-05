import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { Vehicle } from "@/types/general/vehicles";

interface VehicleDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    vehicle: Vehicle | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const VehicleDeleteModal = ({
    isOpen,
    onClose,
    vehicle,
    onConfirm,
    isDeleting,
}: VehicleDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            title={t("vehicles.deleteVehicle", "Delete Vehicle")}
            description={
                <>
                    {t(
                        "vehicles.deleteVehicleConfirmation",
                        "Are you sure you want to delete this vehicle? This action cannot be undone."
                    )}
                    {vehicle && (
                        <div className="mt-4 p-3 bg-muted rounded-md">
                            <p className="font-semibold">{vehicle.name}</p>
                            {vehicle.plate_number && (
                                <p className="text-sm text-muted-foreground">
                                    {vehicle.plate_number}
                                </p>
                            )}
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default VehicleDeleteModal;
