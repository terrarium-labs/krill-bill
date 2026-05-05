/**
 * Browse tree for the in-app docs modal. The parent passes the bundled user-guide index
 * (`sample_platform_documents.json`); `guide:` URLs are resolved to `docs/user-guide` in the modal.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { useIcon } from "@/hooks/use-icon";
import type { IconType } from "@/types/miscelanea";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { PlatformDocument } from "@/types/docs/docs";

export function DocNavIcon({ icon }: { icon: IconType | null | undefined }) {
  const renderIcon = useIcon();
  if (icon == null) return null;
  if (typeof icon === "string" && icon.trim() === "") return null;
  return renderIcon(icon, "h-4 w-4 shrink-0");
}

/**
 * When the API returns a single synthetic root wrapper, unwrap it so top-level browse
 * shows its children directly (e.g. a root node whose URL is empty or a non-HTTPS
 * placeholder).
 *
 * A real API document (HTTPS URL) is never unwrapped — it stays as a collapsible
 * top-level entry. Only nodes with no URL or a non-HTTPS placeholder URL are treated
 * as invisible wrappers.
 */
export function normalizePlatformBrowseNodes(
  nodes: PlatformDocument[],
): PlatformDocument[] {
  if (nodes.length !== 1) return nodes;
  const only = nodes[0];
  const ch = only.children?.filter(Boolean) ?? [];
  if (ch.length === 0) return nodes;
  // Keep real documents (HTTP(S) URLs) as-is; only unwrap empty or placeholder roots.
  const url = only.url?.trim() ?? "";
  if (url.length > 0 && !url.startsWith("guide:")) return nodes;
  return ch;
}

/** Stable key for selection / breadcrumb (slug when present, else id). */
export function getPlatformDocKey(doc: PlatformDocument): string {
  return doc.slug ?? doc.id;
}

function docKey(doc: PlatformDocument): string {
  return getPlatformDocKey(doc);
}

/** True when the doc can be opened in the viewer (non-empty URL, not placeholder `#`). */
function hasNavigableDocUrl(url: string | undefined | null): boolean {
  const u = url?.trim() ?? "";
  if (u.length === 0 || u === "#") return false;
  return true;
}

function docHasSelectedDescendant(
  doc: PlatformDocument,
  selectedSlug: string | null,
): boolean {
  if (!selectedSlug) return false;
  if (docKey(doc) === selectedSlug) return true;
  for (const c of doc.children?.filter(Boolean) ?? []) {
    if (docHasSelectedDescendant(c, selectedSlug)) return true;
  }
  return false;
}

/** DFS path from forest roots to the node whose slug/id matches (inclusive). */
export function findPathToSlug(
  forest: PlatformDocument[],
  slug: string,
): PlatformDocument[] | null {
  for (const node of forest) {
    const path = dfsPathToSlug(node, slug);
    if (path) return path;
  }
  return null;
}

function dfsPathToSlug(
  node: PlatformDocument,
  slug: string,
): PlatformDocument[] | null {
  if (docKey(node) === slug) return [node];
  for (const c of node.children?.filter(Boolean) ?? []) {
    const sub = dfsPathToSlug(c, slug);
    if (sub) return [node, ...sub];
  }
  return null;
}

/**
 * One pattern everywhere: Accordion row = SidebarMenuButton + icon + label + chevron (right),
 * same as “Organization” and nested sections.
 */
