import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { LandingPage } from "@/components/LandingPage";
import { ContactsProvider } from "@/contexts/contacts-context";
import { InvoicesProvider } from "@/contexts/invoices-context";
import { AppLayout } from "@/layout/AppLayout";
import ContactsPage from "@/pages/contacts/ContactsPage";
import InvoicePage from "@/pages/invoices/InvoicePage";
import InvoicesPage from "@/pages/invoices/InvoicesPage";
import SettingsPage from "@/pages/SettingsPage";

export default function App() {
  return (
    <ContactsProvider>
      <InvoicesProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="invoices/new" element={<InvoicePage />} />
              <Route path="invoices/:id" element={<InvoicePage />} />
              <Route path="contacts" element={<ContactsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </InvoicesProvider>
    </ContactsProvider>
  );
}
