import i18n from "@/lib/i18n";

const getTagColorFromString = (text: string | number | null | undefined): string => {
    const str = typeof text === "string" ? text : text != null ? String(text) : "";
    if (!str) {
        return "gray";
    }

    // Generar un hash simple del texto
    const hash = str.split("").reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    // Mapear el hash a un color
    const colors = [
        "green",
        "red",
        "yellow",
        "blue",
        "purple",
        "orange",
        "gray",
        "indigo",
        "cyan",
        "pink",
        "teal",
        "lime",
        "amber",
        "emerald",
        "fuchsia",
        "rose",
        "sky",
        "violet",
    ];

    return getMappedColor(str, colors[Math.abs(hash) % colors.length]);
};

// Get mapped color
const getMappedColor = (text: string, defaultColor: string): string => {
    let color = null;
    const lowerText = text.toLowerCase();

    color = _getMappedColorStatus(lowerText);
    if (color) return color;

    color = _getMappedColorPriority(lowerText);
    if (color) return color;

    color = _getMappedColorGroupType(lowerText);
    if (color) return color;

    color = _getMappedColorMethod(lowerText);
    if (color) return color;

    color = _getMappedColorContractType(lowerText);
    if (color) return color;

    color = _getMappedColorVehicleType(lowerText);
    if (color) return color;

    return defaultColor;
};

// Get status color
const _getMappedColorStatus = (text: string): string | null => {
    switch (text) {
        case "family":
            return "cyan";
        case "sub_family":
        case "sub family":
            return "emerald";
        case "work_order":
        case "work orders":
        case "work orders":
        case "autosaved":
        case "paid":
        case "unlimited":
            return "blue";
        case "Ticket":
        case "ticket":
            return "purple";
        case "Order":
        case "order":
        case "orders":
        case "Received":
        case "received":
        case "ready":
        case "verified":
        case "completed":
        case "complete":
        case "published":
        case "signed":
        case "ok":
        case "good":
        case "active":
        case "approved":
        case "success":
        case "entry":
            return "green";
        /** Training enrollment: registered, not yet started — informative, not an error. */
        case "enrolled":
            return "blue";
        case "failed":
            return "red";
        case "withdrew":
            return "gray";
        case "in_progress":
        case "in progress":
            return "amber";
        case "signing":
        case "pending":
        case "is_pending":
        case "is pending":
        case "in_queue":
        case "in queue":
        case "pending_observer":
        case "absence":
        case "category":
        case "maintenance":
            return "yellow";
        case "Invoice":
        case "invoice":
        case "sales_invoices":
        case "sales invoices":
        case "purchase_invoices":
        case "purchase invoices":
        case "sick_leave":
        case "partially_paid":
        case "partially_received":
        case "partially paid":
        case "partially received":
            return "orange";
        case "rejected":
        case "declined":
        case "rejected_observer":
        case "denied":
        case "wrong":
        case "error":
        case "canceled":
        case "cancelled":
        case "expired":
        case "exit":
        case "overdue":
        case "out_of_service":
        case "out of service":
        case "archived":
        case "incomplete":
            return "red";
        case "inactive":
        case "closed":
        case "locked":
        case "draft":
        case "Draft":
        case "unknown":
        case "-":
            return "gray";
        default:
            return null;
    }
}

// Get priority color
const _getMappedColorPriority = (text: string): string | null => {
    switch (text) {
        case "low":
            return "green";
        case "normal":
        case "medium":
            return "yellow";
        case "high":
            return "orange";
        case "urgent":
            return "red";
        case "unknown":
        case "-":
            return "gray";
        default:
            return null;
    }
}

// Get group type color
const _getMappedColorGroupType = (type: string): string | null => {
    switch (type) {
        case "area":
            return "blue";
        case "department":
            return "green";
        case "section":
            return "purple";
        default:
            return null;
    }
};

