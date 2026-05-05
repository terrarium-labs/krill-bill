import { Menu, Bell, User } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 h-14 flex items-center px-6 gap-4">
      <button
        onClick={onToggleSidebar}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Menu size={20} className="text-gray-600" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
          <Bell size={20} className="text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <User size={20} className="text-gray-600" />
        </button>
      </div>
    </header>
  );
}
