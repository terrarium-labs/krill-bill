import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import ChatInput from "@/app/chat/components/chat-input";
import { useState, useEffect, useRef, useCallback } from "react";
import React from "react";
import { useOrgMe } from "@/app/contexts/OrgMeContext";
import { useParams } from "react-router-dom";
import { getOrgThreads, postOrgThread, patchOrgThread, deleteOrgThread } from "@/api/orgs/threads/threads";
import { Thread } from "@/types/general/threads";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";
import { formatTime, formatDate } from "@/utils/miscelanea";
import { Loader2, Check } from "lucide-react";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AttachedFile } from "@/app/chat/components/chat-input";
import { FilePreview } from "@/app/components/files/components/file-preview";

/**
 * ThreadSection Component
 * 
 * A comprehensive thread messaging component with real-time updates, file attachments,
 * voice recording, and message editing capabilities. Displays messages in a Slack-like
 * format with left-aligned messages and avatars in the margin.
 * 
 * @example
 * ```tsx
 * // Basic usage with default settings
 * <ThreadSection entityId="customer-123" />
 * 
 * // With disabled editing and custom polling
 * <ThreadSection 
 *   entityId="customer-123" 
 *   edit={false}
 *   pollingInterval={3000}
 * />
 * 
 * // Disable polling, files, and voice recording
 * <ThreadSection 
 *   entityId="customer-123" 
 *   pollingInterval={-1}
 *   disableFiles={true}
 *   disableVoice={true}
 * />
 * ```
 * 
 * @param {string} entityId - The unique identifier of the entity (e.g., customer, ticket) to fetch threads for
 * @param {boolean} [edit=true] - Enable/disable message editing and deletion for own messages
 * @param {number} [pollingInterval=5000] - Interval in milliseconds to poll for new messages.
 *   Set to -1 to disable automatic polling. Recommended: 3000-10000ms for active chats,
 *   -1 for archived or read-only views
 * @param {boolean} [disableFiles=false] - Disable file attachment functionality
 * @param {boolean} [disableVoice=false] - Disable voice recording and speech-to-text functionality
 * @param {number} [maxFiles=5] - Maximum number of files that can be attached to a message
 * @param {number} [maxFileSize=10] - Maximum file size in MB for attachments
 * 
 * @features
 * - Real-time message polling (configurable or disabled)
 * - File attachments with preview
 * - Voice recording with speech-to-text transcription
 * - Inline message editing (for own messages)
 * - Message deletion with confirmation
 * - Date separators (Today, Yesterday, or full date)
 * - Message grouping by sender and date
 * - Infinite scroll with "Load more" for older messages
 * - Responsive design with mobile support
 * - Accessibility features (ARIA labels, keyboard navigation)
 */
interface ThreadSectionProps {
    entityId: string;
    edit?: boolean;
    pollingInterval?: number;
    disableFiles?: boolean;
    disableVoice?: boolean;
    maxFiles?: number;
    maxFileSize?: number;
}

