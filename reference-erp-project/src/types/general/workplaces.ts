export interface Workplace {
    id: string;
    name: string;
    phone: string | null;
    address_line_1: string;
    address_line_2: string | null;
    city: string;
    postal_code: string;
    state_province: string;
    country: string | null;
    timezone: string;
    description: string | null;
    icon_url: string | null;
    num_employees: number | null;
}
