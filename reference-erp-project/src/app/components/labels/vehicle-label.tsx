import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIcon } from "@/hooks/use-icon";
import { getColorClasses } from "@/utils/miscelanea";
import { Vehicle } from "@/types/general/vehicles";
import { FlagComponent } from "@/app/components/flag-component";
import TextLabel from "@/app/components/labels/text-label";
import Tag from "@/app/components/tag/tag";
import { getTagColorFromString } from "@/app/components/tag/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// ── Types ─────────────────────────────────────────────────────────────────────

type HideProp =
    | "flag"          // hides country flag
    | "plate-number"  // hides plate number text
    | "plate"         // hides both flag and plate number
    | "name"  // hides the vehicle name
    | "icon"          // hides the leading colored vehicle-type icon badge
    | "type";         // hides the trailing vehicle-type Tag

/**
 * VehicleLabel component — displays one or multiple vehicles.
 *
 * @param data     - Single Vehicle, array of Vehicles, null, or undefined
 * @param hide     - Parts to suppress (flag, plate-number, plate, name, icon, type)
 * @param variant  - "default": full label for single / overlapping badges for multiple
 *                   "icon": always renders the overlapping icon-badge style
 * @param link     - If true, navigates to the vehicle detail page on click.
 *                   If string, appends it as sub-route.
 *
 * Behaviour:
 * - null / undefined / empty array → renders "-"
 * - variant="default", single vehicle → icon badge + flag + plate + name + type tag
 * - variant="default", multiple vehicles → overlapping icon badges + "+N" overflow
 * - variant="icon" → always overlapping icon-badge style (even for one vehicle)
 */
interface VehicleLabelProps {
    data: Vehicle | Vehicle[] | null | undefined;
    hide?: HideProp[];
    variant?: "default" | "icon";
    link?: boolean | string;
    /** Extra classes applied to the outer wrapper element */
    className?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Maps a vehicle_type to its corresponding Lucide icon name. */
function vehicleTypeToIcon(type: Vehicle["vehicle_type"]): string {
    switch (type) {
        case "car":        return "car";
        case "van":        return "bus";
        case "motorcycle": return "bike";
        default:           return "truck";
    }
}

// ── Component ─────────────────────────────────────────────────────────────────

const VehicleLabel: React.FC<VehicleLabelProps> = ({
    data,
    hide = [],
    variant = "default",
    link = false,
    className,
}) => {
    const renderIcon = useIcon();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();

    const handleClick = (e: React.MouseEvent, vehicleId: string) => {
        e.stopPropagation();
        if (link && orgId) {
            const basePath = `/${orgId}/vehicles/${vehicleId}`;
            const subRoute = typeof link === "string" ? `/${link}` : "";
            navigate(`${basePath}${subRoute}`);
        }
    };

    // ── Empty state ───────────────────────────────────────────────────────────

    if (!data || (Array.isArray(data) && data.length === 0)) {
        return <span className="text-muted-foreground">-</span>;
    }

    // ── Normalise to array ────────────────────────────────────────────────────

    const vehicles = Array.isArray(data) ? data : [data];

    // ── Derive visibility flags ───────────────────────────────────────────────

    const hideIcon        = hide.includes("icon");
    const hideFlag        = hide.includes("flag") || hide.includes("plate");
    const hidePlateNumber = hide.includes("plate-number") || hide.includes("plate");
    const hideVehicleName = hide.includes("name");
    const hideType        = hide.includes("type");

    // ── Icon badge renderer (used in both icon variant and array mode) ─────────

    const renderIconBadge = (vehicle: Vehicle, index?: number) => {
        const typeColor = getTagColorFromString(vehicle.vehicle_type);
        const tooltipText = `${vehicle.name} · ${vehicle.plate_number}`;

        const badge = (
            <div
                className={cn(
                    "w-6 h-6 p-1 rounded-md shrink-0 flex items-center justify-center",
                    "cursor-pointer hover:opacity-90 transition-opacity",
                    getColorClasses(typeColor)
                )}
            >
                {renderIcon(vehicleTypeToIcon(vehicle.vehicle_type), "w-4 h-4")}
            </div>
        );

        return (
            <TooltipProvider key={vehicle.id ?? index}>
                <Tooltip>
                    <TooltipTrigger asChild>{badge}</TooltipTrigger>
                    <TooltipContent>
                        <span className="text-sm">{tooltipText}</span>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    };

    // ── Default variant — single vehicle ──────────────────────────────────────

    if (variant === "default" && vehicles.length === 1) {
        const vehicle   = vehicles[0];
        const typeColor = getTagColorFromString(vehicle.vehicle_type);

        return (
            <div
                className={cn(
                    "flex items-center gap-2",
                    link && "cursor-pointer hover:bg-primary/10 -mx-2 -my-1 px-2 py-1 rounded transition-all hover:opacity-80",
                    className
                )}
                onClick={link ? (e) => handleClick(e, vehicle.id) : undefined}
            >
                {/* Leading vehicle-type icon badge */}
                {!hideIcon && (
                    <div
                        className={cn(
                            "w-6 h-6 p-1 rounded-md shrink-0 flex items-center justify-center",
                            getColorClasses(typeColor)
                        )}
                    >
                        {renderIcon(vehicleTypeToIcon(vehicle.vehicle_type), "w-4 h-4")}
                    </div>
                )}

                {/* Country flag */}
                {!hideFlag && vehicle.plate_number_country && (
                    <FlagComponent
                        country={vehicle.plate_number_country.toLowerCase()}
                        countryName={vehicle.plate_number_country.toUpperCase()}
                    />
                )}

                {/* Plate number */}
                {!hidePlateNumber && (
                    <TextLabel
                        data={vehicle.plate_number}
                        className="font-medium max-w-xs truncate"
                    />
                )}

                {/* Vehicle name */}
                {!hideVehicleName && (
                    <TextLabel
                        data={`(${vehicle.name})`}
                        className="text-muted-foreground max-w-xs truncate"
                    />
                )}

                {/* Vehicle type tag — shares the same color as the icon */}
                {!hideType && (
                    <Tag
                        text={vehicle.vehicle_type}
                        color={typeColor}
                        className="capitalize"
                    />
                )}
            </div>
        );
    }

    // ── Icon variant or multiple vehicles — overlapping icon badges ───────────

    const visibleVehicles   = vehicles.slice(0, 3);
    const remainingVehicles = vehicles.slice(3);
    const remainingTooltip  = remainingVehicles
        .map((v) => `${v.name} · ${v.plate_number}`)
        .join(", ");

    return (
        <div className={cn("flex items-center gap-1", className)}>
            {visibleVehicles.map((vehicle, index) => (
                <div
                    key={vehicle.id}
                    style={{ marginLeft: index > 0 ? "-8px" : "0" }}
                    onClick={link ? (e) => handleClick(e, vehicle.id) : undefined}
                    className={cn(link && "cursor-pointer")}
                >
                    {renderIconBadge(vehicle, index)}
                </div>
            ))}

            {vehicles.length > 3 && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="w-6 h-6 rounded-md bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium ml-[-8px] cursor-pointer hover:opacity-80">
                                +{vehicles.length - 3}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <div className="max-w-xs text-sm">{remainingTooltip}</div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
    );
};

export default VehicleLabel;