const ThreadSection = ({
    entityId,
    edit = true,
    pollingInterval = 5000,
    disableFiles = false,
    disableVoice = false,
    maxFiles = 5,
    maxFileSize = 10
}: ThreadSectionProps) => {
    const { t } = useTranslation();
    const { me } = useOrgMe();
    const { orgId } = useParams<{ orgId: string }>();

    const [threads, setThreads] = useState<Thread[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const isInitialLoadRef = useRef(true);
    const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState<string>("");
    const editTextareaRef = useRef<HTMLTextAreaElement>(null);
    const [hoveredThreadId, setHoveredThreadId] = useState<string | null>(null);

    // Check if a date is today
    const isToday = (date: Date): boolean => {
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    // Check if a date is yesterday
    const isYesterday = (date: Date): boolean => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return (
            date.getDate() === yesterday.getDate() &&
            date.getMonth() === yesterday.getMonth() &&
            date.getFullYear() === yesterday.getFullYear()
        );
    };

    // Get date string key for grouping messages by date
    const getDateKey = (date: Date): string => {
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    };

    // Format date for separator display (Today, Yesterday, or full date)
    const formatDateSeparator = (date: Date): string => {
        if (isToday(date)) {
            return t('threads.today', 'Today');
        } else if (isYesterday(date)) {
            return t('threads.yesterday', 'Yesterday');
        } else {
            return formatDate(date.toISOString(), {
                showTime: false,
                showDay: true,
                showMonth: true,
                showYear: true
            });
        }
    };

    // Format message time - always show only time
    const formatMessageTime = (thread: Thread): string => {
        return formatTime(thread.created_at);
    };

    // Check if two dates are on the same day
    const isSameDay = (date1: Date, date2: Date): boolean => {
        return getDateKey(date1) === getDateKey(date2);
    };

    const fetchThreads = async (isInitial = false, scrollDown = false) => {
        if (!orgId || !entityId) return;

        // Only show loading state on initial load
        if (!isInitial) {
            setLoading(false);
        }

        try {
            const response = await getOrgThreads(orgId, entityId, undefined);
            if (response.success) {
                const threads = response.success.threads || [];
                // Sort threads by created_at in ascending order (oldest first)
                threads.sort((a: Thread, b: Thread) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                setThreads(threads);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                // Status 400 means thread hasn't been initialized yet (no messages)
                // Treat this as "no messages yet" state, not an error
                // Set empty threads array so it shows "No messages yet" message
                setThreads([]);
                setNextPageToken(null);
            }
        } catch (error) {
            // Only show error for actual exceptions, not 400 status responses
            setError(error as string);
        } finally {
            setLoading(false);

            // Scroll to bottom only on initial load, after everything is done
            if (isInitial || scrollDown) {
                setTimeout(() => {
                    const scrollContainer = scrollContainerRef.current;
                    if (scrollContainer) {
                        scrollContainer.scrollTop = scrollContainer.scrollHeight;
                        isInitialLoadRef.current = false;
                    }
                }, 100);
            }
        }
    };


    useEffect(() => {
        isInitialLoadRef.current = true;
        setLoading(true);
        fetchThreads(true);
    }, [orgId, entityId]);

    // Polling effect for real-time updates
    useEffect(() => {
        // Skip polling if disabled (pollingInterval === -1) or no entityId/orgId
        if (pollingInterval === -1 || !orgId || !entityId) return;

        const pollInterval = setInterval(() => {
            // Fetch threads without showing loading state
            fetchThreads(false, false);
        }, pollingInterval);

        return () => clearInterval(pollInterval);
    }, [pollingInterval, orgId, entityId]);

    // Load more threads (older messages)
    const loadMoreThreads = useCallback(async () => {
        if (!orgId || !entityId || !nextPageToken || isLoadingMore || loading) return;

        setIsLoadingMore(true);
        try {
            const response = await getOrgThreads(orgId, entityId, nextPageToken);
            if (response.success && response.success.threads) {
                // Prepend older threads to the beginning of the list and sort by created_at
                setThreads(prev => {
                    const newThreads = response.success.threads || [];
                    const combinedThreads = [...newThreads, ...prev];
                    // Sort threads by created_at in ascending order (oldest first)
                    combinedThreads.sort((a: Thread, b: Thread) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                    return combinedThreads;
                });
                setNextPageToken(response.success.next_page_token || null);
            } else {
                setError(response.error || "Error loading more threads");
            }
        } catch (error) {
            setError(error as string);
            console.error("Error loading more threads:", error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [orgId, entityId, nextPageToken, isLoadingMore, loading]);


    const handleSendMessage = async (
        message: string,
        files: AttachedFile[]
    ) => {
        if (!orgId || !entityId || (!message.trim() && files.length === 0)) return;

        try {
            const response = await postOrgThread(orgId, entityId, message.trim(), files.map(file => file.file));
            if (response.success || response === undefined) {
                // Refetch threads to get the new message
                fetchThreads(false, true);
            } else {
                // Error handling is done by laiaFetch (toast notification)
                console.error("Error sending message:", response.error);
            }
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const handleDeleteThread = async (threadId: string) => {
        if (!orgId) return;

        try {
            const response = await deleteOrgThread(orgId, threadId);
            if (response.success || response === undefined) {
                // Refetch threads without showing loader
                await fetchThreads(false);
            }
        } catch (error) {
            console.error("Error deleting thread:", error);
        }
    };

    const handleStartEdit = (thread: Thread) => {
        setEditingThreadId(thread.id);
        setEditContent(thread.content);
        // Focus textarea at the end after it's rendered
        setTimeout(() => {
            if (editTextareaRef.current) {
                editTextareaRef.current.focus();
                editTextareaRef.current.setSelectionRange(
                    editTextareaRef.current.value.length,
                    editTextareaRef.current.value.length
                );
            }
        }, 0);
    };

    const handleCancelEdit = () => {
        setEditingThreadId(null);
        setEditContent("");
    };

    const handleSaveEdit = async () => {
        if (!orgId || !editingThreadId || !editContent.trim()) return;

        try {
            const response = await patchOrgThread(orgId, editingThreadId, {
                content: editContent.trim(),
            });

            if (response.success) {
                setEditingThreadId(null);
                setEditContent("");
                // Refetch threads without showing loader
                await fetchThreads(false);
            }
        } catch (error) {
            console.error("Error updating thread:", error);
        }
    };

    const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSaveEdit();
        } else if (e.key === "Escape") {
            e.preventDefault();
            handleCancelEdit();
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col min-h-0">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center p-6">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
                    <div className="flex-1 flex items-center justify-center p-6">
                        <p className="text-sm text-destructive">
                            {error}
                        </p>
                    </div>
                ) : threads.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center p-6">
                        <p className="text-sm text-muted-foreground">
                            {t('threads.noMessages', 'No messages yet')}
                        </p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col relative min-h-0">
                        <div
                            ref={scrollContainerRef}
                            className="flex-1 overflow-y-auto relative pb-4"
                        >
                            {/* Load more button at the top */}
                            {nextPageToken && (
                                <div className="flex justify-center py-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={loadMoreThreads}
                                        disabled={isLoadingMore}
                                        className="text-xs"
                                    >
                                        {isLoadingMore ? (
                                            <>
                                                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                                {t('threads.loading', 'Loading...')}
                                            </>
                                        ) : (
                                            t('threads.loadMore', 'Load more messages')
                                        )}
                                    </Button>
                                </div>
                            )}
                            {threads.map((thread, index) => {
                                const isOwnMessage = me?.employee?.id === thread.employee.id;
                                const isEditing = editingThreadId === thread.id;
                                const isHovered = hoveredThreadId === thread.id;
                                const threadDate = new Date(thread.created_at);

                                // Check if we need to show a date separator
                                const showDateSeparator = index === 0 || !isSameDay(threadDate, new Date(threads[index - 1].created_at));

                                // Check if this is the first message in a consecutive chain from the same user
                                const prevThread = index > 0 ? threads[index - 1] : null;
                                const isFirstInChain = !prevThread || prevThread.employee.id !== thread.employee.id || !isSameDay(threadDate, new Date(prevThread.created_at));

                                // All messages left-aligned, avatar/time only on first message of chain
                                const isEdited = new Date(thread.updated_at).getTime() !== new Date(thread.created_at).getTime();
                                return (
                                    <div key={thread.id} className="w-full">
                                        {showDateSeparator && (
                                            <div className="flex items-center justify-center py-2">
                                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50">
                                                    <span className="text-xs font-medium text-foreground">
                                                        {formatDateSeparator(threadDate)}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        <div
                                            className={cn(
                                                "flex w-full rounded-md transition-colors px-2 py-1",
                                                edit && isHovered && "bg-muted/50",
                                                isFirstInChain && index > 0 && !showDateSeparator ? "mt-2" : !isFirstInChain && "mt-0"
                                            )}
                                            onMouseEnter={edit ? () => setHoveredThreadId(thread.id) : undefined}
                                            onMouseLeave={edit ? () => setHoveredThreadId(null) : undefined}
                                        >
                                            {/* Avatar column */}
                                            <div className="shrink-0 min-w-10 max-w-10 flex items-start justify-cente">
                                                {isFirstInChain ? (
                                                    <EmployeeAvatar
                                                        employee={thread.employee}
                                                        size="md"
                                                        showName={false}
                                                    />
                                                ) : (
                                                    isHovered && (
                                                        <span className="text-xs text-muted-foreground transition-opacity whitespace-nowrap pt-0.5">
                                                            {formatMessageTime(thread)}
                                                        </span>
                                                    )
                                                )}
                                            </div>

                                            {/* Content column with actions */}
                                            <div className="flex-1 min-w-0 flex items-start">
                                                <div className="flex-1 min-w-0">
                                                    {isFirstInChain && (
                                                        <div className="flex items-center gap-2 h-5 mb-0.5">
                                                            <span className="text-sm font-semibold text-foreground leading-5">
                                                                {thread.employee.first_name} {thread.employee.last_name}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground leading-5">
                                                                {formatMessageTime(thread)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {isEditing ? (
                                                        <Textarea
                                                            ref={editTextareaRef}
                                                            value={editContent}
                                                            onChange={(e) => setEditContent(e.target.value)}
                                                            onKeyDown={handleEditKeyDown}
                                                            className="min-h-[60px] resize-none text-sm"
                                                            rows={3}
                                                        />
                                                    ) : (
                                                        <>
                                                            <div className="text-sm text-foreground break-words leading-5 min-h-5">
                                                                {thread.content}
                                                            </div>
                                                            {thread.files && thread.files.length > 0 && (
                                                                <FilePreview files={thread.files} variant="message" />
                                                            )}
                                                            {isEdited && (
                                                                <span className="text-xs text-muted-foreground italic">
                                                                    (edited)
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                                {/* Actions to the right */}
                                                {isOwnMessage && edit && (
                                                    <div className="shrink-0 h-5 flex items-center pl-2">
                                                        {isEditing ? (
                                                            <div onClick={(e) => e.stopPropagation()}>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={handleSaveEdit}
                                                                    className="h-7 w-7 p-0"
                                                                >
                                                                    <Check className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <div
                                                                onClick={(e) => e.stopPropagation()}
                                                                className={cn(
                                                                    "transition-all duration-200 ease-in-out",
                                                                    isHovered
                                                                        ? "opacity-100"
                                                                        : "opacity-0 pointer-events-none"
                                                                )}
                                                            >
                                                                <CustomActionsDropdown
                                                                    className="h-4! w-4!"
                                                                    items={[
                                                                        {
                                                                            label: t('common.edit', 'Edit'),
                                                                            icon: 'edit',
                                                                            onClick: () => handleStartEdit(thread),
                                                                        },
                                                                        {
                                                                            label: t('common.delete', 'Delete'),
                                                                            icon: 'trash-2',
                                                                            onClick: () => handleDeleteThread(thread.id),
                                                                            variant: 'destructive',
                                                                        },
                                                                    ]}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div className="shrink-0">
                <ChatInput
                    className="pb-4 px-0"
                    onSendMessage={(message, files) => handleSendMessage(message, files ?? [])}
                    placeholder={t('threads.messagePlaceholder', 'Type a message...')}
                    showAttachButton={!disableFiles}
                    showVoiceButton={!disableVoice}
                    maxFiles={maxFiles}
                    maxFileSize={maxFileSize}
                />
            </div>
        </div>
    );
};

export default ThreadSection;