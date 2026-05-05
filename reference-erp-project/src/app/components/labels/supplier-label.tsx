import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SupplierAvatar } from "@/app/components/avatars/supplier-avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Supplier } from "@/types/suppliers/supplier";

interface SupplierLabelProps {
    data: Supplier | Supplier[] | null | undefined;
    options?: {
        showName?: boolean;
        showNameExtra?: boolean;
        showEmail?: boolean;
        size?: "sm" | "md" | "lg" | "xl" | "2xl";
        variant?: "truncate" | "full";
        onClick?: (supplierId: string) => void;
    };
    className?: string;
    link?: boolean | string;
    variant?: "default" | "icon";
}

/**
 * SupplierLabel component - Displays one or multiple suppliers with their avatars
 *
 * @param data - Can be a single Supplier, an array of Suppliers, null, or undefined
 * @param options - Optional display options for SupplierAvatar
 * @param className - Optional custom class name to pass to SupplierAvatar (only affects single supplier display)
 * @param link - If true, navigates to supplier detail page. If string, appends it as sub-route (e.g., "orders")
 * @param variant - "default" shows name for single supplier, "icon" always shows overlapping avatar style
 *
 * Behavior:
 * - If null/undefined/empty array: displays "-"
 * - If variant="default":
 *   - Single supplier: displays the supplier with name
 *   - Multiple suppliers: displays up to 3 avatars (overlapping) and a "+N" badge for the rest
 * - If variant="icon": always displays in overlapping avatar style (without name)
 */
const SupplierLabel: React.FC<SupplierLabelProps> = ({ data, options, className, link = false, variant = "default" }) => {
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();

    const handleClick = (supplierId: string) => {
        if (link && orgId) {
            const basePath = `/${orgId}/suppliers/${supplierId}`;
            const subRoute = typeof link === "string" ? `/${link}` : "";
            navigate(`${basePath}${subRoute}`);
        }
    };

    // Handle null, undefined, or empty cases
    if (!data || (Array.isArray(data) && data.length === 0)) {
        return <span className="text-muted-foreground">-</span>;
    }

    // Normalize data to array for icon variant
    const suppliers = Array.isArray(data) ? data : [data];

    // Handle single supplier (not in array) - only for default variant
    if (variant === "default" && !Array.isArray(data)) {
        return (
            <div
                className={`flex items-center gap-1 ${link ? "cursor-pointer hover:bg-primary/10 -mx-2 -my-1 px-2 py-1 rounded transition-all group hover:opacity-80" : ""}`}
                onClick={link ? () => handleClick(data.id) : undefined}
            >
                <SupplierAvatar
                    supplier={data}
                    showName={options?.showName ?? true}
                    showNameExtra={options?.showNameExtra ?? false}
                    showEmail={options?.showEmail ?? false}
                    size={options?.size ?? "sm"}
                    variant={options?.variant ?? "truncate"}
                    className={className}
                />
            </div>
        );
    }

    // Handle array with single supplier - only for default variant
    if (variant === "default" && suppliers.length === 1) {
        return (
            <div
                className={`inline-flex items-center gap-1 ${link ? "cursor-pointer hover:bg-primary/10 -mx-2 -my-1 px-2 py-1 rounded transition-all group hover:opacity-80" : ""}`}
                onClick={link ? () => handleClick(suppliers[0].id) : undefined}
            >
                <SupplierAvatar
                    supplier={suppliers[0]}
                    showName={options?.showName ?? true}
                    showNameExtra={options?.showNameExtra ?? false}
                    showEmail={options?.showEmail ?? false}
                    size={options?.size ?? "sm"}
                    variant={options?.variant ?? "truncate"}
                    className={className}
                />
            </div>
        );
    }

    // Handle multiple suppliers (or icon variant)
    const visibleSuppliers = suppliers.slice(0, 3);
    const remainingSuppliers = suppliers.slice(3);
    const remainingNames = remainingSuppliers
        .map((supplier) => {
            return supplier.trade_name || supplier.supplier_name || supplier.email || "Unknown";
        })
        .join(", ");

    return (
        <div className="flex items-center gap-1">
            {visibleSuppliers.map((supplier, index) => (
                <div
                    key={supplier.id}
                    style={{ marginLeft: index > 0 ? "-8px" : "0" }}
                >
                    <SupplierAvatar
                        supplier={supplier}
                        showName={false}
                    />
                </div>
            ))}
            {suppliers.length > 3 && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium ml-[-8px] cursor-pointer hover:opacity-80">
                                +{suppliers.length - 3}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <div className="max-w-xs">
                                {remainingNames}
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
    );
};

export default SupplierLabel;
