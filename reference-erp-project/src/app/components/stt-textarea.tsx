import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Loader2, X, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { transcribeAudio } from "@/api/chat/transcribe";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface SttTextareaProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  rows?: number;
}

export function SttTextarea({
  id,
  value,
  onChange,
  placeholder,
  className,
  disabled = false,
  rows = 3,
}: SttTextareaProps) {
  const { t } = useTranslation();
  const { orgId } = useParams();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // forceTextarea keeps the textarea visible even when value is empty
  // (e.g. after clicking "manual write" or while actively editing)
  const [forceTextarea, setForceTextarea] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const {
    state: recordingState,
    start: startRecording,
    stop: stopRecording,
    cancel: cancelRecording,
    audioLevels,
  } = useAudioRecorder();

  const isRecording = recordingState === "recording";
  const isProcessing = recordingState === "processing";

  // Determine what to show
  const showRecording = isRecording;
  const showTranscribing = isTranscribing || isProcessing;
  const showTextarea =
    !showRecording && !showTranscribing && (!!value || forceTextarea);
  const showMic = !showRecording && !showTranscribing && !showTextarea;

  // Sync forceTextarea off when value becomes non-empty (no longer needed)
  useEffect(() => {
    if (value) {
      setForceTextarea(false);
    }
  }, [value]);

  const handleMicClick = useCallback(async () => {
    try {
      await startRecording();
    } catch {
      toast.error(
        t("sttTextarea.micDenied", "Microphone access denied")
      );
    }
  }, [startRecording, t]);

  const handleStopRecording = useCallback(async () => {
    const audioBlob = await stopRecording();
    if (!audioBlob || !orgId) return;

    setIsTranscribing(true);
    try {
      const result = await transcribeAudio(orgId, audioBlob);

      if (!result.success) {
        toast.error(
          t("sttTextarea.transcriptionFailed", "Transcription failed")
        );
        return;
      }

      const transcribedText = result.success.text || "";
      if (transcribedText) {
        onChange(transcribedText);
      }

      setTimeout(() => textareaRef.current?.focus(), 100);
    } catch {
      toast.error(
        t("sttTextarea.transcriptionFailed", "Transcription failed")
      );
    } finally {
      setIsTranscribing(false);
    }
  }, [stopRecording, orgId, onChange, t]);

  const handleCancelRecording = useCallback(() => {
    cancelRecording();
  }, [cancelRecording]);

  const handleManualWrite = useCallback(() => {
    setForceTextarea(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const handleTextareaBlur = useCallback(() => {
    if (!value.trim()) {
      setForceTextarea(false);
    }
  }, [value]);

  // --- Mic view ---
  if (showMic) {
    return (
      <div className={cn("flex flex-col items-center gap-2 py-4", className)}>
        <Button
          type="button"
          variant="outline"
          className="rounded-full h-14 w-14 cursor-pointer border-2 hover:border-primary/50 transition-all duration-200"
          onClick={handleMicClick}
          disabled={disabled}
        >
          <Mic className="h-6! w-6!" />
        </Button>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer underline underline-offset-2"
          onClick={handleManualWrite}
          disabled={disabled}
        >
          {t("sttTextarea.manualWrite", "escribir manualmente")}
        </button>
      </div>
    );
  }

  // --- Recording view ---
  if (showRecording) {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-3 py-4",
          className
        )}
      >
        <div className="w-full max-w-xs">
          <RecordingVisualizer audioLevels={audioLevels} />
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            className="rounded-full h-10 w-10 cursor-pointer"
            onClick={handleCancelRecording}
          >
            <X className="h-5! w-5!" />
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="rounded-full h-14 w-14 animate-pulse cursor-pointer"
            onClick={handleStopRecording}
          >
            <Square className="h-5! w-5! fill-current" />
          </Button>
        </div>
      </div>
    );
  }

  // --- Transcribing view ---
  if (showTranscribing) {
    return (
      <div className={cn("flex flex-col items-center gap-2 py-4", className)}>
        <div className="h-14 w-14 flex items-center justify-center">
          <Loader2 className="h-6! w-6! animate-spin text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground">
          {t("sttTextarea.transcribing", "Transcribiendo...")}
        </p>
      </div>
    );
  }

  // --- Textarea view ---
  return (
    <div className={cn("w-full", className)}>
      <Textarea
        id={id}
        ref={textareaRef}
        value={value}
        onChange={handleTextareaChange}
        onBlur={handleTextareaBlur}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className="resize-none"
      />
    </div>
  );
}

// --- Recording visualizer ---
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
