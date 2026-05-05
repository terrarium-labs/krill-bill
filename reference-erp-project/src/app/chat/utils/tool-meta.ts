export interface ToolMeta {
    icon: string;
    color?: string | undefined;
    label: string;
}

// ─── Tool metadata ───────────────────────────────────────────────
export const TOOL_META: Record<string, ToolMeta> = {
    // Core dev tools (IDE / agent harness)
    bash: { icon: "lucide:terminal", label: "Running command" },
    read: { icon: "lucide:file-code-2", label: "Reading" },
    write: { icon: "lucide:file-plus-2", label: "Writing" },
    edit: { icon: "lucide:file-pen-line", label: "Editing" },
    web_search: { icon: "lucide:search", label: "Searching" },
    internet_search: { icon: "lucide:globe", label: "Searching the web" },

    get_current_time: { icon: "lucide:clock", label: "Getting current time" },
    get_current_timezone: { icon: "lucide:calendar", label: "Getting current timezone" },

    read_skill: { icon: "lucide:book-open", label: "Loading skill" },

    // Core Charles
    list_employees_charles: { icon: "lucide:users", label: "Listing employees" },

    // Product catalog
    create_item_charles: { icon: "lucide:package-plus", label: "Creating item" },
    list_items_charles: { icon: "lucide:package-search", label: "Listing items" },
    update_item_charles: { icon: "lucide:package-check", label: "Updating item" },
    create_bundle_charles: { icon: "lucide:boxes", label: "Creating bundle" },
    update_bundle_charles: { icon: "lucide:boxes", label: "Updating bundle" },

    // Field service — work orders & tickets
    list_work_orders_charles: { icon: "lucide:clipboard-list", label: "Listing work orders" },
    list_work_order_statuses_charles: { icon: "lucide:list-checks", label: "Listing statuses" },
    list_work_order_types_charles: { icon: "lucide:list", label: "Listing types" },
    close_work_order: { icon: "lucide:clipboard-check", label: "Closing work order" },
    get_relevant_work_order_information: { icon: "lucide:clipboard", label: "Getting work order info" },
    create_work_order: { icon: "lucide:clipboard-plus", label: "Creating work order" },
    get_relevant_similar_work_orders: { icon: "lucide:git-compare", label: "Finding similar work orders" },
    get_ticket_charles: { icon: "lucide:ticket", label: "Getting ticket" },
    create_time_record_charles: { icon: "lucide:timer", label: "Creating time record" },

    // Widgets (includes charts via widget_type chart)
    create_charles_widget: { icon: "lucide:layout-panel-top", label: "Creating widget" },
    create_pie_chart: { icon: "lucide:pie-chart", label: "Creating chart" },

    // Employee profile (any employee, or "me")
    get_employee_information: { icon: "lucide:id-card", label: "Getting employee info" },
    get_employee_payment_methods: { icon: "lucide:credit-card", label: "Getting payment methods" },
    get_employee_emergency_contacts: { icon: "lucide:phone", label: "Getting emergency contacts" },
    create_employee_emergency_contact: { icon: "lucide:phone", label: "Creating emergency contact" },
    update_employee_emergency_contact: { icon: "lucide:phone", label: "Updating emergency contact" },
    delete_employee_emergency_contact: { icon: "lucide:phone-off", label: "Deleting emergency contact" },
    get_employee_payrolls: { icon: "lucide:receipt", label: "Getting payrolls" },
    get_employee_contracts: { icon: "lucide:file-text", label: "Getting contracts" },
    get_employee_absences: { icon: "lucide:calendar-x", label: "Getting absences" },
    get_employee_workspace_holidays: { icon: "lucide:palmtree", label: "Getting workplace holidays" },

    // Legacy "my" employee tools (same UX as get_employee_*)
    get_my_information: { icon: "lucide:id-card", label: "Getting my info" },
    get_my_payment_methods: { icon: "lucide:credit-card", label: "Getting payment methods" },
    get_my_emergency_contacts: { icon: "lucide:phone", label: "Getting emergency contacts" },
    create_my_emergency_contact: { icon: "lucide:phone", label: "Creating emergency contact" },
    update_my_emergency_contact: { icon: "lucide:phone", label: "Updating emergency contact" },
    delete_my_emergency_contact: { icon: "lucide:phone-off", label: "Deleting emergency contact" },
    get_my_payrolls: { icon: "lucide:receipt", label: "Getting payrolls" },
    get_my_contracts: { icon: "lucide:file-text", label: "Getting contracts" },
    get_my_absences: { icon: "lucide:calendar-x", label: "Getting absences" },
    get_my_workspace_holidays: { icon: "lucide:palmtree", label: "Getting holidays" },

    // Leave management
    get_employee_absence_tracker_charles: { icon: "lucide:calendar-range", label: "Getting leave balances" },
    list_employee_absences_charles: { icon: "lucide:calendar-days", label: "Listing absence requests" },
    create_employee_absence_charles: { icon: "lucide:calendar-plus", label: "Creating absence request" },
    update_employee_absence_charles: { icon: "lucide:calendar-cog", label: "Updating absence request" },
    cancel_employee_absence_charles: { icon: "lucide:calendar-x-2", label: "Cancelling absence request" },
    get_employee_absence_counters_charles: { icon: "lucide:calculator", label: "Getting absence counters" },

    // HR operations (org / workplaces / news / birthdays)
    list_workplaces_charles: { icon: "lucide:map-pin", label: "Listing workplaces" },
    create_holidays_batch_charles: { icon: "lucide:calendar-heart", label: "Creating workplace holidays" },
    list_org_birthdays_charles: { icon: "lucide:cake", label: "Listing birthdays" },
    list_all_orgs_news_charles: { icon: "lucide:newspaper", label: "Listing news" },
    create_admin_news_charles: { icon: "lucide:newspaper", label: "Creating news" },
    list_all_related_news_charles: { icon: "lucide:newspaper", label: "Listing related news" },
    get_single_news_charles: { icon: "lucide:newspaper", label: "Getting news" },
    update_admin_news_charles: { icon: "lucide:newspaper", label: "Updating news" },

    // Team management (manager time records)
    list_manager_employees_time_records_charles: { icon: "lucide:timer", label: "Listing team time records" },
    verify_manager_employees_time_record_charles: { icon: "lucide:timer", label: "Verifying time record" },

    // Integrations — Gmail
    send_mail_charles: { icon: "logos:google-gmail", label: "Sending mail" },
    create_draft_mail_charles: { icon: "logos:google-gmail", label: "Creating draft" },
    read_mail_charles: { icon: "logos:google-gmail", label: "Reading mail" },
    get_message_metadata_for_reply_charles: { icon: "logos:google-gmail", label: "Getting reply info" },

    // Integrations — Google Calendar
    create_google_calendar_event_charles: { icon: "logos:google-calendar", label: "Creating event" },
    read_google_calendar_events_charles: { icon: "logos:google-calendar", label: "Reading calendar" },
    update_google_calendar_event_charles: { icon: "logos:google-calendar", label: "Updating event" },
    change_assistance_google_calendar_event_charles: { icon: "logos:google-calendar", label: "Updating assistance" },

    // Commercial — clients
    create_client_charles: { icon: "lucide:building-2", label: "Creating client" },
    update_client_charles: { icon: "lucide:building-2", label: "Updating client" },
    list_clients_charles: { icon: "lucide:building-2", label: "Listing clients" },
    get_client_charles: { icon: "lucide:building-2", label: "Getting client" },

    // Commercial — suppliers
    create_supplier_charles: { icon: "lucide:truck", label: "Creating supplier" },
    update_supplier_charles: { icon: "lucide:truck", label: "Updating supplier" },
    list_suppliers_charles: { icon: "lucide:truck", label: "Listing suppliers" },
    get_supplier_charles: { icon: "lucide:truck", label: "Getting supplier" },
};

