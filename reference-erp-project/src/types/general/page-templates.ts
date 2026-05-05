export interface PageTemplate {
    id: string;
    type: string;
    data: Record<string, unknown>;
}

export interface PageTemplatesResponse {
    page_templates: PageTemplate[];
    next_page_token: string | null;
}
