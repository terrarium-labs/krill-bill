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
import { OrgUser } from "@/types/general/user";

interface UserAssignmentRemoveModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: OrgUser | null;
    onConfirm: () => void;
    isRemoving: boolean;
}

const UserAssignmentRemoveModal = ({
    open,
    onOpenChange,
    user,
    onConfirm,
    isRemoving,
}: UserAssignmentRemoveModalProps) => {
    const { t } = useTranslation();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>{t("admin.users.users.removeAssignment", "Remove Assignment")}</DialogTitle>
                    <DialogDescription>
                        {t("admin.users.users.removeAssignmentConfirmation", "Are you sure you want to remove this user's assignment? This action can be undone by assigning them again.")}
                        {user && (
                            <div className="mt-2 p-2 bg-muted rounded">
                                <strong>
                                    {`${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email}
                                </strong>
                            </div>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isRemoving}
                    >
                        {t("common.cancel", "Cancel")}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isRemoving}
                    >
                        {isRemoving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t("common.removing", "Removing...")}
                            </>
                        ) : (
                            t("admin.users.users.removeAssignment", "Remove Assignment")
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default UserAssignmentRemoveModal;
