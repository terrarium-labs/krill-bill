import { useCallback, useEffect, useState } from "react";
import type { RefObject } from "react";
import type { MarkdownHeading } from "@/utils/heading-navigation";
import { findScrollableParent } from "@/utils/heading-navigation";

export interface UseHeadingNavigationOptions {
    /** Region that contains heading targets. When this element itself is scrollable it is used as the scroll container directly. */
    contentRef: RefObject<HTMLElement | null>;
    headings: MarkdownHeading[];
    /** Pixels to leave below the top edge when snapping to a heading. */
    scrollOffset?: number;
}

/** Returns true when `el` itself has scrollable overflow (not just its ancestors). */
function isSelfScrollable(el: HTMLElement): boolean {
    const { overflowY, overflow } = window.getComputedStyle(el);
    return (
        overflowY === "auto" ||
        overflowY === "scroll" ||
        overflow === "auto" ||
        overflow === "scroll"
    );
}

/**
 * Active-heading tracking + smooth-scroll to a heading `id`.
 *
 * - If `contentRef.current` is itself scrollable (e.g. a modal content pane) it is
 *   used directly as both the scroll target and the IntersectionObserver root.
 * - Otherwise the scrollable ancestor is located with `findScrollableParent` (page scroll).
 * - An IntersectionObserver keeps `activeHeading` in sync as the user scrolls.
 *   Clicking a TOC item sets the heading immediately for fast feedback; the observer
 *   then takes over and tracks position naturally as scrolling continues.
 */
export function useHeadingNavigation({
    contentRef,
    headings,
    scrollOffset = 100,
}: UseHeadingNavigationOptions) {
    const [activeHeading, setActiveHeading] = useState("");

    // Initialise active heading whenever the heading list changes.
    useEffect(() => {
        if (headings.length > 0) {
            setActiveHeading(headings[0].id);
        } else {
            setActiveHeading("");
        }
    }, [headings]);

    // Track which heading is visible as the user scrolls.
    useEffect(() => {
        if (headings.length === 0) return;

        const containerEl = contentRef.current;

        // Use the element itself as root when it owns the scroll, otherwise the viewport (null).
        const observerRoot =
            containerEl && isSelfScrollable(containerEl) ? containerEl : null;

        const observer = new IntersectionObserver(
            (entries) => {
                // Walk headings in document order; highlight the first one entering the zone.
                // Leaving events (isIntersecting: false) are intentionally ignored so the
                // highlight only moves forward when a new section scrolls into view.
                for (const heading of headings) {
                    const entry = entries.find((e) => e.target.id === heading.id);
                    if (entry?.isIntersecting) {
                        setActiveHeading(heading.id);
                        return;
                    }
                }
            },
            {
                root: observerRoot,
                // Top 10 % is the active reading band; bottom 80 % is below the fold.
                rootMargin: "-10% 0px -80% 0px",
                threshold: 0,
            },
        );

        for (const heading of headings) {
            const el = document.getElementById(heading.id);
            if (el) observer.observe(el);
        }

        return () => observer.disconnect();
    }, [headings, contentRef]);

    const scrollToHeading = useCallback(
        (id: string) => {
            const element = document.getElementById(id);
            if (!element) return;

            // Highlight immediately so the TOC feels responsive on click.
            // The IntersectionObserver will take over and update naturally as scrolling continues.
            setActiveHeading(id);

            // Resolve the scroll container: use contentRef.current directly when it is
            // scrollable (modal pane), otherwise walk up to the scrollable ancestor (page scroll).
            const refEl = contentRef.current;
            const scrollContainer: HTMLElement | Window =
                refEl && isSelfScrollable(refEl)
                    ? refEl
                    : (findScrollableParent(refEl) ?? window);

            const rect = element.getBoundingClientRect();

            if (scrollContainer === window) {
                window.scrollTo({
                    top: rect.top + window.scrollY - scrollOffset,
                    behavior: "smooth",
                });
            } else {
                const containerEl = scrollContainer as HTMLElement;
                const containerRect = containerEl.getBoundingClientRect();
                containerEl.scrollTo({
                    top: rect.top - containerRect.top + containerEl.scrollTop - scrollOffset,
                    behavior: "smooth",
                });
            }
        },
        [contentRef, scrollOffset],
    );

    return {
        activeHeading,
        setActiveHeading,
        scrollToHeading,
    };
}
