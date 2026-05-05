import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BasicLocation, Location } from "@/types/general/location";
import { DynamicIcon, IconName } from "lucide-react/dynamic";
import { StockLocation } from "@/types/items/stock";

interface LocationLabelProps {
    data: BasicLocation | Location | StockLocation | (BasicLocation | Location | StockLocation)[] | null | undefined;
    textClassName?: string;
    link?: boolean | string;
    /** "default" = icon (when exists) + name. "icon" = icon only, with "map-pin" fallback when no icon_url. */
    variant?: "default" | "icon";
    options?: {
        showCity?: boolean;
        showCountry?: boolean;
    };
    /** Whether to show tooltip on hover. */
    showTooltip?: boolean;
}

/**
 * LocationLabel component - Displays one or multiple locations with icons
 * 
 * @param data - Can be a single Location, an array of Locations, null, or undefined
 * @param textClassName - Optional className for the text element
 * @param link - If true, navigates to /{orgId}/locations/{id}. If string, navigates to /{orgId}/{link}/locations/{id}
 * @param variant - "default" shows icon (when exists) + name. "icon" shows only icon, with "map-pin" when no icon_url.
 * @param options - Optional options to pass to LocationAvatar
 * @param showTooltip - Whether to show tooltip on hover.
 * 
 * Behavior:
 * - If null/undefined/empty array: displays "-"
 * - If single location: displays the location with name
 * - If multiple locations: displays up to 3 location badges and a "+N" badge for the rest
 */
const LocationLabel: React.FC<LocationLabelProps> = ({ data, textClassName, link = false, variant = "default", options, showTooltip = true }) => {
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();

    const handleClick = (locationId: string) => {
        if (link && orgId) {
            const pathSegment = typeof link === 'string' ? `/${link}` : '';
            navigate(`/${orgId}${pathSegment}/locations/${locationId}`);
        }
    };
    // Handle null, undefined, or empty cases
    if (!data || (Array.isArray(data) && data.length === 0)) {
        return <span className="text-muted-foreground">-</span>;
    }

    const tooltipContent = (location: BasicLocation | Location | StockLocation) => (
        <div className="text-sm">
            <div className="font-medium">{location.name}</div>
            {(location.city || location.country) && (
                <div className="text-muted-foreground">
                    {[location.city, location.country].filter(Boolean).join(', ')}
                </div>
            )}
        </div>
    );

    // Render a single location badge
    const renderLocationBadge = (location: BasicLocation | Location | StockLocation) => {
        const isIconVariant = variant === "icon";
        const iconToShow = isIconVariant ? (location.icon_url ?? "map-pin") : location.icon_url;

        const cityCountryParts = [
            options?.showCity ? location.city : null,
            options?.showCountry ? location.country : null,
        ].filter(Boolean);
        const cityCountryLine = cityCountryParts.join(", ");

        const badge = (
            <div
                className={`flex items-center gap-1.5 rounded-md text-sm ${link ? "cursor-pointer hover:bg-primary/10 -mx-2 px-2 rounded transition-all group hover:opacity-80" : ''}`}
                onClick={link ? (e) => { e.preventDefault(); handleClick(location.id) } : undefined}
            >
                {iconToShow && (
                    <DynamicIcon
                        name={iconToShow as IconName}
                        className="min-h-4 min-w-4 max-h-4 max-w-4 shrink-0"
                    />
                )}
                {!isIconVariant && (
                    <div className="flex flex-col min-w-0">
                        <span className={`font-medium ${textClassName || "max-w-[150px] truncate"}`}>{location.name}</span>
                        {cityCountryLine && (
                            <span className="text-xs text-muted-foreground truncate">{cityCountryLine}</span>
                        )}
                    </div>
                )}
            </div>
        );

        if (showTooltip) {
            return (
                <TooltipProvider key={location.id}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            {badge}
                        </TooltipTrigger>
                        <TooltipContent>
                            {tooltipContent(location)}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        }

        return <div key={location.id}>{badge}</div>;
    };

    // Handle single location (not in array)
    if (!Array.isArray(data)) {
        return (
            <div className="flex items-center gap-1">
                {renderLocationBadge(data)}
            </div>
        );
    }

    // Handle array with single location
    if (data.length === 1) {
        return (
            <div className="flex items-center gap-1">
                {renderLocationBadge(data[0])}
            </div>
        );
    }

    // Handle multiple locations
    const visibleLocations = data.slice(0, 3);
    const remainingLocations = data.slice(3);
    const remainingNames = remainingLocations.map(location => location.name).join(', ');

    return (
        <div className="flex items-center gap-1 flex-wrap">
            {visibleLocations.map((location) => renderLocationBadge(location))}
            {data.length > 3 && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center justify-center px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs font-medium cursor-pointer hover:opacity-80">
                                +{data.length - 3}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <div className="max-w-xs">
                                {remainingNames}
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
    );
};

export default LocationLabel;
