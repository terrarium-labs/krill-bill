import { ChevronLeft, Home, Settings, Package } from 'lucide-react';
import { Link, useLocation } from 'react-router';

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navItems = [
  { label: 'Dashboard', href: '/', icon: Home },
  { label: 'Serial Numbers', href: '/admin/serial-numbers', icon: Package },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function Sidebar({ open, onOpenChange }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-40"
          onClick={() => onOpenChange(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-50 flex flex-col ${
          open ? 'w-64' : 'w-0 lg:w-20'
        }`}
      >
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200">
          {open && <span className="font-bold text-lg">Krill Bill</span>}
          <button
            onClick={() => onOpenChange(!open)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => !open && onOpenChange(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-green-50 text-green-700 border-l-4 border-green-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} className="flex-shrink-0" />
                {open && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          {open && (
            <div className="text-xs text-gray-500">
              <p className="font-semibold">v0.1.0</p>
              <p>Krill Bill SaaS</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
