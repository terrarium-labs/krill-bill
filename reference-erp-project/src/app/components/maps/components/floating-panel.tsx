import { useEffect, useRef, useCallback, useState } from "react";
import { X, GripHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingPanelProps {
    title: string;
    children: React.ReactNode;
    defaultPosition?: { x: number; y: number };
    defaultSize?: { width: number; height: number };
    onClose: () => void;
    className?: string;
}

const FloatingPanel = ({
    title,
    children,
    defaultPosition = { x: 16, y: 16 },
    defaultSize = { width: 400, height: 500 },
    onClose,
    className,
}: FloatingPanelProps) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const pos = useRef(defaultPosition);
    const size = useRef(defaultSize);
    const [mounted, setMounted] = useState(false);

    const applyTransform = useCallback(() => {
        const el = panelRef.current;
        if (!el) return;
        el.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
    }, []);

    const applySize = useCallback(() => {
        const el = panelRef.current;
        if (!el) return;
        el.style.width = `${size.current.width}px`;
        el.style.height = `${size.current.height}px`;
    }, []);

    useEffect(() => {
        applyTransform();
        applySize();
        requestAnimationFrame(() => setMounted(true));
    }, [applyTransform, applySize]);

    const handleDragStart = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            const startX = e.clientX - pos.current.x;
            const startY = e.clientY - pos.current.y;

            const onMove = (ev: MouseEvent) => {
                pos.current = {
                    x: Math.max(0, Math.min(ev.clientX - startX, window.innerWidth - 100)),
                    y: Math.max(0, Math.min(ev.clientY - startY, window.innerHeight - 40)),
                };
                applyTransform();
            };

            const onUp = () => {
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("mouseup", onUp);
                document.body.style.cursor = "";
                document.body.style.userSelect = "";
            };

            document.body.style.cursor = "grabbing";
            document.body.style.userSelect = "none";
            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
        },
        [applyTransform]
    );

    const handleEdgeResize = useCallback(
        (e: React.MouseEvent, edges: { top?: boolean; bottom?: boolean; left?: boolean; right?: boolean }) => {
            e.preventDefault();
            e.stopPropagation();
            const startX = e.clientX;
            const startY = e.clientY;
            const startW = size.current.width;
            const startH = size.current.height;
            const startPosX = pos.current.x;
            const startPosY = pos.current.y;

            const onMove = (ev: MouseEvent) => {
                const dx = ev.clientX - startX;
                const dy = ev.clientY - startY;

                if (edges.right) {
                    size.current.width = Math.max(280, startW + dx);
                }
                if (edges.bottom) {
                    size.current.height = Math.max(200, startH + dy);
                }
                if (edges.left) {
                    const newW = Math.max(280, startW - dx);
                    pos.current.x = startPosX + (startW - newW);
                    size.current.width = newW;
                }
                if (edges.top) {
                    const newH = Math.max(200, startH - dy);
                    pos.current.y = startPosY + (startH - newH);
                    size.current.height = newH;
                }

                applySize();
                applyTransform();
            };

            const onUp = () => {
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("mouseup", onUp);
                document.body.style.cursor = "";
                document.body.style.userSelect = "";
            };

            document.body.style.userSelect = "none";
            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
        },
        [applySize, applyTransform]
    );

    return (
        <div
            ref={panelRef}
            className={cn(
                "fixed top-0 left-0 z-60 flex flex-col rounded-lg border bg-background shadow-xl overflow-hidden",
                !mounted && "opacity-0 -translate-y-2",
                mounted && "opacity-100 translate-y-0",
                className
            )}
            style={{
                willChange: "transform",
                transition: mounted ? "none" : "opacity 200ms ease-out, translate 200ms ease-out",
            }}
        >
            <div
                onMouseDown={handleDragStart}
                className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/50 shrink-0 select-none cursor-grab active:cursor-grabbing"
            >
                <div className="flex items-center gap-2">
                    <GripHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium">{title}</span>
                </div>
                <button
                    onClick={onClose}
                    className="flex items-center justify-center w-5 h-5 rounded-md hover:bg-accent cursor-pointer transition-colors"
                >
                    <X className="h-3 w-3" />
                </button>
            </div>

            <div className="flex-1 overflow-auto">{children}</div>

            {/* Edge handles */}
            <div onMouseDown={(e) => handleEdgeResize(e, { top: true })} className="absolute top-0 left-2 right-2 h-1.5 cursor-ns-resize" />
            <div onMouseDown={(e) => handleEdgeResize(e, { bottom: true })} className="absolute bottom-0 left-2 right-2 h-1.5 cursor-ns-resize" />
            <div onMouseDown={(e) => handleEdgeResize(e, { left: true })} className="absolute left-0 top-2 bottom-2 w-1.5 cursor-ew-resize" />
            <div onMouseDown={(e) => handleEdgeResize(e, { right: true })} className="absolute right-0 top-2 bottom-2 w-1.5 cursor-ew-resize" />

            {/* Corner handles */}
            <div onMouseDown={(e) => handleEdgeResize(e, { top: true, left: true })} className="absolute top-0 left-0 w-2.5 h-2.5 cursor-nwse-resize" />
            <div onMouseDown={(e) => handleEdgeResize(e, { top: true, right: true })} className="absolute top-0 right-0 w-2.5 h-2.5 cursor-nesw-resize" />
            <div onMouseDown={(e) => handleEdgeResize(e, { bottom: true, left: true })} className="absolute bottom-0 left-0 w-2.5 h-2.5 cursor-nesw-resize" />
            <div onMouseDown={(e) => handleEdgeResize(e, { bottom: true, right: true })} className="absolute bottom-0 right-0 w-2.5 h-2.5 cursor-nwse-resize" />
        </div>
    );
};

export default FloatingPanel;
