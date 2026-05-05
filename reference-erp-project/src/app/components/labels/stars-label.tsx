import React from "react";
import { Icon } from "@iconify/react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IconType } from "@/types/miscelanea";

/**
 * Icon type - string (Lucide/Iconify name) or React component.
 * Strings get "lucide:" prefix when not already prefixed.
 */

interface StarsLabelProps {
    /** Level from 1 to 5 */
    level: number;
    /** Display variant */
    variant?: "default" | "empty" | "fill";
    /** Optional custom icon - string (e.g. "Star") or Lucide component */
    icon?: IconType;
    /** Size preset */
    size?: "sm" | "md" | "lg";
    className?: string;
}

const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
} as const;

const filledClass = "text-yellow-500 fill-yellow-500";
const emptyClass = "text-yellow-500 fill-none";

/**
 * StarsLabel - Displays a level (1-5) as stars.
 *
 * Variants:
 * - default: Always 5 stars; first `level` are filled, rest are border-only
 * - empty: `level` stars, all border-only
 * - fill: `level` stars, all filled
 */
const StarsLabel: React.FC<StarsLabelProps> = ({
    level,
    variant = "default",
    icon,
    size = "md",
    className,
}) => {
    const sizeClass = sizeClasses[size];
    const clampedLevel = Math.min(5, Math.max(0, level));

    const renderStar = (filled: boolean, key: number) => {
        const starClass = cn(sizeClass, filled ? filledClass : emptyClass);

        if (icon) {
            if (typeof icon === "string") {
                const iconName = icon.includes(":") ? icon : `lucide:${icon}`;
                return (
                    <Icon
                        key={key}
                        icon={iconName}
                        className={starClass}
                        style={!filled ? { fill: "none" } : undefined}
                    />
                );
            }
            const IconComp = icon;
            return <IconComp key={key} className={starClass} />;
        }

        return <Star key={key} className={starClass} />;
    };

    if (variant === "default") {
        return (
            <span className={cn("inline-flex items-center gap-0.5", className)}>
                {Array.from({ length: 5 }, (_, i) => renderStar(i < clampedLevel, i))}
            </span>
        );
    }

    if (variant === "empty") {
        const count = clampedLevel;
        return (
            <span className={cn("inline-flex items-center gap-0.5", className)}>
                {Array.from({ length: count }, (_, i) => renderStar(false, i))}
            </span>
        );
    }

    // variant === "fill"
    const count = clampedLevel;
    return (
        <span className={cn("inline-flex items-center gap-0.5", className)}>
            {Array.from({ length: count }, (_, i) => renderStar(true, i))}
        </span>
    );
};

export default StarsLabel;
