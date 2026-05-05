import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { useTranslation } from "@/hooks/useTranslation";
import {
    postEmployeePayroll,
    patchEmployeePayroll,
    getEmployeePayroll,
} from "@/api/employees/payrolls/payrolls";
import { getOrgEmployees } from "@/api/employees/employees";
import { PayrollLine } from "@/types/employees/payrolls";

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
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/app/components/forms-elements/date-time-picker";
import { MultiSelectApi } from "@/app/components/forms-elements/multi-select-api";
import IdBadge from "@/app/components/id-badge";
import { promptUnsavedChanges } from "@/app/components/forms-elements/modal-unsaved";
import { formatDateForAPI } from "@/utils/miscelanea";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from "@/components/ui/shadcn-io/tabs";
import PayrollLinesEditor from "./payroll-lines-editor";
import FilesSection from "@/app/components/files/files-section";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";

// Form validation schema
const payrollSchema = z.object({
    employee_id: z.string().min(1, "Employee is required"),
    start_date: z.date().refine((val) => val !== null && val !== undefined, {
        message: "Start date is required",
    }),
    end_date: z.date().refine((val) => val !== null && val !== undefined, {
        message: "End date is required",
    }),
    payment_date: z.date().refine((val) => val !== null && val !== undefined, {
        message: "Payment date is required",
    }),
});

type FormValues = z.infer<typeof payrollSchema>;

interface PayrollEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPayrollSaved?: () => void;
    orgId: string;
    employeeId?: string; // Pre-selected employee (for employee detail page)
    payrollId?: string; // For edit mode - payroll will be fetched
    mode: "create" | "edit";
    renderActions?: () => React.ReactNode; // Custom actions for edit mode (e.g., delete dropdown)
}

