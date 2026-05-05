import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { X, ArrowDown, Plus, History, ClipboardList, Cake, Clock, BrainCircuit, AudioLines } from "lucide-react"
import { useChatContext } from "./context/ChatContext"
import ChatInput from "./components/chat-input"
import { useTranslation } from "react-i18next"
import Message from "./components/Message"
import { useState, useRef, useEffect, useCallback } from "react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { CharlesChatEmptyAura } from "./components/charles-chat-empty-aura"
import VoiceMode from "./components/VoiceMode"
import { cn } from "@/lib/utils"

interface ChatPanelProps {
    fullscreen?: boolean;
    className?: string;
    /** Hide inline title/toolbar when chrome is rendered outside the panel. */
    hideToolbar?: boolean;
}

export default function ChatPanel({ fullscreen = false, className, hideToolbar = false }: ChatPanelProps) {
    const { t } = useTranslation()
    const { toggleChat, messagesList, setMessagesList, setChatRunning, handleSendMessage, setAgentMode, agentMode } = useChatContext()

    // ============================================================================
    // AUTO-SCROLL SYSTEM
    // ============================================================================
    // This system manages automatic scrolling behavior in the chat:
    // - Auto-scrolls to bottom when new messages arrive (if user hasn't scrolled up)
    // - Shows a "scroll to bottom" button when user scrolls away from bottom
    // - Detects user scroll intent via wheel/touch to immediately pause auto-scroll
    // ============================================================================

    // Reference to the invisible element at the end of messages (scroll target)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Reference to the scrollable container
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    // Controls whether we should auto-scroll on new messages
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

    // Controls visibility of the "scroll to bottom" button
    const [showScrollButton, setShowScrollButton] = useState(false)

    // Tracks if the scroll container has been scrolled (for conditional header border)
    const [isScrolled, setIsScrolled] = useState(false)

    // Voice mode state
    const [voiceModeOpen, setVoiceModeOpen] = useState(false)

    // Track the last scroll position to detect scroll direction
    const lastScrollTopRef = useRef(0)

    // Ref to track auto-scroll state without causing re-renders (used in event handlers)
    const autoScrollRef = useRef(true)

    // Ref to track button visibility without causing re-renders (used in event handlers)
    const buttonVisibleRef = useRef(false)

    // Timer for debouncing state updates to prevent flickering
    const stateUpdateTimerRef = useRef<NodeJS.Timeout | null>(null)

    // Flag to track if user is actively interacting (prevents auto-scroll interference)
    const userInteractingRef = useRef(false)

    // Timer to reset user interaction flag
    const interactionTimerRef = useRef<NodeJS.Timeout | null>(null)

    // Keep refs in sync with state (refs are used in event handlers for instant access)
    useEffect(() => {
        autoScrollRef.current = shouldAutoScroll
    }, [shouldAutoScroll])

    useEffect(() => {
        buttonVisibleRef.current = showScrollButton
    }, [showScrollButton])

    /**
     * Checks if the scroll container has scrollable content
     * Returns false if content fits within the viewport
     */
    const hasScrollableContent = useCallback(() => {
        const element = scrollContainerRef.current
        if (!element) return false
        return element.scrollHeight > element.clientHeight
    }, [])

    /**
     * Checks if the user is at the bottom of the scroll container
     * @param threshold - Distance from bottom (in px) that still counts as "at bottom"
     */
    const isAtBottom = useCallback((threshold = 100) => {
        const element = scrollContainerRef.current
        if (!element) return true
        const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight
        return distanceFromBottom < threshold
    }, [])

    /**
     * Disables auto-scroll and shows the scroll button
     * Uses refs for immediate effect and debounced state updates to prevent flickering
     */
    const pauseAutoScroll = useCallback(() => {
        // Immediately update refs (no re-render, instant effect)
        autoScrollRef.current = false
        buttonVisibleRef.current = true
        userInteractingRef.current = true

        // Clear any pending state update to prevent race conditions
        if (stateUpdateTimerRef.current) {
            clearTimeout(stateUpdateTimerRef.current)
        }

        // Clear interaction timer
        if (interactionTimerRef.current) {
            clearTimeout(interactionTimerRef.current)
        }

        // Debounced state update - batches rapid changes into single update
        stateUpdateTimerRef.current = setTimeout(() => {
            setShouldAutoScroll(false)
            setShowScrollButton(true)
        }, 16) // ~1 frame at 60fps for smooth visual update

        // Reset interaction flag after user stops interacting
        interactionTimerRef.current = setTimeout(() => {
            userInteractingRef.current = false
        }, 150)
    }, [])

    /**
     * Re-enables auto-scroll and hides the scroll button
     * Only triggers if user is not actively interacting
     */
    const resumeAutoScroll = useCallback(() => {
        // Don't resume if user is actively interacting
        if (userInteractingRef.current) return

        // Clear any pending state update
        if (stateUpdateTimerRef.current) {
            clearTimeout(stateUpdateTimerRef.current)
        }

        // Debounced state update with slightly longer delay for smoother transition
        stateUpdateTimerRef.current = setTimeout(() => {
            // Double-check we're still at bottom before resuming
            if (isAtBottom(150)) {
                autoScrollRef.current = true
                buttonVisibleRef.current = false
                setShouldAutoScroll(true)
                setShowScrollButton(false)
            }
        }, 100)
    }, [isAtBottom])

    /**
     * Handles scroll events on the container
     * Detects scroll direction and updates auto-scroll state accordingly
     */
    const handleScroll = useCallback(() => {
        const element = scrollContainerRef.current
        if (!element) return

        const currentScrollTop = element.scrollTop
        const previousScrollTop = lastScrollTopRef.current

        setIsScrolled(currentScrollTop > 0)

        // Skip if no scrollable content
        if (!hasScrollableContent()) {
            lastScrollTopRef.current = currentScrollTop
            return
        }

        // Detect scroll direction
        const isScrollingUp = currentScrollTop < previousScrollTop - 2 // 2px threshold for noise
        const atBottom = isAtBottom(150)

        if (isScrollingUp && currentScrollTop > 0) {
            // User is scrolling up - pause auto-scroll
            pauseAutoScroll()
        } else if (atBottom && !userInteractingRef.current) {
            // User reached bottom and not actively interacting - resume auto-scroll
            resumeAutoScroll()
        }

        // Update last scroll position
        lastScrollTopRef.current = currentScrollTop
    }, [hasScrollableContent, isAtBottom, pauseAutoScroll, resumeAutoScroll])

    /**
     * Scrolls to the bottom of the container using scrollTop
     * Uses instant scroll for auto-scroll (during streaming) and smooth for manual clicks
     * @param smooth - Whether to use smooth scrolling animation
     */
    const scrollToBottomInternal = useCallback((smooth: boolean = false) => {
        const element = scrollContainerRef.current
        if (!element) return

        // Calculate target scroll position (with small padding to prevent edge jitter)
        const targetScroll = element.scrollHeight - element.clientHeight

        if (smooth) {
            // Smooth scroll for manual button clicks
            element.scrollTo({
                top: targetScroll,
                behavior: "smooth"
            })
        } else {
            // Instant scroll for auto-scroll during streaming
            // This prevents the up-and-down jitter when chunks arrive rapidly
            element.scrollTop = targetScroll
        }
    }, [])

    /**
     * Manually scrolls to the bottom and re-enables auto-scroll
     * Called when user clicks the scroll-to-bottom button
     */
    const scrollToBottom = useCallback(() => {
        // Clear any pending timers
        if (stateUpdateTimerRef.current) {
            clearTimeout(stateUpdateTimerRef.current)
        }
        if (interactionTimerRef.current) {
            clearTimeout(interactionTimerRef.current)
        }

        // Reset interaction state
        userInteractingRef.current = false

        // Update state immediately for responsive feel
        autoScrollRef.current = true
        buttonVisibleRef.current = false
        setShouldAutoScroll(true)
        setShowScrollButton(false)

        // Smooth scroll to bottom (user-initiated, so use smooth animation)
        scrollToBottomInternal(true)
    }, [scrollToBottomInternal])

    /**
     * Auto-scroll effect - triggers when messages change
     * Only scrolls if auto-scroll is enabled and user isn't interacting
     * Uses instant scroll (no animation) to prevent jitter during streaming
     */
    useEffect(() => {
        if (shouldAutoScroll && !userInteractingRef.current) {
            // Use requestAnimationFrame to sync with browser render cycle
            // This ensures the DOM has updated before we calculate scroll position
            requestAnimationFrame(() => {
                // Use instant scroll to prevent up-and-down jitter during streaming
                scrollToBottomInternal(false)
            })
        }
    }, [messagesList, shouldAutoScroll, scrollToBottomInternal])

    /**
     * Early detection of user scroll intent via wheel/touch events
     * This allows us to pause auto-scroll BEFORE the scroll event fires
     */
    useEffect(() => {
        const element = scrollContainerRef.current
        if (!element) return

        /**
         * Handles mouse wheel events
         * Detects upward scroll intent and pauses auto-scroll immediately
         */
        const handleWheel = (e: WheelEvent) => {
            // Only react if there's scrollable content and we're not at top
            if (!hasScrollableContent() || element.scrollTop === 0) return

            // User scrolling up (negative deltaY) - pause auto-scroll
            if (e.deltaY < 0) {
                pauseAutoScroll()
            }
        }

        // Touch handling variables
        let touchStartY = 0

        /**
         * Records touch start position for gesture detection
         */
        const handleTouchStart = (e: TouchEvent) => {
            touchStartY = e.touches[0].clientY
        }

        /**
         * Handles touch move events
         * Detects upward scroll gesture and pauses auto-scroll
         */
        const handleTouchMove = (e: TouchEvent) => {
            // Only react if there's scrollable content and we're not at top
            if (!hasScrollableContent() || element.scrollTop === 0) return

            const touchY = e.touches[0].clientY
            const deltaY = touchY - touchStartY

            // Positive delta = finger moving down = content scrolling up
            // Use threshold to prevent accidental triggers
            if (deltaY > 10) {
                pauseAutoScroll()
            }
        }

        // Add event listeners with passive flag for better scroll performance
        element.addEventListener('wheel', handleWheel, { passive: true })
        element.addEventListener('touchstart', handleTouchStart, { passive: true })
        element.addEventListener('touchmove', handleTouchMove, { passive: true })

        // Cleanup function
        return () => {
            element.removeEventListener('wheel', handleWheel)
            element.removeEventListener('touchstart', handleTouchStart)
            element.removeEventListener('touchmove', handleTouchMove)

            // Clear all timers on unmount
            if (stateUpdateTimerRef.current) {
                clearTimeout(stateUpdateTimerRef.current)
            }
            if (interactionTimerRef.current) {
                clearTimeout(interactionTimerRef.current)
            }
        }
    }, [hasScrollableContent, pauseAutoScroll])

    return (
        <div className={cn("h-full flex flex-col bg-background relative", className)}>
            {/* Header - hidden in fullscreen (sidebar handles navigation) */}
            {!fullscreen && !hideToolbar && (
                <div className="flex justify-between p-4">
                    <div className="flex items-center gap-2">
                        <Label className="text-lg font-bold">Charles</Label>
                    </div>
                    <div className="flex items-center">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => {
                                    setAgentMode(!agentMode)
                                    setChatRunning(false)
                                }}>
                                    <BrainCircuit className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <p>{t("chat.actions.agentMode", "Agent mode")}</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => {
                                    setMessagesList([])
                                    setChatRunning(false)
                                }}>
                                    <History className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <p>{t("chat.actions.chatHistory", "Chat history")}</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => {
                                    setMessagesList([])
                                    setChatRunning(false)
                                }}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <p>{t("chat.actions.newChat", "New chat")}</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={toggleChat}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <p>{t("chat.actions.closeChat", "Close chat")}</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            )}

            {/* Fullscreen header - minimal, with agent mode toggle */}
            {fullscreen && (
                <div className={`flex justify-center p-3 w-full transition-colors ${isScrolled ? "border-b" : ""}`}>
                    <div className="flex items-center gap-2 w-full justify-between">
                        <Label className="text-lg font-bold">Charles</Label>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setVoiceModeOpen(true)}>
                                    <AudioLines className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <p>{t("chat.actions.voiceMode", "Voice mode")}</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            )}

            {/* Chat messages area */}
            <div
                ref={scrollContainerRef}
                className="overflow-y-auto h-full"
                onScroll={handleScroll}
            >
                {messagesList.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <div className={`flex items-center justify-center space-y-4 flex-col px-4 ${fullscreen ? "max-w-lg" : "max-w-sm"}`}>
                            <CharlesChatEmptyAura fullscreen={fullscreen} />
                            <p className="text-center text-sm">{t("chat.noMessagesDescription", "Start a conversation with Charles")}</p>
                            <div className="flex w-full flex-col gap-1.5">
                                {[
                                    {
                                        icon: ClipboardList,
                                        label: t("chat.openers.pendingWorkOrders", "¿Qué órdenes de trabajo tengo pendientes?"),
                                        message: t("chat.openers.pendingWorkOrdersMessage", "¿Qué órdenes de trabajo tengo pendientes de cerrar?"),
                                    },
                                    {
                                        icon: Cake,
                                        label: t("chat.openers.teamBirthdays", "¿Quién cumple años esta semana?"),
                                        message: t("chat.openers.teamBirthdaysMessage", "¿Quién cumple años esta semana en el equipo?"),
                                    },
                                    {
                                        icon: Clock,
                                        label: t("chat.openers.hoursLogged", "¿Cuántas horas llevo registradas esta semana?"),
                                        message: t("chat.openers.hoursLoggedMessage", "¿Cuántas horas he registrado esta semana?"),
                                    },
                                ].map((opener) => (
                                    <button
                                        key={opener.message}
                                        type="button"
                                        onClick={() => handleSendMessage(opener.message)}
                                        className="flex w-full items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-left text-xs leading-snug text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                    >
                                        <opener.icon className="size-3.5 shrink-0" />
                                        <span className="min-w-0">{opener.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={`flex flex-col gap-4 p-4 ${fullscreen ? "max-w-3xl mx-auto w-full" : ""}`}>
                        {messagesList.map((message, index) => (
                            <Message key={index} message={message} />
                        ))}
                        <div ref={messagesEndRef} className="h-1 shrink-0" aria-hidden="true" />
                    </div>
                )}
            </div>

            {/* Scroll to bottom button */}
            {
                showScrollButton && messagesList.length > 0 && (
                    <div className="absolute bottom-30 left-1/2 transform -translate-x-1/2 z-10 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <Button
                            size="icon"
                            className="rounded-full shadow-lg hover:scale-110 transition-transform h-7 w-7"
                            onClick={scrollToBottom}
                            title="Scroll to bottom"
                        >
                            <ArrowDown className="h-4 w-4" />
                        </Button>
                    </div>
                )
            }

            {/* Chat input at the bottom */}
            <div className={fullscreen ? "max-w-3xl mx-auto w-full pb-4" : ""}>
                <ChatInput
                    autoFocus
                    placeholder={t("chat.placeholders.message", "Ask anything to Charles...")}
                    onSendMessage={handleSendMessage}
                    onVoiceModeClick={() => setVoiceModeOpen(true)}
                />
            </div>

            {/* Voice mode overlay */}
            <VoiceMode
                open={voiceModeOpen}
                onClose={() => setVoiceModeOpen(false)}
            />
        </div >
    )
} 