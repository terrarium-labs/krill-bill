import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import React from "react";
import { useIcon } from "@/hooks/use-icon";
import type { IconType } from "@/types/miscelanea";

const IdBadge = ({
  id,
  className,
  onClick,
  iconSize = 3,
  hideTooltip = false,
  hideIcon = true,
  customTooltip,
  icon = "copy",
}: {
  id: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  iconSize?: number;
  hideTooltip?: boolean;
  hideIcon?: boolean;
  customTooltip?: string;
  icon?: IconType;
}) => {
  const renderIcon = useIcon();
  const { t } = useTranslation();

  if (!id || id === "") return null;

  const handleCopyID = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    toast.success(
      t("common.copiedIDToClipboard", "ID copiado al portapapeles")
    );
  };

  const iconSizeClass = `min-w-${iconSize} min-h-${iconSize} max-w-${iconSize} max-h-${iconSize}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn(
            "font-mono font-medium text-muted-foreground hover:bg-muted/50 cursor-pointer bg-muted/25 flex items-center gap-1",
            className
          )}
          onClick={onClick || handleCopyID}
        >
          {!hideIcon && renderIcon(icon, cn(iconSizeClass, "z-30"))}
          {id}
        </Badge>
      </TooltipTrigger>
      <TooltipContent hidden={hideTooltip}>{customTooltip || t("common.copyID", "Copy ID")}</TooltipContent>
    </Tooltip>
  );
};

export default IdBadge;
