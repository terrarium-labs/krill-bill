import type { Employee } from "../employees/employees";

export interface NewsArticle {
    id: string;
    title: string;
    slug: string;
    summary: string;
    content: string;
    cover_image_url: string | null;
    status: "draft" | "published" | "archived";
    published_at: string | null;
    archived_at: string | null;
    author: Employee;
    tags: string[];
    created_at: string;
    updated_at: string;
}
