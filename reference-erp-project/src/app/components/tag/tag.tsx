import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useMemo } from "react";
import { getColorClasses } from "@/utils/miscelanea";
import { DynamicIcon, IconName } from "lucide-react/dynamic";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getTagColorFromString, getTagTextFromString } from "@/app/components/tag/utils";

/** Props for the Tag component. */
interface TagProps {
  /** Lucide icon name to show before the text. */
  icon?: IconName;
  /** Label text displayed in the tag. */
  text: string;
  /** Additional CSS classes. */
  className?: string;
  /** Color name (e.g. "green", "red"). If omitted, derived from `text`. */
  color?: string;
  /** When true, shows an X button to remove/dismiss the tag. */
  withX?: boolean;
  /** Called when the X button is clicked (only when `withX` is true). */
  onXClick?: (e: React.MouseEvent) => void;
  /** Called when the badge is clicked. */
  onClick?: (e: React.MouseEvent) => void;
  /** Optional tooltip content; when set, the tag shows a tooltip on hover. */
  tooltipContent?: React.ReactNode;
}

/**
 * Renders a small labeled badge (tag) with optional icon, color, remove button, and tooltip.
 * Color can be set via `color` or is derived from `text` when not provided.
 */
const Tag = ({ icon, text, color, className, withX = false, onXClick, onClick, tooltipContent }: TagProps) => {
  // Usar useMemo para mantener el color consistente
  const colorClasses = useMemo(() => {
    const colorToUse = color || getTagColorFromString(text);
    return getColorClasses(colorToUse);
  }, [color, text]);

  const badge = (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium", colorClasses, className)}
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          e.preventDefault();
          onClick(e);
        }
      }}
    >
      {icon && <DynamicIcon name={icon} className="w-3 h-3 mr-1" />}
      {getTagTextFromString(text)}
      {withX && <X onClick={(e) => {
        if (onXClick) {
          e.stopPropagation();
          e.preventDefault();
          onXClick(e);
        }
      }} className="cursor-pointer w-4 h-4" />}
    </Badge>
  );

  if (tooltipContent != null) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>{tooltipContent}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
};

export default Tag;