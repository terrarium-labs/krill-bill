import { Content, StartEvent, DeltaEvent, OutputEvent } from "@/types/chat/chat";
import { supabase } from "@/lib/supabase";
import { baseApiUrl } from "@/api/0.core/url";

//const baseApiUrl = "https://dev.fredvic.timbal.ai";

// POST /orgs/{org_id}/charles
export const streamChatResponse = async function* (
    org_id: string,
    prompt: Content[],
    parent_id: string | null
): AsyncGenerator<StartEvent | DeltaEvent | OutputEvent, void, unknown> {
    // Get authentication token
    let token = localStorage.getItem("x-auth-token");

    if (!token) {
        throw new Error("No authentication token found");
    }

    const url = new URL(`/orgs/${org_id}/charles`, baseApiUrl);

    const makeRequest = async (authToken: string): Promise<Response> => {
        return await fetch(url.toString(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`,
            },
            body: JSON.stringify({prompt, parent_id}),
        });
    };

    let response = await makeRequest(token);

    // Handle 401 with token refresh
    if (response.status === 401) {
        const { data, error } = await supabase.auth.refreshSession();
        if (data?.session && !error) {
            token = data.session.access_token;
            localStorage.setItem("x-auth-token", token);
            response = await makeRequest(token);
        } else {
            throw new Error("Authentication failed");
        }
    }

    // Handle other error status codes
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    // Check if the response is SSE
    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("text/event-stream")) {
        throw new Error("Expected Server-Sent Events response");
    }

    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error("Response body is not readable");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            // Decode the chunk and add to buffer
            buffer += decoder.decode(value, { stream: true });

            // Process complete events from buffer
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // Keep incomplete line in buffer

            let eventData = "";

            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    eventData = line.slice(6); // Remove "data: " prefix

                    // Skip empty data or comments
                    if (!eventData || eventData.trim() === "") {
                        continue;
                    }

                    try {
                        const event = JSON.parse(eventData) as StartEvent | DeltaEvent | OutputEvent;
                        yield event;
                    } catch (parseError) {
                        console.error("Failed to parse SSE event:", parseError, "Data:", eventData);
                    }

                    eventData = "";
                } else if (line === "") {
                    // Empty line marks end of event (but we already processed it)
                    continue;
                }
            }
        }
    } finally {
        reader.releaseLock();
    }
};