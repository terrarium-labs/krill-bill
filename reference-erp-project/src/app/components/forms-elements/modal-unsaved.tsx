import React, { useState } from 'react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';

interface UnsavedChangesModalProps {
    isOpen: boolean;
    onClose: (confirmed: boolean) => void;
}

const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
    isOpen,
    onClose,
}) => {
    const { t } = useTranslation();

    const handleDiscard = () => {
        onClose(true);
    };

    const handleKeepEditing = () => {
        onClose(false);
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={() => onClose(false)}>
            <AlertDialogContent className="sm:max-w-[425px]">
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {t('unsaved_changes_title', 'Unsaved Changes')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('unsaved_changes_description', 'You have unsaved changes. Are you sure you want to leave without saving?')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex gap-2 sm:gap-2 justify-end">
                    <Button variant="outline"
                        onClick={handleKeepEditing}
                    >
                        {t('discard_changes', 'Keep Editing')}
                    </Button>
                    <Button onClick={handleDiscard}>
                        {t('keep_editing', 'Discard')}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

// Global state for the modal
let globalModalState = {
    isOpen: false,
    resolve: null as ((value: boolean) => void) | null,
};

// Function to trigger the modal
let triggerModalUpdate: (() => void) | null = null;

// Hook to manage the global modal state
export const useUnsavedChangesModal = () => {
    const [isOpen, setIsOpen] = useState(globalModalState.isOpen);

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

// Async function that returns a promise resolving to true/false
export const promptUnsavedChanges = (): Promise<boolean> => {
    return new Promise((resolve) => {
        globalModalState.isOpen = true;
        globalModalState.resolve = resolve;

        if (triggerModalUpdate) {
            triggerModalUpdate();
        }
    });
};

// Global modal component that should be included in your app root
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