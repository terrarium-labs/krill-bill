import { User } from "./user";
import { Employee } from "../employees/employees";

export interface File {
  id: string;
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  url: string;
  created_at: string;
  created_by: User | Employee;
  updated_at: string;
}