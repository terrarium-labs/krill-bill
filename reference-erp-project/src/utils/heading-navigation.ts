/**
 * Shared helpers for table-of-contents navigation (HTML articles and markdown docs).
 */

export interface MarkdownHeading {
    id: string;
    text: string;
    level: number;
}

function slugifyHeadingText(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function ensureUniqueSlug(baseId: string, seen: Set<string>): string {
    let uniqueId = baseId || "heading";
    let counter = 1;
    while (seen.has(uniqueId)) {
        uniqueId = `${baseId}-${counter}`;
        counter++;
    }
    seen.add(uniqueId);
    return uniqueId;
}

/** Strip basic HTML entities from a snippet (for heading text extracted from HTML). */
function decodeHtmlEntities(text: string): string {
    return text
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"');
}

/**
 * Parse h1–h3 from rendered HTML (`dangerouslySetInnerHTML` content).
 * IDs are generated deterministically so {@link injectHeadingIdsIntoHtml} can align.
 */
export function extractHeadingsFromHtml(htmlContent: string): MarkdownHeading[] {
    if (!htmlContent) return [];

    const headingRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
    const headings: MarkdownHeading[] = [];
    const seenIds = new Set<string>();

    for (const match of htmlContent.matchAll(headingRegex)) {
        const level = parseInt(match[1], 10);
        const rawInner = match[2];
        const text = rawInner
            .replace(/<[^>]+>/g, "")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .trim();

        if (!text) continue;

        const baseId = slugifyHeadingText(text);
        const id = ensureUniqueSlug(baseId, seenIds);

        if (level <= 3) {
            headings.push({ id, text, level });
        }
    }

    return headings;
}

/**
 * Inject `id` on the first matching h1–h3 for each extracted heading (same logic as legacy News article page).
 */
export function injectHeadingIdsIntoHtml(
    htmlContent: string,
    headings: MarkdownHeading[],
): string {
    if (!htmlContent) return htmlContent;

    let content = htmlContent;

    content = content.replace(
        /<p([^>]*)>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi,
        "<p$1>&nbsp;</p>",
    );

    if (headings.length === 0) return content;

    for (const heading of headings) {
        const headingRegex = new RegExp(
            `<h${heading.level}([^>]*)>([\\s\\S]*?)<\\/h${heading.level}>`,
            "gi",
        );

        let replaced = false;
        content = content.replace(headingRegex, (match, attributes, innerContent) => {
            if (replaced) return match;
            if (attributes && String(attributes).includes("id=")) {
                return match;
            }

            const extractedText = innerContent
                .replace(/<[^>]+>/g, "")
                .replace(/&nbsp;/g, " ")
                .replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&quot;/g, '"')
                .trim();

            if (extractedText === heading.text) {
                replaced = true;
                return `<h${heading.level} id="${heading.id}"${attributes}>${innerContent}</h${heading.level}>`;
            }

            return match;
        });
    }

    return content;
}

/**
 * ATX headings (`#` … `###`) from markdown. Trailing `#` on the line are stripped (GFM-style).
 */
export function extractHeadingsFromMarkdown(markdown: string): MarkdownHeading[] {
    if (!markdown) return [];

    const lines = markdown.split(/\r?\n/);
    const headings: MarkdownHeading[] = [];
    const seenIds = new Set<string>();

    for (const line of lines) {
        const m = /^(#{1,6})\s+(.+?)\s*$/.exec(line.trim());
        if (!m) continue;

        const level = m[1].length;
        if (level > 3) continue;

        let text = m[2].replace(/\s+#+\s*$/, "").trim();
        text = text
            .replace(/\*\*(.+?)\*\*/g, "$1")
            .replace(/\*(.+?)\*/g, "$1")
            .replace(/`(.+?)`/g, "$1");
        text = decodeHtmlEntities(text.replace(/<[^>]+>/g, ""));
        if (!text) continue;

        const baseId = slugifyHeadingText(text);
        const id = ensureUniqueSlug(baseId, seenIds);
        headings.push({ id, text, level });
    }

    return headings;
}

/** Walk up the DOM to find the nearest scrollable ancestor (overflow auto/scroll). */
export function findScrollableParent(element: HTMLElement | null): HTMLElement | null {
    if (!element) return null;

    let parent: HTMLElement | null = element.parentElement;
    while (parent) {
        const style = window.getComputedStyle(parent);
        if (
            style.overflowY === "auto" ||
            style.overflowY === "scroll" ||
            style.overflow === "auto" ||
            style.overflow === "scroll"
        ) {
            return parent;
        }
        parent = parent.parentElement;
    }
    return null;
}
