import React from "react";

interface TextLabelProps {
    data: string | null | undefined;
    className?: string;
}

/**
 * TextLabel component - Displays a text string or "-" if null/undefined
 * 
 * @param data - Text string, null, or undefined
 * @param className - Optional custom class name to override the default "text-sm" styling
 * 
 * Behavior:
 * - If null/undefined/empty string: displays "-"
 * - Otherwise: displays the text string
 */
const TextLabel: React.FC<TextLabelProps> = ({ data, className }) => {
    // Handle null, undefined, or empty string
    if (!data) {
        return <div className="text-muted-foreground m-0 p-0">-</div>;
    }

    return <div className={className || ""}>{data}</div>;
};

export default TextLabel;
