import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useVehicle } from "@/app/vehicles/contexts/VehicleContext";
import { IconInfoItem } from "@/app/components/custom-labels";
import { Separator } from "@/components/ui/separator";
import { COUNTRIES } from "@/utils/countries";
import Tag from "@/app/components/tag/tag";
import EmployeeLabel from "@/app/components/labels/employee-label";
import WorkplaceLabel from "@/app/components/labels/workplace-label";
import { Users } from "lucide-react";
import TextLabel from "@/app/components/labels/text-label";
import { FlagComponent } from "@/app/components/flag-component";

const VehicleInfoCard = () => {
    const { t } = useTranslation();
    const { vehicle } = useVehicle();
    const [, setSearchParams] = useSearchParams();

    const drivers = vehicle.active_employees ?? [];

    const goToDriversTab = () => {
        setSearchParams({ tab: "drivers" });
    };

    const getCountryName = (countryCode: string) => {
        const country = COUNTRIES.find((c) => c.code === countryCode);
        return country?.name || countryCode;
    };

    const hasManualOrigin =
        vehicle.origin_address_line_1 ||
        vehicle.origin_address_line_2 ||
        vehicle.origin_city ||
        vehicle.origin_state_province ||
        vehicle.origin_postal_code ||
        vehicle.origin_country;

    const wp = vehicle.workplace;

    // Resolved origin fields: prefer explicit origin_* values, fall back to workplace address
    const origin = hasManualOrigin
        ? {
            address: [vehicle.origin_address_line_1, vehicle.origin_address_line_2].filter(Boolean).join(", ") || null,
            city: vehicle.origin_city,
            postal_code: vehicle.origin_postal_code,
            country: vehicle.origin_country ? getCountryName(vehicle.origin_country) : null,
            countryCode: vehicle.origin_country ?? null,
        }
        : wp
            ? {
                address: [wp.address_line_1, wp.address_line_2].filter(Boolean).join(", ") || null,
                city: wp.city,
                postal_code: wp.postal_code,
                country: wp.country ? getCountryName(wp.country) : null,
                countryCode: wp.country ?? null,
            }
            : null;

    const originFields = origin
        ? [
            { key: "address", label: t("vehicles.address", "Address"), value: origin.address, icon: "home" as const },
            { key: "city", label: t("vehicles.originCity", "City"), value: origin.city, icon: "map-pin" as const },
            { key: "postal_code", label: t("vehicles.postalCode", "Postal code"), value: origin.postal_code, icon: "mail" as const },
            { key: "country", label: t("vehicles.originCountry", "Country"), value: origin.country, countryCode: origin.countryCode ?? undefined, icon: "flag" as const },
        ].filter((f) => f.value)
        : [];

    return (
        <Card className="w-full shadow-none gap-2">
            <CardHeader>
                <CardTitle>{t("vehiclesDetail.vehicleInfo", "Vehicle Information")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Core vehicle fields */}
                <IconInfoItem
                    icon="hash"
                    label={t("vehicles.plateNumber", "Plate Number")}
                    value={vehicle.plate_number}
                    children={
                        <div className="flex items-center gap-2">
                            {vehicle.plate_number_country && (
                                <FlagComponent
                                    country={vehicle.plate_number_country.toLowerCase()}
                                    countryName={vehicle.plate_number_country.toUpperCase()}
                                />
                            )}
                            <TextLabel data={vehicle.plate_number} className="font-medium max-w-xs truncate capitalize-all" />
                        </div>
                    }
                    copyable
                />

                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                        <div className="flex items-center justify-center w-6 h-6 shrink-0 mt-0.5">
                            <Users className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col gap-1 min-w-0">
                            <span className="text-xs text-muted-foreground">
                                {t("vehiclesDetail.activeDrivers", "Active Drivers")}
                            </span>
                            <EmployeeLabel data={drivers} link />
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground shrink-0 h-7 px-2"
                        onClick={goToDriversTab}
                    >
                        {t("vehiclesDetail.viewAllDrivers", "View all")}
                    </Button>
                </div>

                <IconInfoItem
                    icon={
                        vehicle.vehicle_type === "car" ? "car"
                            : vehicle.vehicle_type === "van" ? "bus"
                                : vehicle.vehicle_type === "motorcycle" ? "bike"
                                    : "truck"
                    }
                    label={t("vehicles.type", "Type")}
                    children={<Tag text={vehicle.vehicle_type} className="capitalize" />}
                />

                <IconInfoItem
                    icon="activity"
                    label={t("vehicles.status", "Status")}
                    children={<Tag text={vehicle.status} className="capitalize" />}
                />

                <IconInfoItem
                    icon="file-text"
                    label={t("vehicles.chassisNumber", "Chassis Number")}
                    value={vehicle.chassis_number || undefined}
                    copyable
                />

                <IconInfoItem
                    icon="map-pin"
                    label={t("vehicles.location", "Location")}
                    value={
                        vehicle.location
                            ? [
                                vehicle.location.name,
                                vehicle.location.city,
                                vehicle.location.country ? getCountryName(vehicle.location.country) : null,
                            ].filter(Boolean).join(", ")
                            : undefined
                    }
                />

                {vehicle.workplace && (
                    <IconInfoItem
                        icon="building-2"
                        label={t("vehicles.workplace", "Workplace")}
                    >
                        <WorkplaceLabel data={vehicle.workplace} link />
                    </IconInfoItem>
                )}


                {/* Origin — manual fields, or workplace address as fallback; one line per field */}
                {originFields.length > 0 && (
                    <>
                        <Separator />
                        {originFields.map((f) => (
                            <IconInfoItem
                                key={f.key}
                                icon={
                                    f.key === "country" && "countryCode" in f && f.countryCode
                                        ? ({ className }) => (
                                            <span className={className}>
                                                <FlagComponent
                                                    country={f.countryCode!.toLowerCase()}
                                                    countryName={f.value!}
                                                />
                                            </span>
                                        )
                                        : f.icon
                                }
                                label={f.label}
                                value={f.value ?? undefined}
                            />
                        ))}
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default VehicleInfoCard;
