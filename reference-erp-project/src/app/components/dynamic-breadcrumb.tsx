import { useMemo, useRef } from "react";
import { useLocation, Link, useParams } from "react-router";
import { HomeIcon } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useOrg } from "@/app/contexts/OrgContext";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    BreadcrumbEllipsis,
} from "@/components/ui/breadcrumb";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BreadcrumbSegment {
    title: string;
    url: string;
    isLast?: boolean;
}

// Hook para detectar el ancho de pantalla y el contenedor
const useResponsiveBreadcrumb = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    return { containerRef };
};

export default function DynamicBreadcrumb() {
    const location = useLocation();
    const { orgId } = useParams<{ orgId: string }>();
    const { t } = useTranslation();
    const { org } = useOrg();
    const { containerRef } = useResponsiveBreadcrumb();

    // Function to get translated title for route segment
    const getRouteTitle = (segment: string, index: number): string => {
        // If it's the first segment and matches the orgId, use the org name
        if (index === 0 && segment === orgId && org?.name) {
            return org.name;
        }

        const routeTranslations: Record<string, string> = {
            "": t('sidebar.myZone', 'My Zone'),
            "clients": t('sidebar.clients', 'Clients'),
            "suppliers": t('sidebar.suppliers', 'Suppliers'),
            "locations": t('sidebar.locations', 'Locations'),
            "sales": t('sidebar.sales', 'Sales'),
            "quotes": t('sidebar.quotes', 'Quotes'),
            "invoices": t('sidebar.invoices', 'Invoices'),
            "rates": t('sidebar.rates', 'Rates'),
            "hourly-rates": t('sidebar.hourlyRates', 'Hourly Rates'),
            "purchases": t('sidebar.purchases', 'Purchases'),
            "orders": t('sidebar.orders', 'Orders'),
            "aftersales": t('sidebar.aftersales', 'Aftersales'),
            "work-orders": t('sidebar.workOrders', 'Work Orders'),
            "field-service": t('sidebar.fieldService', 'Field Service'),
            "status-templates": t('sidebar.statusTemplates', 'Status Templates'),
            "agreements": t('sidebar.agreements', 'Agreements'),
            "planning": t('sidebar.planning', 'Planning'),
            "planner": t('sidebar.planner', 'Planner'),
            "mission-control": t('sidebar.missionControl', 'Mission Control'),
            "urgent-plan": t('missionControl.summary.urgentPlan', 'Urgent Plan'),
            "settings": t('sidebar.settings', 'Settings'),
            "projects": t('sidebar.projects', 'Projects'),
            "list": t('sidebar.projectsList', 'Projects List'),
            "inventory": t('sidebar.inventory', 'Inventory'),
            "items": t('sidebar.items', 'Items'),
            "warehouses": t('sidebar.warehouses', 'Warehouses'),
            "mobile": t('sidebar.mobileInventory', 'Mobile Inventory'),
            "people": t('sidebar.people', 'People'),
            "employees": t('sidebar.employees', 'Employees'),
            "managers": t('sidebar.managers', 'Managers'),
            "candidates": t('sidebar.candidates', 'Candidates'),
            "crm": t('sidebar.crm', 'CRM'),
            "leads": t('sidebar.leads', 'Leads'),
            "opportunities": t('sidebar.opportunities', 'Opportunities'),
            "accounting": t('sidebar.accounting', 'Accounting'),
            "management": t('sidebar.accounting', 'Accounting'), // "Gestión" maps to accounting
            "treasury": t('sidebar.treasury', 'Treasury'),
            "analytics": t('sidebar.analytics', 'Analytics'),
            "admin": t('sidebar.administration', 'Administration'),
            "permissions": t('sidebar.permissions', 'Permissions'),
            "groups": t('sidebar.userGroups', 'User Groups'),
            "tags": t('sidebar.tags', 'Tags'),
            "other": t('sidebar.other', 'Other'),
            "profile": t('profile.title', 'Profile'),
            "api-keys": t('apiKeys.title', 'API Keys'),
            "time-policies": t('timePolicies.title', 'Time Policies'),
            "job-titles": t('jobTitles.title', 'Job Titles'),
            "hard-skills": t('hardSkills.title', 'Hard Skills'),
            "soft-skills": t('softSkills.title', 'Soft Skills'),
            "skills": t('skills.title', 'Skills'),
            "absences": t('absences.title', 'Absences'),
            "absence-policies": t('absencePolicies.title', 'Absence Policies'),
            "policies": t('policies.title', 'Policies'),
            "general": t('policies.general', 'General'),
            "time-slots": t('timeSlots.title', 'Time Slots'),
            "overtime-rules": t('overtimeRules.title', 'Overtime Rules'),
            "fields": t('admin.customFields.title', 'Custom Fields'),
            "indirect-costs": t('indirectCosts.title', 'Indirect Costs'),
            "ticket-work-order-types": t('ticketWorkOrderTypes.title', 'Ticket Work Order Types'),
            "order-types": t('orderTypes.title', 'Order Types'),
            "workplaces": t('workplaces.title', 'Workplaces'),
            "users": t('users.title', 'Users'),
            "document-series": t('documentsSeries.title', 'Document Series'),
            "taxonomy": t('taxonomy.title', 'Taxonomy'),
            "news-admin": t('news.title', 'News Admin.'),
            "create": t('news.create', 'Create'),
            "payrolls": t('payrolls.title', 'Payrolls'),
            "sick-leaves": t('sickLeaves.title', 'Sick Leaves'),
            "time-records": t('timeRecords.title', 'Time Records'),
            "news": t('news.title', 'News'),
            "tickets": t('tickets.title', 'Tickets'),
            "tickets-admin": t('tickets.adminTitle', 'Tickets Admin.'),
            "on-call": t('on-call.title', 'On Call'),
            "checklists": t('checklists.title', 'Checklists'),
            "org-chart": t('orgChart.title', 'Org. Chart'),
            "currencies": t('settings.currencies.title', 'Currencies'),
            "org": t('settings.org.title', 'Organization'),
            "vehicles": t('sidebar.vehicles', 'Vehicles'),
            "commuting-rates": t('commutingRates.title', 'Commuting Rates'),
            "iam": t('iam.title', 'IAM'),
            "signing-requests": t('signingRequests.title', 'Signing Requests'),
        };

        return routeTranslations[segment] || segment.charAt(0).toLowerCase() + segment.slice(1);
    };


    const breadcrumbs = useMemo((): BreadcrumbSegment[] => {
        const pathSegments = location.pathname.split("/").filter(Boolean);
        const segments: BreadcrumbSegment[] = [];

        // Build breadcrumbs from path segments
        let currentPath = "";
        pathSegments.forEach((segment, index) => {
            currentPath += `/${segment}`;
            const title = getRouteTitle(segment, index);

            segments.push({
                title,
                url: currentPath,
                isLast: index === pathSegments.length - 1,
            });
        });

        return segments;
    }, [location.pathname, t, org]); // Add 'org' as dependency

    const renderBreadcrumbs = () => {
        const totalItems = breadcrumbs.length;

        // Show all breadcrumbs if 3 or fewer (like files-section.tsx)
        if (totalItems <= 3) {
            const elements: React.ReactNode[] = [];

            breadcrumbs.forEach((segment, index) => {
                elements.push(
                    <BreadcrumbItem key={segment.url} className={index === 0 ? "hidden md:block" : ""}>
                        {segment.isLast ? (
                            <BreadcrumbPage className="truncate max-w-[100px] lg:max-w-[120px] xl:max-w-[150px]">
                                {segment.title}
                            </BreadcrumbPage>
                        ) : (
                            <BreadcrumbLink asChild>
                                <Link
                                    to={segment.url}
                                    className={`truncate max-w-[100px] lg:max-w-[120px] xl:max-w-[150px]`}
                                >
                                    <span className="truncate">{segment.title}</span>
                                </Link>
                            </BreadcrumbLink>
                        )}
                    </BreadcrumbItem>
                );

                if (index < totalItems - 1) {
                    elements.push(
                        <BreadcrumbSeparator key={`sep-${index}`} className={`${index === 0 ? "hidden md:block" : ""} shrink-0`} />
                    );
                }
            });

            return elements;
        }

        // Show ellipsis for more than 3 breadcrumbs (like files-section.tsx)
        const firstItem = breadcrumbs[0];
        const hiddenItems = breadcrumbs.slice(1, -1); // Items to hide in dropdown
        const lastItem = breadcrumbs[breadcrumbs.length - 1];

        const elements: React.ReactNode[] = [];

        // First breadcrumb
        elements.push(
            <BreadcrumbItem key={firstItem.url} className="hidden md:block">
                <BreadcrumbLink asChild>
                    <Link to={firstItem.url} className="flex items-center gap-2 truncate max-w-[100px] lg:max-w-[120px] xl:max-w-[150px]">
                        <HomeIcon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{firstItem.title}</span>
                    </Link>
                </BreadcrumbLink>
            </BreadcrumbItem>
        );
        elements.push(<BreadcrumbSeparator key="sep-first" className="hidden md:block shrink-0" />);

        // Ellipsis with dropdown
        elements.push(
            <BreadcrumbItem key="ellipsis" className="shrink-0">
                <DropdownMenu>
                    <DropdownMenuTrigger className="flex h-5 w-5 items-center justify-center">
                        <BreadcrumbEllipsis className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        {hiddenItems.map((item) => (
                            <DropdownMenuItem key={item.url} asChild>
                                <Link to={item.url}>{item.title}</Link>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </BreadcrumbItem>
        );
        elements.push(<BreadcrumbSeparator key="sep-ellipsis" className="shrink-0" />);

        // Last breadcrumb
        elements.push(
            <BreadcrumbItem key={lastItem.url}>
                <BreadcrumbPage className="truncate max-w-[100px] lg:max-w-[120px] xl:max-w-[150px]">
                    {lastItem.title}
                </BreadcrumbPage>
            </BreadcrumbItem>
        );

        return elements;
    };

    return (
        <div ref={containerRef} className="min-w-0 flex-1 overflow-hidden">
            <Breadcrumb className="hidden md:flex items-start">
                <BreadcrumbList className="flex-wrap flex items-center">
                    {renderBreadcrumbs()}
                </BreadcrumbList>
            </Breadcrumb>
        </div>
    );
} 