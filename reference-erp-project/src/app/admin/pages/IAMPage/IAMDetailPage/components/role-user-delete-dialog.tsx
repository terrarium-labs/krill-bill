import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { OrgUser } from "@/types/general/user";

interface RoleUserDeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: OrgUser | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const RoleUserDeleteDialog: React.FC<RoleUserDeleteDialogProps> = ({
    open,
    onOpenChange,
    user,
    onConfirm,
    isDeleting,
}) => {
    const { t } = useTranslation();

    const userName = user?.first_name && user?.last_name
        ? `${user.first_name} ${user.last_name}`
        : user?.email;

    return (
        <Dialog
            open={open}
            onOpenChange={(open) => {
                onOpenChange(open);
                if (!open) {
                    // Force remove pointer-events: none from body if it gets stuck
                    setTimeout(() => {
                        document.body.style.removeProperty('pointer-events');
                    }, 100);
                }
            }}
        >
            <DialogContent showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>{t("admin.iam.users.deleteUser", "Remove User")}</DialogTitle>
                    <DialogDescription>
                        {t(
                            "admin.iam.users.deleteUserDescription",
                            "Are you sure you want to remove '{{name}}' from this role? This action cannot be undone.",
                            { name: userName }
                        )}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                    >
                        {t("common.cancel", "Cancel")}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {t("common.deleting", "Removing...")}
                            </>
                        ) : (
                            t("common.delete", "Remove")
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default RoleUserDeleteDialog;
