import { useEffect } from "react";
import { useBlocker } from "react-router";
import UnsavedChangesModal from "./forms-elements/modal-unsaved";

interface UnsavedChangesGuardProps {
  hasUnsavedChanges: boolean;
  children: React.ReactNode;
}

/**
 * Wrapper component that protects against losing unsaved changes
 * - Blocks in-app navigation with a custom modal
 * - Blocks browser tab/window close with native browser dialog
 * 
 * Usage:
 * ```tsx
 * <UnsavedChangesGuard hasUnsavedChanges={isDirty}>
 *   <YourPageContent />
 * </UnsavedChangesGuard>
 * ```
 */
export const UnsavedChangesGuard: React.FC<UnsavedChangesGuardProps> = ({
  hasUnsavedChanges,
  children,
}) => {
  // Block navigation when there are unsaved changes
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
  );

  // Block browser tab/window close when there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ""; // Required for Chrome
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return (
    <>
      {children}
      
      {/* Unsaved changes blocker dialog */}
      <UnsavedChangesModal
        isOpen={blocker.state === "blocked"}
        onClose={(confirmed) => {
          if (blocker.state === "blocked") {
            if (confirmed) {
              blocker.proceed();
            } else {
              blocker.reset();
            }
          }
        }}
      />
    </>
  );
};
