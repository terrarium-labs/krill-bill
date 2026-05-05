import React from "react";
import { Mail } from "lucide-react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

interface EmailLabelProps {
    data: string | null | undefined;
    showIcon?: boolean;
    copyable?: boolean;
    link?: boolean;
    variant?: "blue" | "black";
}

/**
 * EmailLabel component - Displays an email address with optional icon, copy, and link functionality
 * 
 * @param data - Email address as string, null, or undefined
 * @param showIcon - Whether to display the mail icon (default: false)
 * @param copyable - Whether to show a copy button (default: false)
 * @param link - Whether to make the email clickable as mailto link (default: false)
 * @param variant - Link color variant: "blue" (default) or "black" (black text that turns blue on hover)
 * 
 * Behavior:
 * - If null/undefined/empty string: displays "-"
 * - Otherwise: displays email with optional icon, copy button, and/or link
 */
const EmailLabel: React.FC<EmailLabelProps> = ({ 
    data, 
    showIcon = false, 
    copyable = false,
    link = false,
    variant = "blue"
}) => {
    const { t } = useTranslation();

    // Handle null, undefined, or empty string
    if (!data) {
        return <span className="text-muted-foreground">-</span>;
    }

    const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(data);
        toast.success(t("common.copiedToClipboard", "Copied to clipboard"));
    };

    const content = (
        <div className="flex items-center gap-2">
            {showIcon && <Mail className="h-4 w-4 text-muted-foreground" />}
            <span>{data}</span>
            {copyable && (
                <button
                    onClick={handleCopy}
                    className="flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted p-1"
                >
                    <Copy className="h-3 w-3 text-muted-foreground" />
                </button>
            )}
        </div>
    );

    if (link) {
        const linkClassName = variant === "black" 
            ? "hover:underline text-foreground hover:text-blue-500"
            : "hover:underline text-blue-500 hover:text-blue-600";
            
        return (
            <a 
                href={`mailto:${data}`}
                className={linkClassName}
                onClick={(e) => e.stopPropagation()}
            >
                {content}
            </a>
        );
    }

    return content;
};

export default EmailLabel;
