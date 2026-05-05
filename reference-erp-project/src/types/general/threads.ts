import { Employee } from "../employees/employees";
import { File } from "./files";

export interface Thread {
    id: string;
    path: string;
    content: string;
    files:File[];
    created_at: string;
    updated_at: string;
    employee: Employee;
}