function NavEntry({
  doc,
  nested,
  selectedSlug,
  onSelectDoc,
  noUrlTitle,
  expandedBranchIds,
  onBranchExpansionChange,
}: {
  doc: PlatformDocument;
  nested: boolean;
  selectedSlug: string | null;
  onSelectDoc: (d: PlatformDocument) => void;
  noUrlTitle: string;
  expandedBranchIds: Set<string>;
  onBranchExpansionChange: (docId: string, open: boolean) => void;
}) {
  const children = doc.children?.filter(Boolean) ?? [];
  const hasChildren = children.length > 0;
  const navigable = hasNavigableDocUrl(doc.url);
  const key = docKey(doc);
  const isActive = navigable && selectedSlug === key;

  if (hasChildren) {
    const branchActive = docHasSelectedDescendant(doc, selectedSlug);
    const branchOpen = expandedBranchIds.has(doc.id) ? doc.id : undefined;
    /** No document URL: row only expands/collapses; not a selectable doc target. */
    const toggleOnlyBranch = !navigable;

    const branchBody = (
      <div
        className={cn(
          "mt-1 flex flex-col gap-0.5 border-sidebar-border py-0.5",
          nested ? "ml-1 border-l pl-2" : "ml-2 border-l pl-2",
        )}
      >
        {children.map((child) => (
          <NavEntry
            key={child.id}
            doc={child}
            nested
            selectedSlug={selectedSlug}
            onSelectDoc={onSelectDoc}
            noUrlTitle={noUrlTitle}
            expandedBranchIds={expandedBranchIds}
            onBranchExpansionChange={onBranchExpansionChange}
          />
        ))}
      </div>
    );

    const accordion = (
      <Accordion
        type="single"
        collapsible
        value={branchOpen}
        onValueChange={(v) => {
          onBranchExpansionChange(doc.id, v === doc.id);
        }}
      >
        <AccordionItem value={doc.id} className="border-none">
          {toggleOnlyBranch ? (
            <AccordionTrigger
              className={cn(
                "p-0 hover:no-underline [&>svg]:hidden [&[data-state=open]_.chevron]:rotate-90",
              )}
            >
              <div className="w-full">
                <SidebarMenuButton asChild>
                  <div>
                    <DocNavIcon icon={doc.icon} />
                    <span className="min-w-0 flex-1 truncate">{doc.name}</span>
                    <ChevronRight className="chevron ml-auto shrink-0 transition-transform duration-200" />
                  </div>
                </SidebarMenuButton>
              </div>
            </AccordionTrigger>
          ) : (
            <AccordionPrimitive.Header className="border-0 p-0">
              <SidebarMenuButton
                asChild
                isActive={isActive}
                data-docs-nav-active={isActive ? "true" : undefined}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (!isActive) {
                      onSelectDoc(doc);
                      return;
                    }
                    onBranchExpansionChange(
                      doc.id,
                      !expandedBranchIds.has(doc.id),
                    );
                  }}
                  className="w-full text-left"
                >
                  <DocNavIcon icon={doc.icon} />
                  <span className="min-w-0 truncate">{doc.name}</span>
                  <ChevronRight
                    className={cn(
                      "chevron ml-auto shrink-0 transition-transform duration-200",
                      Boolean(branchOpen) && "rotate-90",
                    )}
                  />
                </button>
              </SidebarMenuButton>
            </AccordionPrimitive.Header>
          )}
          <AccordionContent className="pb-0 pt-0">{branchBody}</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    if (nested) {
      return <div className="min-w-0 py-0.5">{accordion}</div>;
    }
    return <SidebarMenuItem>{accordion}</SidebarMenuItem>;
  }

  if (!navigable) {
    const row = (
      <SidebarMenuButton disabled>
        <DocNavIcon icon={doc.icon} />
        <span className="opacity-50">{doc.name}</span>
      </SidebarMenuButton>
    );
    if (nested) return row;
    return <SidebarMenuItem>{row}</SidebarMenuItem>;
  }

  if (nested) {
    return (
      <div className="min-w-0 py-0.5">
        <SidebarMenuButton
          asChild
          isActive={isActive}
          data-docs-nav-active={isActive ? "true" : undefined}
        >
          <button
            type="button"
            onClick={() => onSelectDoc(doc)}
            className="w-full text-left"
          >
            <DocNavIcon icon={doc.icon} />
            <span className="min-w-0 truncate">{doc.name}</span>
          </button>
        </SidebarMenuButton>
      </div>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        data-docs-nav-active={isActive ? "true" : undefined}
        className="w-full"
        onClick={() => onSelectDoc(doc)}
      >
        <DocNavIcon icon={doc.icon} />
        <span className="min-w-0 truncate">{doc.name}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function DocsModalSidebarNav({
  nodes,
  selectedSlug,
  onSelectDoc,
}: {
  nodes: PlatformDocument[];
  selectedSlug: string | null;
  onSelectDoc: (d: PlatformDocument) => void;
}) {
  const { t } = useTranslation();
  const browse = useMemo(
    () => normalizePlatformBrowseNodes(nodes),
    [nodes],
  );

  const noUrlTitle = t(
    "docsModal.docNoUrl",
    "This item has no document URL",
  );

  const [expandedBranchIds, setExpandedBranchIds] = useState<Set<string>>(
    () => new Set(),
  );

  useEffect(() => {
    if (!selectedSlug) {
      setExpandedBranchIds(new Set());
      return;
    }
    const path = findPathToSlug(browse, selectedSlug);
    if (!path || path.length === 0) return;

    const branches = new Set<string>();
    if (path.length >= 1) {
      branches.add(path[0].id);
    }
    for (let i = 1; i < path.length - 1; i++) {
      const n = path[i];
      if ((n.children?.filter(Boolean).length ?? 0) > 0) {
        branches.add(n.id);
      }
    }

    // Merge path into existing expansion so other sections stay open when selection moves.
    setExpandedBranchIds((prev) => {
      const next = new Set(prev);
      for (const id of branches) {
        next.add(id);
      }
      return next;
    });
  }, [selectedSlug, browse]);

  const onBranchExpansionChange = useCallback(
    (docId: string, open: boolean) => {
      setExpandedBranchIds((prev) => {
        const next = new Set(prev);
        if (open) next.add(docId);
        else next.delete(docId);
        return next;
      });
    },
    [],
  );

  // Scroll the active leaf into view once when the selection (or tree) changes — not when
  // the user toggles branches (expandedBranchIds), to avoid jarring repositions.
  const navRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!selectedSlug) return;
    const timer = setTimeout(() => {
      const el = navRef.current?.querySelector<HTMLElement>(
        "[data-docs-nav-active='true']",
      );
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 250);
    return () => clearTimeout(timer);
  }, [selectedSlug, browse]);

  return (
    <SidebarProvider defaultOpen className="min-h-0 min-w-0">
      <Sidebar
        ref={navRef}
        collapsible="none"
        className="w-full min-w-0 border-0 bg-transparent p-0 text-sidebar-foreground"
      >
        <SidebarContent className="gap-2 overflow-x-hidden px-0 mb-5">
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {browse.map((category) => (
                  <NavEntry
                    key={category.id}
                    doc={category}
                    nested={false}
                    selectedSlug={selectedSlug}
                    onSelectDoc={onSelectDoc}
                    noUrlTitle={noUrlTitle}
                    expandedBranchIds={expandedBranchIds}
                    onBranchExpansionChange={onBranchExpansionChange}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}
