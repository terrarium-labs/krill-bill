import {
    EventItemThinking,
    EventItemThinkingDelta,
    EventText,
    EventTextDelta,
    EventToolUse,
    EventToolUseDelta,
    EventCustom,
    EventContentBlockStop
} from "./delta";

/**
 * Base interface for all timbal events yielded during flow execution.
 */
export interface BaseEvent {
    type: string;
    /** The id of the run this event was emitted from */
    run_id: string;
    /** The id of the parent run (if any) */
    parent_run_id: string | null;
    /** The path of the element that yielded this event */
    path: string;
    /** The id of the single execution in a run */
    call_id: string;
    /** The id of the parent call if this event comes from a nested runnable */
    parent_call_id: string | null;
}

/**
 * Event emitted when a step starts execution.
 */
export interface StartEvent extends BaseEvent {
    type: "START";
    /** 
     * Optional user-facing text describing the action the step is performing.
     * Intended for display in UIs to show agent activity, e.g., 
     * "Thinking...", "Searching the web...", "Running tool: get_weather".
     */
    status_text: string | null;
}

/**
 * Event emitted for delta updates during streaming.
 */
export interface DeltaEvent extends BaseEvent {
    type: "DELTA";
    item: EventItemThinking | EventItemThinkingDelta | EventText | EventTextDelta | EventToolUse | EventToolUseDelta | EventCustom | EventContentBlockStop;
}

/**
 * Run status type
 */
export type RunStatus = "success" | "error" | "running" | "pending" | "cancelled";

/**
 * Event emitted when a step completes with its full output.
 */
export interface OutputEvent extends BaseEvent {
    type: "OUTPUT";
    /** The input arguments passed to the runnable */
    input: any;
    /** The status summary of the runnable after it completed */
    status: RunStatus;
    /** The result of the runnable */
    output: any;
    /** The error that occurred during the runnable */
    error: any;
    /** The start time of the runnable in milliseconds */
    t0: number;
    /** The end time of the runnable in milliseconds */
    t1: number;
    /** The usage of the runnable */
    usage: Record<string, number>;
    /** Additional metadata about the runnable */
    metadata: Record<string, any>;
}

// ============================================================================
// Content Types for Chat Messages
// ============================================================================

/**
 * Base interface for all content types in chat messages.
 */
export interface BaseContent {
    type: string;
}

/**
 * Text content type for chat messages.
 */
export interface TextContent extends BaseContent {
    type: "text";
    text: string;
    id?: string;
}

/**
 * Thinking content type for chat messages.
 */
export interface ThinkingContent extends BaseContent {
    type: "thinking";
    thinking: string;
    /** TODO: Review openai */
    signature?: string | null;
    /** Start time in milliseconds */
    start_time?: number;
    /** End time in milliseconds */
    end_time?: number;
    id?: string;
}

/**
 * File content type for chat messages.
 */
export interface FileContent extends BaseContent {
    type: "file";
    file: string;
}

/**
 * Custom content type for chat messages.
 */
export interface CustomContent extends BaseContent {
    type: "custom";
    value: Record<string, any>;
}

/**
 * Tool result content type for chat messages.
 */
export interface ToolResultContent extends BaseContent {
    type: "tool_result";
    id: string;
    content: (TextContent | FileContent)[];
}

/**
 * Tool use content type for chat messages.
 */
export interface ToolUseContent extends BaseContent {
    type: "tool_use";
    id: string;
    name: string;
    input: string;
    is_server_tool_use: boolean;
    /** Start time in milliseconds */
    start_time?: number;
    /** End time in milliseconds */
    end_time?: number;
}

/**
 * Union type of all possible content types.
 */
export type Content =
    | TextContent
    | ThinkingContent
    | FileContent
    | CustomContent
    | ToolResultContent
    | ToolUseContent;

/**
 * Error information in a message
 */
export interface MessageError {
    type?: string;
    message?: string;
    traceback?: string;
}

/**
 * Chat message with role and structured content.
 */
export interface Message {
    role: string;
    content: Content[];
    error?: MessageError;
    run_id?: string;
}
