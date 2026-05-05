import React from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface TextLargeLabelProps {
    data: string | null | undefined;
    /** Maximum width for truncation (default: "max-w-xs") */
    maxWidth?: string;
    /** HoverCard width (default: "w-80") */
    hoverWidth?: string;
    /** Open delay in milliseconds (default: 200) */
    openDelay?: number;
}

/**
 * TextLargeLabel component - Displays truncated text with a hover card for full content
 * 
 * @param data - Text content as string, null, or undefined
 * @param maxWidth - Maximum width CSS class for truncation (default: "max-w-xs")
 * @param hoverWidth - Width CSS class for hover card (default: "w-80")
 * @param openDelay - Delay before showing hover card in ms (default: 200)
 * 
 * Behavior:
 * - If null/undefined/empty string: displays "-"
 * - Otherwise: displays truncated text with hover card showing full content
 * - Text is clickable and changes color on hover
 * - Full content preserves line breaks and wraps properly
 * 
 * Examples:
 * - Short text: displays inline without truncation
 * - Long text: truncates with "..." and shows full text on hover
 */
const TextLargeLabel: React.FC<TextLargeLabelProps> = ({
    data,
    maxWidth = "max-w-xs",
    hoverWidth = "w-80",
    openDelay = 200
}) => {
    // Handle null, undefined, or empty string
    if (!data) {
        return <span className="text-muted-foreground">-</span>;
    }

    return (
        <HoverCard openDelay={openDelay}>
            <HoverCardTrigger asChild>
                <div className={`text-sm ${maxWidth} truncate cursor-pointer hover:text-primary`}>
                    {data}
                </div>
            </HoverCardTrigger>
            <HoverCardContent className={hoverWidth} side="top">
                <div className="space-y-2">
                    <div className="text-sm whitespace-pre-wrap break-words">
                        {data}
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
};

export default TextLargeLabel;
