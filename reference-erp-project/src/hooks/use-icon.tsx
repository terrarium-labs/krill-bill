import { Icon } from "@iconify/react";
import React, { useCallback } from "react";
import type { IconType } from "@/types/miscelanea";

/**
 * Icon prop: Iconify string (optionally with "set:name") or a Lucide-style short name,
 * or a React component that accepts className.
 */

function renderIconElement(icon: IconType, className?: string): React.ReactElement {
    if (typeof icon === "string") {
        const iconName = icon.includes(":") ? icon : `lucide:${icon}`;
        return <Icon icon={iconName} className={className} />;
    }
    const IconComponent = icon;
    return <IconComponent className={className} />;
}

/**
 * Stable callback that renders a string (Iconify/Lucide) or component icon.
 */
export function useIcon() {
    return useCallback((icon: IconType, className?: string) => {
        return renderIconElement(icon, className);
    }, []);
}
