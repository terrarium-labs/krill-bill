import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useVehicle } from "../../../../contexts/VehicleContext";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";
import { Users } from "lucide-react";
import VehicleDriversModal from "@/app/vehicles/components/vehicle-drivers-modal";

const VehicleDriversCard = () => {
    const { t } = useTranslation();
    const { vehicle, refreshVehicle } = useVehicle();
    const navigate = useNavigate();
    const { orgId, vehicleId } = useParams<{ orgId: string; vehicleId: string }>();

    const [driversModalOpen, setDriversModalOpen] = useState(false);

    const drivers = vehicle.active_employees ?? [];

    return (
        <>
            <Card className="w-full shadow-none gap-2">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>{t("vehiclesDetail.activeDrivers", "Active Drivers")}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDriversModalOpen(true)}
                        >
                            {t("common.viewAll", "View all")}
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {drivers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 gap-2 text-muted-foreground">
                            <Users className="h-8 w-8 opacity-40" />
                            <p className="text-sm">{t("vehiclesDetail.noActiveDrivers", "No active drivers assigned")}</p>
                            <button
                                className="text-xs text-primary hover:underline"
                                onClick={() => setDriversModalOpen(true)}
                            >
                                {t("vehiclesDetail.manageDrivers", "Manage drivers")}
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {drivers.map((employee) => (
                                <div
                                    key={employee.id}
                                    className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-1 rounded-md transition-colors"
                                    onClick={() => navigate(`/${orgId}/employees/${employee.id}`)}
                                >
                                    <EmployeeAvatar employee={employee} showName size="sm" />
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {orgId && vehicleId && (
                <VehicleDriversModal
                    open={driversModalOpen}
                    onOpenChange={setDriversModalOpen}
                    orgId={orgId}
                    vehicleId={vehicleId}
                    onSuccess={refreshVehicle}
                />
            )}
        </>
    );
};

export default VehicleDriversCard;
