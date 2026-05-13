import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface ChatPanelProps {
  open?: boolean;
  onClose?: () => void;
}

export function ChatPanel({ open = false, onClose }: ChatPanelProps) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="w-96 h-full border-l border-border bg-background flex flex-col">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border">
        <span className="font-semibold text-foreground">{t('chat.title', 'Chat')}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X size={16} />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="text-sm text-muted-foreground text-center py-8">
          {t('chat.placeholder', 'Chat messages will appear here')}
        </div>
      </div>

      {/* Footer with input */}
      <Separator />
      <div className="h-14 px-4 py-3 border-t border-border flex items-center gap-2">
        <input
          type="text"
          placeholder={t('chat.inputPlaceholder', 'Type a message...')}
          className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
        />
      </div>
    </div>
  );
}
