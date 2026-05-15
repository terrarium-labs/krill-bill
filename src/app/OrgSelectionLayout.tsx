import { Outlet } from 'react-router';
import { UnsavedChangesGlobalModal } from '@/app/components/modals/unsaved-changes-modal';

export default function OrgSelectionLayout() {
  return (
    <div className="w-full h-screen">
      <Outlet />
      <UnsavedChangesGlobalModal />
    </div>
  );
}
