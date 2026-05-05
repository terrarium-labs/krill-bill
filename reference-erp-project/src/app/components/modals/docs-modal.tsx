import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { BookOpen } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import MarkdownRenderer from "@/app/components/MarkdownRenderer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useHeadingNavigation } from "@/hooks/use-heading-navigation";
import { cn } from "@/lib/utils";
import { extractHeadingsFromMarkdown } from "@/utils/heading-navigation";
import {
  parsePlatformDocumentsResponse,
  type PlatformDocument,
} from "@/types/docs/docs";
import { getPlatformDocuments } from "@/api/docs/docs";
import {
  DocsModalSidebarNav,
  findPathToSlug,
} from "@/app/components/sidebars/docs-modal-sidebar";

/** Markdown source: fetch by URL, or inline string (e.g. `import doc from '…md?raw'`). */
export type DocsModalSource =
  | { type: "url"; url: string }
  | { type: "content"; content: string };

/**
 * Options for opening the docs modal.
 *
 * **Preferred:** pass `slug` — the modal looks up the `PlatformDocument` in the tree
 * returned by `GET /platform-documents` (by stable `slug`, or `id` as fallback), selects
 * it in the sidebar, and loads content from its URL. No markdown needs to be pre-loaded
 * in the calling component.
 *
 * **Legacy / special cases:** pass `source` directly when there is no corresponding
 * `PlatformDocument` entry (e.g. inline welcome screens).
 */
export type OpenDocsOptions =
  | { slug: string; title?: string }
  | { source: DocsModalSource; title?: string; selectedUrl?: string };

/** DFS search for a document by its `slug` field (falls back to `id`). */
function findDocBySlug(
  nodes: PlatformDocument[],
  slug: string,
): PlatformDocument | null {
  for (const node of nodes) {
    if ((node.slug ?? node.id) === slug) return node;
    if (node.children?.length) {
      const found = findDocBySlug(node.children.filter(Boolean), slug);
      if (found) return found;
    }
  }
  return null;
}

/** DFS search for a document by exact `url` (for legacy `openDocs` options). */
function findDocByUrl(
  nodes: PlatformDocument[],
  url: string,
): PlatformDocument | null {
  for (const node of nodes) {
    const u = node.url?.trim() ?? "";
    if (u.length > 0 && u === url) return node;
    if (node.children?.length) {
      const found = findDocByUrl(node.children.filter(Boolean), url);
      if (found) return found;
    }
  }
  return null;
}

const PD_ROOT_ID = "pd_root";

