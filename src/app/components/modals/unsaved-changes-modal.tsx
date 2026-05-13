import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onClose: (confirmed: boolean) => void;
}

/**
 * Modal for confirming unsaved changes.
 * Uses shadcn Dialog component for warning dialogs.
 */
const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const discardButtonRef = React.useRef<HTMLButtonElement>(null);

  const handleDiscard = () => {
    onClose(true);
  };

  const handleKeepEditing = () => {
    onClose(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose(false)}>
      <DialogContent
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          discardButtonRef.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>{t('modals.unsavedChanges.title', 'Unsaved Changes')}</DialogTitle>
          <DialogDescription>
            {t('modals.unsavedChanges.description', 'You have unsaved changes. Are you sure you want to leave without saving?')}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleKeepEditing}
          >
            {t('modals.unsavedChanges.keepEditing', 'Keep Editing')}
          </Button>
          <Button
            ref={discardButtonRef}
            type="button"
            variant="destructive"
            onClick={handleDiscard}
          >
            {t('modals.unsavedChanges.discard', 'Discard')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Global state for the modal
let globalModalState = {
  isOpen: false,
  resolve: null as ((value: boolean) => void) | null,
};

// Function to trigger the modal
let triggerModalUpdate: (() => void) | null = null;

/**
 * Hook to manage the global modal state.
 * Used for displaying unsaved changes confirmation modal.
 */
export const useUnsavedChangesModal = () => {
  const [isOpen, setIsOpen] = React.useState(globalModalState.isOpen);

  React.useEffect(() => {
    triggerModalUpdate = () => {
      setIsOpen(globalModalState.isOpen);
    };
    return () => {
      triggerModalUpdate = null;
    };
  }, []);

  const handleClose = (confirmed: boolean) => {
    globalModalState.isOpen = false;
    setIsOpen(false);
    if (globalModalState.resolve) {
      globalModalState.resolve(confirmed);
      globalModalState.resolve = null;
    }
  };

  return {
    isOpen,
    handleClose,
  };
};

/**
 * Async function that returns a promise resolving to true if user wants to discard changes, false otherwise.
 * @returns Promise<boolean> - true to discard, false to keep editing
 */
export const promptUnsavedChanges = (): Promise<boolean> => {
  return new Promise((resolve) => {
    globalModalState.isOpen = true;
    globalModalState.resolve = resolve;

    if (triggerModalUpdate) {
      triggerModalUpdate();
    }
  });
};

/**
 * Global modal component that should be included in your app root.
 * Manages unsaved changes confirmation at application level.
 */
export const UnsavedChangesGlobalModal: React.FC = () => {
  const { isOpen, handleClose } = useUnsavedChangesModal();

  return (
    <UnsavedChangesModal
      isOpen={isOpen}
      onClose={handleClose}
    />
  );
};

export default UnsavedChangesModal;
