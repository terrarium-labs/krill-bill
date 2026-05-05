import { Employee } from "@/types/employees/employees";
import { Client } from "@/types/clients/client";
import { Supplier } from "@/types/suppliers/supplier";

export interface Me {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  photo_url: string;
  lang: string;
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  photo_url: string;
  lang: string;
}

export interface OrgUser extends User {
  employee: Employee | null;
  client: Client | null;
  supplier: Supplier | null;
}