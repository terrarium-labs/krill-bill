import { forwardRef } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface DashboardWidgetProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    icon: LucideIcon;
    isEditing: boolean;
    children: React.ReactNode;
}

const DashboardWidget = forwardRef<HTMLDivElement, DashboardWidgetProps>(
    ({ title, icon: Icon, isEditing, children, className, style, ...rest }, ref) => {
        return (
            <div
                ref={ref}
                style={style}
                className={cn(
                    "flex flex-col rounded-lg overflow-hidden transition-shadow",
                    isEditing
                        ? "border border-dashed border-muted-foreground/40 bg-card text-card-foreground shadow-sm ring-1 ring-primary/10"
                        : "border-0 bg-transparent",
                    className,
                )}
                {...rest}
            >
                {isEditing && (
                    <div className="dashboard-drag-handle flex items-center gap-1.5 px-3 py-1.5 border-b border-dashed border-muted-foreground/20 bg-muted/30 cursor-grab active:cursor-grabbing select-none shrink-0">
                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/60" />
                        <Icon className="h-3.5 w-3.5 text-muted-foreground/60" />
                        <span className="text-xs text-muted-foreground/80 font-medium truncate">
                            {title}
                        </span>
                    </div>
                )}
                <div className="flex-1 min-h-0 overflow-hidden">
                    {children}
                </div>
            </div>
        );
    },
);

DashboardWidget.displayName = "DashboardWidget";

export default DashboardWidget;