// Get method color
const _getMappedColorMethod = (method: string) => {
    switch (method.toUpperCase()) {
        case "GET": return "blue";
        case "POST": return "yellow";
        case "PATCH": return "orange";
        case "PUT": return "orange";
        case "DELETE": return "red";
        default: return null;
    }
};

// Get contract type color
const _getMappedColorContractType = (type: string): string | null => {
    switch (type.toUpperCase()) {
        case "PERMANENT": return "blue";
        case "TEMPORARY": return "green";
        case "INTERNSHIP": return "purple";
        case "CONTRACTOR": return "orange";
        case "AGENCY_WORKER": return "red";
        case "APPRENTEESHIP": return "blue";
        default: return null;
    }
};

// Get vehicle type color
const _getMappedColorVehicleType = (type: string): string | null => {
    switch (type.toUpperCase()) {
        case "CAR": return "blue";
        case "MOTORCYCLE": return "green";
        case "TRUCK": return "purple";
        case "BUS": return "orange";
        default: return null;
    }
};

const getTagTextFromString = (text: string | number | null | undefined): string => {
    const str = typeof text === "string" ? text : text != null ? String(text) : "";
    if (!str) return "-";

    const lowerText = str.toLowerCase();

    let textValue = null;
    textValue = _getMappedTextStatus(lowerText);
    if (textValue) return textValue;

    textValue = _getMappedTextPriority(lowerText);
    if (textValue) return textValue;

    textValue = _getMappedTextGroupType(lowerText);
    if (textValue) return textValue;

    textValue = _getMappedTextContractType(lowerText);
    if (textValue) return textValue;

    textValue = _getMappedTextVehicleType(lowerText);
    if (textValue) return textValue;

    return str;

}

// Get status text from string
const _getMappedTextStatus = (text: string): string | null => {
    switch (text) {
        case "in_queue":
            return i18n.t("labels.inQueue", "In Queue");
        case "approved":
            return i18n.t("labels.approved", "Approved");
        case "verified":
            return i18n.t("labels.verified", "Verified");
        case "active":
            return i18n.t("labels.active", "Active");
        case "signed":
            return i18n.t("labels.signed", "Signed");
        case "pending":
        case "is_pending":
            return i18n.t("labels.pending", "Pending");
        case "pending_observer":
            return i18n.t("labels.pendingObserver", "Pending Observer");
        case "in_progress":
            return i18n.t("labels.inProgress", "In Progress");
        case "rejected":
            return i18n.t("labels.rejected", "Rejected");
        case "rejected_observer":
            return i18n.t("labels.rejectedObserver", "Rejected Observer");
        case "cancelled":
            return i18n.t("labels.cancelled", "Cancelled");
        case "ok":
            return i18n.t("labels.ok", "OK");
        case "success":
            return i18n.t("labels.success", "Success");
        case "good":
            return i18n.t("labels.good", "Good");
        case "denied":
            return i18n.t("labels.denied", "Denied");
        case "wrong":
            return i18n.t("labels.wrong", "Wrong");
        case "error":
            return i18n.t("labels.error", "Error");
        case "expired":
            return i18n.t("labels.expired", "Expired");
        case "inactive":
            return i18n.t("labels.inactive", "Inactive");
        case "absence":
            return i18n.t("labels.absence", "Absence");
        case "sick_leave":
            return i18n.t("labels.sickLeave", "Sick Leave");
        case "Work_order":
        case "work_order":
            return i18n.t("labels.workOrder", "Work Order");
        case "invoice":
            return i18n.t("labels.invoice", "Invoice");
        case "invoices":
            return i18n.t("labels.invoices", "Invoices");
        case "sales_invoices":
        case "sales invoices":
            return i18n.t("labels.salesInvoices", "Sales Invoices");
        case "purchase_invoices":
        case "purchase invoices":
            return i18n.t("labels.purchaseInvoices", "Purchase Invoices");
        case "Ticket":
            return i18n.t("labels.ticket", "Ticket");
        case "Order":
            return i18n.t("labels.order", "Order");
        case "Location":
            return i18n.t("labels.location", "Location");
        case "Client":
            return i18n.t("labels.client", "Client");
        case "draft":
            return i18n.t("labels.draft", "Draft");
        case "partially_paid":
            return i18n.t("labels.partiallyPaid", "Partially Paid");
        case "paid":
            return i18n.t("labels.paid", "Paid");
        case "overdue":
            return i18n.t("labels.overdue", "Overdue");
        case "partially_received":
            return i18n.t("labels.partiallyReceived", "Partially Received");
        case "received":
            return i18n.t("labels.received", "Received");
        case "declined":
            return i18n.t("labels.declined", "Declined");
        case "error":
            return i18n.t("labels.error", "Error");
        case "incomplete":
            return i18n.t("labels.incomplete", "Incomplete");
        case "ready":
            return i18n.t("labels.ready", "Ready");
        case "completed":
            return i18n.t("labels.completed", "Completed");
        case "canceled":
            return i18n.t("labels.canceled", "Canceled");
        case "expired":
            return i18n.t("labels.expired", "Expired");
        case "cancelled":
            return i18n.t("labels.cancelled", "Cancelled");
        case "permanent":
            return i18n.t("labels.permanent", "Permanent");
        case "temporary":
            return i18n.t("labels.temporary", "Temporary");
        case "internship":
            return i18n.t("labels.internship", "Internship");
        case "contractor":
            return i18n.t("labels.contractor", "Contractor");
        case "agency_worker":
            return i18n.t("labels.agencyWorker", "Agency Worker");
        case "apprenticeship":
            return i18n.t("labels.apprenticeship", "Apprenticeship");
        case "autosaved":
            return i18n.t("labels.autosaved", "Autosaved");
        case "entry":
            return i18n.t("labels.entry", "Entry");
        case "exit":
            return i18n.t("labels.exit", "Exit");
        case "unknown":
            return i18n.t("labels.unknown", "Unknown");
        case "maintenance":
            return i18n.t("labels.maintenance", "Maintenance");
        case "out_of_service":
            return i18n.t("labels.outOfService", "Out of Service");
        default:
            return null;
    }
};

