import { UnsavedChangesGlobalModal } from '@/app/components/modals/unsaved-changes-modal';
import OrganizationsPage from '@/app/pages/organizations/OrganizationsPage';

export default function OrgSelectionLayout() {
  return (
    <div className="w-full h-screen">
      <OrganizationsPage />
      <UnsavedChangesGlobalModal />
    </div>
  );
}
