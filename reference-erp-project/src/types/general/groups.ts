import Employee from "../employees/employees";

export interface Group {
    id: string;
    name: string;
    description: string | null;
    icon_url: string | null;
    num_employees_group: number; // number of employees in the group
    num_employees_total: number; // number of employees in the group and all its sub-groups
    type: "area" | "department" | "section";
    parent: {
        id: string;
        name: string;
    }
    responsible: Employee | null;
    created_at: string;
    updated_at: string;
}