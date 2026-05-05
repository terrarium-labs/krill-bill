import React from "react";
import { Package, Clock, Car, CircleDashed, Check } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export type BillableItemType = "material" | "hour" | "commuting" | null;

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
    material: { icon: Package, color: "text-orange-500" },
    hour: { icon: Clock, color: "text-blue-500" },
    commuting: { icon: Car, color: "text-green-500" },
};

interface BillableItemTypeSelectorProps {
    value: BillableItemType;
    onChange: (type: BillableItemType) => void;
    disabled?: boolean;
}

export const BillableItemTypeSelector: React.FC<BillableItemTypeSelectorProps> = ({
    value,
    onChange,
    disabled = false,
}) => {
    const { t } = useTranslation();

    const typeOptions: { value: BillableItemType; label: string; icon: React.ElementType; color: string }[] = [
        { value: "material", label: t("common.material", "Material"), icon: Package, color: "text-orange-500" },
        { value: "hour", label: t("common.hour", "Hour"), icon: Clock, color: "text-blue-500" },
        { value: "commuting", label: t("common.commuting", "Commuting"), icon: Car, color: "text-green-500" },
    ];

    const currentConfig = value ? TYPE_CONFIG[value] : null;
    const CurrentIcon = currentConfig?.icon ?? CircleDashed;
    const currentColor = currentConfig?.color ?? "text-muted-foreground";

    const currentLabel = value
        ? typeOptions.find((o) => o.value === value)?.label ?? value
        : t("common.selectType", "Select type");

    return (
        <DropdownMenu>
            <TooltipProvider>
                <Tooltip>
                    <DropdownMenuTrigger asChild disabled={disabled}>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                className={cn(
                                    "flex items-center justify-center h-6 w-6 rounded-md hover:bg-accent transition-colors shrink-0",
                                    disabled && "opacity-50 cursor-not-allowed"
                                )}
                                disabled={disabled}
                            >
                                <CurrentIcon className={cn("h-3.5 w-3.5", currentColor)} />
                            </button>
                        </TooltipTrigger>
                    </DropdownMenuTrigger>
                    <TooltipContent side="top" className="text-xs">
                        {currentLabel}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent align="start" className="min-w-[140px]">
                {typeOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = value === option.value;
                    return (
                        <DropdownMenuItem
                            key={option.value}
                            onClick={() => onChange(isSelected ? null : option.value)}
                            className="cursor-pointer"
                        >
                            <div className="flex items-center gap-2 w-full justify-between">
                                <div className="flex items-center gap-2">
                                    <Icon className={cn("h-4 w-4", option.color)} />
                                    <span>{option.label}</span>
                                </div>
                                {isSelected && (
                                    <Check className="h-3.5 w-3.5 text-primary" />
                                )}
                            </div>
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
