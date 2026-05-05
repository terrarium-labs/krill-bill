import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { WorkPlaceProvider } from "./pages/WorkPlacesPage/context/WorkPlaceContext";
import { AbsencePolicyProvider } from "./pages/AbsencesPage/pages/AbsencesPolicies/context/AbsencePolicyContext";
import { TimePolicyProvider } from "./pages/TimePoliciesPage/context/TimePolicyContext";
import AbsencePolicyDetailPage from "./pages/AbsencesPage/pages/AbsencesPolicies/AbsencePolicyDetailPage/AbsencePolicyDetailPage";
import TimePolicyDetailPage from "./pages/TimePoliciesPage/TimePolicyDetailPage/TimePolicyDetailPage";
import SettingsPage from "./SettingsPage";
import OrgSettingsPage from "./pages/OrgSettingsPage/OrgSettingsPage";
import AbsencesPage from "./pages/AbsencesPage/AbsencesPage";
import TimePoliciesPage from "./pages/TimePoliciesPage/TimePoliciesPage";
import WorkplacesPage from "./pages/WorkPlacesPage/WorkPlacesPage";
import WorkpacesDetailPages from "./pages/WorkPlacesPage/WorkplacesDetailPage/WorkpacesDetailPage";
import OrgChartPage from "./pages/OrgChartPage/OrgChartPage";
import JobTitlesPage from "./pages/JobTitlesPage/JobTitlesPage";
import JobTitleDetailPage from "./pages/JobTitlesPage/JobTitleDetailPage/JobTitleDetailPage";
import SkillsPage from "./pages/SkillsPage/SkillsPage";
import CustomFieldsPage from "./pages/CustomFieldsPage/CustomFieldsPage";
import UsersPage from "./pages/UsersPage/UsersPage";
import LogsPage from "./pages/LogsPage/LogsPage";
import TaxonomyPage from "./pages/Taxonomy/TaxonomyPage";
import IAMRoutes from "./pages/IAMPage/IAMRoutes";
import ChecklistsPage from "./pages/ChecklistsPage/ChecklistsPage";
import ChecklistDetailPage from "./pages/ChecklistsPage/ChecklistDetailPage/ChecklistDetailPage";
import StatusTemplatesRoutes from "./pages/StatusTemplates/StatusTemplatesRoutes";
import SerialNumbersPage from "./pages/SerialNumbersPage/SerialNumbersPage";
import TicketWorkOrderTypesPage from "./pages/TicketWorkOrderTypesPage/TicketWorkOrderTypesPage";
import OrderTypesPage from "./pages/OrderTypesPage/OrderTypesPage";
import CurrenciesPage from "./pages/CurrenciesPage/CurrenciesPage";
import IndirectCostsPage from "./pages/IndirectCostsPage/IndirectCostsPage";
import ConversationsPage from "./pages/ConversationsPage/ConversationsPage";
import BonusTypesPage from "./pages/BonusTypesPage/BonusTypesPage";

import { useTranslation } from "react-i18next";
import { ChecklistProvider } from "./pages/ChecklistsPage/contexts/ChecklistContext";

const AdminRoutes = () => {
  const { t } = useTranslation();
  const { orgId } = useParams<{ orgId: string }>();
  return (
    <Routes>
      <Route path="/" element={<SettingsPage />} />
      <Route path="/org" element={<OrgSettingsPage />} />
      <Route path="/users" element={<UsersPage />} />
      <Route path="/document-series" element={<SerialNumbersPage />} />
      <Route path="/logs/*" element={<LogsPage />} />
      <Route path="/iam/*" element={<IAMRoutes />} />
      <Route path="/status-templates/*" element={<StatusTemplatesRoutes />} />
      <Route path="/workplaces" element={<WorkplacesPage />} />
      <Route path="/org-chart" element={<OrgChartPage />} />
      <Route path="/job-titles" element={<JobTitlesPage />} />
      <Route path="/skills" element={<SkillsPage />} />
      <Route path="/taxonomy/*" element={<TaxonomyPage />} />
      <Route path="/checklists" element={<ChecklistsPage />} />
      <Route
        path="/checklists/:checklistId"
        element={
          <ChecklistProvider>
            <ChecklistDetailPage />
          </ChecklistProvider>
        }
      />
      <Route path="/ticket-work-order-types" element={<TicketWorkOrderTypesPage />} />
      <Route path="/order-types" element={<OrderTypesPage />} />
      <Route path="/currencies" element={<CurrenciesPage />} />
      <Route path="/indirect-costs" element={<IndirectCostsPage />} />
      <Route path="/conversations" element={<ConversationsPage />} />
      <Route path="/bonus-types" element={<BonusTypesPage />} />
      <Route
        path="/workplaces/:workplaceId"
        element={
          <WorkPlaceProvider>
            <WorkpacesDetailPages />
          </WorkPlaceProvider>
        }
      />
      <Route path="/job-titles/:jobTitleId" element={<JobTitleDetailPage />} />
      <Route path="/absence-policies" element={<AbsencesPage />} />
      <Route
        path="/absence-policies/:policyId"
        element={
          <AbsencePolicyProvider>
            <AbsencePolicyDetailPage />
          </AbsencePolicyProvider>
        }
      />
      <Route path="/time-policies" element={<TimePoliciesPage />} />
      <Route
        path="/time-policies/:policyId"
        element={
          <TimePolicyProvider>
            <TimePolicyDetailPage />
          </TimePolicyProvider>
        }
      />
      <Route
        path="/fields/clients"
        element={<CustomFieldsPage table_name="Clients" title={t("admin.customFields.clients", "Custom Fields for Clients")} />}
      />
      <Route
        path="/fields/suppliers"
        element={<CustomFieldsPage table_name="Suppliers" title={t("admin.customFields.suppliers", "Custom Fields for Suppliers")} />}
      />
      <Route
        path="/fields/items"
        element={<CustomFieldsPage table_name="Items" title={t("admin.customFields.items", "Custom Fields for Items")} />}
      />
      <Route
        path="/fields/employees"
        element={<CustomFieldsPage table_name="Employees" title={t("admin.customFields.employees", "Custom Fields for Employees")} />}
      />
      <Route path="*" element={<Navigate to={`/${orgId}/admin`} replace />} />
    </Routes>
  );
};

export default AdminRoutes;
