import { Navigate, Route, Routes, useParams } from "react-router";
import { useOrgMe } from "./contexts/OrgMeContext";
import NewsRoutes from "./news/NewsRoutes";
import NewsAdminRoutes from "./news/admin/NewsAdminRoutes";
import AdminRoutes from "./admin/AdminRoutes";
import ItemsRoutes from "./items/ItemsRoutes";
import RatesRoutes from "./rates/RatesRoutes";
import ClientsRoutes from "./clients/ClientsRoutes";
import WarehousesRoutes from "./warehouses/WarehousesRoutes";
import VehiclesRoutes from "./vehicles/VehiclesRoutes";
import HourlyRatesRoutes from "./rates/HourlyRatesRoutes";
import SuppliersRoutes from "./suppliers/SuppliersRoutes";
import EmployeesRoutes from "./employees/EmployeesRoutes";
import ManagersRoutes from "./managers/ManagersRoutes";
import SigningRequestsRoutes from "./signing-requests/SigningRequestsRoutes";
import DashboardRoutes from "./dashboard/DashboardRoutes";
import ProfileRoutes from "./profile/ProfileRoutes";
import PayrollsRoutes from "./payrolls/PayrollsRoutes";
import AbsencesRoutes from "./absences/AbsencesRoutes";
import TimeRecordsRoutes from "./time-records/TimeRecordsRoutes";
import SickLeavesRoutes from "./sick-leaves/SickLeavesRouter";
import TicketsRoutes from "./tickets/TicketsRoutes";
import TicketsAdminRoutes from "./tickets/admin/TicketsAdminRoutes";
import WorkOrdersRoutes from "./work-orders/WorkOrdersRoutes";
import PurchasesRoutes from "./purchases/PurchasesRoutes";
import SalesRoutes from "./sales/SalesRoutes";
import MissionControlRoutes from "./mission-control/MissionControlRoutes";
import CommutingRatesRoutes from "./rates/CommuttingRatesRoutes";
import OnCallRoutes from "./on-call/OnCallRoutes";
import TrainingsRoutes from "./trainings/TrainingsRoutes";
import AnalyticsRoutes from "./analytics/AnalyticsRoutes";

export default function MainRoutes() {
  const { orgId } = useParams<{ orgId: string }>();
  const { me } = useOrgMe();
  const isClient = !!me?.client;

  return (
    <div className="flex flex-col gap-4 p-4">
      <Routes>
        <Route index element={<DashboardRoutes />} />

        {isClient ? (
          /* Client-only: Purchases (invoices), Inventory (no vehicles), Field Service (no planner, no on call shifts) */
          <>
            <Route path="purchases/*" element={<SalesRoutes />} />
            <Route path="items/*" element={<ItemsRoutes />} />
            <Route path="locations/*" element={<WarehousesRoutes />} />
            <Route path="rates/*" element={<RatesRoutes />} />
            <Route path="news/*" element={<NewsRoutes />} />
            <Route path="tickets/*" element={<TicketsRoutes />} />
            <Route path="work-orders/*" element={<WorkOrdersRoutes />} />
            <Route path="tickets-admin/*" element={<TicketsAdminRoutes />} />
          </>
        ) : (
          /* Employee-only */
          <>
            <Route path="admin/*" element={<AdminRoutes />} />
            <Route path="clients/*" element={<ClientsRoutes />} />
            <Route path="suppliers/*" element={<SuppliersRoutes />} />
            <Route path="items/*" element={<ItemsRoutes />} />
            <Route path="locations/*" element={<WarehousesRoutes />} />
            <Route path="vehicles/*" element={<VehiclesRoutes />} />
            <Route path="rates/*" element={<RatesRoutes />} />
            <Route path="hourly-rates/*" element={<HourlyRatesRoutes />} />
            <Route path="commuting-rates/*" element={<CommutingRatesRoutes />} />
            <Route path="employees/*" element={<EmployeesRoutes />} />
            <Route path="managers/*" element={<ManagersRoutes />} />
            <Route path="news/*" element={<NewsRoutes />} />
            <Route path="news-admin/*" element={<NewsAdminRoutes />} />
            <Route path="signing-requests/*" element={<SigningRequestsRoutes />} />
            <Route path="payrolls/*" element={<PayrollsRoutes />} />
            <Route path="absences/*" element={<AbsencesRoutes />} />
            <Route path="sick-leaves/*" element={<SickLeavesRoutes />} />
            <Route path="time-records/*" element={<TimeRecordsRoutes />} />
            <Route path="tickets/*" element={<TicketsRoutes />} />
            <Route path="tickets-admin/*" element={<TicketsAdminRoutes />} />
            <Route path="work-orders/*" element={<WorkOrdersRoutes />} />
            <Route path="mission-control/*" element={<MissionControlRoutes />} />
            <Route path="on-call/*" element={<OnCallRoutes />} />
            <Route path="trainings/*" element={<TrainingsRoutes />} />
            <Route path="sales/*" element={<SalesRoutes />} />
            <Route path="purchases/*" element={<PurchasesRoutes />} />
            <Route path="analytics/*" element={<AnalyticsRoutes />} />
          </>
        )}

        {/* Common routes for both employee and client */}
        <Route path="profile/*" element={<ProfileRoutes />} />
        <Route path="*" element={<Navigate to={`/${orgId}`} replace />} />
      </Routes>
    </div>
  );
}
