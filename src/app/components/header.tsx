import { Menu, MessageCircle } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';

interface HeaderProps {
    onToggleChat: () => void;
}

export default function Header({ onToggleChat }: HeaderProps) {
    const { toggleSidebar } = useSidebar();

    return (
        <header className="bg-background dark:bg-background border-b border-border h-14 flex items-center px-6 gap-4">
            <button
                onClick={toggleSidebar}
                className="p-2 hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
            >
                <Menu size={20} className="text-foreground" />
            </button>

            <div className="flex-1" />

            <button
                onClick={onToggleChat}
                className="p-2 hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
            >
                <MessageCircle size={20} className="text-foreground" />
            </button>
        </header>
    );
}
