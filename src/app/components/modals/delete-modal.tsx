import * as React from "react";
import { useTranslation } from "react-i18next";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

/**
 * Props for the {@link DeleteModal} component.
 * Use this type when wrapping the generic delete modal or passing props to it.
 */
export interface DeleteModalProps {
    /** Controlled open state. */
    open: boolean;
    /** Called when open state should change (e.g. close via overlay/escape). */
    onOpenChange: (open: boolean) => void;
    /** Modal title. */
    title: React.ReactNode;
    /** Main description text. */
    description: React.ReactNode;
    /** Optional extra content below the description (e.g. summary card). */
    children?: React.ReactNode;
    /** Cancel button label. Default: "Cancel". Omit if using the default. */
    cancelText?: React.ReactNode;
    /** Confirm/delete button label. Default: "Delete". Omit if using the default. */
    deleteText?: React.ReactNode;
    /** Label shown while confirming (with spinner). Default: "Deleting...". */
    deletingText?: React.ReactNode;
    /** Called when the modal is closed (any method: overlay, escape, cancel, or after confirm). */
    onClose?: () => void;
    /** Called when the user clicks the delete button. May be async; modal closes after it resolves. */
    onConfirm?: () => void | Promise<void>;
    /** Called when the user clicks the Cancel button. */
    onCancel?: () => void;
    /** When true, delete button shows a spinner and both buttons are disabled. */
    isDeleting?: boolean;
    /** Optional class name for the dialog content (e.g. "max-w-md"). */
    contentClassName?: string;
}

/**
 * Generic delete confirmation modal with title, description, optional body content,
 * and Cancel / Delete actions. Use for any "Are you sure you want to delete…?" flows.
 *
 * @remarks
 * - Control visibility with `open` and `onOpenChange`.
 * - Only pass `cancelText`, `deleteText`, or `deletingText` when you need non-default labels.
 * - Pass `children` for extra content (e.g. a summary card) below the description.
 * - Initial focus is on the Delete button so Enter confirms (Escape still closes via the dialog).
 *
 * @example
 * ```tsx
 * <DeleteModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Delete item?"
 *   description="This cannot be undone."
 *   onConfirm={handleDelete}
 *   isDeleting={isDeleting}
 * />
 * ```
 */
export function DeleteModal({
    open,
    onOpenChange,
    title,
    description,
    children,
    cancelText,
    deleteText,
    deletingText,
    onClose,
    onConfirm,
    onCancel,
    isDeleting = false,
    contentClassName,
}: DeleteModalProps) {
    const { t } = useTranslation();

    const cancelTextValue = cancelText ?? t("common.cancel", "Cancel");
    const deleteTextValue = deleteText ?? t("common.delete", "Delete");
    const deletingTextValue = deletingText ?? t("common.deleting", "Deleting...");

    const handleOpenChange = React.useCallback(
        (next: boolean) => {
            if (!next) {
                onClose?.();
            }
            onOpenChange(next);
        },
        [onClose, onOpenChange]
    );

    const handleCancel = React.useCallback(() => {
        onCancel?.();
        onClose?.();
        onOpenChange(false);
    }, [onCancel, onClose, onOpenChange]);

    const handleConfirm = React.useCallback(async () => {
        if (!onConfirm) return;
        await onConfirm();
        onClose?.();
        onOpenChange(false);
    }, [onConfirm, onClose, onOpenChange]);

    const deleteButtonRef = React.useRef<HTMLButtonElement>(null);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className={contentClassName}
                showCloseButton={false}
                onOpenAutoFocus={(e) => {
                    e.preventDefault();
                    deleteButtonRef.current?.focus();
                }}
            >
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                {children ? <>{children}</> : null}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isDeleting}
                    >
                        {cancelTextValue}
                    </Button>
                    <Button
                        ref={deleteButtonRef}
                        type="button"
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" />
                                {deletingTextValue}
                            </>
                        ) : (
                            <>
                                {deleteTextValue}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default DeleteModal;
