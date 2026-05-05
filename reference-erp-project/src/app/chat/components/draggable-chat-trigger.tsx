import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { CharlesAuraCircle } from "@/app/chat/components/charles-chat-empty-aura";
import { Undo2 } from "lucide-react";
import { useChatContext } from "@/app/chat/context/ChatContext";

const STORAGE_KEY = "chat-trigger-position";
const openingLines = [
    "Can I help you today?",
    "Ask me anything...",
    "Need my help?",
    "Let's get things done!",
];

interface Position {
    x: number;
    y: number;
}

interface FractionPosition {
    xFraction: number;
    yFraction: number;
}

const BUTTON_WIDTH = 208;
const BUTTON_HEIGHT = 56;
const MARGIN = 24;

const getDefaultFraction = (): FractionPosition => {
    const maxX = window.innerWidth - BUTTON_WIDTH;
    const maxY = window.innerHeight - BUTTON_HEIGHT;
    return {
        xFraction: maxX > 0 ? (maxX - MARGIN) / maxX : 1,
        yFraction: maxY > 0 ? (maxY - MARGIN) / maxY : 1,
    };
};

const getStoredFraction = (): FractionPosition | null => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const pos = JSON.parse(stored);
            // New format: fractions
            if (typeof pos.xFraction === "number" && typeof pos.yFraction === "number") {
                return {
                    xFraction: Math.max(0, Math.min(1, pos.xFraction)),
                    yFraction: Math.max(0, Math.min(1, pos.yFraction)),
                };
            }
            // Legacy format: absolute pixels — migrate to fractions
            if (typeof pos.x === "number" && typeof pos.y === "number") {
                const maxX = window.innerWidth - BUTTON_WIDTH;
                const maxY = window.innerHeight - BUTTON_HEIGHT;
                return {
                    xFraction: maxX > 0 ? Math.max(0, Math.min(1, pos.x / maxX)) : 1,
                    yFraction: maxY > 0 ? Math.max(0, Math.min(1, pos.y / maxY)) : 1,
                };
            }
        }
    } catch {
        // ignore
    }
    return null;
};

const fractionToPixels = (frac: FractionPosition): Position => ({
    x: frac.xFraction * (window.innerWidth - BUTTON_WIDTH),
    y: frac.yFraction * (window.innerHeight - BUTTON_HEIGHT),
});

const pixelsToFraction = (pos: Position): FractionPosition => {
    const maxX = window.innerWidth - BUTTON_WIDTH;
    const maxY = window.innerHeight - BUTTON_HEIGHT;
    return {
        xFraction: maxX > 0 ? Math.max(0, Math.min(1, pos.x / maxX)) : 1,
        yFraction: maxY > 0 ? Math.max(0, Math.min(1, pos.y / maxY)) : 1,
    };
};

const DraggableChatTrigger = () => {
    const { toggleChat } = useChatContext();
    const [currentLineIndex, setCurrentLineIndex] = useState(0);
    const [fractionPosition, setFractionPosition] = useState<FractionPosition>(() => {
        return getStoredFraction() ?? getDefaultFraction();
    });
    const [isHovered, setIsHovered] = useState(false);
    // Used only to trigger re-render on resize so pixel position is recomputed from fractions
    const [, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    const isDragging = useRef(false);
    const hasDragged = useRef(false);
    const dragStart = useRef<Position>({ x: 0, y: 0 });
    const fractionStart = useRef<FractionPosition>({ xFraction: 0, yFraction: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Carousel rotation
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentLineIndex((prev) => (prev + 1) % openingLines.length);
        }, 5337);
        return () => clearInterval(interval);
    }, []);

    // On resize, trigger re-render so pixel position is recomputed from stable fractions
    useEffect(() => {
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Pixel position derived from fractions and current window size
    const position = fractionToPixels(fractionPosition);

    const isAtDefault = useMemo(() => {
        const def = getDefaultFraction();
        return (
            Math.abs(fractionPosition.xFraction - def.xFraction) < 0.01 &&
            Math.abs(fractionPosition.yFraction - def.yFraction) < 0.01
        );
    }, [fractionPosition]);

    const resetPosition = useCallback(() => {
        const def = getDefaultFraction();
        setFractionPosition(def);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(def));
    }, []);

    const onPointerDown = useCallback((e: React.PointerEvent) => {
        isDragging.current = true;
        hasDragged.current = false;
        dragStart.current = { x: e.clientX, y: e.clientY };
        fractionStart.current = { ...fractionPosition };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        e.preventDefault();
    }, [fractionPosition]);

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging.current) return;
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        if (!hasDragged.current && Math.abs(dx) + Math.abs(dy) > 4) {
            hasDragged.current = true;
        }
        const startPixels = fractionToPixels(fractionStart.current);
        const newFrac = pixelsToFraction({ x: startPixels.x + dx, y: startPixels.y + dy });
        setFractionPosition(newFrac);
    }, []);

    const onPointerUp = useCallback((_e: React.PointerEvent) => {
        if (!isDragging.current) return;
        isDragging.current = false;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fractionPosition));
        if (!hasDragged.current) {
            toggleChat();
        }
    }, [fractionPosition, toggleChat]);

    return (
        <div
            className="fixed z-50"
            style={{ left: position.x, top: position.y }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Reset pin button */}
            {!isAtDefault && isHovered && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        resetPosition();
                    }}
                    className="absolute -top-2 -right-2 z-10 flex items-center justify-center h-6 w-6 rounded-full bg-muted border border-border shadow-sm hover:bg-accent transition-colors duration-200 cursor-pointer"
                    title="Reset to default position"
                >
                    <Undo2 className="h-3 w-3 text-muted-foreground" />
                </button>
            )}
            <Button
                ref={buttonRef}
                variant="outline"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                className="h-14 w-52 py-2 px-3 gap-3 rounded-full shadow-lg hover:shadow-xl bg-background/10 backdrop-blur-md border-border/50 transition-all duration-300 hover:bg-background/80 hover:scale-105 group select-none touch-none"
            >
                <div className="relative size-8 shrink-0 overflow-hidden rounded-full transition-transform duration-500 ease-in-out group-hover:scale-110">
                    <CharlesAuraCircle className="size-full ring-2 ring-background/50" />
                </div>
                {/* Text container */}
                <div className="flex-1 flex flex-col items-start">
                    <span className="text-sm font-medium leading-tight">
                        AgentHub
                    </span>
                    <div className="relative h-4 w-full overflow-hidden">
                        {openingLines.map((line, i) => (
                            <span
                                key={line}
                                className={`text-left absolute inset-0 text-xs text-muted-foreground leading-tight transition-all duration-500 ease-in-out ${
                                    i === currentLineIndex
                                        ? "opacity-100 translate-y-0"
                                        : "opacity-0 translate-y-2"
                                }`}
                            >
                                {line}
                            </span>
                        ))}
                    </div>
                </div>
            </Button>
        </div>
    );
};

export default DraggableChatTrigger;