const PayrollEditModal: React.FC<PayrollEditModalProps> = ({
    open,
    onOpenChange,
    onPayrollSaved,
    orgId,
    employeeId,
    payrollId,
    mode,
    renderActions,
}) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingPayroll, setIsFetchingPayroll] = useState(false);
    const [payrollLines, setPayrollLines] = useState<any[]>([]);
    const [initialLines, setInitialLines] = useState<PayrollLine[]>([]);
    const [modalPayrollId, setModalPayrollId] = useState<string | undefined>(payrollId);
    const [payrollEmployee, setPayrollEmployee] = useState<any>(null);
    const isEditMode = mode === "edit";
    const [activeTab, setActiveTab] = useState<string>("payroll-lines");
    // Handle lines changes from the editor
    const handleLinesChange = useCallback((lines: any[]) => {
        setPayrollLines(lines);
    }, []);

    const handleTabChange = useCallback((value: string) => {
        setActiveTab(value);
    }, []);

    const form = useForm<FormValues>({
        resolver: zodResolver(payrollSchema),
        defaultValues: {
            employee_id: employeeId || "",
            start_date: new Date(),
            end_date: new Date(),
            payment_date: new Date(),
        },
    });

    useEffect(() => {
        if (open) {
            setModalPayrollId(payrollId || undefined);
        }
    }, [open, payrollId]);

    // Fetch payroll data when modal opens in edit mode
    useEffect(() => {
        const fetchPayrollData = async () => {
            if (!open || !isEditMode || !modalPayrollId || !employeeId) return;

            setIsFetchingPayroll(true);
            try {
                const response = await getEmployeePayroll(orgId, employeeId, modalPayrollId);
                if (response.success) {
                    const payroll = response.success.payroll;

                    // Store employee for defaultItems
                    if (payroll.employee) {
                        setPayrollEmployee(payroll.employee);
                    }

                    // Set form values from fetched data
                    form.reset({
                        employee_id: payroll.employee?.id || employeeId || "",
                        start_date: new Date(payroll.start_date),
                        end_date: new Date(payroll.end_date),
                        payment_date: new Date(payroll.payment_date),
                    });

                    // Set initial lines for the editor
                    if (payroll.lines) {
                        const sortedLines = [...payroll.lines].sort((a: PayrollLine, b: PayrollLine) => a.order - b.order);
                        setInitialLines(sortedLines);
                    }
                }
            } catch (error) {
                console.error("Error fetching payroll:", error);
                toast.error(t("payrolls.fetchError", "Failed to load payroll data"));
            } finally {
                setIsFetchingPayroll(false);
            }
        };

        if (open && isEditMode && modalPayrollId) {
            fetchPayrollData();
        } else if (open && !isEditMode) {
            // Create mode - use defaults or pre-selected employee
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            form.reset({
                employee_id: employeeId || "",
                start_date: firstDayOfMonth,
                end_date: lastDayOfMonth,
                payment_date: lastDayOfMonth,
            });
            setInitialLines([]);
        }
    }, [open, isEditMode, modalPayrollId, employeeId, orgId, form, t]);

    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            // Format lines for API - remove internal flags and only include non-deleted lines
            const formattedLines = payrollLines
                .filter((line) => !line.isDeleted)
                .map((line, index) => ({
                    id: line.isNew ? undefined : line.id, // Don't send id for new lines
                    concept: line.concept,
                    amount: line.amount ?? 0,
                    type: line.type,
                    sub_type: line.sub_type,
                    order: index,
                }));

            const requestData = {
                start_date: formatDateForAPI(values.start_date),
                end_date: formatDateForAPI(values.end_date),
                payment_date: formatDateForAPI(values.payment_date),
                lines: formattedLines,
            };

            let response;
            const targetEmployeeId = values.employee_id;

            if (isEditMode && modalPayrollId) {
                response = await patchEmployeePayroll(
                    orgId,
                    targetEmployeeId,
                    modalPayrollId,
                    requestData
                );
            } else {
                response = await postEmployeePayroll(orgId, targetEmployeeId, requestData);
            }

            if (response.success) {
                const successMessage = isEditMode
                    ? t("payrolls.updatedSuccess", "Payroll updated successfully")
                    : t("payrolls.createdSuccess", "Payroll created successfully");

                if (response.success.payroll_id) {
                    setModalPayrollId(response.success.payroll_id);
                }

                toast.success(successMessage);
                form.reset();
                setPayrollLines([]);
                setInitialLines([]);
                onOpenChange(false);
                if (onPayrollSaved) {
                    onPayrollSaved();
                }
            } else {
                const errorMessage = isEditMode
                    ? response.error || t("payrolls.updateError", "Failed to update payroll")
                    : response.error || t("payrolls.createError", "Failed to create payroll");

                toast.error(errorMessage);
            }
        } catch (error) {
            console.error(`Error ${isEditMode ? "updating" : "creating"} payroll:`, error);
            const errorMessage = isEditMode
                ? t("payrolls.updateError", "Failed to update payroll")
                : t("payrolls.createError", "Failed to create payroll");
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenChange = async (open: boolean) => {
        if (!open) {
            if (form.formState.isDirty) {
                const discard = await promptUnsavedChanges();
                if (discard) {
                    form.reset();
                    setPayrollLines([]);
                    setInitialLines([]);
                    onOpenChange(false);
                }
            } else {
                form.reset();
                setPayrollLines([]);
                setInitialLines([]);
                onOpenChange(false);
            }
        } else {
            onOpenChange(open);
        }
    };

    const handleInteractOutside = (e: Event) => {
        if (form.formState.isDirty) {
            e.preventDefault();
            handleOpenChange(false);
        }
    };

    const dialogTitle = isEditMode
        ? t("payrolls.editPayroll", "Edit Payroll")
        : t("payrolls.createPayroll", "Create Payroll");

    return (
        <Dialog open={open} onOpenChange={handleOpenChange} >
            <DialogContent
                className="max-w-2xl md:min-w-4xl w-full max-h-[90vh] min-h-[90vh] overflow-y-auto flex flex-col"
                showCloseButton={false}
                onPointerDownOutside={handleInteractOutside}
                onEscapeKeyDown={handleInteractOutside}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between gap-2 text-lg font-semibold">
                        <span>{dialogTitle}</span>
                        {isEditMode && modalPayrollId && (
                            <div className="flex items-center gap-2">
                                <IdBadge id={modalPayrollId} />
                                {renderActions && renderActions()}
                            </div>
                        )}
                    </DialogTitle>
                </DialogHeader>

                {isFetchingPayroll ? (
                    <div className="flex items-center justify-center py-12 flex-1">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <Form {...form}>
                        <div className="space-y-4 overflow-y-auto max-h-[90vh] px-2 scrollbar-hide mb-16">
                            <div className="grid grid-cols-1 md:grid-cols-3 col-span-1 md:col-span-3">
                                <FormField
                                    control={form.control}
                                    name="employee_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("payrolls.employee", "Employee")} *</FormLabel>
                                            <FormControl>
                                                <MultiSelectApi
                                                    fetchOptions={getOrgEmployees}
                                                    fetchArgs={[orgId, undefined, undefined, undefined, undefined, undefined, undefined]}
                                                    optionsKey="employees"
                                                    enableParams="hidden"
                                                    defaultParams="employees"
                                                    customValueKey={(item) => item.id}
                                                    customLabelKey={(item) => <EmployeeAvatar employee={item} />}
                                                    placeholder={t("payrolls.selectEmployee", "Select employee...")}
                                                    searchPlaceholder={t("payrolls.searchEmployee", "Search employees...")}
                                                    emptyText={t("payrolls.noEmployees", "No employees found.")}
                                                    value={field.value ? [field.value] : []}
                                                    onChangeValue={(values) => {
                                                        const selectedValue = values[0] || "";
                                                        field.onChange(selectedValue);
                                                    }}
                                                    defaultItems={payrollEmployee ? [payrollEmployee] : undefined}
                                                    maxCount={1}
                                                    disabled={isLoading || (employeeId !== undefined)}
                                                    className="w-full truncate"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Date Pickers - 3 Column Layout */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Start Date */}
                                <DateTimePicker
                                    form={form}
                                    name="start_date"
                                    showMonthYearPicker={true}
                                    label={t("payrolls.startDate", "Start")}
                                    required={true}
                                    disabled={isLoading}
                                    showTime={false}
                                />

                                {/* End Date */}
                                <DateTimePicker
                                    form={form}
                                    name="end_date"
                                    showMonthYearPicker={true}
                                    label={t("payrolls.endDate", "End")}
                                    required={true}
                                    disabled={isLoading}
                                    showTime={false}
                                />

                                {/* Payment Date */}
                                <DateTimePicker
                                    form={form}
                                    name="payment_date"
                                    showMonthYearPicker={true}
                                    label={t("payrolls.paymentDate", "Payment")}
                                    required={true}
                                    disabled={isLoading}
                                    showTime={false}
                                />
                            </div>

                            <Tabs value={activeTab} onValueChange={handleTabChange}>
                                <TabsList className="w-full justify-start border-b-2 border-border bg-background" activeClassName='border-b-2 border-primary -mb-1.5'>
                                    <TabsTrigger className="py-0" value="payroll-lines">{t("payrolls.tabs.payrollLines", "Payroll Lines")}</TabsTrigger>
                                    <TabsTrigger className="py-0" value="files">{t("payrolls.tabs.files", "Files")}</TabsTrigger>
                                </TabsList>
                                <TabsContents transition={{ duration: 0 }}>
                                    <TabsContent value="payroll-lines" transition={{ duration: 0 }}>
                                        <div className="mt-2">
                                            <PayrollLinesEditor
                                                isEditMode={isEditMode}
                                                initialLines={initialLines}
                                                onChange={handleLinesChange}
                                            />
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="files" transition={{ duration: 0 }}>
                                        <div className={`${isEditMode ? "mt-2" : ""}`}>
                                            <FilesSection
                                                entity_id={modalPayrollId}
                                                showBreadcrumbs={isEditMode}
                                                showSearch={isEditMode}
                                                showCreateFolder={false}
                                                showUpload={isEditMode}
                                            />
                                        </div>
                                    </TabsContent>
                                </TabsContents>
                            </Tabs>

                            <DialogFooter className="flex-col rounded-b-lg sm:flex-row gap-2 fixed bottom-0 left-0 right-0 bg-background p-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleOpenChange(false)}
                                    disabled={isLoading}
                                >
                                    {t("common.cancel", "Cancel")}
                                </Button>
                                <Button
                                    type="submit"
                                    onClick={form.handleSubmit(onSubmit)}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            {isEditMode
                                                ? t("payrolls.updating", "Updating...")
                                                : t("payrolls.creating", "Creating...")}
                                        </>
                                    ) : isEditMode ? (
                                        t("common.update", "Update")
                                    ) : (
                                        t("common.create", "Create")
                                    )}
                                </Button>
                            </DialogFooter>
                        </div>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default PayrollEditModal;

