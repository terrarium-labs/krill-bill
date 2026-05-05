import { useTranslation } from "react-i18next";
import PageHeader from "@/app/components/page-header";
import {
  Building,
  Users,
  Calendar,
  Terminal,
  Search,
  IdCard,
  Blocks,
  TextCursorInput,
  Network,
  Briefcase,
  Wrench,
  Clock,
  Shield,
  ClipboardList,
  ListTodo,
  FileDigit,
  Tags,
  Package,
  Coins,
  Calculator,
  MessagesSquare,
  Gift,
} from "lucide-react";
import { Link } from "react-router-dom";
import SearchBar from "../components/search-bar";
import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  VerticalMenu,
  VerticalMenuItem,
} from "@/components/ui/vertical-menu";
interface SettingItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  disabled?: boolean;
}

interface SettingSection {
  id: string;
  title: string;
  description: string;
  items: SettingItem[];
}

const SettingItemCard = ({ title, description, icon, link, disabled }: SettingItem) => (
  <Link
    to={disabled ? "" : link}
    className={cn("group", disabled && "pointer-events-none")}
  >
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg transition-colors",
        disabled ? "opacity-50" : "hover:bg-accent cursor-pointer"
      )}
    >
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0 text-primary [&>svg]:w-4 [&>svg]:h-4 [&>svg]:min-w-4 [&>svg]:min-h-4">
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span
          className={cn(
            "text-sm font-semibold leading-snug",
            !disabled && "text-primary"
          )}
        >
          {title}
        </span>
        <span className="line-clamp-2 text-sm text-muted-foreground mt-0.5">
          {description}
        </span>
      </div>
    </div>
  </Link>
);

const SettingsSection = ({
  section,
  index,
}: {
  section: SettingSection;
  index: number;
}) => (
  <div
    id={section.id}
    className={cn("first:pt-0 py-6 scroll-mt-4", index > 0 && "border-t")}
  >
    <h2 className="text-base font-semibold mb-4">{section.title}</h2>
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 xl:grid-cols-3">
      {section.items.map((item) => (
        <SettingItemCard key={item.title} {...item} />
      ))}
    </div>
  </div>
);

