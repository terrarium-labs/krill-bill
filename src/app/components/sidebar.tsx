import { ChevronLeft, Home, Settings, FileText, Users, Boxes } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useState } from 'react';
import { getTranslation } from '@/i18n';
import CustomDropdownMenu from './dropdown-menu';

interface SidebarProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface NavItem {
    label: string;
    href?: string;
    icon?: React.ComponentType<{ size: number; className?: string }>;
    children?: NavItem[];
}

const navItems: NavItem[] = [
    { label: 'sidebar.dashboard', href: '/', icon: Home },
    { label: 'sidebar.invoices', href: '/invoices', icon: FileText },
    { label: 'sidebar.clients', href: '/clients', icon: Users },
    { label: 'sidebar.providers', href: '/providers', icon: Boxes },
    {
        label: 'sidebar.settings',
        icon: Settings,
        children: [
            { label: 'sidebar.general', href: '/settings/general' },
            { label: 'sidebar.serialPatterns', href: '/settings/serial-numbers' },
        ],
    },
];

export default function Sidebar({ open, onOpenChange }: SidebarProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const [expandedSettings, setExpandedSettings] = useState(false);

    const t = (key: string) => getTranslation('en', key);

    const isSettingsActive = location.pathname.startsWith('/settings');

    const isActive = (href?: string) => {
        if (!href) return false;
        return location.pathname === href;
    };

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
                className={`fixed lg:static top-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-50 flex flex-col ${
                    open ? 'w-64 left-0' : 'w-64 -left-full lg:w-20 lg:left-0'
                }`}
            >
                {/* Header */}
                <div className="h-14 flex items-center justify-between px-3 border-b border-gray-200 dark:border-gray-700">
                    {open && <span className="font-bold text-lg dark:text-white">Krill Bill</span>}
                    <button
                        onClick={() => onOpenChange(!open)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                        <ChevronLeft size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-2">
                    {navItems.map((item) => {
                        if (item.children) {
                            // Parent item with children (Settings)
                            if (open) {
                                // Expanded: show full navigation
                                return (
                                    <div key={item.label}>
                                        <button
                                            onClick={() => setExpandedSettings(!expandedSettings)}
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isSettingsActive
                                                ? 'bg-accent-100 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400 border-l-4 border-accent-700'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-accent-100/50 dark:hover:bg-accent-900/10 hover:text-accent-700 dark:hover:text-accent-400'
                                                }`}
                                        >
                                            {item.icon && <item.icon size={20} className="flex-shrink-0" />}
                                            <>
                                                <span className="text-sm font-medium flex-1 text-left">{t(item.label)}</span>
                                                <ChevronLeft
                                                    size={16}
                                                    className={`transform transition-transform ${expandedSettings ? 'rotate-180' : ''}`}
                                                />
                                            </>
                                        </button>

                                        {/* Children items */}
                                        {expandedSettings && (
                                            <div className="ml-3 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                                                {item.children.map((child) => (
                                                    <Link
                                                        key={child.label}
                                                        to={child.href || '#'}
                                                        className={`block px-3 py-2 rounded-lg text-sm transition-colors ${isActive(child.href)
                                                            ? 'bg-accent-100 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400'
                                                            : 'text-gray-600 dark:text-gray-400 hover:bg-accent-100/50 dark:hover:bg-accent-900/10 hover:text-accent-700 dark:hover:text-accent-400'
                                                            }`}
                                                    >
                                                        {t(child.label)}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            } else {
                                // Collapsed: show dropdown menu with icon-only button
                                return (
                                    <CustomDropdownMenu
                                        key={item.label}
                                        items={item.children.map((child) => ({
                                            label: t(child.label),
                                            onClick: () => navigate(child.href || '#'),
                                            className: isActive(child.href)
                                                ? 'bg-accent-100 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400'
                                                : '',
                                        }))}
                                        trigger={
                                            <button
                                                className={`w-full flex items-center justify-center p-2 rounded-lg transition-colors ${isSettingsActive
                                                    ? 'bg-accent-100 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-accent-100/50 dark:hover:bg-accent-900/10 hover:text-accent-700 dark:hover:text-accent-400'
                                                    }`}
                                            >
                                                {item.icon && <item.icon size={20} />}
                                            </button>
                                        }
                                        align="start"
                                    />
                                );
                            }
                        }

                        // Regular item without children
                        return (
                            <Link
                                key={item.href}
                                to={item.href || '#'}
                                className={`flex items-center ${open ? 'gap-3' : 'justify-center'} px-3 py-2 rounded-lg transition-colors ${isActive(item.href)
                                    ? 'bg-accent-100 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400 border-l-4 border-accent-700'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-accent-100/50 dark:hover:bg-accent-900/10 hover:text-accent-700 dark:hover:text-accent-400'
                                    }`}
                            >
                                {item.icon && <item.icon size={20} className="flex-shrink-0" />}
                                {open && <span className="text-sm font-medium">{t(item.label)}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-3">
                    {open && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            <p className="font-semibold">{t('footer.version')} 0.1.0</p>
                            <p>Krill Bill SaaS</p>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
