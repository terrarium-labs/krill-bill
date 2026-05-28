import { ChevronRight, Home, Settings, FileText, Users, Boxes } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAccentBgSoftClasses, getAccentTextSoftClasses } from '@/app/utils/colors';
import { useSidebar } from '@/components/ui/sidebar';
import {
    Tooltip,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import CustomDropdownMenu from './dropdown-menu';

interface NavItem {
    label: string;
    href?: string;
    icon?: React.ComponentType<{ size: number; className?: string }>;
    children?: NavItem[];
}

export function AppSidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();
    const [expandedSettings, setExpandedSettings] = useState(false);
    const { open } = useSidebar();
    const { t } = useTranslation();

    // Build navigation items with dynamic orgId paths
    const navItems: NavItem[] = [
        { label: 'sidebar.dashboard', href: `/orgs/${orgId}`, icon: Home },
        { label: 'sidebar.invoices', href: `/orgs/${orgId}/invoices`, icon: FileText },
        { label: 'sidebar.clients', href: `/orgs/${orgId}/clients`, icon: Users },
        { label: 'sidebar.providers', href: `/orgs/${orgId}/providers`, icon: Boxes },
        {
            label: 'sidebar.settings',
            icon: Settings,
            children: [
                { label: 'sidebar.profile', href: `/orgs/${orgId}/settings/profile` },
                { label: 'sidebar.general', href: `/orgs/${orgId}/settings/general` },
                { label: 'sidebar.serialPatterns', href: `/orgs/${orgId}/settings/serial-numbers` },
            ],
        },
    ];

    const isActive = (href?: string) => {
        if (!href) return false;
        return location.pathname === href;
    };

    const isSettingsActive = location.pathname.startsWith(`/orgs/${orgId}/settings`);

    return (
        <nav className="flex flex-col h-full [&_svg]:flex-shrink-0">
            {/* Nav items */}
            <div className={`flex-1 overflow-y-auto space-y-2 ${open ? 'px-3 py-4' : 'px-2 py-4'}`}>
                {navItems.map((item) => {
                    if (item.children) {
                        return (
                            <div key={item.label}>
                                {open ? (
                                    // Expanded sidebar: inline navigation
                                    <>
                                        <button
                                            onClick={() => setExpandedSettings(!expandedSettings)}
                                            className={`w-full flex items-center h-9 rounded-md text-sm font-medium transition-colors ${
                                                open ? 'gap-3 px-3 py-2 border-l-4' : 'justify-center p-2 border-l-0'
                                            } ${isSettingsActive
                                                ? 'border-[color:var(--accent-600)] text-foreground'
                                                : 'border-transparent text-foreground'
                                                }
                                                ${!expandedSettings && isSettingsActive
                                                    ? `border-[color:var(--accent-600)] bg-[color:var(--accent-200)] [color:var(--accent-600)]`
                                                    : `hover:[background-color:var(--accent-100)]`
                                                }`}
                                        >
                                            {item.icon && <item.icon size={20} />}
                                            {open && (
                                                <>
                                                    <span className="flex-1 text-left">{t(item.label)}</span>
                                                    <ChevronRight
                                                        size={16}
                                                        className={`transition-transform ${expandedSettings ? 'rotate-90' : ''
                                                            }`}
                                                    />
                                                </>
                                            )}
                                        </button>

                                        {expandedSettings && (
                                            <div className="ml-6 space-y-1">
                                                {item.children.map((child) => (
                                                    <Link
                                                        key={child.href}
                                                        to={child.href || '#'}
                                                        className={`block px-3 py-2 rounded-md text-sm transition-colors ${isActive(child.href)
                                                            ? `border-[color:var(--accent-600)] bg-[color:var(--accent-200)] [color:var(--accent-600)]`
                                                            : 'border-transparent text-foreground hover:[background-color:var(--accent-100)]'
                                                            }`}
                                                    >
                                                        {t(child.label)}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    // Collapsed sidebar: dropdown menu
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div>
                                                <CustomDropdownMenu
                                                    items={item.children.map((child) => ({
                                                        label: t(child.label),
                                                        onClick: () => navigate(child.href || '#'),
                                                        className: isActive(child.href)
                                                            ? `${getAccentBgSoftClasses()} ${getAccentTextSoftClasses()}`
                                                            : '',
                                                    }))}
                                                    trigger={
                                                        <button
                                                            className={`w-full flex items-center justify-center p-2 h-9 rounded-md font-medium transition-colors border-l-0 ${
                                                                isSettingsActive
                                                                    ? 'bg-[color:var(--accent-200)] [color:var(--accent-600)]'
                                                                    : 'border-transparent text-foreground hover:[background-color:var(--accent-100)]'
                                                            }`}
                                                        >
                                                            {item.icon && <item.icon size={20} />}
                                                        </button>
                                                    }
                                                    align="start"
                                                />
                                            </div>
                                        </TooltipTrigger>
                                    </Tooltip>
                                )}
                            </div>
                        );
                    }

                    return (
                        open ? (
                            <Link
                                key={item.href}
                                to={item.href || '#'}
                                className={`flex items-center gap-3 px-3 py-2 h-9 rounded-md text-sm font-medium transition-colors border-l-4 ${isActive(item.href)
                                    ? `border-[color:var(--accent-600)] bg-[color:var(--accent-200)] [color:var(--accent-600)]`
                                    : 'border-transparent text-foreground hover:[background-color:var(--accent-100)]'
                                    }`}
                            >
                                {item.icon && <item.icon size={20} />}
                                <span>{t(item.label)}</span>
                            </Link>
                        ) : (
                            <Tooltip key={item.href}>
                                <TooltipTrigger asChild>
                                    <Link
                                        to={item.href || '#'}
                                        className={`w-full flex items-center justify-center p-2 h-9 rounded-md font-medium transition-colors border-l-0 ${isActive(item.href)
                                            ? `border-[color:var(--accent-600)] bg-[color:var(--accent-200)] [color:var(--accent-600)]`
                                            : 'border-transparent text-foreground hover:[background-color:var(--accent-100)]'
                                            }`}
                                    >
                                        {item.icon && <item.icon size={20} />}
                                    </Link>
                                </TooltipTrigger>
                            </Tooltip>
                        )
                    );
                })}
            </div>
        </nav>
    );
}
