import ChatPanel from "@/app/chat/ChatPanel";
import { useChatContext } from "@/app/chat/context/ChatContext";
import DraggableChatTrigger from "@/app/chat/components/draggable-chat-trigger";
import ChatFloatingChrome from "@/app/chat/components/chat-floating-chrome";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

const CHAT_PANEL_WIDTH_STORAGE_KEY = "chat-panel-width-px";
const CHAT_PANEL_DEFAULT_WIDTH_PX = 448;
const CHAT_PANEL_MIN_WIDTH_PX = 320;
const CHAT_PANEL_MAX_WIDTH_PX = 800;

function persistChatPanelWidthPx(width: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHAT_PANEL_WIDTH_STORAGE_KEY, String(width));
  } catch {
    /* ignore */
  }
}

function readChatPanelWidthPx(): number {
  if (typeof window === "undefined") return CHAT_PANEL_DEFAULT_WIDTH_PX;
  try {
    const raw = localStorage.getItem(CHAT_PANEL_WIDTH_STORAGE_KEY);
    const n = raw ? Number.parseInt(raw, 10) : NaN;
    if (Number.isFinite(n)) {
      return Math.min(
        CHAT_PANEL_MAX_WIDTH_PX,
        Math.max(CHAT_PANEL_MIN_WIDTH_PX, n)
      );
    }
  } catch {
    /* ignore */
  }
  return CHAT_PANEL_DEFAULT_WIDTH_PX;
}

const triggerTransition = {
  duration: 0.38,
  ease: [0.22, 1, 0.36, 1] as const,
};

const panelOpenTransition = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.82,
} as const;

const panelExitTransition = {
  duration: 0.32,
  ease: [0.32, 0.72, 0, 1] as const,
};

const panelVariants = {
  initial: {
    opacity: 0,
    x: 56,
    scale: 0.96,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: panelOpenTransition,
  },
  exit: {
    opacity: 0,
    x: 40,
    scale: 0.985,
    transition: panelExitTransition,
  },
};

/**
 * Floating chat trigger + docked panel (default layout only). Agent mode uses fullscreen chat elsewhere.
 */
export default function FloatingChatShell() {
  const { isChatVisible, isMobile } = useChatContext();

  const [chatMaxWidthPx, setChatMaxWidthPx] = useState(() => {
    if (typeof window === "undefined") return CHAT_PANEL_MAX_WIDTH_PX;
    return Math.min(
      CHAT_PANEL_MAX_WIDTH_PX,
      Math.max(CHAT_PANEL_MIN_WIDTH_PX, window.innerWidth - 56)
    );
  });
  const [chatWidthPx, setChatWidthPx] = useState(readChatPanelWidthPx);
  const resizeSessionRef = useRef<{ startX: number; startWidth: number } | null>(
    null
  );
  const latestWidthRef = useRef(chatWidthPx);

  useEffect(() => {
    latestWidthRef.current = chatWidthPx;
  }, [chatWidthPx]);

  useEffect(() => {
    const update = () => {
      setChatMaxWidthPx(
        Math.min(
          CHAT_PANEL_MAX_WIDTH_PX,
          Math.max(CHAT_PANEL_MIN_WIDTH_PX, window.innerWidth - 56)
        )
      );
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    setChatWidthPx((prev) => {
      const next = Math.min(
        chatMaxWidthPx,
        Math.max(CHAT_PANEL_MIN_WIDTH_PX, prev)
      );
      if (next !== prev) {
        persistChatPanelWidthPx(next);
      }
      return next;
    });
  }, [chatMaxWidthPx]);

  const onChatResizePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      const session = resizeSessionRef.current;
      if (!session) return;
      const next = Math.min(
        chatMaxWidthPx,
        Math.max(
          CHAT_PANEL_MIN_WIDTH_PX,
          session.startWidth + (session.startX - e.clientX)
        )
      );
      latestWidthRef.current = next;
      setChatWidthPx(next);
    },
    [chatMaxWidthPx]
  );

  const endChatResize = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>, target: HTMLButtonElement) => {
      if (resizeSessionRef.current) {
        resizeSessionRef.current = null;
        persistChatPanelWidthPx(latestWidthRef.current);
      }
      try {
        target.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    },
    []
  );

  return (
    <AnimatePresence initial={false}>
      {isChatVisible ? (
        <motion.div
          key="chat-dock"
          className={cn(
            "fixed z-50 flex flex-col gap-2",
            isMobile
              ? "inset-3"
              : "top-4 right-6 bottom-4 left-auto h-[calc(100dvh-2rem)]"
          )}
          style={
            !isMobile
              ? {
                  width: `${Math.min(chatWidthPx, chatMaxWidthPx)}px`,
                  transformOrigin: "100% 0%",
                }
              : { transformOrigin: "100% 0%" }
          }
          variants={panelVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {!isMobile && (
            <button
              type="button"
              aria-label="Drag to resize chat panel"
              className={cn(
                "absolute top-0 bottom-0 -left-1 z-60 w-4 -translate-x-1/2 cursor-ew-resize! touch-none",
                "border-0 bg-transparent p-0 outline-none focus-visible:ring-0"
              )}
              onPointerDown={(e) => {
                e.preventDefault();
                resizeSessionRef.current = {
                  startX: e.clientX,
                  startWidth: latestWidthRef.current,
                };
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={onChatResizePointerMove}
              onPointerUp={(e) => endChatResize(e, e.currentTarget)}
              onPointerCancel={(e) => endChatResize(e, e.currentTarget)}
            />
          )}
          <ChatFloatingChrome />
          <div
            className="group flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-border shadow-2xl"
            role="dialog"
            aria-label="Chat"
          >
            <ChatPanel
              hideToolbar
              className="bg-background/70 backdrop-blur-md transition-[backdrop-filter,background-color] duration-300 ease-out group-hover:bg-background/75 group-hover:backdrop-blur-xl dark:bg-background/50 dark:group-hover:bg-background/55"
            />
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-[55%] -z-10"
            style={{
              background: [
                "radial-gradient(ellipse 150% 115% at 100% 0%, color-mix(in oklch, var(--primary) 22%, transparent), transparent 72%)",
                "radial-gradient(ellipse 195% 140% at 100% -8%, color-mix(in oklch, var(--background) 48%, transparent), transparent 82%)",
              ].join(", "),
            }}
          />
        </motion.div>
      ) : (
        <motion.div
          key="chat-trigger"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={triggerTransition}
        >
          <DraggableChatTrigger />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
