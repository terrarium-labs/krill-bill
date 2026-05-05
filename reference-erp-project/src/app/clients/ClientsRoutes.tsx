import { Navigate, Route, Routes, useParams } from "react-router-dom";
import ClientsPage from "./ClientsPage";
import { ClientProvider } from "./contexts/ClientContext";
import ClientDetailPage from "./ClientDetailPage/ClientDetailPage";
import ClientDetailPageLocationsDetail from "./ClientDetailPage/pages/ClientDetailPageLocations/ClientDetailPageLocation/ClientDetailPageLocationsDetail";
import { LocationProvider } from "./ClientDetailPage/pages/ClientDetailPageLocations/contexts/LocationContext";

const ClientsDetailRoutes = () => {
  const { orgId, clientId } = useParams<{ orgId: string, clientId: string }>();
  return (
    <Routes>
      <Route path="" element={<ClientDetailPage />} />
      <Route path="locations/:locationId" element={
        <LocationProvider>
          <ClientDetailPageLocationsDetail />
        </LocationProvider>
      } /> 
      {/* <Route path="invoices/new" element={<PageInvoice />} />
      <Route path="invoices/:invoiceId" element={<PageInvoice />} />
      <Route path="quotes/new" element={<PageQuote />} />
      <Route path="quotes/:quoteId" element={<PageQuote />} />
      <Route path="agreements/new" element={<AgreementPage />} />
      <Route path="agreements/:agreementId" element={<AgreementPage />} />
      <Route path="projects/:projectId" element={<ProjectDetailPage />} /> */}
      <Route path="*" element={<Navigate to={`/${orgId}/clients/${clientId}`} replace    />} />
    </Routes>
  );
};

const ClientsRoutes = () => {
  return (
    <Routes>
      <Route path="" element={<ClientsPage />} />
      <Route
        path=":clientId/*"
        element={
          <ClientProvider>
            <ClientsDetailRoutes />
          </ClientProvider>
        }
      />
    </Routes>)
};

export default ClientsRoutes;
