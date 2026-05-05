import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import PageHeader from "@/app/components/page-header";
import { useEmployee } from "../contexts/EmployeeContext";
import IdBadge from "@/app/components/id-badge";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from "@/components/ui/shadcn-io/tabs";
import EmployeeDetailPageSummary from "./pages/EmployeeDetailPageSummary/EmployeeDetailPageSummary";
import EmployeeDetailPagePayrolls from "./pages/EmployeeDetailPagePayrolls/EmployeeDetailPagePayrolls";
import EmployeeDetailPageContracts from "./pages/EmployeeDetailPageContracts/EmployeeDetailPageContracts";
import EmployeeDetailPageWorkOrders from "./pages/EmployeeDetailPageWorkOrders/EmployeeDetailPageWorkOrders";
import EmployeeDetailPageManager from "./pages/EmployeeDetailPageManager/EmployeeDetailPageManager";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { deleteEmployee } from "@/api/employees/employees";
import FilesSection from "@/app/components/files/files-section";
import Tag from "@/app/components/tag/tag";
import EmployeeEditModal from "../components/employee-edit-modal";
import EmployeeDeleteModal from "../components/employee-delete-modal";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";
import EmployeeDetailPageTime from "./pages/EmployeeDetailPageTime/EmployeeDetailPageTime";
import EmployeeDetailPageTrainings from "./pages/EmployeeDetailPageTrainings/EmployeeDetailPageTrainings";
import EmployeeDetailPageBonus from "./pages/EmployeeDetailPageBonus/EmployeeDetailPageBonus";

