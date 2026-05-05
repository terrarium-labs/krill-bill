import { DynamicIcon, IconName } from "lucide-react/dynamic";
import { cn } from "@/lib/utils";
import { getColorClasses } from "@/utils/miscelanea";

/** Pin marker: DynamicIcon when icon_url (as in LocationLabel), else default SVG pin. pinColor = color name (e.g. "blue", "green") for theme classes. */
export function PinMarkerContent({
    iconUrl = "map-pin",
    pinColor = "blue",
    label,
}: {
    iconUrl?: string | null | undefined;
    /** Color name from LIST_COLORS / getStatusColor (e.g. "blue", "green"). No hex. */
    pinColor?: string;
    /** When set, renders a numbered circle instead of an icon. */
    label?: string;
}) {
    const colorName = pinColor.toLowerCase();
    const iconName = iconUrl as IconName;

    if (label) {
        return (
            <div
                className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full border-2 shadow-md text-sm font-bold",
                    getColorClasses(colorName),
                )}
            >
                {label}
            </div>
        );
    }

    if (iconUrl !== undefined && iconUrl !== null && iconUrl !== "") {
        return (
            <div
                className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full border-2 shadow-md",
                    getColorClasses(colorName),
                )}
            >
                <DynamicIcon name={iconName} className="h-4 w-4" />
            </div>
        );
    }

    return (
        <svg
            width="32"
            height="32"
            viewBox="0 0 24 22"
            preserveAspectRatio="xMidYMax meet"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn("drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]", getColorClasses(colorName))}
        >
            <path
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                fill="currentColor"
                stroke="white"
                strokeWidth="1.5"
            />
            <circle cx="12" cy="9" r="2.5" fill="white" />
        </svg>
    );
}
