import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Message, Content } from '@/types/chat/chat';
import { useParams } from 'react-router-dom';
import { postOrgFilesUploader } from '@/api/orgs/files/files';
import { uploadFile } from '@/lib/uploaders_timbal';
import { streamChatResponse } from '@/api/chat/chat';
import { toast } from 'sonner';
import { AttachedFile } from '../components/chat-input';
import { DeltaEvent } from '@/types/chat/chat';
import { EventToolUseDelta, EventTextDelta, EventItemThinkingDelta } from '@/types/chat/delta';

interface ChatContextType {
    isChatVisible: boolean;
    isMobile: boolean;
    showChat: () => void;
    hideChat: () => void;
    toggleChat: () => void;
    messagesList: Message[];
    setMessagesList: React.Dispatch<React.SetStateAction<Message[]>>;
    chatRunning: boolean;
    setChatRunning: React.Dispatch<React.SetStateAction<boolean>>;
    agentMode: boolean;
    setAgentMode: React.Dispatch<React.SetStateAction<boolean>>;
    handleSendMessage: (message: string, files?: AttachedFile[]) => Promise<void>;
    autoSendMessage: (message: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
    children: ReactNode;
    defaultVisible?: boolean;
}

export function ChatProvider({ children }: ChatProviderProps) {
    const { orgId } = useParams();
    const [isChatVisible, setIsChatVisible] = useState<boolean>((localStorage.getItem("chat-visible") || "true") === "true");
    const [agentMode, setAgentMode] = useState<boolean>(false);
    const [messagesList, setMessagesList] = useState<Message[]>([]);
    const [chatRunning, setChatRunning] = useState(false);
    const messageListRef = useRef(messagesList);
    const isMobile = useIsMobile();

    // Keep messageListRef in sync with messagesList
    messageListRef.current = messagesList;

    const showChat = () => setIsChatVisible(true);
    const hideChat = () => setIsChatVisible(false);
    const toggleChat = () => setIsChatVisible(prev => !prev);

    useEffect(() => {
        if (isMobile) {
            setIsChatVisible(false);
        }
    }, [isMobile]);

    useEffect(() => {
        localStorage.setItem("chat-visible", isChatVisible.toString());
    }, [isChatVisible]);

    const uploadAttachedFile = async (file: File): Promise<Content | null> => {
        if (!orgId) return null;
        try {
            // Step 1: Get the uploader URL
            const uploaderResponse = await postOrgFilesUploader(orgId, {
                path: null,
                entity_id: "charles",
                name: file.name,
                content_type: file.type,
                content_length: file.size,
            });

            if (uploaderResponse.success) {
                const content_url = await uploadFile(uploaderResponse.success.uploader, file, (progress: number) => {
                    console.log("Upload progress:", progress);
                });
                if (content_url) {
                    return {
                        type: "file",
                        file: content_url as string,
                    };
                }
                else {
                    console.error("Failed to upload file");
                    return null;
                }
            } else {
                console.error("Failed to get uploader");
                return null;
            }
        }
        catch (error) {
            console.error("Error uploading file:", error);
            return null;
        }
    };

    // Helper function to add a new content block to the message
    const addContentBlock = (message: Message, newBlock: Content): Message => ({
        ...message,
        content: [...message.content, newBlock]
    });

    // Helper function to update an existing content block by ID
    const updateContentBlock = (message: Message, id: string, updater: (c: Content) => Partial<Content>): Message => ({
        ...message,
        content: message.content.map(c => {
            // Check if the content has an id property and if it matches
            const contentId = 'id' in c ? c.id : undefined;
            return contentId === id ? { ...c, ...updater(c) } as Content : c;
        })
    });

    const handleDeltaItem = (data: DeltaEvent, message: Message): Message => {
        switch (data.item.type) {
            case 'tool_use':
                return addContentBlock(message, {
                    type: 'tool_use',
                    id: data.item.id,
                    name: data.item.name,
                    input: data.item.input || '',
                    is_server_tool_use: data.item.is_server_tool_use || false,
                });
            case 'tool_use_delta':
                return updateContentBlock(message, data.item.id, (c) => ({
                    input: (c.type === 'tool_use' ? c.input : '') + (data.item as EventToolUseDelta).input_delta
                }));
            case 'text':
                return addContentBlock(message, {
                    id: data.item.id,
                    type: 'text',
                    text: ''
                });
            case 'text_delta':
                return updateContentBlock(message, data.item.id, (c) => ({
                    text: (c.type === 'text' ? c.text : '') + (data.item as EventTextDelta).text_delta
                }));
            case 'thinking':
                return addContentBlock(message, {
                    type: 'thinking',
                    id: data.item.id,
                    thinking: '',
                });
            case 'thinking_delta':
                return updateContentBlock(message, data.item.id, (c) => ({
                    thinking: (c.type === 'thinking' ? c.thinking : '') + (data.item as EventItemThinkingDelta).thinking_delta
                }));
            case 'content_block_stop':
                return updateContentBlock(message, data.item.id, () => ({
}));
            default:
                console.log('ChatContext: Unknown delta item type:', data.item);
                return message;
        }
    };

    const handleEvent = (data: any) => {
        switch (data.type) {
            case 'START':
                if (data.error) {
                    toast.error(data.error);
                } else {
                    if (!data.path.includes('.')) {
                        setMessagesList((prev: Message[]) => {
                            // Only add the message if run_id doesn't already exist
                            if (prev.some(msg => msg.run_id === data.run_id)) {
                                console.log('ChatContext: Message with run_id already exists:', data.run_id);
                                return prev;
                            }
                            return [...prev, { role: 'assistant', run_id: data.run_id, content: [] }];
                        });
                    }
                }
                break;
            case 'DELTA':
                if (data.error) {
                    toast.error(data.error);
                } else {
                    setMessagesList((prev: Message[]) => {
                        const message = prev.find(msg => msg.run_id === data.run_id);
                        const messageIndex = prev.findIndex(msg => msg.run_id === data.run_id);
                        if (messageIndex !== -1 && message) {
                            const newMessage = handleDeltaItem(data, message);
                            return [...prev.slice(0, messageIndex), newMessage, ...prev.slice(messageIndex + 1)];
                        }
                        return prev;
                    });
                }
                break;
            case 'OUTPUT':
                if (!data.path.includes('.')) {
                    setChatRunning(false);
                    if (data.error) {
                        const newMessage: Message = {
                            role: 'assistant',
                            run_id: data.run_id,
                            content: [],
                            error: data.error
                        };
                        setMessagesList((prev: Message[]) => {
                            // Replace the message if it already exists, otherwise add it
                            const messageIndex = prev.findIndex(msg => msg.run_id === data.run_id);
                            if (messageIndex !== -1) {
                                return [...prev.slice(0, messageIndex), newMessage, ...prev.slice(messageIndex + 1)];
                            }
                            return [...prev, newMessage];
                        });
                    }
                    else if (data.output?.content) {
                        setMessagesList((prev: Message[]) => {
                            const messageIndex = prev.findIndex(msg => msg.run_id === data.run_id);
                            if (messageIndex !== -1) {
                                const updatedMessage: Message = {
                                    ...prev[messageIndex],
                                    //! ALERTRA AIXO ES UNA GUARRADA FALTA MSG_ID PER AÑADIR EL NOU CONTENIDO A LA POSICIÓN CORRECTA
                                    content: [ ...prev[messageIndex].content.filter(c => c.type !== 'text'), ...data.output.content.filter((c : Content) => c.type === 'text' || c.type === 'file' || c.type === 'custom') ],
                                };
                                return [...prev.slice(0, messageIndex), updatedMessage, ...prev.slice(messageIndex + 1)];
                            }
                            return prev;
                        });
                    }
                }
                console.log("messageList output", messageListRef.current);
                break;
            default:
                console.log('ChatContext: Unknown message type:', data);
                break;
        }
    };

    const handleSendMessage = async (message: string, files?: AttachedFile[]) => {
        if (chatRunning) return;

        setChatRunning(true);
        const content: Content[] = [];

        // Add text content if there's a message
        if (message.trim()) {
            content.push({
                type: "text",
                text: message
            });
        }

        // Upload files and add to content
        if (files && files.length > 0) {
            for (const file of files) {
                const fileContent = await uploadAttachedFile(file.file);
                if (fileContent) {
                    content.push(fileContent);
                }
            }
        }

        // Send the message with all content
        if (content.length > 0) {
            // Add user message to messagesList
            const userMessage: Message = {
                role: 'user',
                content: content
            };
            setMessagesList((prev: Message[]) => [...prev, userMessage]);

            // Set chat as running
            setChatRunning(true);

            let run_id = messagesList[messagesList.length - 1]?.run_id || null;

            try {
                // Stream the response
                const generator = streamChatResponse(orgId || "", content, run_id || null);
                for await (const event of generator) {
                    handleEvent(event);
                }
            } catch (error) {
                console.error("Error streaming chat response:", error);
                toast.error("Failed to send message");
                setChatRunning(false);
            }
        }
        else {
            console.error("No content to send");
        }
    };

    const autoSendMessage = async (message: string, files?: AttachedFile[]) => {
        showChat();
        setMessagesList([]);
        await handleSendMessage(message, files);
    }

    const value: ChatContextType = {
        isChatVisible,
        isMobile,
        showChat,
        hideChat,
        toggleChat,
        messagesList,
        setMessagesList,
        chatRunning,
        setChatRunning,
        agentMode,
        setAgentMode,
        handleSendMessage,
        autoSendMessage,
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChatContext(): ChatContextType {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChatContext must be used within a ChatProvider');
    }
    return context;
}

export default ChatContext;
