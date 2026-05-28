import { UnsavedChangesGlobalModal } from '@/app/components/modals/unsaved-changes-modal';
import OrgSelectionPage from '@/app/pages/OrgSelectionPage';

export default function OrgSelectionLayout() {
  return (
    <div className="w-full h-screen">
      <OrgSelectionPage />
      <UnsavedChangesGlobalModal />
    </div>
  );
}
