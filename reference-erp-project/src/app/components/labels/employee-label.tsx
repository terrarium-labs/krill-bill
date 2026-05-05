import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Employee } from "@/types/employees/employees";

interface EmployeeLabelProps {
    data: Employee | Employee[] | null | undefined;
    link?: boolean | string;
    variant?: "default" | "icon";
    size?: "sm" | "md" | "lg";
    className?: string;
    textClassName?: string;
}

/**
 * EmployeeLabel component - Displays one or multiple employees with their avatars
 * 
 * @param data - Can be a single Employee, an array of Employees, null, or undefined
 * @param link - If true, navigates to employee detail page. If string, appends it as sub-route (e.g., "time-records")
 * @param variant - "default" shows name for single employee, "icon" always shows overlapping avatar style
 * 
 * Behavior:
 * - If null/undefined/empty array: displays "-"
 * - If variant="default":
 *   - Single employee: displays the employee with name
 *   - Multiple employees: displays up to 3 avatars (overlapping) and a "+N" badge for the rest
 * - If variant="icon": always displays in overlapping avatar style (without name)
 */
const EmployeeLabel: React.FC<EmployeeLabelProps> = ({ data, link = false, variant = "default", size = "sm", className, textClassName }) => {
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();

    const handleClick = (employeeId: string) => {
        if (link && orgId) {
            const basePath = `/${orgId}/employees/${employeeId}`;
            const subRoute = typeof link === 'string' ? `/${link}` : '';
            navigate(`${basePath}${subRoute}`);
        }
    };
    // Handle null, undefined, or empty cases
    if (!data || (Array.isArray(data) && data.length === 0)) {
        return <span className="text-muted-foreground">-</span>;
    }

    // Normalize data to array for icon variant
    const employees = Array.isArray(data) ? data : [data];

    // Handle single employee (not in array) - only for default variant
    if (variant === "default" && !Array.isArray(data)) {
        return (
            <div 
                className={`flex items-center gap-1 ${link ? "cursor-pointer hover:bg-primary/10 -mx-2 -my-1 px-2 py-1 rounded transition-all group hover:opacity-80" : ''} ${className ?? ''}`}
                onClick={link ? () => handleClick(data.id) : undefined}
            >
                <EmployeeAvatar
                    employee={data}
                    showName={true}
                    size={size}
                    textClassName={textClassName}
                />
            </div>
        );  
    }

    // Handle array with single employee - only for default variant
    if (variant === "default" && employees.length === 1) {
        return (
            <div 
                className={`flex items-center gap-1 ${link ? "cursor-pointer hover:bg-primary/10 -mx-2 -my-1 px-2 py-1 rounded transition-all group hover:opacity-80" : ''} ${className ?? ''}`}
                onClick={link ? () => handleClick(employees[0].id) : undefined}
            >
                <EmployeeAvatar
                    employee={employees[0]}
                    showName={true}
                    size={size}
                    textClassName={textClassName}
                />
            </div>
        );
    }

    // Handle multiple employees (or icon variant)
    const visibleEmployees = employees.slice(0, 3);
    const remainingEmployees = employees.slice(3);
    const remainingNames = remainingEmployees.map(employee => {
        const firstName = employee.first_name || '';
        const lastName = employee.last_name || '';
        return `${firstName} ${lastName}`.trim() || employee.email || 'Unknown';
    }).join(', ');

    return (
        <div className="flex items-center gap-1">
            {visibleEmployees.map((employee, index) => (
                <div
                    key={employee.id}
                    style={{ marginLeft: index > 0 ? "-8px" : "0" }}
                >
                    <EmployeeAvatar
                        employee={employee}
                        showName={false}
                        onHover={true}
                    />
                </div>
            ))}
            {employees.length > 3 && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium ml-[-8px] cursor-pointer hover:opacity-80">
                                +{employees.length - 3}
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

export default EmployeeLabel;
