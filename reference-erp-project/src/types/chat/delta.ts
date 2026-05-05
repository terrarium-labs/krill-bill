/**
 * Delta event system for fine-grained streaming output.
 * 
 * This module provides a structured event system for streaming LLM outputs with
 * rich semantic information. Unlike simple chunk events which only carry raw
 * data, DeltaEvents provide typed, structured information about different types
 * of content being streamed (text, tool calls, thinking, etc.).
 */

// Base interface for all delta items
export interface DeltaItem {
    id: string;
    type: string;
}

export interface EventItemThinking extends DeltaItem {
    type: "thinking";
    thinking: string;
}

export interface EventItemThinkingDelta extends DeltaItem {
    type: "thinking_delta";
    thinking_delta: string;
}

export interface EventContentBlockStop extends DeltaItem {
    type: "content_block_stop";
}

export interface EventText extends DeltaItem {
    type: "text";
    text: string;
}

export interface EventTextDelta extends DeltaItem {
    type: "text_delta";
    text_delta: string;
}

export interface EventToolUse extends DeltaItem {
    type: "tool_use";
    name: string;
    input: string;
    is_server_tool_use: boolean;
}

export interface EventToolUseDelta extends DeltaItem {
    type: "tool_use_delta";
    input_delta: string;
}

export interface EventCustom extends DeltaItem {
    type: "custom";
    data: any;
}