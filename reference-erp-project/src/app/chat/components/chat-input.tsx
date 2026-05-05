import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Paperclip,
  Mic,
  X,
  SendHorizonal,
  Check,
  Loader2,
  AudioLines,
} from "lucide-react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { transcribeAudio } from "@/api/chat/transcribe";
import { useParams } from "react-router-dom";
import { getFileTypeInfo } from "@/utils/miscelanea";

export interface AttachedFile {
  id: string;
  file: File;
  type: "image" | "document" | "other";
}

interface ChatInputProps {
  onSendMessage: (message: string, files?: AttachedFile[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  maxFiles?: number;
  acceptedFileTypes?: string;
  maxFileSize?: number; // in MB
  showVoiceButton?: boolean;
  showAttachButton?: boolean;
  onVoiceModeClick?: () => void;
  /** Focus the textarea after mount (e.g. when the chat panel opens). */
  autoFocus?: boolean;
}

const ChatInput = ({
  onSendMessage,
  placeholder,
  disabled = false,
  className,
  maxFiles = 5,
  acceptedFileTypes = "*",
  maxFileSize = 10,
  showVoiceButton = true,
  showAttachButton = true,
  onVoiceModeClick,
  autoFocus = false,
}: ChatInputProps) => {
  const { t } = useTranslation();
  const { orgId } = useParams();
  const translatedPlaceholder = placeholder || t("chat.placeholders.message");
  const [message, setMessage] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio recording with transcription
  const {
    state: recordingState,
    start: startRecording,
    stop: stopRecording,
    cancel: cancelRecording,
    audioLevels,
  } = useAudioRecorder();
  const [isTranscribing, setIsTranscribing] = useState(false);

  // File type utilities
  const getFileType = (file: File): "image" | "document" | "other" => {
    if (file.type.startsWith("image/")) return "image";
    if (
      file.type.includes("pdf") ||
      file.type.includes("document") ||
      file.type.includes("text")
    )
      return "document";
    return "other";
  };

  // Auto-resize function
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const scrollHeight = textarea.scrollHeight;
    const minHeight = 40;
    const maxHeight = 200;

    const newHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight));
    textarea.style.height = `${newHeight}px`;
    textarea.style.overflowY = scrollHeight > maxHeight ? "auto" : "hidden";
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [message, adjustTextareaHeight]);

  useEffect(() => {
    if (!autoFocus || disabled) return;
    let cancelled = false;
    const outer = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (!cancelled) {
          textareaRef.current?.focus({ preventScroll: true });
        }
      });
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(outer);
    };
  }, [autoFocus, disabled]);

  // File handling
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    if (attachedFiles.length + files.length > maxFiles) {
      toast.error(`Máximo ${maxFiles} archivos permitidos`);
      return;
    }

    const validFiles: AttachedFile[] = [];

    files.forEach((file) => {
      if (file.size > maxFileSize * 1024 * 1024) {
        toast.error(
          `El archivo "${file.name}" es muy grande. Tamaño máximo: ${maxFileSize}MB`
        );
        return;
      }

      validFiles.push({
        id: Math.random().toString(36).substr(2, 9),
        file,
        type: getFileType(file),
      });
    });

    setAttachedFiles([...attachedFiles, ...validFiles]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (fileId: string) => {
    setAttachedFiles(attachedFiles.filter((f) => f.id !== fileId));
  };

  // Voice recording and transcription
  const handleMicClick = async () => {
    if (recordingState === "idle") {
      try {
        // Clear text input when starting recording
        setMessage("");
        await startRecording();
      } catch (error) {
        toast.error(t("chat.micPermissionDenied") || "Microphone access denied");
        console.error("Error accessing microphone:", error);
      }
    }
  };

  const handleConfirmRecording = async () => {
    const audioBlob = await stopRecording();
    if (!audioBlob || !orgId) return;

    setIsTranscribing(true);
    try {
      const result = await transcribeAudio(orgId, audioBlob);

      if (!result.success) {
        toast.error(t("chat.transcriptionFailed") || "Transcription failed");
        return;
      }

      const transcribedText = result.success.text || "";

      // Append transcribed text to existing input
      setMessage((prev) => {
        const newText = prev ? `${prev} ${transcribedText}` : transcribedText;
        return newText;
      });

      // Focus textarea after transcription
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    } catch (error) {
      toast.error(t("chat.transcriptionFailed") || "Transcription failed");
      console.error("Transcription error:", error);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCancelRecording = () => {
    cancelRecording();
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  // Handle send message
  const handleSend = useCallback(() => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage && attachedFiles.length === 0) {
      toast.error(t("chat.emptyMessage") || "Please enter a message or attach files");
      return;
    }

    if (disabled) return;

    onSendMessage(trimmedMessage, attachedFiles);

    // Clear everything
    setMessage("");
    setAttachedFiles([]);

    // Reset textarea height
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "40px";
      }
    }, 0);
  }, [message, attachedFiles, onSendMessage, disabled, t]);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        return;
      } else if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        handleSend();
      } else {
        e.preventDefault();
        handleSend();
      }
    }
  };

  const hasContent =
    message.trim().length > 0 || attachedFiles.length > 0;

  return (
    <TooltipProvider>
      <div className={cn("space-y-2 p-4 pt-0 p", className)}>
        {/* Attached Files Preview */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {attachedFiles.map((attachedFile) => {
              const fileName = attachedFile.file.name;
              const fileUrl = URL.createObjectURL(attachedFile.file);
              const isImage = attachedFile.type === 'image';
              const fileTypeInfo = getFileTypeInfo(fileName);

              return (
                <div key={attachedFile.id} className="relative group">
                  {isImage ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                      <img
                        src={fileUrl}
                        alt={fileName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="relative rounded-lg overflow-hidden border border-border bg-muted/30 hover:bg-muted/50 transition-colors flex flex-row items-center gap-3 p-2 h-10 w-52 cursor-pointer">
                      <div className={cn("rounded-md p-1 shrink-0 h-6 w-6 flex items-center justify-center", fileTypeInfo.color)}>
                        <Icon icon={fileTypeInfo.icon} className="h-4 w-4 shrink-0 text-white" />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="text-xs font-medium text-muted-foreground">
                          {fileTypeInfo.label}
                        </div>
                        <div className="text-xs text-foreground truncate">
                          {fileName}
                        </div>
                      </div>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFile(attachedFile.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}


        {/* Main Input Container */}
        <div className="flex items-end gap-2 rounded-xl shadow-lg">
          <div
            className={`dark:bg-muted/50 bg-transparent! relative flex-1 pb-10 p-2 rounded-xl border ${isTextareaFocused ? "border-muted-foreground/50" : "border"
              }`}
          >
            {recordingState === "recording" ? (
              <div className="w-full flex items-center justify-center min-h-[40px]">
                <RecordingVisualizer audioLevels={audioLevels} />
              </div>
            ) : (
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  setIsTextareaFocused(true);
                }}
                onBlur={() => {
                  setIsTextareaFocused(false);
                }}
                placeholder={translatedPlaceholder}
                disabled={disabled || recordingState === "processing"}
                rows={1}
                className={cn(
                  "min-h-[40px] bg-transparent! focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 max-h-[100px] p-0  border-none shadow-none ring-0  resize-none"
                )}
                style={{ height: "40px", overflowY: "hidden" }}
              />
            )}

            {/* Action buttons inside textarea */}
            <div className="absolute right-0 px-2 w-full bottom-2 flex items-center gap-1 justify-between">
              {/* Attach button */}
              {showAttachButton && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={disabled}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>{t("chat.actions.attachFiles", "Attach Files")}</p>
                  </TooltipContent>
                </Tooltip>
              )}
              <div className="flex gap-1 w-full justify-end">
                {recordingState === "idle" && !isTranscribing ? (
                  <>
                    {/* Voice button */}
                    {showVoiceButton && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full"
                            onClick={handleMicClick}
                            disabled={disabled}
                          >
                            <Mic className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>{t("chat.actions.recordVoice", "Record Voice")}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {hasContent ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={handleSend}
                            disabled={disabled}
                            size="sm"
                            className={cn(
                              "h-8 w-8 p-0 rounded-full",
                              "transition-all duration-200 cursor-pointer",
                            )}
                          >
                            <SendHorizonal className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t("chat.actions.sendMessage", "Send Message")}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : onVoiceModeClick ? (
                      <Button
                        onClick={onVoiceModeClick}
                        disabled={disabled}
                        size="sm"
                        className={cn(
                          "h-8 p-0 rounded-full",
                          "transition-all duration-200 cursor-pointer",
                        )}
                      >
                        <AudioLines className="h-4 w-4" />
                        <p className="text-xs"> {t("chat.actions.voiceMode", "Hablar")}</p>
                      </Button>
                    ) : null}
                  </>
                ) : (
                  <>
                    {/* Cancel recording button */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-full"
                          onClick={handleCancelRecording}
                          disabled={
                            recordingState === "processing" || isTranscribing
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("chat.actions.cancel", "Cancel")}</p>
                      </TooltipContent>
                    </Tooltip>
                    {/* Confirm recording button */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-full"
                          onClick={handleConfirmRecording}
                          disabled={
                            recordingState === "processing" || isTranscribing
                          }
                        >
                          {recordingState === "processing" || isTranscribing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("chat.actions.confirm", "Confirm")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </>
                )}
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptedFileTypes}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

// Recording visualizer component
function RecordingVisualizer({ audioLevels }: { audioLevels: number[] }) {
  return (
    <div className="w-full flex items-center justify-center gap-0.5 h-6 px-2">
      {audioLevels.map((level, i) => {
        const height = Math.max(2, level * 24);
        return (
          <div
            key={i}
            className="flex-1 max-w-1 rounded-full bg-muted-foreground transition-all duration-75"
            style={{ height: `${height}px` }}
          />
        );
      })}
    </div>
  );
}

export default ChatInput;
