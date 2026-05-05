import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { OrgUserAvatar } from "@/app/components/avatars/org-user-avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { OrgUser } from "@/types/general/user";

interface OrgUserLabelProps {
    data: OrgUser | OrgUser[] | null | undefined;
    link?: boolean | string;
    variant?: "default" | "icon";
}

/**
 * OrgUserLabel component - Displays one or multiple organization users with their avatars
 * 
 * @param data - Can be a single OrgUser, an array of OrgUsers, null, or undefined
 * @param link - If true, navigates to user detail page. If string, appends it as sub-route
 * @param variant - "default" shows name for single user, "icon" always shows overlapping avatar style
 * 
 * Behavior:
 * - If null/undefined/empty array: displays "-"
 * - If variant="default":
 *   - Single user: displays the user with name
 *   - Multiple users: displays up to 3 avatars (overlapping) and a "+N" badge for the rest
 * - If variant="icon": always displays in overlapping avatar style (without name)
 */
const OrgUserLabel: React.FC<OrgUserLabelProps> = ({ data, link = false, variant = "default" }) => {
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();

    const handleClick = (userId: string) => {
        if (link && orgId) {
            const basePath = `/${orgId}/users/${userId}`;
            const subRoute = typeof link === 'string' ? `/${link}` : '';
            navigate(`${basePath}${subRoute}`);
        }
    };

    // Handle null, undefined, or empty cases
    if (!data || (Array.isArray(data) && data.length === 0)) {
        return <span className="text-muted-foreground">-</span>;
    }

    // Normalize data to array for icon variant
    const users = Array.isArray(data) ? data : [data];

    // Handle single user (not in array) - only for default variant
    if (variant === "default" && !Array.isArray(data)) {
        return (
            <div 
                className={`flex items-center gap-1 ${link ? "cursor-pointer hover:bg-primary/10 -mx-2 -my-1 px-2 py-1 rounded transition-all group hover:opacity-80" : ''}`}
                onClick={link ? () => handleClick(data.id) : undefined}
            >
                <OrgUserAvatar
                    orgUser={data}
                    showName={true}
                />
            </div>
        );  
    }

    // Handle array with single user - only for default variant
    if (variant === "default" && users.length === 1) {
        return (
            <div 
                className={`flex items-center gap-1 ${link ? "cursor-pointer hover:bg-primary/10 -mx-2 -my-1 px-2 py-1 rounded transition-all group hover:opacity-80" : ''}`}
                onClick={link ? () => handleClick(users[0].id) : undefined}
            >
                <OrgUserAvatar
                    orgUser={users[0]}
                    showName={true}
                />
            </div>
        );
    }

    // Handle multiple users (or icon variant)
    const visibleUsers = users.slice(0, 3);
    const remainingUsers = users.slice(3);
    const remainingNames = remainingUsers.map(user => {
        const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
        return fullName || user.email || 'Unknown';
    }).join(', ');

    return (
        <div className="flex items-center gap-1">
            {visibleUsers.map((user, index) => (
                <div
                    key={user.id}
                    style={{ marginLeft: index > 0 ? "-8px" : "0" }}
                >
                    <OrgUserAvatar
                        orgUser={user}
                        showName={false}
                    />
                </div>
            ))}
            {users.length > 3 && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium ml-[-8px] cursor-pointer hover:opacity-80">
                                +{users.length - 3}
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

export default OrgUserLabel;
