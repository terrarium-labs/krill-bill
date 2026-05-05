import { Employee } from "./employees";

export interface SickLeave {
  id: string;
  employee: Employee;
  start_date: string;
  end_date: string;
  name: string;
  description: string;
  num_files: number;
}