function DocsModalBreadcrumb({
  rootLabel,
  selectedSlug,
  legacyTitle,
  platformNav,
  onSelectDoc,
}: {
  rootLabel: string;
  selectedSlug: string | null;
  legacyTitle: string | undefined;
  platformNav: PlatformDocument[];
  onSelectDoc: (doc: PlatformDocument) => void;
}) {
  const path =
    selectedSlug != null
      ? findPathToSlug(platformNav, selectedSlug)
      : null;

  const rootDoc = findDocBySlug(platformNav, PD_ROOT_ID);

  const ariaLabel = useMemo(() => {
    if (path && path.length > 0) {
      const tailNames =
        path[0]?.id === PD_ROOT_ID ? path.slice(1) : path;
      if (tailNames.length === 0) {
        return rootLabel;
      }
      return [rootLabel, ...tailNames.map((d) => d.name)].join(" › ");
    }
    if (legacyTitle) {
      return `${rootLabel} › ${legacyTitle}`;
    }
    return rootLabel;
  }, [path, legacyTitle, rootLabel]);

  const singleRootCrumb = (
    <>
      <DialogTitle className="sr-only">{ariaLabel}</DialogTitle>
      <Breadcrumb>
        <BreadcrumbList className="text-base">
          <BreadcrumbItem>
            <BreadcrumbPage className="font-semibold">{rootLabel}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </>
  );

  if (selectedSlug == null && legacyTitle) {
    return (
      <>
        <DialogTitle className="sr-only">{ariaLabel}</DialogTitle>
        <Breadcrumb>
          <BreadcrumbList className="text-base">
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold">
                {rootLabel}
              </BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{legacyTitle}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </>
    );
  }

  if (selectedSlug == null || !path || path.length === 0) {
    return singleRootCrumb;
  }

  const isRootOnly = path.length === 1 && path[0].id === PD_ROOT_ID;
  if (isRootOnly) {
    return singleRootCrumb;
  }

  const tail =
    path[0]?.id === PD_ROOT_ID ? path.slice(1) : path;

  return (
    <>
      <DialogTitle className="sr-only">{ariaLabel}</DialogTitle>
      <Breadcrumb>
        <BreadcrumbList className="text-base">
          <BreadcrumbItem>
            {rootDoc?.url?.trim() ? (
              <BreadcrumbLink asChild>
                <button
                  type="button"
                  className="font-semibold"
                  onClick={() => onSelectDoc(rootDoc)}
                >
                  {rootLabel}
                </button>
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage className="font-semibold">{rootLabel}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
          {tail.map((doc, index) => {
            const isLast = index === tail.length - 1;
            const hasUrl = Boolean(doc.url?.trim());
            return (
              <Fragment key={doc.id}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{doc.name}</BreadcrumbPage>
                  ) : hasUrl ? (
                    <BreadcrumbLink asChild>
                      <button
                        type="button"
                        onClick={() => onSelectDoc(doc)}
                      >
                        {doc.name}
                      </button>
                    </BreadcrumbLink>
                  ) : (
                    <span className="text-muted-foreground">{doc.name}</span>
                  )}
                </BreadcrumbItem>
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </>
  );
}

interface DocsModalContextValue {
  openDocs: (opts: OpenDocsOptions) => void;
  closeDocs: () => void;
  /** Optional default doc used by the header trigger when no override is passed */
  headerDoc?: OpenDocsOptions;
}

const DocsModalContext = createContext<DocsModalContextValue | null>(null);

export function useDocsModal(): DocsModalContextValue {
  const ctx = useContext(DocsModalContext);
  if (!ctx) {
    throw new Error("useDocsModal must be used within DocsModalProvider");
  }
  return ctx;
}

export interface DocsModalProviderProps {
  children: ReactNode;
  /** Optional: default document opened from the header / sidebar trigger */
  headerDoc?: OpenDocsOptions;
}

function defaultWelcomeMarkdown(t: (key: string, def: string) => string): string {
  return [
    "## " + t("docsModal.welcomeHeading", "Documentation"),
    "",
    t(
      "docsModal.welcomeIntro",
      "Open this viewer from the help button in the header or sidebar. Developers can load markdown from a URL or pass inline content."
    ),
    "",
    "### " + t("docsModal.welcomeLocalTitle", "Local files"),
    t(
      "docsModal.welcomeLocalBody",
      "Place `.md` files under `public/docs` (e.g. `public/docs/guide.md`) and open them with a URL path like `/docs/guide.md`."
    ),
    "",
    "### " + t("docsModal.welcomeRemoteTitle", "Remote URLs"),
    t(
      "docsModal.welcomeRemoteBody",
      "Any reachable HTTP(S) URL that returns markdown text can be used with `openDocs({ source: { type: 'url', url: '...' } })`."
    ),
  ].join("\n");
}

function DocsModalDialog({
  open,
  onOpenChange,
  source,
  platformNav,
  platformNavLoading,
  selectedSlug,
  legacyTitle,
  onSelectPlatformDoc,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: DocsModalSource | null;
  platformNav: PlatformDocument[];
  /** True while the initial `GET /platform-documents` request is in flight. */
  platformNavLoading: boolean;
  selectedSlug: string | null;
  legacyTitle: string | undefined;
  onSelectPlatformDoc: (doc: PlatformDocument) => void;
}) {
  const { t } = useTranslation();
  const rootLabel = t("docsModal.title", "Documentation");

  const contentRef = useRef<HTMLDivElement>(null);
  const [tocMarkdown, setTocMarkdown] = useState("");

  useEffect(() => {
    if (!source) {
      setTocMarkdown("");
      return;
    }
    if (source.type === "content") {
      setTocMarkdown(source.content);
    } else {
      setTocMarkdown("");
    }
  }, [source]);

  const headings = useMemo(
    () => extractHeadingsFromMarkdown(tocMarkdown),
    [tocMarkdown],
  );

  const { activeHeading, scrollToHeading } = useHeadingNavigation({
    contentRef,
    headings,
    scrollOffset: 24,
  });

  const markdownKey =
    source == null
      ? "empty"
      : source.type === "url"
        ? source.url
        : `content-${source.content.length}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          // Same shell as payroll-view-modal; p-0 gap-0 so header/body control padding.
          "max-w-[90vw] md:min-w-[90vw] w-full max-h-[90vh] min-h-[90vh] overflow-y-auto flex flex-col p-0 gap-0",
        )}
        showCloseButton={false}
      >
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 text-left">
          <DocsModalBreadcrumb
            rootLabel={rootLabel}
            selectedSlug={selectedSlug}
            legacyTitle={legacyTitle}
            platformNav={platformNav}
            onSelectDoc={onSelectPlatformDoc}
          />
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-6 py-4 xl:flex-row xl:items-stretch">
          <aside className="flex min-h-0 w-full shrink-0 flex-col gap-2 overflow-hidden xl:w-64 xl:min-w-[16rem] xl:self-stretch">
            <ScrollArea className="min-h-0 flex-1 basis-0 pr-2">
              {platformNavLoading ? (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t("docsModal.platformNavLoading", "Loading documentation…")}
                </p>
              ) : platformNav.length === 0 ? (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t("docsModal.platformNavEmpty", "No documentation topics yet.")}
                </p>
              ) : (
                <nav aria-label={t("docsModal.platformNavTitle", "Browse")}>
                  <DocsModalSidebarNav
                    nodes={platformNav}
                    selectedSlug={selectedSlug}
                    onSelectDoc={onSelectPlatformDoc}
                  />
                </nav>
              )}
            </ScrollArea>
          </aside>

          <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col gap-0 md:flex-row md:items-stretch">
            {source ? (
              <>
            <div
              ref={contentRef}
                  className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 md:px-8"
            >
                  <div className="mx-auto w-full max-w-200">
                <MarkdownRenderer
                  key={markdownKey}
                      className="min-h-0 w-full"
                  url={source.type === "url" ? source.url : null}
                  content={
                    source.type === "content" ? source.content : undefined
                  }
                  textSizeMultiplier={0.9}
                  breakAll={false}
                  anchorHeadings
                  onMarkdownBodyChange={setTocMarkdown}
                />
                  </div>
            </div>
            {headings.length > 0 ? (
                  <aside className="flex min-h-0 w-full shrink-0 flex-col border-t border-border pt-4 md:w-44 md:shrink-0 md:self-stretch md:border-t-0 md:border-border md:pt-0 md:pl-4 md:pr-0">
                    <p className="mb-2 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("docsModal.tableOfContents", "On this page")}
                </p>
                    <ScrollArea className="min-h-0 flex-1 basis-0 pr-2">
                  <nav className="space-y-0.5 border-l border-border pl-3">
                    {headings.map((heading) => (
                      <button
                        key={heading.id}
                        type="button"
                        onClick={() => scrollToHeading(heading.id)}
                        className={cn(
                          "block w-full text-left text-xs leading-snug transition-colors py-0.5",
                          heading.level === 1 && "pl-0",
                          heading.level === 2 && "pl-2",
                          heading.level === 3 && "pl-4",
                          activeHeading === heading.id
                            ? "font-semibold text-primary"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {heading.text}
                      </button>
                    ))}
                  </nav>
                </ScrollArea>
              </aside>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DocsModalProvider({
  children,
  headerDoc,
}: DocsModalProviderProps) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<DocsModalSource | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [legacyTitle, setLegacyTitle] = useState<string | undefined>();
  const [platformNav, setPlatformNav] = useState<PlatformDocument[]>([]);
  const [platformNavLoading, setPlatformNavLoading] = useState(true);
  const lastSlugRequestRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPlatformNavLoading(true);
      const res = await getPlatformDocuments();
      if (cancelled) return;
      if ("success" in res && res.success != null) {
        setPlatformNav(parsePlatformDocumentsResponse(res.success));
      } else {
        setPlatformNav([]);
      }
      setPlatformNavLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyDoc = useCallback((doc: PlatformDocument) => {
    const u = doc.url?.trim();
    if (!u) return;
    setSelectedSlug(doc.slug ?? doc.id);
    setLegacyTitle(undefined);
    setSource({ type: "url", url: u });
  }, []);

  const openDocs = useCallback(
    (opts: OpenDocsOptions) => {
      if ("slug" in opts) {
        lastSlugRequestRef.current = opts.slug;
        const doc = findDocBySlug(platformNav, opts.slug);
        if (doc) {
          applyDoc(doc);
          lastSlugRequestRef.current = null;
        }
        setOpen(true);
        return;
      }

      setSource(opts.source);

      let nextSlug: string | null = null;
      const sel = opts.selectedUrl?.trim();
      if (sel) {
        const d = findDocByUrl(platformNav, sel);
        if (d) nextSlug = d.slug ?? d.id;
      } else if (opts.source.type === "url") {
        const d = findDocByUrl(platformNav, opts.source.url.trim());
        if (d) nextSlug = d.slug ?? d.id;
      }
      setSelectedSlug(nextSlug);
      setLegacyTitle(nextSlug ? undefined : opts.title);
      setOpen(true);
    },
    [applyDoc, platformNav],
  );

  useEffect(() => {
    if (platformNavLoading) return;
    const slug = lastSlugRequestRef.current;
    if (slug == null) return;
    const doc = findDocBySlug(platformNav, slug);
    if (doc) applyDoc(doc);
    lastSlugRequestRef.current = null;
  }, [platformNav, platformNavLoading, applyDoc]);

  const closeDocs = useCallback(() => {
    setOpen(false);
  }, []);

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) {
      window.setTimeout(() => {
        setSource(null);
        setLegacyTitle(undefined);
        setSelectedSlug(null);
      }, 200);
    }
  }, []);

  const onSelectPlatformDoc = useCallback(
    (doc: PlatformDocument) => {
      applyDoc(doc);
    },
    [applyDoc],
  );

  const value = useMemo(
    () => ({
      openDocs,
      closeDocs,
      headerDoc,
    }),
    [openDocs, closeDocs, headerDoc],
  );

  return (
    <DocsModalContext.Provider value={value}>
      {children}
      <DocsModalDialog
        open={open}
        onOpenChange={handleOpenChange}
        source={source}
        platformNav={platformNav}
        platformNavLoading={platformNavLoading}
        selectedSlug={selectedSlug}
        legacyTitle={legacyTitle}
        onSelectPlatformDoc={onSelectPlatformDoc}
      />
    </DocsModalContext.Provider>
  );
}

export interface DocsModalHeaderTriggerProps {
  className?: string;
  /** If set, opens this doc instead of the provider `headerDoc` / welcome fallback */
  doc?: OpenDocsOptions;
}

/**
 * Compact icon button for toolbars / headers. Uses provider `headerDoc`, `doc` prop, or a built‑in welcome.
 */
export function DocsModalHeaderTrigger({
  className,
  doc: docOverride,
}: DocsModalHeaderTriggerProps) {
  const { t } = useTranslation();
  const { openDocs, headerDoc } = useDocsModal();

  const handleClick = useCallback(() => {
    if (docOverride) {
      openDocs(docOverride);
      return;
    }
    if (headerDoc) {
      openDocs(headerDoc);
      return;
    }
    openDocs({
      source: {
        type: "content",
        content: defaultWelcomeMarkdown(t),
      },
    });
  }, [docOverride, headerDoc, openDocs, t]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-9 w-9 shrink-0", className)}
          aria-label={t("docsModal.openDocs", "Open documentation")}
          onClick={handleClick}
        >
          <BookOpen className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {t("docsModal.openDocs", "Documentation")}
      </TooltipContent>
    </Tooltip>
  );
}
