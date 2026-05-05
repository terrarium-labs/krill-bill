import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useDocsModal, type OpenDocsOptions } from "@/app/components/modals/docs-modal";

export type TipsCardHiddenPart = "icon" | "button";
export type TipsCardVariant = "default" | "row";

export interface TipsCardProps {
  /** Shown next to the info icon in the header. */
  title?: string;
  /** Content shown in the card body. Accepts a plain string or any React node for rich content. */
  summary: React.ReactNode;
  /**
   * Full document opened in the docs modal when "View more" is used.
   * If omitted, neither the button nor the click action is shown.
   */
  doc?: OpenDocsOptions;
  /**
   * Custom label for the button. Defaults to "View more".
   * Only used when a button action is present (either `doc` or `onClick`).
   */
  buttonLabel?: string;
  /**
   * Custom click handler for the button. If provided, takes precedence over `doc`.
   * When both are omitted, no button is shown.
   */
  onClick?: () => void;
  /**
   * Regions to suppress.
   * - `"icon"` omits the info icon.
   * - `"button"` hides the action until the card is hovered or focused within.
   *   In the `"row"` variant this only hides the chevron; the whole card remains clickable.
   */
  hidden?: TipsCardHiddenPart | TipsCardHiddenPart[];
  /**
   * `"row"` places icon, title, summary and chevron on a single horizontal line.
   * The entire card becomes the click target and the chevron replaces the "View more" text button.
   * Defaults to `"default"`.
   */
  variant?: TipsCardVariant;
  className?: string;
}

function useTipsCardHidden(hidden: TipsCardProps["hidden"]) {
  return useMemo(() => {
    if (hidden == null) return new Set<TipsCardHiddenPart>();
    const list = Array.isArray(hidden) ? hidden : [hidden];
    return new Set(
      list.filter((p): p is TipsCardHiddenPart => p === "icon" || p === "button"),
    );
  }, [hidden]);
}

/**
 * Info-style card with an optional **View more** action that opens a doc in the global docs modal,
 * or a custom button with a provided label and click handler.
 * Use `variant="row"` for a compact single-line layout where the entire card is clickable.
 */
const TipsCard = ({
  title: titleProp,
  summary,
  doc,
  buttonLabel,
  onClick,
  hidden: hiddenProp,
  variant = "default",
  className,
}: TipsCardProps) => {
  const { t } = useTranslation();
  const { openDocs } = useDocsModal();
  const title = titleProp ?? t("tipsCard.title", "Tips");
  const hidden = useTipsCardHidden(hiddenProp);
  const hideIcon = hidden.has("icon");
  const hideButtonUntilHover = hidden.has("button");

  const handleOpen = doc ? () => openDocs(doc) : undefined;
  const handleButtonClick = onClick || handleOpen;

  // ─── Row variant ──────────────────────────────────────────────────────────
  if (variant === "row") {
    return (
      <Card
        role={handleButtonClick ? "button" : undefined}
        tabIndex={handleButtonClick ? 0 : undefined}
        onClick={handleButtonClick}
        onKeyDown={
          handleButtonClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleButtonClick();
                }
              }
            : undefined
        }
        className={cn(
          "group gap-0 py-0 shadow-none bg-primary-foreground text-muted-foreground",
          handleButtonClick && "cursor-pointer select-none",
          className,
        )}
      >
        <CardContent className="px-4 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            {!hideIcon && (
              <span
                className="flex h-4 w-4 shrink-0 items-center justify-center"
                aria-hidden
              >
                <Info className="size-3.5 shrink-0" />
              </span>
            )}
            <span className="shrink-0 text-xs font-semibold leading-snug">
              {title}
            </span>
            <div className="min-w-0 flex-1 overflow-hidden text-xs leading-relaxed opacity-80">
              <div className="line-clamp-1">{summary}</div>
            </div>
            {handleButtonClick && (
              <ChevronRight
                className={cn(
                  "ml-1 size-4 shrink-0 transition-opacity duration-200",
                  hideButtonUntilHover
                    ? "opacity-0 group-hover:opacity-70 group-focus-within:opacity-70"
                    : "opacity-70",
                )}
                aria-hidden
              />
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Default variant ──────────────────────────────────────────────────────
  const buttonLabel_ = buttonLabel ?? t("tipsCard.viewMore", "View more");
  const viewMoreButton = handleButtonClick ? (
    <button
      type="button"
      className={cn(
        "group/btn inline-flex w-max max-w-full items-center gap-1 border-0 bg-transparent p-0 text-left text-xs font-medium",
        "focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
        "cursor-pointer",
      )}
      onClick={handleButtonClick}
    >
      <span
        className={cn(
          "underline-offset-4 no-underline transition-[text-decoration] duration-200",
          "group-hover/btn:underline",
        )}
      >
        {buttonLabel_}
      </span>
      <ChevronRight
        className="size-[1em] shrink-0 opacity-70 transition-transform duration-200 group-hover/btn:translate-x-0.5"
        aria-hidden
      />
    </button>
  ) : null;

  return (
    <Card
      className={cn(
        "group gap-0 py-2.5 shadow-none bg-primary-foreground text-muted-foreground",
        className,
      )}
    >
      <CardHeader className="px-4 pt-2 text-xs">
        <CardTitle className="flex items-center gap-2">
          {!hideIcon ? (
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center"
              aria-hidden
            >
              <Info className="size-4 shrink-0" />
            </span>
          ) : null}
          <span className="min-w-0 leading-snug">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-2">
        <div className="relative min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key="summary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-col gap-3"
            >
              <div className="text-xs leading-relaxed">{summary}</div>
              {viewMoreButton !== null ? (
                hideButtonUntilHover ? (
                  <div
                    className={cn(
                      "grid min-h-0 overflow-hidden transition-[grid-template-rows] duration-200 ease-out",
                      "grid-rows-[0fr] group-hover:grid-rows-[1fr] group-focus-within:grid-rows-[1fr]",
                    )}
                  >
                    <div className="min-h-0">{viewMoreButton}</div>
                  </div>
                ) : (
                  viewMoreButton
                )
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
};

export default TipsCard;
