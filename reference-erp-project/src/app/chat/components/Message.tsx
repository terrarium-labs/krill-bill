import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import MarkdownRenderer from "@/app/components/MarkdownRenderer";
import { getFileIcon, getColorByExtension, getColorClasses } from "@/utils/miscelanea";
import TextShimmer from "@/components/TextShimmer";
import { Content, ToolUseContent, Message as MessageType } from "@/types/chat/chat";
import ToolBlock from "./ToolBlock";
import WebSearchSources, { WebSearchResult } from "./WebSearchSources";
import { getToolIcon, isSkillTool, extractSkillName, getSkillIcon, getSkillColor } from "../utils/tool-meta";
import { ChevronRight } from "lucide-react";
import { CharlesAuraCircle } from "@/app/chat/components/charles-chat-empty-aura";
import { cn } from "@/lib/utils";

type ContentGroup =
    | { kind: "single"; item: Content; index: number }
    | { kind: "tool_group"; items: { item: ToolUseContent; index: number }[] };

const Message = ({ message }: { message: MessageType }) => {
    const [expandedImage, setExpandedImage] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { t } = useTranslation();

    // Generate stable checksum from string (using last 25 chars max)
    const generateChecksum = (str?: string) => {
        if (!str) return '0';
        const useStr = str.length > 25 ? str.slice(-25) : str;
        let hash = 0;
        for (let i = 0; i < useStr.length; i++) {
            const char = useStr.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    };

    // Helper functions to check content type
    const isImage = (item: Content) => {
        return item.type === 'file' && item.file && (
            item.file.startsWith('data:image/') ||
            item.file.match(/^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i)
        );
    };

    const isFile = (item: Content) => {
        return item.type === 'file' && !isImage(item);
    };

    const isText = (item: Content) => {
        return item.type === 'text' && item.text && item.text.length > 0;
    };

    const isTool = (item: Content) => {
        return item.type === 'tool_use' && item.input !== undefined && item.input !== null;
    };

    const isThinking = (item: Content) => {
        return item.type === 'thinking' && item.thinking && item.thinking.length > 0;
    }

    const handleImageClick = (imageUrl: string) => {
        setExpandedImage(imageUrl);
        setIsModalOpen(true);
    };

    const handleFileClick = (fileUrl: string) => {
        window.open(fileUrl, '_blank');
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setExpandedImage(null);
    };

    // Render individual content item based on its type
    const renderContentItem = (item: Content, index: number) => {
        // Render image
        if (isImage(item) && 'file' in item && item.file) {
            return (
                <div key={`image-${index}-${generateChecksum(item.file as string)}`} className="mb-2 w-64 h-64">
                    <div
                        className="w-full h-full relative overflow-hidden rounded-lg cursor-pointer"
                        onClick={() => handleImageClick(item.file)}
                    >
                        <img
                            src={item.file as string}
                            alt="Attached file"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            );
        }

        // Render regular file
        if (isFile(item) && 'file' in item && item.file) {
            return (
                <div key={`file-${index}-${generateChecksum(item.file as string)}`} className="mb-2 w-full flex justify-end">
                    <div
                        onClick={() => handleFileClick(item.file as string)}
                        className="w-64 h-14 rounded-lg flex items-center justify-start border border-border bg-muted/50 p-2 gap-2 cursor-pointer hover:bg-muted transition-all duration-200"
                    >
                        <Icon
                            icon={getFileIcon((item.file as string).split('/').pop() || '')}
                            className={`text-lg min-w-6 min-h-6 w-6 h-6 ${getColorByExtension((item.file as string).split('/').pop() || '')}`}
                        />
                        <p className="text-xs mt-1 text-center w-30 truncate">{(item.file as string).split('/').pop() || ''}</p>
                    </div>
                </div>
            );
        }

        // Render tool use (generic for all tools)
        if (isTool(item) && item.type === 'tool_use') {
            return (
                <ToolBlock
                    item={item}
                    index={index}
                    generateChecksum={generateChecksum}
                />
            );
        }

        if (isThinking(item) && item.type === 'thinking') {
            // Use stable key based on index only to prevent accordion from losing state
            const stableKey = `thinking-${index}`;
            return (
                <div key={stableKey} className="w-full py-1">
                    <div className="flex flex-col gap-1 ml-2">
                        <Accordion type="single" collapsible className="p-0 m-0">
                            <AccordionItem value="thinking-content" className="border-none">
                                <AccordionTrigger className="text-xs p-0 m-0 hover:no-underline [&>svg]:hidden group">
                                    <div className="group/thinking flex items-center gap-1">
                                        <CharlesAuraCircle className="size-4 ring-1 min-h-0" />
                                        <p className="text-xs font-normal">
                                            {t("chat.thought")}
                                        </p>
                                        <ChevronRight className="font-normal size-4 opacity-0 transition-all duration-200 group-hover/thinking:opacity-50 group-data-[state=open]:rotate-90 group-data-[state=open]:opacity-50" />
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="text-xs pt-2 opacity-70">
                                    <MarkdownRenderer
                                        content={item.thinking}
                                        breakAll={false}
                                        textSizeMultiplier={0.75}
                                    />
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </div>
            );
        }

        // Render text
        if (isText(item) && item.type === 'text') {
            return (
                <div key={`text-${index}`} className="flex flex-col">
                    <Card
                        className={`gap-0 py-0.5 rounded-xl border-none w-full ${message.role === 'user' ? 'ml-auto px-4 bg-foreground/5 w-fit' : 'mr-auto px-2 bg-transparent w-full'} shadow-none`}
                    >
                        <MarkdownRenderer
                            content={item.text}
                            breakAll={false}
                            textSizeMultiplier={0.9}
                        />
                    </Card>
                </div>
            );
        }

        return null;
    };

    const groupContent = (content: Content[]): ContentGroup[] => {
        const groups: ContentGroup[] = [];
        let toolBuffer: { item: ToolUseContent; index: number }[] = [];

        const flushTools = () => {
            if (toolBuffer.length === 0) return;
            if (toolBuffer.length === 1) {
                groups.push({ kind: "single", item: toolBuffer[0].item, index: toolBuffer[0].index });
            } else {
                groups.push({ kind: "tool_group", items: [...toolBuffer] });
            }
            toolBuffer = [];
        };

        content.forEach((item, index) => {
            if (isTool(item) && item.type === "tool_use") {
                toolBuffer.push({ item: item as ToolUseContent, index });
            } else {
                flushTools();
                groups.push({ kind: "single", item, index });
            }
        });
        flushTools();
        return groups;
    };

    const MAX_VISIBLE_ICONS = 3;

    const getGroupIcon = (item: ToolUseContent) => {
        if (isSkillTool(item.name)) {
            return getSkillIcon(extractSkillName(item.input));
        }
        return getToolIcon(item.name);
    };

    const renderToolGroup = (group: { items: { item: ToolUseContent; index: number }[] }) => {
        const key = `tool-group-${group.items[0].index}`;
        const skills = group.items.filter(({ item }) => isSkillTool(item.name));
        const tools = group.items.filter(({ item }) => !isSkillTool(item.name));
        const visibleIcons = group.items.slice(0, MAX_VISIBLE_ICONS);
        const overflow = group.items.length - MAX_VISIBLE_ICONS;

        const labelParts: string[] = [];
        if (tools.length > 0) labelParts.push(`${tools.length} ${t("chat.tools_used", "tools used")}`);
        if (skills.length > 0) labelParts.push(`${skills.length} ${t("chat.skills_read", "skills read")}`);

        return (
            <div key={key} className="w-full py-1">
                <div className="flex flex-col gap-1 ml-2">
                    <Accordion type="single" collapsible className="p-0 m-0 group">
                        <AccordionItem value="tools-content" className="border-none">
                            <AccordionTrigger className="text-xs p-0 m-0 hover:no-underline [&>svg]:hidden group">
                                <div className="flex items-center gap-1.5">
                                    <div className="flex -space-x-1.5">
                                        {visibleIcons.map(({ item, index }) => {
                                            return (
                                                <div
                                                    key={`icon-${index}`}
                                                    className={
                                                        cn("w-5 h-5 rounded-full border border-border bg-background flex items-center justify-center",
                                                            isSkillTool(item.name) ? getColorClasses(getSkillColor(extractSkillName(item.input))) : '',
                                                        )}
                                                >
                                                    <Icon
                                                        icon={getGroupIcon(item)}
                                                        className={`size-3.5`}
                                                    />
                                                </div>
                                            );
                                        })}
                                        {overflow > 0 && (
                                            <div className="w-5 h-5 rounded-full border border-border bg-background flex items-center justify-center">
                                                <span className="text-[9px] leading-none">+{overflow}</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs font-normal">
                                        {labelParts.join(", ")}
                                    </p>
                                    <ChevronRight className="font-normal opacity-0 size-4 group-data-[state=open]:rotate-90 group-data-[state=open]:opacity-50 transition-all duration-200 group-hover:opacity-50" />
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-1 pb-0">
                                {group.items.map(({ item, index }) => (
                                    <ToolBlock
                                        key={`tool-${item.name}-${index}-${item.id || ""}`}
                                        item={item}
                                        index={index}
                                        generateChecksum={generateChecksum}
                                    />
                                ))}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </div>
        );
    };

    const contentGroups = groupContent(message.content || []);

    const webSearchResults: WebSearchResult[] = message.content
        ?.filter(
            (item): item is import("@/types/chat/chat").CustomContent =>
                item.type === "custom" &&
                "value" in item &&
                item.value?.type === "web_search_tool_result"
        )
        .flatMap((item) =>
            (item.value.content || [])
                .filter((r: any) => r.type === "web_search_result" && r.title && r.url)
                .map((r: any) => ({
                    title: r.title,
                    url: r.url,
                    page_age: r.page_age,
                    type: r.type,
                }))
        ) ?? [];

    // Check if content is empty or has no displayable items
    const hasDisplayableContent = message.content && message.content.length > 0 &&
        message.content.some(item =>
            isImage(item) || isFile(item) || isText(item) ||
            isTool(item) || isThinking(item)
        );

    return (
        <div className="flex flex-col w-full">
            {/* Show error box if error exists */}
            {message.error && (
                <Card className="bg-destructive/10 border-destructive/50 border shadow-none rounded-xl p-2 mb-2">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <Icon icon="lucide:alert-circle" className="text-destructive text-lg min-w-4 min-h-4 max-w-4 max-h-4" />
                            <p className="text-sm font-semibold text-destructive">
                                {message.error.type || 'Error'}
                            </p>
                        </div>
                        {message.error.message && (
                            <p className="text-xs text-destructive/80 font-medium">
                                {message.error.message}
                            </p>
                        )}
                        {message.error.traceback && (
                            <Accordion type="single" collapsible className="p-0 m-0">
                                <AccordionItem value="traceback" className="border-none">
                                    <AccordionTrigger className="text-xs p-0 m-0 hover:no-underline">
                                        <div className="flex items-center gap-2 text-destructive">
                                            <Icon icon="lucide:code" className="text-lg min-w-4 min-h-4 max-w-4 max-h-4" />
                                            <p className="text-xs font-normal">
                                                {t("chat.traceback") || "Traceback"}
                                            </p>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <pre className="text-[12px] font-mono bg-destructive/5 rounded-lg p-2 overflow-x-auto text-destructive whitespace-pre-wrap">
                                            {message.error.traceback}
                                        </pre>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        )}
                    </div>
                </Card>
            )}

            {/* Only show loading/content if there's no error */}
            {!message.error && (
                <>
                    {!hasDisplayableContent && message.role === 'assistant' && (
                        <div className="flex items-center gap-1">
                            <CharlesAuraCircle className="size-4 ring-1 min-h-0" />
                            <TextShimmer shimmer={true} className="text-xs font-normal">
                                {t("chat.thought.planning_next_moves", "Planning next moves...")}
                            </TextShimmer>
                            <ChevronRight className="font-normal opacity-0 size-4 group-data-[state=open]:rotate-90 group-data-[state=open]:opacity-50 transition-all duration-200 group-hover:opacity-50" />
                        </div>
                    )}

                    {contentGroups.map((group) =>
                        group.kind === "tool_group"
                            ? renderToolGroup(group)
                            : renderContentItem(group.item, group.index)
                    )}

                    {webSearchResults.length > 0 && (
                        <WebSearchSources results={webSearchResults} />
                    )}
                </>
            )}

            {/* Image modal */}
            <Dialog open={isModalOpen} onOpenChange={closeModal}>
                <DialogContent className="max-w-5xl">
                    {expandedImage && (
                        <img
                            src={expandedImage}
                            className="w-full h-full object-contain max-h-[80vh]"
                            alt="Expanded view"
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Message;