export const DEFAULT_TOOL_ICON = "lucide:wrench";

export function getToolIcon(name: string): string {
    return TOOL_META[name]?.icon ?? DEFAULT_TOOL_ICON;
}

export function getToolLabel(name: string): string {
    return TOOL_META[name]?.label ?? name;
}

// ─── Skill metadata (read_skill tool) ────────────────────────────
export const SKILL_META: Record<string, ToolMeta> = {
    commercial: { icon: "lucide:handshake", label: "Commercial", color: "blue" },
    employee_profile: { icon: "lucide:id-card", label: "Employee profile", color: "yellow" },
    field_service: { icon: "lucide:clipboard-list", label: "Field service", color: "cyan" },
    hr_operations: { icon: "lucide:building", label: "HR operations", color: "orange" },
    integrations: { icon: "lucide:puzzle", label: "Integrations", color: "purple" },
    leave_management: { icon: "lucide:calendar-off", label: "Leave management", color: "rose" },
    product_catalog: { icon: "lucide:boxes", label: "Product catalog", color: "pink" },
    team_management: { icon: "lucide:users-round", label: "Team management", color: "green" },
    widgets: { icon: "lucide:chart-area", label: "Widgets", color: "red" },

    // Legacy skill ids (older agent payloads)
    charts: { icon: "lucide:bar-chart-3", label: "Charts", color: "yellow" },
    clients: { icon: "lucide:building-2", label: "Clients", color: "blue" },
    employees: { icon: "lucide:users", label: "Employees", color: "green" },
    items_and_bundles: { icon: "lucide:boxes", label: "Items & Bundles", color: "pink" },
    hhrr: { icon: "lucide:user-cog", label: "HR", color: "orange" },
    suppliers: { icon: "lucide:truck", label: "Suppliers", color: "green" },
    user_information: { icon: "lucide:id-card", label: "User Information", color: "yellow" },
    work_orders: { icon: "lucide:clipboard-list", label: "Work Orders", color: "cyan" },
};

export const DEFAULT_SKILL_ICON = "lucide:book-open";

export function getSkillIcon(skillName: string): string {
    return SKILL_META[skillName]?.icon ?? DEFAULT_SKILL_ICON;
}

export function getSkillLabel(skillName: string): string {
    return SKILL_META[skillName]?.label ?? skillName;
}

export function getSkillColor(skillName: string): string {
    return SKILL_META[skillName]?.color ?? "blue";
}

export function isSkillTool(toolName: string): boolean {
    return toolName === "read_skill";
}

export function extractSkillName(input: string): string {
    if (!input || input.trim() === "") return "";
    try {
        const parsed = JSON.parse(input);
        return parsed.name || parsed.skill || "";
    } catch {
        // Partial JSON during streaming — extract name/skill value via regex
        const match = /"(?:name|skill)"\s*:\s*"([^"]+)/.exec(input);
        return match ? match[1] : "";
    }
}
