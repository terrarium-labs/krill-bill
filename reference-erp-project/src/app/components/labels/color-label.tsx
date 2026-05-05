import { cn } from "@/lib/utils";
import { getColorClasses } from "@/utils/miscelanea";

interface ColorLabelProps {
    data: string | { color: string; };
    className?: string;
    variant?: "default" | "icon";
}

const ColorLabel: React.FC<ColorLabelProps> = ({ data, className, variant = "default" }) => {
    const color = typeof data === "object" && data !== null && "color" in data ? (data as any).color : data;
    if (!color) {
        return <span className="text-muted-foreground">-</span>;
    }
    if (variant === "icon") {
        return (
            <div className={cn("flex items-center gap-2", className)}>
                <div className={cn("w-4 h-4 rounded-md border-2", getColorClasses(color))} />
            </div>
        );
    }
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className={cn("w-4 h-4 rounded-md border-2", getColorClasses(color))} />
            <span className="capitalize">{color}</span>
        </div>
    );
};

export default ColorLabel;