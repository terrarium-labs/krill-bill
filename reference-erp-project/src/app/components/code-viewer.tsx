import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export type MonacoEditor = editor.IStandaloneCodeEditor;

interface CodeViewerProps {
    value: string;
    language?: string;
    /** Fixed height. When omitted the editor grows with content up to maxHeight. */
    height?: number | string;
    /** Max height in pixels when using auto-sizing. When omitted the editor grows without a cap. */
    maxHeight?: number;
    className?: string;
    /** Called with the editor instance after it mounts — use to trigger find, etc. */
    onEditorMount?: (editor: MonacoEditor) => void;
}

export const CodeViewer = ({
    value,
    language = "json",
    height,
    maxHeight,
    className,
    onEditorMount,
}: CodeViewerProps) => {
    const { resolvedTheme } = useTheme();
    const editorRef = useRef<MonacoEditor | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef(0);
    const [editorBox, setEditorBox] = useState<{ w: number; h: number }>({
        w: 1,
        h: 1,
    });

    const monacoTheme = resolvedTheme === "dark" ? "vs-dark" : "light";

    const measureAndLayout = useCallback(() => {
        const el = containerRef.current;
        const ed = editorRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const w = Math.max(1, Math.floor(r.width));
        const h = Math.max(1, Math.floor(r.height));
        setEditorBox((prev) =>
            prev.w === w && prev.h === h ? prev : { w, h },
        );
        ed?.layout({ width: w, height: h });
    }, []);

    const scheduleMeasure = useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = 0;
            measureAndLayout();
        });
    }, [measureAndLayout]);

    function updateHeight(ed: MonacoEditor) {
        const contentHeight =
            maxHeight != null
                ? Math.min(ed.getContentHeight(), maxHeight)
                : ed.getContentHeight();
        if (containerRef.current) {
            containerRef.current.style.height = `${contentHeight}px`;
        }
        scheduleMeasure();
    }

    const handleMount: OnMount = (ed) => {
        editorRef.current = ed;
        onEditorMount?.(ed);
        if (!height) {
            updateHeight(ed);
        } else {
            scheduleMeasure();
        }
    };

    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const ro = new ResizeObserver(() => {
            scheduleMeasure();
        });
        ro.observe(el);
        scheduleMeasure();

        return () => {
            ro.disconnect();
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [scheduleMeasure]);

    useEffect(() => {
        const ed = editorRef.current;
        if (!ed || height) return;

        const disposable = ed.onDidContentSizeChange(() => updateHeight(ed));
        return () => disposable.dispose();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [height, maxHeight]);

    return (
        <div
            ref={containerRef}
            className={cn("min-w-0 w-full overflow-hidden", className)}
            style={height ? { height } : undefined}
        >
            <Editor
                width={editorBox.w}
                height={editorBox.h}
                value={value}
                language={language}
                theme={monacoTheme}
                onMount={handleMount}
                options={{
                    readOnly: true,
                    automaticLayout: false,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    lineNumbers: "off",
                    folding: true,
                    renderLineHighlight: "none",
                    overviewRulerLanes: 0,
                    hideCursorInOverviewRuler: true,
                    scrollbar: {
                        vertical: "auto",
                        horizontal: "auto",
                        verticalScrollbarSize: 6,
                        horizontalScrollbarSize: 6,
                    },
                    fontSize: 12,
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    padding: { top: 8, bottom: 8 },
                    contextmenu: false,
                    links: false,
                    renderValidationDecorations: "off",
                    find: {
                        addExtraSpaceOnTop: false,
                        autoFindInSelection: "never",
                        seedSearchStringFromSelection: "always",
                    },
                }}
            />
        </div>
    );
};

export default CodeViewer;