const SettingsPage = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSection, setActiveSection] = useState("general-settings");

  const settingsSections: SettingSection[] = useMemo(
    () => [
      {
        id: "general-settings",
        title: t("settings.sections.general", "Ajustes generales"),
        description: t(
          "settings.sections.general_description",
          "Ajustes generales"
        ),
        items: [
          {
            title: t("settings.options.org", "Organization Settings"),
            description: t(
              "settings.options.org_description",
              "Change name and logo of your organization"
            ),
            icon: <IdCard />,
            link: "org",
          },
          {
            title: t("settings.options.users", "Organization Users"),
            description: t(
              "settings.options.users_description",
              "Manage users of your organization"
            ),
            icon: <Users />,
            link: "users",
          },
          {
            title: t("settings.options.document_series", "Document Series"),
            description: t(
              "settings.options.document_series_description",
              "Manage document series of your organization"
            ),
            icon: <FileDigit />,
            link: "document-series",
          },
        ],
      },
      {
        id: "clients-settings",
        title: t("settings.sections.clients", "Clients Configuration"),
        description: t(
          "settings.sections.clients_description",
          "Manage clients settings and custom fields"
        ),
        items: [
          {
            title: t("settings.options.custom_fields", "Custom Fields"),
            description: t(
              "settings.options.custom_fields_description",
              "Create custom attributes for clients"
            ),
            icon: <TextCursorInput />,
            link: "fields/clients",
          },
        ],
      },
      {
        id: "suppliers-settings",
        title: t("settings.sections.suppliers", "Suppliers Configuration"),
        description: t(
          "settings.sections.suppliers_description",
          "Manage suppliers settings and custom fields"
        ),
        items: [
          {
            title: t("settings.options.custom_fields", "Custom Fields"),
            description: t(
              "settings.options.custom_fields_description",
              "Create custom attributes for suppliers"
            ),
            icon: <TextCursorInput />,
            link: "fields/suppliers",
          },
        ],
      },
      {
        id: "purchases-settings",
        title: t("settings.sections.purchases", "Purchases Configuration"),
        description: t(
          "settings.sections.purchases_description",
          "Manage purchase orders settings and custom fields"
        ),
        items: [
          {
            title: t("settings.options.order_types", "Order Types"),
            description: t(
              "settings.options.order_types_description",
              "Manage hierarchical order types for your organization"
            ),
            icon: <Package />,
            link: "order-types",
          },
        ],
      },
      {
        id: "inventory-settings",
        title: t(
          "settings.sections.inventory",
          "Inventory & Items Configuration"
        ),
        description: t(
          "settings.sections.inventory_description",
          "Manage items settings, categories, tags, etc."
        ),
        items: [
          {
            title: t("settings.options.taxonomy", "Taxonomy"),
            description: t(
              "settings.options.taxonomy_description",
              "Create and manage taxonomy to organize your inventory"
            ),
            icon: <Blocks />,
            link: "taxonomy",
          },
          {
            title: t("settings.options.custom_fields", "Custom Fields"),
            description: t(
              "settings.options.custom_fields_description",
              "Create custom attributes for items"
            ),
            icon: <TextCursorInput />,
            link: "fields/items",
          },
        ],
      },
      {
        id: "hr-settings",
        title: t("settings.sections.RRHH", "HR Configuration"),
        description: t(
          "settings.sections.RRHH_description",
          "Manage HR settings and custom fields"
        ),
        items: [
          {
            title: t("settings.options.custom_fields", "Custom Fields"),
            description: t(
              "settings.options.custom_fields_description",
              "Create custom attributes for employees"
            ),
            icon: <TextCursorInput />,
            link: "fields/employees",
          },
          {
            title: t("settings.options.work_centers", "Workplaces"),
            description: t(
              "settings.options.work_centers_description",
              "Set and assign workplaces to your employees. Manage their schedules and attendance."
            ),
            icon: <Building />,
            link: "workplaces",
          },
          {
            title: t("settings.options.org_chart", "Organization Chart"),
            description: t(
              "settings.options.org_chart_description",
              "Set and manage your organization's chart."
            ),
            icon: <Network />,
            link: "org-chart",
          },
          {
            title: t("settings.options.job_titles", "Job Titles"),
            description: t(
              "settings.options.job_titles_description",
              "Set and manage your organization's job titles and roles."
            ),
            icon: <Briefcase />,
            link: "job-titles",
          },
          {
            title: t("settings.options.skills", "Skills"),
            description: t(
              "settings.options.skills_description",
              "Define and manage skills and competencies."
            ),
            icon: <Wrench />,
            link: "skills",
          },
          {
            title: t("settings.options.absence_types", "Absences Policies"),
            description: t(
              "settings.options.absence_types_description",
              "Set and manage your organization's absence policies and types."
            ),
            icon: <Calendar />,
            link: "absence-policies",
          },
          {
            title: t("settings.options.time_policies", "Time Policies"),
            description: t(
              "settings.options.time_policies_description",
              "Configure time policies, working hours, and overtime rules."
            ),
            icon: <Clock />,
            link: "time-policies",
          },
          {
            title: t("settings.options.bonus_types", "Bonus Types"),
            description: t(
              "settings.options.bonus_types_description",
              "Define and manage bonus types for employees."
            ),
            icon: <Gift />,
            link: "bonus-types",
          },
        ],
      },
      {
        id: "field-service-settings",
        title: t(
          "settings.sections.fieldService",
          "Field Service Configuration"
        ),
        description: t(
          "settings.sections.fieldService_description",
          "Manage field service operations, checklists and status templates"
        ),
        items: [
          {
            title: t("settings.options.checklists", "Checklists"),
            description: t(
              "settings.options.checklists_description",
              "Create and manage checklist templates for field operations"
            ),
            icon: <ClipboardList />,
            link: "checklists",
          },
          {
            title: t("settings.options.workOrdersStatus", "Work Orders Status"),
            description: t(
              "settings.options.workOrdersStatus_description",
              "Configure the statuses used for work orders."
            ),
            icon: <ListTodo />,
            link: "status-templates/work-orders",
          },
          {
            title: t(
              "settings.options.ticketWorkOrderTypes",
              "Ticket Work Order Types"
            ),
            description: t(
              "settings.options.ticketWorkOrderTypes_description",
              "Configure the types used for ticket work orders."
            ),
            icon: <Tags />,
            link: "ticket-work-order-types",
          },
        ],
      },
      {
        id: "finance-settings",
        title: t("settings.sections.finance", "Finance"),
        description: t(
          "settings.sections.finance_description",
          "Manage taxes, currencies and financial settings"
        ),
        items: [
          {
            title: t("settings.options.currencies", "Currencies"),
            description: t(
              "settings.options.currencies_description",
              "Manage currencies and exchange rates"
            ),
            icon: <Coins />,
            link: "currencies",
          },
          {
            title: t("settings.options.indirectCosts", "Indirect Costs"),
            description: t(
              "settings.options.indirectCosts_description",
              "Manage indirect costs for work orders"
            ),
            icon: <Calculator />,
            link: "indirect-costs",
          },
        ],
      },
      {
        id: "advanced-settings",
        title: t("settings.sections.advanced", "Advanced settings"),
        description: t(
          "settings.sections.advanced_description",
          "Configuración avanzada del sistema"
        ),
        items: [
          {
            title: t("settings.options.iam", "Identity & Access Management"),
            description: t(
              "settings.options.iam_description",
              "Manage roles and permissions for your organization"
            ),
            icon: <Shield />,
            link: "iam",
          },
          {
            title: t("settings.options.audit_logs", "Audit logs"),
            description: t(
              "settings.options.audit_logs_description",
              "See current organization's logs history"
            ),
            icon: <Terminal />,
            link: "logs",
          },
          {
            title: t(
              "settings.options.conversations",
              "Conversations"
            ),
            description: t(
              "settings.options.conversations_description",
              "View AI assistant conversation history and details"
            ),
            icon: <MessagesSquare />,
            link: "conversations",
          },
        ],
      },
    ],
    [t]
  );

  const filteredSections = useMemo(() => {
    if (!searchTerm.trim()) return settingsSections;

    const searchLower = searchTerm.toLowerCase();
    return settingsSections
      .map((section) => {
        const filteredItems = section.items.filter(
          (item) =>
            item.title.toLowerCase().includes(searchLower) ||
            item.description.toLowerCase().includes(searchLower)
        );
        const sectionMatches =
          section.title.toLowerCase().includes(searchLower) ||
          section.description.toLowerCase().includes(searchLower);

        if (sectionMatches || filteredItems.length > 0) {
          return {
            ...section,
            items: sectionMatches ? section.items : filteredItems,
          };
        }
        return null;
      })
      .filter(Boolean) as SettingSection[];
  }, [settingsSections, searchTerm]);

  // Track which section is visible for the sidebar highlight
  useEffect(() => {
    if (searchTerm) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-10% 0px -80% 0px", threshold: 0 }
    );

    settingsSections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [searchTerm, settingsSections]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("settings.title", "Settings")}
        description={t(
          "settings.description",
          "Manage your organization settings"
        )}
        showBackButton={false}
        action={
          <SearchBar
            placeholder={t("settings.search_placeholder", "Search settings")}
            onSearch={setSearchTerm}
          />
        }
      />

      <div className="flex gap-8 items-start">
        {/* Sticky sidebar — hidden on mobile and while searching */}
        {!searchTerm && (
          <aside className="hidden lg:block shrink-0 sticky top-4 self-start">
            <VerticalMenu
              value={activeSection}
              onValueChange={(id) => {
                setActiveSection(id);
                document
                  .getElementById(id)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              variant="default"
              bordered={false}
              minWidth={180}
            >
              {settingsSections.map((section) => (
                <VerticalMenuItem key={section.id} value={section.id}>
                  {section.title}
                </VerticalMenuItem>
              ))}
            </VerticalMenu>
          </aside>
        )}

        <div className="flex-1 min-w-0">
          {filteredSections.length > 0 ? (
            filteredSections.map((section, index) => (
              <SettingsSection
                key={section.id}
                section={section}
                index={index}
              />
            ))
          ) : searchTerm.trim() !== "" ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="w-10 h-10 text-muted-foreground mb-3" />
              <h3 className="text-base font-semibold mb-1">
                {t("settings.no_results", "No settings found")}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">
                {t(
                  "settings.no_results_description",
                  'No results for "{{search}}". Try different keywords.',
                  { search: searchTerm }
                )}
              </p>
              <button
                onClick={() => setSearchTerm("")}
                className="text-sm text-primary hover:underline"
              >
                {t("settings.clear_search", "Clear search")}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
