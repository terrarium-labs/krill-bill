import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { MultiSelect } from "@/app/components/forms-elements/multi-select";
import { MultiSelectApi } from "@/app/components/forms-elements/multi-select-api";
import { getOrgEmployees } from "@/api/employees/employees";
import { getClients } from "@/api/clients/clients";
import { getSuppliers } from "@/api/suppliers/suppliers";
import { postOrgUserAssign } from "@/api/orgs/users/users";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { OrgUser } from "@/types/general/user";
import { Employee } from "@/types/employees/employees";
import { Client } from "@/types/clients/client";
import { Supplier } from "@/types/suppliers/supplier";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import ClientLabel from "@/app/components/labels/client-label";
import EmployeeLabel from "@/app/components/labels/employee-label";
import SupplierLabel from "@/app/components/labels/supplier-label";

interface UserAssignmentAddModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: string;
    user: OrgUser;
    onSuccess: () => void;
}

type EntityType = "employee" | "client" | "supplier";

const assignUserFormSchema = z.object({
    entity_type: z.array(z.enum(["employee", "client", "supplier"])).min(1, "Entity type is required"),
    entity_id: z.array(z.string()).min(1, "Entity selection is required"),
});

type AssignUserFormValues = z.infer<typeof assignUserFormSchema>;

