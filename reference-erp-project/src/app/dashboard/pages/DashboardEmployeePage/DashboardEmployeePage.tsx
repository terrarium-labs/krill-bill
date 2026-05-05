import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import PageHeader from "@/app/components/page-header";
import { useEmployee } from '@/app/dashboard/contexts/DashboardEmployeeContext';
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";
import IdBadge from "@/app/components/id-badge";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from "@/components/ui/shadcn-io/tabs";
import DashboardEmployeePageMyInfo from "./pages/DashboardEmployeePageMyInfo/DashboardEmployeePageMyInfo";
import DashboardEmployeePagePayrolls from "./pages/DashboardEmployeePagePayrolls/DashboardEmployeePagePayrolls";
import DashboardEmployeePageManager from "./pages/DashboardEmployeePageManager/DashboardEmployeePageManager";
import DashboardEmployeePageHome from "./pages/DashboardEmployeePageHome/DashboardEmployeePageHome";
import Tag from "@/app/components/tag/tag";
import { Badge } from "@/components/ui/badge";
import DashboardEmployePageTime from "./pages/DashboardEmployeePageTime/DashboardEmployePageTime";
import DashboardEmployeePageFiles from "./pages/DashboardEmployeePageFiles/DashboardPageEmployeeFiles";
import DashboardEmployeePageBonuses from "./pages/DashboardEmployeePageBonuses/DashboardEmployeePageBonuses";
import DashboardEmployeePageTrainings from "./pages/DashboardEmployeePageTrainings/DashboardEmployeePageTrainings";


const DashboardEmployeePage = () => {
    const { t } = useTranslation();
    const { employee, refreshEmployee, pendingSignatures } = useEmployee();
    const pendingSignatureCount = pendingSignatures.length;
    const [searchParams, setSearchParams] = useSearchParams();

    // Get current tab from URL or default to 'home'
    const currentTab = searchParams.get('tab') || 'home';

    // Valid tab values
    const validTabs = ['home', 'my-info', 'payrolls', 'time', 'training', 'work-orders', 'bonuses', 'manager', 'files'];

    // Tab values that show the time section (for sub-tab deep links)
    const timeTabValues = ['time', 'activity', 'absences', 'schedule'] as const;

    const trainingTabValues = ['training', 'all-trainings', 'my-trainings'] as const;

    // Sub-tab params that keep the main "Files" tab selected
    const filesTabValues = ['files', 'pending-signatures'] as const;

    // Map time / files sub-tab URL params to the active main tab
    const activeTab = timeTabValues.includes(currentTab as (typeof timeTabValues)[number])
        ? 'time'
        : trainingTabValues.includes(currentTab as (typeof trainingTabValues)[number])
          ? 'training'
          : filesTabValues.includes(currentTab as (typeof filesTabValues)[number])
            ? 'files'
            : validTabs.includes(currentTab)
              ? currentTab
              : 'home';

    // Handle tab change (main tabs + time/files sub-tab deep links)
    const handleTabChange = (value: string) => {
        if (
            validTabs.includes(value) ||
            timeTabValues.includes(value as (typeof timeTabValues)[number]) ||
            trainingTabValues.includes(value as (typeof trainingTabValues)[number]) ||
            filesTabValues.includes(value as (typeof filesTabValues)[number])
        ) {
            setSearchParams({ tab: value });
        }
    };


    // Get employee display name
    const employeeName = `${employee.first_name} ${employee.last_name}`.trim();

    return (
        <div className="space-y-6">
            <PageHeader
                beforeTextChildren={<EmployeeAvatar employee={employee} showName={false} size="2xl" imageEditable={true} onImageChange={refreshEmployee} />}
                title={t('dashboard.welcome', 'Welcome back, {{employeeName}}!', { employeeName: employeeName })}
                showBackButton={false}
                action={
                    <div className="flex items-center gap-2">
                        {employee.job_title?.name && <Tag text={employee.job_title?.name || '-'} />}
                        <IdBadge id={employee.id || ""} className="h-6 px-4 text-xs" />
                    </div>
                }
            />

            <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList
                    className="w-full justify-start border-b-2 border-border bg-background mb-4"
                    activeClassName='border-b-2 border-primary -mb-1.5'
                >
                    <TabsTrigger className="py-0" value="home">{t('dashboard.home', 'Home')}</TabsTrigger>
                    <TabsTrigger className="py-0" value="my-info">{t('employeesDetail.myInfo', 'My Info')}</TabsTrigger>
                    <TabsTrigger className="py-0" value="payrolls">{t('employeesDetail.payrolls', 'Payrolls')}</TabsTrigger>
                    <TabsTrigger className="py-0" value="time">{t('employeesDetail.myTime', 'My Time')}</TabsTrigger>
                    <TabsTrigger className="py-0" value="training">{t('dashboard.trainings.tab', 'Training')}</TabsTrigger>
                    {/* Todo: Implement work orders
                    <TabsTrigger className="py-0" value="work-orders">{t('employeesDetail.workOrders', 'Work Orders')}</TabsTrigger> */}
                    <TabsTrigger className="py-0" value="bonuses">{t('employeesDetail.bonuses', 'Bonuses')}</TabsTrigger>
                    {(employee.is_supervisor || employee.is_absence_supervisor) && <TabsTrigger className="py-0" value="manager">{t('employeesDetail.manager', 'Manager')}</TabsTrigger>}
                    <TabsTrigger className="relative py-0 pr-1" value="files">
                        <span className="relative inline-flex items-center">
                            {t("employeesDetail.files", "Files")}
                            {pendingSignatureCount > 0 && (
                                <Badge
                                    variant="destructive"
                                    className="pointer-events-none absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 py-0 text-[10px] leading-none tabular-nums"
                                    aria-hidden
                                >
                                    {pendingSignatureCount > 99 ? "99+" : pendingSignatureCount}
                                </Badge>
                            )}
                        </span>
                    </TabsTrigger>
                </TabsList>

                <TabsContents transition={{ duration: 0 }}>
                    <TabsContent value="home" transition={{ duration: 0 }}>
                        <DashboardEmployeePageHome />
                    </TabsContent>
                    <TabsContent value="my-info" transition={{ duration: 0 }}>
                        <DashboardEmployeePageMyInfo />
                    </TabsContent>
                    <TabsContent value="payrolls" transition={{ duration: 0 }}>
                        <DashboardEmployeePagePayrolls />
                    </TabsContent>
                    <TabsContent value="time" transition={{ duration: 0 }}>
                        <DashboardEmployePageTime />
                    </TabsContent>
                    <TabsContent value="training" transition={{ duration: 0 }}>
                        <DashboardEmployeePageTrainings />
                    </TabsContent>
                    {/* Todo: Implement work orders - coming soon
                    <TabsContent value="work-orders" transition={{ duration: 0 }}>
                        <DashboardEmployeePageWorkOrders />
                    </TabsContent> */}
                    <TabsContent value="bonuses" transition={{ duration: 0 }}>
                        <DashboardEmployeePageBonuses />
                    </TabsContent>
                    {(employee.is_supervisor || employee.is_absence_supervisor) && <TabsContent value="manager" transition={{ duration: 0 }}>
                        <DashboardEmployeePageManager />
                    </TabsContent>}
                    <TabsContent value="files" transition={{ duration: 0 }}>
                        <DashboardEmployeePageFiles />
                    </TabsContent>
                </TabsContents>
            </Tabs>
        </div>
    );
};

export default DashboardEmployeePage;

