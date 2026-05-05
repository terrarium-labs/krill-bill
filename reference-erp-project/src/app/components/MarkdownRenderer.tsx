import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import TicketViewModal, { useTicketModal } from "@/app/tickets/components/ticket-view-modal";
import { SquareArrowOutUpRight } from 'lucide-react';
import ChatWidget from "@/app/chat/components/ChatWidget";
import { extractHeadingsFromMarkdown } from "@/utils/heading-navigation";
import { MarkdownRendererTable } from "@/app/components/markdown-renderer-table";
import { cn } from "@/lib/utils";

export interface MarkdownRendererProps {
    content?: string;
    textSizeMultiplier?: number;
    url?: string | null;
    breakAll?: boolean;
    /** Add `id` on h1–h3 matching {@link extractHeadingsFromMarkdown} (for TOC / in-page links). */
    anchorHeadings?: boolean;
    /** Fires when markdown body is available (after fetch or when `content` updates). */
    onMarkdownBodyChange?: (markdown: string) => void;
    /** Merged onto the root block wrapper (`block w-full min-w-0`). */
    className?: string;
    /** Merged onto the inner wrapper around `<ReactMarkdown />` (`w-full min-w-0`). */
    contentClassName?: string;
}

const MarkdownRenderer = ({
    content,
    textSizeMultiplier = 0.8,
    url = null,
    breakAll = true,
    anchorHeadings = false,
    onMarkdownBodyChange,
    className,
    contentClassName,
}: MarkdownRendererProps) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();
    const { ticketModalOpen, selectedTicketId, setTicketModalOpen, openTicketModal } = useTicketModal();
    const [markdownContent, setMarkdownContent] = useState(content || '');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchMarkdownContent = async () => {
            try {
                setIsLoading(true);
                if (url) {
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error('Failed to fetch markdown content');
                    }
                    const text = await response.text();
                    setMarkdownContent(text);
                }
            } catch (error) {
                console.error('Error fetching markdown:', error);
                toast.error(t("markdown.fetch_error") || "Failed to load markdown content");
            } finally {
                setIsLoading(false);
            }
        };

        if (url) {
            fetchMarkdownContent();
        }
        if (content) {
            setMarkdownContent(content);
            setIsLoading(false);
        }
    }, [url, content, t]);

    useEffect(() => {
        onMarkdownBodyChange?.(markdownContent);
    }, [markdownContent, onMarkdownBodyChange]);

    const handleCopyCode = useCallback((code: string) => {
        navigator.clipboard.writeText(code);
        toast.success(t("markdown.code_copied") || "Code copied to clipboard");
    }, [t]);

    const getFontSize = useCallback(
        (baseSize: number) => `${baseSize * textSizeMultiplier}px`,
        [textSizeMultiplier],
    );

    const preprocessMarkdown = (markdownText: string = '') => {
        let processedText = markdownText
            .replace(/\\\[/g, '$$')
            .replace(/\\\]/g, '$$')
            .replace(/\\\(/g, '$')
            .replace(/\\\)/g, '$');
        return processedText;
    };

    const headingListForNav = useMemo(
        () => extractHeadingsFromMarkdown(preprocessMarkdown(markdownContent)),
        [markdownContent],
    );

    const headingPtr = useRef(0);

    const remarkPlugins = useMemo(
        () => [[remarkMath, { singleDollarTextMath: false }], remarkGfm] as any,
        [],
    );
    const rehypePlugins = useMemo(() => [rehypeRaw, rehypeKatex], []);

    const markdownComponents = useMemo(
        () => ({
            code({ className, children }: { className?: string; children?: React.ReactNode }) {
                const match = /language-(\w+)/.exec(className || '');
                const isInline = !match;

                return !isInline && match ? (
                    <div className="relative max-w-4xl w-full min-w-0">
                        <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2 z-10 h-8 w-8 p-0"
                            onClick={() => handleCopyCode(String(children).replace(/\n$/, ''))}
                        >
                            <Icon icon="solar:copy-linear" className="text-lg text-white" />
                        </Button>
                        <SyntaxHighlighter
                            style={dracula as any}
                            language={match[1]}
                            PreTag="div"
                            wrapLongLines={true}
                            customStyle={{
                                marginTop: 4,
                                marginBottom: 4,
                                fontSize: getFontSize(13),
                                borderRadius: '6px',
                                wordBreak: 'break-all',
                            }}
                        >
                            {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                    </div>
                ) : (
                    <code style={{ fontSize: getFontSize(14) }} className={`${className || ''} ${breakAll ? 'break-all' : ''}`}>
                        {children}
                    </code>
                );
            },
            h1: ({ children }: { children?: React.ReactNode }) => {
                const id = anchorHeadings ? headingListForNav[headingPtr.current++]?.id : undefined;
                return (
                    <h1
                        id={id}
                        style={{ fontSize: getFontSize(28) }}
                        className={`font-semibold my-4 ${breakAll ? 'break-all' : ''}`}
                    >
                        {children}
                    </h1>
                );
            },
            h2: ({ children }: { children?: React.ReactNode }) => {
                const id = anchorHeadings ? headingListForNav[headingPtr.current++]?.id : undefined;
                return (
                    <h2
                        id={id}
                        style={{ fontSize: getFontSize(24) }}
                        className={`font-semibold my-3 ${breakAll ? 'break-all' : ''}`}
                    >
                        {children}
                    </h2>
                );
            },
            h3: ({ children }: { children?: React.ReactNode }) => {
                const id = anchorHeadings ? headingListForNav[headingPtr.current++]?.id : undefined;
                return (
                    <h3
                        id={id}
                        style={{ fontSize: getFontSize(20) }}
                        className={`font-semibold my-2 ${breakAll ? 'break-all' : ''}`}
                    >
                        {children}
                    </h3>
                );
            },
            h4: ({ children }: { children?: React.ReactNode }) => <h4 style={{ fontSize: getFontSize(16) }} className={`font-semibold my-2 ${breakAll ? 'break-all' : ''}`}>{children}</h4>,
            p: ({ children }: { children?: React.ReactNode }) => <p style={{ fontSize: getFontSize(16) }} className={`my-2 ${breakAll ? 'break-all' : ''}`}>{children}</p>,
            ul: ({ children }: { children?: React.ReactNode }) => <ul style={{ fontSize: getFontSize(16) }} className={`list-disc pl-6 my-2 ${breakAll ? 'break-all' : ''}`}>{children}</ul>,
            ol: ({ children }: { children?: React.ReactNode }) => <ol style={{ fontSize: getFontSize(16) }} className={`list-decimal pl-6 my-2 ${breakAll ? 'break-all' : ''}`}>{children}</ol>,
            li: ({ children }: { children?: React.ReactNode }) => <li style={{ fontSize: getFontSize(16) }} className={`my-1 ${breakAll ? 'break-all' : ''}`}>{children}</li>,
            a: ({ href, children }: { href?: string; children?: React.ReactNode }) => {
                if (href && href.startsWith('#charles-widget:')) {
                    return (
                        <ChatWidget
                            href={href}
                            label={children}
                            orgId={orgId || ""}
                        />
                    );
                }
                if (href && href.startsWith('#charles-nav:')) {
                    const internalPath = href.replace('#charles-nav:', '');
                    return (
                        <Button
                            type="button"
                            size="sm"
                            variant="link"
                            className="px-0 h-auto text-purple-400 hover:text-purple-400 hover:underline"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate(`/${orgId}${internalPath}`);
                            }}
                        >
                            {children}
                        </Button>
                    );
                }
                if (href && href.startsWith('#ticket-nav:')) {
                    const ticketId = href.replace('#ticket-nav:', '');
                    return (
                        <span
                            role="button"
                            tabIndex={0}
                            className="inline-flex items-center justify-center gap-1 bg-muted py-0.5 px-1.5 rounded-md hover:bg-muted/50 cursor-pointer border border-border text-[12px] text-muted-foreground font-mono"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openTicketModal(ticketId);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openTicketModal(ticketId);
                                }
                            }}
                        >
                            {ticketId}
                            <SquareArrowOutUpRight className="h-3 w-3 mb-0.5" />
                        </span>
                    );
                }
                return (
                    <a href={href} className="text-blue-500 hover:text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                        {children}
                    </a>
                );
            },
            blockquote: ({ children }: { children?: React.ReactNode }) => (
                <Card className="my-4 px-4 py-2 bg-muted border-l-4 border-primary">
                    {children}
                </Card>
            ),
            hr: () => <Separator className="my-4" />,
            table: ({ children }: { children?: React.ReactNode }) => (
                <MarkdownRendererTable getFontSize={getFontSize} breakAll={breakAll}>
                    {children}
                </MarkdownRendererTable>
            ),
            thead: ({ children }: { children?: React.ReactNode }) => (
                <thead style={{ fontSize: getFontSize(16) }} className={cn("bg-muted", breakAll && "break-all")}>
                    {children}
                </thead>
            ),
            tbody: ({ children }: { children?: React.ReactNode }) => (
                <tbody style={{ fontSize: getFontSize(16) }} className={cn("divide-y divide-border", breakAll && "break-all")}>
                    {children}
                </tbody>
            ),
            tr: ({ children }: { children?: React.ReactNode }) => <tr className={breakAll ? "break-all" : undefined}>{children}</tr>,
            th: ({ children }: { children?: React.ReactNode }) => (
                <th
                    style={{ fontSize: getFontSize(16) }}
                    className={cn("min-w-0 px-4 py-2 text-left", breakAll && "break-all")}
                >
                    {children}
                </th>
            ),
            td: ({ children }: { children?: React.ReactNode }) => (
                <td style={{ fontSize: getFontSize(16) }} className={cn("min-w-0 px-4 py-2", breakAll && "break-all")}>
                    {children}
                </td>
            ),
            img: ({ src, alt }: { src?: string; alt?: string }) => (
                <img src={src} alt={alt} className="max-w-full h-auto my-4 rounded-md" />
            ),
        }),
        [
            handleCopyCode,
            getFontSize,
            breakAll,
            orgId,
            navigate,
            openTicketModal,
            anchorHeadings,
            headingListForNav,
        ],
    );

    headingPtr.current = 0;

    if (isLoading) {
        return (
            <>
                <div className={cn("block w-full min-w-0", className)}>
                    <div
                        className={cn(
                            "flex min-h-[120px] w-full items-center justify-center",
                            contentClassName,
                        )}
                    >
                        <Spinner />
                    </div>
                </div>
                <TicketViewModal
                    open={ticketModalOpen}
                    onOpenChange={setTicketModalOpen}
                    orgId={orgId || ""}
                    ticketId={selectedTicketId}
                />
            </>
        );
    }

    return (
        <>
            <div className={cn("block w-full min-w-0", className)}>
                    <ReactMarkdown
                        remarkPlugins={remarkPlugins}
                        rehypePlugins={rehypePlugins}
                        components={markdownComponents}
                    >
                        {preprocessMarkdown(markdownContent)}
                    </ReactMarkdown>
                </div>
            <TicketViewModal
                open={ticketModalOpen}
                onOpenChange={setTicketModalOpen}
                orgId={orgId || ""}
                ticketId={selectedTicketId}
            />
        </>
    );
};

export default MarkdownRenderer;