// Get priority text from string
const _getMappedTextPriority = (text: string): string | null => {
    switch (text) {
        case "low":
            return i18n.t("labels.low", "Low");
        case "normal":
            return i18n.t("labels.normal", "Normal");
        case "high":
            return i18n.t("labels.high", "High");
        case "urgent":
            return i18n.t("labels.urgent", "Urgent");
        default:
            return null;
    }
};

// Get group type text from string
const _getMappedTextGroupType = (text: string): string | null => {
    switch (text) {
        case "area":
            return i18n.t("labels.area", "Area");
        case "department":
            return i18n.t("labels.department", "Department");
        case "section":
            return i18n.t("labels.section", "Section");
        default: return null;
    }
};

// Get contract type text from string
const _getMappedTextContractType = (text: string): string | null => {
    switch (text) {
        case "permanent":
            return i18n.t("labels.permanent", "Permanent");
        case "temporary":
            return i18n.t("labels.temporary", "Temporary");
        case "internship":
            return i18n.t("labels.internship", "Internship");
        case "contractor":
            return i18n.t("labels.contractor", "Contractor");
        case "agency_worker":
            return i18n.t("labels.agencyWorker", "Agency Worker");
        case "apprenticeship":
            return i18n.t("labels.apprenticeship", "Apprenticeship");
        default: return null;
    }
};

// Get vehicle type text from string
const _getMappedTextVehicleType = (text: string): string | null => {
    switch (text) {
        case "car":
            return i18n.t("labels.car", "Car");
        case "motorcycle":
            return i18n.t("labels.motorcycle", "Motorcycle");
        case "truck":
            return i18n.t("labels.truck", "Truck");
        case "bus":
            return i18n.t("labels.bus", "Bus");
        default: return null;
    }
};

export { getTagColorFromString, getTagTextFromString, getMappedColor };