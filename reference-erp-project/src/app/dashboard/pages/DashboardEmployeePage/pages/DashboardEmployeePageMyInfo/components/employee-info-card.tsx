import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useNavigate, useParams } from 'react-router-dom';
import { useEmployee } from '@/app/dashboard/contexts/DashboardEmployeeContext';
import { COUNTRIES } from '@/utils/countries';
import { formatDate } from '@/utils/miscelanea';
import WorkplaceLabel from '@/app/components/labels/workplace-label';
import { DynamicIcon } from 'lucide-react/dynamic';
import { IconInfoItem } from '@/app/components/custom-labels';
import EmployeeLabel from '@/app/components/labels/employee-label';
import Tag from '@/app/components/tag/tag';

interface EmployeeInfoCardProps {
    showActions?: boolean;
}

export const EmployeeInfoCard: React.FC<EmployeeInfoCardProps> = () => {
    const { t } = useTranslation();
    const { employee } = useEmployee();
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();

    const formatAddress = () => {
        const addressParts = [
            employee.address_line_1,
            employee.address_line_2,
            employee.postal_code,
            employee.city,
            employee.state_province,
            employee.country
        ].filter(Boolean);

        return addressParts.length > 0 ? addressParts.join(', ') : null;
    };

    const getCountryName = (countryCode: string) => {
        const country = COUNTRIES.find(c => c.code === countryCode);
        return country?.name || countryCode;
    };

    const getBasicFields = () => {
        return employee.sections?.filter((field) => field.handler === 'basic')[0]?.fields?.filter((field: any) => field.value);
    };

    const getEmploymentFields = () => {
        return employee.sections?.filter((field) => field.handler === 'employment')[0]?.fields?.filter((field: any) => field.value);
    };

    if (!employee) {
        return null;
    }

    return (
        <Card className="w-full shadow-none gap-2">
            <CardHeader>
                <CardTitle>
                    {t('employees.info', 'Employee Information')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

                <IconInfoItem
                    icon={"mail"}
                    label={t('employees.email', 'Email')}
                    value={employee.email}
                    copyable
                    link
                    linkValue={`mailto:${employee.email}`}
                />

                <IconInfoItem
                    icon={"phone"}
                    label={t('employees.phone', 'Phone')}
                    value={employee.phone}
                    copyable
                    link
                    linkValue={`tel:${employee.phone}`}
                />

                <IconInfoItem
                    icon={"map-pin"}
                    label={t('employees.address', 'Address')}
                    value={formatAddress()}
                />

                {employee.country && (
                    <IconInfoItem
                        icon={"globe"}
                        label={t('employees.country', 'Country')}
                        value={getCountryName(employee.country)}
                        flag
                        countryCode={employee.country}
                    />
                )}

                <IconInfoItem
                    icon={"calendar"}
                    label={t('employees.dateOfBirth', 'Date of Birth')}
                    value={employee.date_of_birth ? formatDate(employee.date_of_birth, { showTime: false }) : null}
                />

                <IconInfoItem
                    icon={"credit-card"}
                    label={t('employees.nationalIdNumber', 'National ID Number')}
                    value={employee.national_id_number}
                    copyable
                />

                <IconInfoItem
                    icon={"building-2"}
                    label={t('employees.taxIdNumber', 'Tax ID Number')}
                    value={employee.tax_id_number}
                    copyable
                />

                <IconInfoItem
                    icon={"file-text"}
                    label={t('employees.notes', 'Notes')}
                    value={employee.notes}
                />

                {/* Basic Custom Fields Section */}
                {employee.sections
                    && employee.sections.length > 0
                    && employee.sections.filter((field) => field.handler === 'basic').length > 0
                    && getBasicFields()
                    && (getBasicFields() || []).length > 0
                    && (
                        <div className="pt-2">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-xs text-muted-foreground font-semibold">
                                    {t('employees.customFields', 'Custom Basic Fields')}
                                </p>
                                <Button variant="ghost" size="icon" onClick={() => navigate(`/${orgId}/admin/fields/employees`)}>
                                    <Settings className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {getBasicFields()?.map((field: any) => (
                                    <div key={field.id}>
                                        <p className="text-xs text-muted-foreground">
                                            {field.name}
                                        </p>
                                        <p className="text-sm font-normal text-foreground">
                                            {field.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                {/* Employment Information Section */}
                {employee.job_title ||
                    employee.org_user_workplace ||
                    employee.org_absence_policy ||
                    employee.org_time_policy ||
                    (employee.reporting_to) ||
                    (employee.reporting_absence_to && employee.reporting_absence_to.length > 0) ? (
                    <div className="pt-4 border-t border-border space-y-4">
                        <p className="text-xs text-muted-foreground font-semibold mb-3">
                            {t('employees.employmentInformation', 'Employment Information')}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {employee.job_title && (
                                <IconInfoItem
                                    icon={"briefcase"}
                                    label={t('employees.jobTitle', 'Job Title')}
                                >
                                    <div className="mt-1 hover:underline cursor-pointer" onClick={() => employee.job_title?.id &&
                                        navigate(`/${orgId}/admin/job-titles/${employee.job_title.id}`)}>
                                        <Tag text={employee.job_title.name} />
                                    </div>
                                </IconInfoItem>
                            )}

                            {employee.org_user_workplace && (
                                <IconInfoItem
                                    icon={"building-2"}
                                    label={t('employees.workplace', 'Workplace')}
                                >
                                    <div className="mt-1">
                                        <WorkplaceLabel data={employee.org_user_workplace} />
                                    </div>
                                </IconInfoItem>
                            )}

                            {employee.org_absence_policy && (
                                <IconInfoItem
                                    icon={"shield"}
                                    label={t('employees.absencePolicy', 'Absence Policy')}
                                    value={employee.org_absence_policy.name}
                                    navigateTo={`/${orgId}/admin/absence-policies/${employee.org_absence_policy.id}`}
                                />
                            )}

                            {employee.org_time_policy && (
                                <IconInfoItem
                                    icon={"clock"}
                                    label={t('employees.timePolicy', 'Time Policy')}
                                    value={employee.org_time_policy.name}
                                    navigateTo={`/${orgId}/admin/time-policies/${employee.org_time_policy.id}`}
                                />
                            )}

                            {employee.reporting_to && (
                                <IconInfoItem
                                    icon={"user-check"}
                                    label={t('employees.reportingTo', 'Reporting To')}
                                >
                                    <div className="flex flex-col gap-2">
                                        <EmployeeLabel data={employee.reporting_to} />
                                    </div>
                                </IconInfoItem>
                            )}

                            {employee.reporting_absence_to && employee.reporting_absence_to.length > 0 && (
                                <IconInfoItem
                                    icon={"user-check"}
                                    label={t('employees.reportingAbsenceTo', 'Reporting Absc. To')}
                                >
                                    <div className="flex flex-col gap-2">
                                        <EmployeeLabel data={employee.reporting_absence_to} />
                                    </div>
                                </IconInfoItem>
                            )}
                        </div>
                    </div>
                ) : null}

                {/* Groups Section */}
                {employee.groups && employee.groups.length > 0 && (
                    <div className="pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground font-semibold mb-3">
                            {t('employees.groups', 'Groups')}
                        </p>
                        <div className="flex flex-wrap gap-1 ">
                            {employee.groups.map((group) => (
                                <div key={group.id} className="flex items-center gap-2 text-sm hover:underline cursor-pointer border border-border rounded-md p-0.5 px-2"
                                    onClick={() => navigate(`/${orgId}/admin/groups/${group.id}`)}>
                                    <DynamicIcon name={group.icon_url as any} className="h-4 w-4" />
                                    <span className="text-sm">{group.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Employment Custom Fields Section */}
                {employee.sections && employee.sections.length > 0 && employee.sections.filter((field) => field.handler === 'employment').length > 0
                    && getEmploymentFields()
                    && (getEmploymentFields() || []).length > 0
                    && (
                        <div className="pt-2">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-xs text-muted-foreground font-semibold">
                                    {t('employees.customEmploymentFields', 'Custom Employment Fields')}
                                </p>
                                <Button variant="ghost" size="icon" onClick={() => navigate(`/${orgId}/admin/fields/employees`)}>
                                    <Settings className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {getEmploymentFields()?.map((field: any) => (
                                    <div key={field.id}>
                                        <p className="text-xs text-muted-foreground">
                                            {field.name}
                                        </p>
                                        <p className="text-sm font-normal text-foreground">
                                            {field.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                {/* Other Custom Sections */}
                {employee.sections
                    && employee.sections.length > 0
                    && employee.sections.filter((field) => field.handler !== 'basic' && field.handler !== 'employment').length > 0
                    && employee.sections.filter((field) => field.handler !== 'basic' && field.handler !== 'employment').map((section) => {
                        const visibleFields = section.fields?.filter((field: any) => field.value) || [];
                        if (visibleFields.length === 0) return null;

                        return (
                            <div key={section.id} className="pt-2 border-t border-border">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs text-muted-foreground font-semibold">
                                        {section.title}
                                    </p>
                                    <Button variant="ghost" size="icon" onClick={() => navigate(`/${orgId}/admin/fields/employees`)}>
                                        <Settings className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {visibleFields.map((field: any) => (
                                        <div key={field.id}>
                                            <p className="text-xs text-muted-foreground">
                                                {field.name}
                                            </p>
                                            <p className="text-sm font-normal text-foreground">
                                                {field.value}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
            </CardContent>
        </Card >
    );
};