const EmployeeDetailPage = () => {
    const { t } = useTranslation();
    const { employee, refreshEmployee } = useEmployee();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();

    // State for modals
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingEmployee, setDeletingEmployee] = useState(false);

    // Get current tab from URL or default to 'summary'
    const currentTab = searchParams.get('tab') || 'summary';

    // Valid tab values
    const validTabs = ['summary', 'payrolls', 'contracts', 'time', 'work-orders', 'bonuses', 'trainings', 'manager', 'files'];

    // Tab values that show the time section (for sub-tab deep links)
    const timeTabValues = ['time', 'schedule', 'activity', 'absences'] as const;

    // Map time sub-tab param to active main tab
    const activeTab = timeTabValues.includes(currentTab as (typeof timeTabValues)[number])
      ? 'time'
      : validTabs.includes(currentTab)
        ? currentTab
        : 'summary';

    // Handle tab change
    const handleTabChange = (value: string) => {
        if (validTabs.includes(value)) {
            setSearchParams({ tab: value });
        }
    };

    // Handle edit employee
    const handleEditEmployee = () => {
        setEditModalOpen(true);
    };

    // Handle delete confirmation
    const handleDeleteConfirm = () => {
        setDeleteModalOpen(true);
    };

    // Handle delete execution
    const handleDeleteEmployee = async () => {
        if (!employee?.id || !orgId) return;

        setDeletingEmployee(true);
        try {
            const response = await deleteEmployee(orgId, employee.id);
            if (response.success) {
                toast.success(t("employees.employeeDeleted", "Employee deleted successfully"));
                setDeleteModalOpen(false);
                navigate(`/${orgId}/employees`);
            } else {
                toast.error(t("employees.errorDeletingEmployee", "Error deleting employee"));
            }
        } catch (error) {
            toast.error(t("employees.errorDeletingEmployee", "Error deleting employee"));
        } finally {
            setDeletingEmployee(false);
        }
    };

    // Handle employee updated
    const handleEmployeeUpdated = () => {
        refreshEmployee();
    };

    // Handle edit modal close
    const handleEditModalClose = (open: boolean) => {
        setEditModalOpen(open);
    };

    return (
        <>
            <PageHeader
                beforeTextChildren={<EmployeeAvatar employee={employee} showName={false} size="2xl" imageEditable={true} onImageChange={handleEmployeeUpdated} />}
                title={`${employee.first_name} ${employee.last_name}`.trim()}
                description={employee.email ?? ""}
                showBackButton={true}
                action={
                    <div className="flex items-center gap-2">
                        {employee.job_title?.name && <Tag text={employee.job_title?.name || '-'} />}
                        <IdBadge id={employee.id || ""} className="h-6 px-4 text-xs" />
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t('common.actions.edit', 'Edit'),
                                    icon: "edit",
                                    onClick: handleEditEmployee,
                                },
                                {
                                    label: t('common.actions.delete', 'Delete'),
                                    icon: "trash-2",
                                    onClick: handleDeleteConfirm,
                                    variant: "destructive",
                                },
                            ]}
                        />
                    </div>
                }
            />

            <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList
                    className="w-full justify-start border-b-2 border-border bg-background mb-4"
                    activeClassName='border-b-2 border-primary -mb-1.5'
                >
                    <TabsTrigger className="py-0" value="summary">{t('employeesDetail.summary', 'Summary')}</TabsTrigger>
                    <TabsTrigger className="py-0" value="payrolls">{t('employeesDetail.payrolls', 'Payrolls')}</TabsTrigger>
                    <TabsTrigger className="py-0" value="contracts">{t('employeesDetail.contracts', 'Contracts')}</TabsTrigger>
                    <TabsTrigger className="py-0" value="time">{t('employeesDetail.timeAndAttendance', 'Time & Attendance')}</TabsTrigger>
                    {/* Todo: Implement work orders
                    <TabsTrigger className="py-0" value="work-orders">{t('employeesDetail.workOrders', 'Work Orders')}</TabsTrigger> */}
                    <TabsTrigger className="py-0" value="bonuses">{t('employeesDetail.bonuses', 'Bonuses')}</TabsTrigger>
                    <TabsTrigger className="py-0" value="trainings">{t('employeesDetail.trainings', 'Trainings')}</TabsTrigger>
                    {(employee.is_supervisor || employee.is_absence_supervisor) && <TabsTrigger className="py-0" value="manager">{t('employeesDetail.manager', 'Manager')}</TabsTrigger>}
                    <TabsTrigger className="py-0" value="files">{t('employeesDetail.files', 'Files')}</TabsTrigger>
                </TabsList>

                <TabsContents transition={{ duration: 0 }}>
                    <TabsContent value="summary" transition={{ duration: 0 }}>
                        <EmployeeDetailPageSummary onEdit={handleEditEmployee} />
                    </TabsContent>
                    <TabsContent value="payrolls" transition={{ duration: 0 }}>
                        <EmployeeDetailPagePayrolls />
                    </TabsContent>
                    <TabsContent value="contracts" transition={{ duration: 0 }}>
                        <EmployeeDetailPageContracts />
                    </TabsContent>
                    <TabsContent value="time" transition={{ duration: 0 }}>
                        <EmployeeDetailPageTime />
                    </TabsContent>
                    <TabsContent value="work-orders" transition={{ duration: 0 }}>
                        <EmployeeDetailPageWorkOrders />
                    </TabsContent>
                    <TabsContent value="bonuses" transition={{ duration: 0 }}>
                        <EmployeeDetailPageBonus />
                    </TabsContent>
                    <TabsContent value="trainings" transition={{ duration: 0 }}>
                        <EmployeeDetailPageTrainings />
                    </TabsContent>
                    {(employee.is_supervisor || employee.is_absence_supervisor) && <TabsContent value="manager" transition={{ duration: 0 }}>
                        <EmployeeDetailPageManager />
                    </TabsContent>}
                    <TabsContent value="files" transition={{ duration: 0 }}>
                        <FilesSection key={`employee-files-${employee.id}`} entity_id={employee.id || ""} />
                    </TabsContent>
                </TabsContents>
            </Tabs>

            {/* Edit Employee Modal */}
            <EmployeeEditModal
                open={editModalOpen}
                onOpenChange={handleEditModalClose}
                onEmployeeCreatedOrUpdated={handleEmployeeUpdated}
                employee={employee}
                mode="edit"
                renderActions={(_employee, closeModal) => (
                    <CustomActionsDropdown
                        items={[
                            {
                                label: t('common.actions.delete', 'Delete'),
                                icon: "trash-2",
                                onClick: () => {
                                    closeModal();
                                    handleDeleteConfirm();
                                },
                                variant: "destructive",
                            },
                        ]}
                    />
                )}
            />

            <EmployeeDeleteModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                employee={employee}
                onConfirm={handleDeleteEmployee}
                isDeleting={deletingEmployee}
            />
        </>
    );
};

export default EmployeeDetailPage;

