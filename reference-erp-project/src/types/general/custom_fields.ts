export interface SectionField {
    id: string;
    title: string;
    description: string;
    table_name: string;
    handler: string;
    fields?: ClientField[] | null;
  }
  
  export interface ClientField {
    id: string;
    table_name: string;
    data_type: string;
    enum_types: string[] | null;
    default_value: string;
    name: string;
    description: string;
    is_nullable: boolean;
    is_unique: boolean;
    is_multiple_values: boolean;
    is_shown_by_default: boolean;
    value: any;
    section: string | null;
  }