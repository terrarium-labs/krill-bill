import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { MultiSelectApiEntity } from "@/app/components/forms-elements/multi-select-api-entity";

function plainEntityLabel(item: unknown): string | null {
    if (!item || typeof item !== "object") return null;
    const o = item as Record<string, unknown>;
    if (typeof o.name === "string" && o.name.trim()) return o.name;
    const first = typeof o.first_name === "string" ? o.first_name : "";
    const last = typeof o.last_name === "string" ? o.last_name : "";
    const combined = `${first} ${last}`.trim();
    return combined || null;
}

export type SigningRequestRecipientAddModalResult =
    | { kind: "email"; email: string }
    | { kind: "employee"; employee_id: string; label: string | null }
    | { kind: "group"; group_id: string; label: string | null };

export type SigningRequestRecipientAddModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: string | undefined;
    /** Called when the user confirms; parent validates (duplicates, etc.) and may keep the modal open on error. */
    onConfirm: (result: SigningRequestRecipientAddModalResult) => void;
    /** When true, only Email and Employee tabs are shown (parallel workflow). */
    disableGroupTab?: boolean;
    /** Optional override for dialog title (e.g. parallel “Add participant”). */
    title?: string;
    /** Optional override for dialog description. */
    description?: string;
    /** Label for the primary confirm button. */
    confirmLabel?: string;
};

const SigningRequestRecipientAddModal = ({
    open,
    onOpenChange,
    orgId,
    onConfirm,
    disableGroupTab = false,
    title,
    description,
    confirmLabel,
}: SigningRequestRecipientAddModalProps) => {
    const { t } = useTranslation();
    const [tab, setTab] = useState<"email" | "employee" | "group">("email");
    const [email, setEmail] = useState("");
    const [employeeIds, setEmployeeIds] = useState<string[]>([]);
    const [employeeLabel, setEmployeeLabel] = useState<string | null>(null);
    const [groupIds, setGroupIds] = useState<string[]>([]);
    const [groupLabel, setGroupLabel] = useState<string | null>(null);

    useEffect(() => {
        if (!open) {
            setTab("email");
            setEmail("");
            setEmployeeIds([]);
            setEmployeeLabel(null);
            setGroupIds([]);
            setGroupLabel(null);
        }
    }, [open]);

    useEffect(() => {
        if (open && disableGroupTab && tab === "group") {
            setTab("email");
        }
    }, [open, disableGroupTab, tab]);

    const handleConfirm = () => {
        if (tab === "email") {
            const trimmed = email.trim();
            if (!trimmed) {
                toast.error(t("signingRequests.create.invalidEmail", "Enter a valid email address."));
                return;
            }
            onConfirm({ kind: "email", email: trimmed });
            return;
        }
        if (tab === "employee") {
            const id = employeeIds[0];
            if (!id) {
                toast.error(t("signingRequests.create.selectEmployee", "Select an employee"));
                return;
            }
            onConfirm({ kind: "employee", employee_id: id, label: employeeLabel });
            return;
        }
        const gid = groupIds[0];
        if (!gid) {
            toast.error(t("signingRequests.create.selectGroup", "Select a group"));
            return;
        }
        onConfirm({ kind: "group", group_id: gid, label: groupLabel });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>
                        {title ??
                            t("signingRequests.create.bulkAddRecipientTitle", "Add recipient")}
                    </DialogTitle>
                    <DialogDescription>
                        {description ??
                            t(
                                "signingRequests.create.bulkAddRecipientDesc",
                                "Each signature area will be included for this recipient in the request."
                            )}
                    </DialogDescription>
                </DialogHeader>
                <Tabs
                    value={tab}
                    onValueChange={(v) => {
                        if (v === "email" || v === "employee" || v === "group") setTab(v);
                    }}
                    className="gap-4"
                >
                    <TabsList
                        className={cn("grid w-full", disableGroupTab ? "grid-cols-2" : "grid-cols-3")}
                    >
                        <TabsTrigger value="email">
                            {t("signingRequests.create.bulkTabEmail", "Email")}
                        </TabsTrigger>
                        <TabsTrigger value="employee">
                            {t("signingRequests.create.bulkTabEmployee", "Employee")}
                        </TabsTrigger>
                        {disableGroupTab ? null : (
                            <TabsTrigger value="group">
                                {t("signingRequests.create.bulkTabGroup", "Group")}
                            </TabsTrigger>
                        )}
                    </TabsList>
                    <TabsContent value="email" className="space-y-2">
                        <Input
                            id="sr-bulk-email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t(
                                "signingRequests.create.bulkEmailPlaceholder",
                                "name@company.com"
                            )}
                        />
                    </TabsContent>
                    <TabsContent value="employee" className="space-y-2">
                        {orgId ? (
                            <MultiSelectApiEntity
                                key="bulk-modal-employee"
                                entityType="employee"
                                orgId={orgId}
                                value={employeeIds}
                                onChangeValue={(ids) => setEmployeeIds(ids)}
                                onChangeValueWithItem={(ids, itemsMap) => {
                                    setEmployeeIds(ids);
                                    const id = ids[0];
                                    const item = id ? itemsMap.get(id) : undefined;
                                    setEmployeeLabel(item ? plainEntityLabel(item) : null);
                                }}
                                maxCount={1}
                                className="w-full min-w-0"
                            />
                        ) : null}
                    </TabsContent>
                    <TabsContent value="group" className="space-y-2">
                        {orgId ? (
                            <MultiSelectApiEntity
                                key="bulk-modal-group"
                                entityType="group"
                                orgId={orgId}
                                value={groupIds}
                                onChangeValue={(ids) => setGroupIds(ids)}
                                onChangeValueWithItem={(ids, itemsMap) => {
                                    setGroupIds(ids);
                                    const id = ids[0];
                                    const item = id ? itemsMap.get(id) : undefined;
                                    setGroupLabel(item ? plainEntityLabel(item) : null);
                                }}
                                maxCount={1}
                                className="w-full min-w-0"
                            />
                        ) : null}
                    </TabsContent>
                </Tabs>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        {t("common.cancel", "Cancel")}
                    </Button>
                    <Button type="button" onClick={handleConfirm}>
                        {confirmLabel ??
                            t("signingRequests.create.bulkAddRecipientConfirm", "Add recipient")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SigningRequestRecipientAddModal;