const UserAssignmentAddModal = ({ open, onOpenChange, orgId, user, onSuccess }: UserAssignmentAddModalProps) => {
    const { t } = useTranslation();

    const form = useForm<AssignUserFormValues>({
        resolver: zodResolver(assignUserFormSchema),
        defaultValues: {
            entity_type: [],
            entity_id: [],
        },
    });

    // Initialize with current assignment
    useEffect(() => {
        if (open && user) {
            if (user.employee?.id) {
                form.reset({
                    entity_type: ["employee"],
                    entity_id: [user.employee.id],
                });
            } else if (user.client?.id) {
                form.reset({
                    entity_type: ["client"],
                    entity_id: [user.client.id],
                });
            } else if (user.supplier?.id) {
                form.reset({
                    entity_type: ["supplier"],
                    entity_id: [user.supplier.id],
                });
            } else {
                form.reset({
                    entity_type: [],
                    entity_id: [],
                });
            }
        }
    }, [open, user, form]);

    const entityTypeOptions = [
        { value: "employee", label: t("admin.users.users.employee", "Employee") },
        { value: "client", label: t("admin.users.users.client", "Client") },
        { value: "supplier", label: t("admin.users.users.supplier", "Supplier") },
    ];

    // Get the current entity type from form
    const currentEntityType = form.watch("entity_type")?.[0] as EntityType | undefined;

    // Create wrapper functions that match the MultiSelectApi expected signature
    const fetchEmployees = async (orgId: string, query: string) => {
        // Call getOrgEmployees with all parameters, setting optional ones to undefined
        return await getOrgEmployees(
            orgId,
            undefined, // not_org_workplace_id
            undefined, // not_org_group_id
            undefined, // not_job_title_id
            undefined, // not_org_time_policy_id
            undefined, // not_assigned_to_wo_id
            undefined, // not_supervised_by_wo_id
            query || undefined,
        );
    };

    const fetchClients = async (orgId: string, query: string) => {
        return await getClients(orgId, query || undefined);
    };

    const fetchSuppliers = async (orgId: string, query: string) => {
        return await getSuppliers(orgId, query || undefined);
    };


    // Get value for entity
    const getEntityValue = (item: any) => item.id;

    // Render entity selector based on entity type - similar to RenderEmployeeSelector pattern
    const RenderEntitySelector = ({ entityType }: { entityType: EntityType | undefined }) => {
        if (!entityType) return null;

        switch (entityType) {
            case "employee":
                return (
                    <FormField
                        control={form.control}
                        name="entity_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    {t("admin.users.users.selectEntity", "Select Entity")}
                                </FormLabel>
                                <FormControl>
                                    <MultiSelectApi
                                        fetchOptions={fetchEmployees}
                                        fetchArgs={[orgId]}
                                        optionsKey="employees"
                                        customValueKey={getEntityValue}
                                        customLabelKey={(item) => <EmployeeLabel data={item as Employee} />}
                                        value={field.value}
                                        onChangeValue={field.onChange}
                                        placeholder={t("admin.users.users.selectEntity", "Select entity...")}
                                        maxCount={1}
                                        className="w-full truncate"
                                    />
                                </FormControl>
                                <p className="text-xs text-muted-foreground">
                                    {t(
                                        "admin.users.users.selectEmployeeFieldDescription",
                                        "Pick the employee record this login should act as.",
                                    )}
                                </p>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                );
            case "client":
                return (
                    <FormField
                        control={form.control}
                        name="entity_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    {t("admin.users.users.selectEntity", "Select Entity")}
                                </FormLabel>
                                <FormControl>
                                    <MultiSelectApi
                                        fetchOptions={fetchClients}
                                        fetchArgs={[orgId]}
                                        optionsKey="clients"
                                        customValueKey={getEntityValue}
                                        customLabelKey={(item) => <ClientLabel data={item as Client} />}
                                        value={field.value}
                                        onChangeValue={field.onChange}
                                        placeholder={t("admin.users.users.selectEntity", "Select entity...")}
                                        maxCount={1}
                                        className="w-full truncate"
                                    />
                                </FormControl>
                                <p className="text-xs text-muted-foreground">
                                    {t(
                                        "admin.users.users.selectClientFieldDescription",
                                        "Pick the client record this login should act as.",
                                    )}
                                </p>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                );
            case "supplier":
                return (
                    <FormField
                        control={form.control}
                        name="entity_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    {t("admin.users.users.selectEntity", "Select Entity")}
                                </FormLabel>
                                <FormControl>
                                    <MultiSelectApi
                                        fetchOptions={fetchSuppliers}
                                        fetchArgs={[orgId]}
                                        optionsKey="suppliers"
                                        customValueKey={getEntityValue}
                                        customLabelKey={(item) => <SupplierLabel data={item as Supplier} />}
                                        value={field.value}
                                        onChangeValue={field.onChange}
                                        placeholder={t("admin.users.users.selectEntity", "Select entity...")}
                                        maxCount={1}
                                        className="w-full truncate"
                                    />
                                </FormControl>
                                <p className="text-xs text-muted-foreground">
                                    {t(
                                        "admin.users.users.selectSupplierFieldDescription",
                                        "Pick the supplier record this login should act as.",
                                    )}
                                </p>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                );
            default:
                return null;
        }
    };

    // Handle submit
    const handleSubmit = async (values: AssignUserFormValues) => {
        const entityType = values.entity_type[0];
        const entityId = values.entity_id[0];

        try {
            // Build payload with all fields, setting only the selected one
            const assignPayload = {
                employee_id: entityType === "employee" ? entityId : null,
                client_id: entityType === "client" ? entityId : null,
                supplier_id: entityType === "supplier" ? entityId : null,
            };

            const response = await postOrgUserAssign(orgId, user.id, assignPayload);

            if (response.success) {
                toast.success(t("admin.users.users.assignedSuccess", "User assigned successfully"));
                onSuccess();
                onOpenChange(false);
            } else {
                toast.error(t("admin.users.users.assignError", "Error assigning user"));
            }
        } catch (error) {
            console.error("Error assigning user:", error);
            toast.error(t("admin.users.users.assignError", "Error assigning user"));
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>{t("admin.users.users.assignUser", "Assign User")}</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 my-4">
                        {/* Entity Type Selector */}
                        <FormField
                            control={form.control}
                            name="entity_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t("admin.users.users.entityType", "Entity Type")}
                                    </FormLabel>
                                    <FormControl>
                                        <MultiSelect
                                            options={entityTypeOptions}
                                            selected={field.value}
                                            onSelectedChange={(value) => {
                                                field.onChange(value);
                                                // Reset entity selection when type changes
                                                form.setValue("entity_id", []);
                                            }}
                                            placeholder={t("admin.users.users.selectEntityType", "Select entity type...")}
                                            maxCount={1}
                                            className="w-full"
                                        />
                                    </FormControl>
                                    <FormDescription className="text-xs text-muted-foreground">
                                        {t(
                                            "admin.users.users.entityTypeFieldDescription",
                                            "Whether this user represents an employee, client, or supplier.",
                                        )}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Entity Selector */}
                        <RenderEntitySelector entityType={currentEntityType} />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={form.formState.isSubmitting}
                            >
                                {t("common.cancel", "Cancel")}
                            </Button>
                            <Button
                                type="submit"
                                disabled={form.formState.isSubmitting}
                            >
                                {form.formState.isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        {t("common.saving", "Saving...")}
                                    </>
                                ) : (
                                    t("admin.users.users.assign", "Assign")
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default UserAssignmentAddModal;

