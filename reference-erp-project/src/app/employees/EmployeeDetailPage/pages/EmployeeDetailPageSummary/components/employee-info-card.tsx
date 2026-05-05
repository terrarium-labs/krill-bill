import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Settings,
    Plus,
    Hexagon,
    List,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { useEmployee } from '../../../../contexts/EmployeeContext';
import { COUNTRIES } from '@/utils/countries';
import { formatDate } from '@/utils/miscelanea';
import { DynamicIcon } from 'lucide-react/dynamic';
import WorkplaceLabel from '@/app/components/labels/workplace-label';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';
import { useEffect, useState } from 'react';
import { RadarChart, PolarAngleAxis, PolarGrid, Radar, PolarRadiusAxis } from 'recharts';
import { ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { getEmployeeSkills, deleteEmployeeSkill } from '@/api/employees/skills/skills';
import { Skill } from '@/types/general/skills';
import { getSkillDescriptionForLevel } from '@/utils/skills';
import { Separator } from '@/components/ui/separator';
import EmployeeSkillsAddModal from './employee-skills-add-modal';
import EmployeeSkillEditModal from './employee-skill-edit-modal';
import EmployeeSkillDeleteModal from './employee-skill-delete-modal';
import { IconInfoItem } from '@/app/components/custom-labels';
import CustomActionsDropdown from '@/app/components/custom-actions-dropdown';
import EmployeeLabel from '@/app/components/labels/employee-label';
import StarsLabel from '@/app/components/labels/stars-label';
import Tag from '@/app/components/tag/tag';

interface EmployeeInfoCardProps {
    showActions?: boolean;
    onEdit?: () => void;
}

export const EmployeeInfoCard: React.FC<EmployeeInfoCardProps> = ({ onEdit }) => {
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

    const [showChartSkills, setShowChartSkills] = useState<boolean>(false);
    const [isAddSkillsModalOpen, setIsAddSkillsModalOpen] = useState(false);
    const [isSkillEditModalOpen, setIsSkillEditModalOpen] = useState(false);
    const [existingSkills, setExistingSkills] = useState<Skill[]>([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [skillToDelete, setSkillToDelete] = useState<Skill | null>(null);
    const [skillToEdit, setSkillToEdit] = useState<Skill | null>(null);
    const [deletingSkill, setDeletingSkill] = useState(false);

    const chartConfig = {
        skill: {
            label: "Skill",
            color: "var(--chart-1)",
        },
    } satisfies ChartConfig

    const getSkills = async () => {
        if (!orgId || !employee.id) return;
        const response = await getEmployeeSkills(orgId, employee.id);
        if (response.success) {
            setExistingSkills(response.success.skills.sort((a: Skill, b: Skill) => {
                if (b.level !== a.level) {
                    return b.level - a.level;
                }
                return a.name.localeCompare(b.name);
            }));
        }
    };

    const handleDeleteSkill = async () => {
        if (!orgId || !employee.id || !skillToDelete) return;

        setDeletingSkill(true);
        try {
            const response = await deleteEmployeeSkill(orgId, employee.id, { skills: [skillToDelete.id] });
            if (response.success) {
                toast.success(t('employees.skillDeletedSuccessfully', 'Skill deleted successfully'));
                await getSkills();
            } else if (response.error) {
                toast.error(response.error.message || t('employees.errorDeletingSkill', 'Error deleting skill'));
            }
        } catch (error) {
            toast.error(t('employees.errorDeletingSkill', 'Error deleting skill'));
        } finally {
            setDeletingSkill(false);
        }
    };

    useEffect(() => {
        getSkills();
    }, [orgId, employee.id]);

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
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground font-semibold">
                            {t('employees.skills', 'Skills')}
                        </p>
                        <div className="flex items-center">
                            <Button variant="ghost" className="h-6! w-6!" size="icon" onClick={() => setShowChartSkills(!showChartSkills)}>
                                {!showChartSkills ?
                                    <Hexagon className="h-4 w-4 text-muted-foreground" /> :
                                    <List className="h-4 w-4 text-muted-foreground" />}
                            </Button>
                            <Button variant="ghost" className="h-6! w-6!" size="icon" onClick={() => setIsAddSkillsModalOpen(true)}>
                                <Plus className="h-4 w-4 text-muted-foreground" />
                            </Button>

                        </div>
                    </div>
                    <div className="flex flex-col gap-2 overflow-y-auto max-h-[220px]">
                        {existingSkills.length > 0 && !showChartSkills && (
                            existingSkills.map((skill) => (
                                <div key={skill.id} className="flex items-center justify-between gap-4">
                                    <p className="flex text-sm font-normal text-foreground flex-col">
                                        {skill.name}
                                        {getSkillDescriptionForLevel(skill.description, skill.level) && (
                                            <span className="text-xs text-muted-foreground line-clamp-1">
                                                {getSkillDescriptionForLevel(skill.description, skill.level)}
                                            </span>
                                        )}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <StarsLabel level={skill.level} variant="default" size="md" />
                                        <CustomActionsDropdown
                                            items={[
                                                {
                                                    label: t("common.edit", "Edit"),
                                                    icon: "square-pen",
                                                    onClick: () => {
                                                        setSkillToEdit(skill);
                                                        setIsSkillEditModalOpen(true);
                                                    },
                                                },
                                                {
                                                    label: t("common.delete", "Delete"),
                                                    icon: "trash-2",
                                                    onClick: () => {
                                                        setSkillToDelete(skill);
                                                        setDeleteModalOpen(true);
                                                    },
                                                    variant: "destructive",
                                                },
                                            ]}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {existingSkills.length > 0 && showChartSkills && (
                        <ChartContainer
                            config={chartConfig}
                            className="max-h-[220px] w-full mx-auto "
                        >
                            <RadarChart data={existingSkills}>
                                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                <PolarAngleAxis dataKey="name" />
                                <PolarRadiusAxis domain={[0, 5]} tickFormatter={(_) => ''} axisLine={false} />
                                <PolarGrid />
                                <Radar
                                    dataKey="level"
                                    fill="var(--chart-1)"
                                    fillOpacity={0.6}
                                />
                            </RadarChart>
                        </ChartContainer>
                    )}
                </div>


                <Separator />

                <IconInfoItem
                    icon={"mail"}
                    label={t('employees.email', 'Email')}
                    value={employee.email}
                    copyable
                    link
                    linkValue={`mailto:${employee.email}`}
                    onEmptyClick={onEdit}
                />

                <IconInfoItem
                    icon={"phone"}
                    label={t('employees.phone', 'Phone')}
                    value={employee.phone}
                    copyable
                    link
                    linkValue={`tel:${employee.phone}`}
                    onEmptyClick={onEdit}
                />

                <IconInfoItem
                    icon={"map-pin"}
                    label={t('employees.address', 'Address')}
                    value={formatAddress()}
                    onEmptyClick={onEdit}
                />

                {employee.country && (
                    <IconInfoItem
                        icon={"globe"}
                        label={t('employees.country', 'Country')}
                        value={getCountryName(employee.country)}
                        flag
                        countryCode={employee.country}
                        onEmptyClick={onEdit}
                    />
                )}

                <IconInfoItem
                    icon={"calendar"}
                    label={t('employees.dateOfBirth', 'Date of Birth')}
                    value={employee.date_of_birth ? formatDate(employee.date_of_birth, { showTime: false }) : null}
                    onEmptyClick={onEdit}
                />

                <IconInfoItem
                    icon={"credit-card"}
                    label={t('employees.nationalIdNumber', 'National ID Number')}
                    value={employee.national_id_number}
                    copyable
                    onEmptyClick={onEdit}
                />

                <IconInfoItem
                    icon={"building-2"}
                    label={t('employees.taxIdNumber', 'Tax ID Number')}
                    value={employee.tax_id_number}
                    copyable
                    onEmptyClick={onEdit}
                />

                <IconInfoItem
                    icon={"file-text"}
                    label={t('employees.notes', 'Notes')}
                    value={employee.notes}
                    onEmptyClick={onEdit}
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
                                        <div className="text-sm font-normal text-foreground">
                                            {Array.isArray(field.value) ? (
                                                <div className="flex flex-col gap-0.5">
                                                    {field.value.map((v: string, i: number) => (
                                                        <span key={i}>{v}</span>
                                                    ))}
                                                </div>
                                            ) : (
                                                field.value
                                            )}
                                        </div>
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
                    employee.reporting_to ||
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
                                        <WorkplaceLabel data={employee.org_user_workplace} link />
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
                                    <EmployeeLabel data={employee.reporting_to} link />
                                </IconInfoItem>
                            )}

                            {employee.reporting_absence_to && employee.reporting_absence_to.length > 0 && (
                                <IconInfoItem
                                    icon={"user-check"}
                                    label={t('employees.reportingAbsenceTo', 'Reporting Absc. To')}
                                >
                                    <div className="flex flex-col gap-2">
                                        <EmployeeLabel data={employee.reporting_absence_to} link />
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
                                    onClick={() => navigate(`/${orgId}/admin/org-chart`)}>
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
                                        <div className="text-sm font-normal text-foreground">
                                            {Array.isArray(field.value) ? (
                                                <div className="flex flex-col gap-0.5">
                                                    {field.value.map((v: string, i: number) => (
                                                        <span key={i}>{v}</span>
                                                    ))}
                                                </div>
                                            ) : (
                                                field.value
                                            )}
                                        </div>
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
                                            <div className="text-sm font-normal text-foreground">
                                                {Array.isArray(field.value) ? (
                                                    <div className="flex flex-col gap-0.5">
                                                        {field.value.map((v: string, i: number) => (
                                                            <span key={i}>{v}</span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    field.value
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
            </CardContent>

            {/* Add Skills Modal */}
            <EmployeeSkillsAddModal
                open={isAddSkillsModalOpen}
                onOpenChange={setIsAddSkillsModalOpen}
                orgId={orgId || ''}
                employeeId={employee.id}
                onSuccess={() => {
                    getSkills();
                }}
            />

            {/* Edit Skill Modal */}
            <EmployeeSkillEditModal
                open={isSkillEditModalOpen}
                onOpenChange={(open) => {
                    setIsSkillEditModalOpen(open);
                    if (!open) setSkillToEdit(null);
                }}
                orgId={orgId || ''}
                employeeId={employee.id}
                skill={skillToEdit}
                onSuccess={getSkills}
            />

            {/* Delete Skill Modal */}
            <EmployeeSkillDeleteModal
                open={deleteModalOpen}
                onOpenChange={(open) => {
                    setDeleteModalOpen(open);
                    if (!open) setSkillToDelete(null);
                }}
                skill={skillToDelete}
                onConfirm={handleDeleteSkill}
                isDeleting={deletingSkill}
            />
        </Card >
    );
};

