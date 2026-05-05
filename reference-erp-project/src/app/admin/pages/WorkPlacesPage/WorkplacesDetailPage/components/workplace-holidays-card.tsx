import React, { useState, useEffect, useMemo } from 'react';
import { CalendarIcon, Plus, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';

import { useTranslation } from '@/hooks/useTranslation';
import { getOrgWorkplaceHolidays, deleteOrgWorkplaceHoliday } from '@/api/orgs/workplaces/holidays/holidays';
import { Holiday } from '@/types/general/holidays';
import CalendarDayLabel from '@/app/components/labels/calendar-day-label';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import WorkplaceHolidayAddModal from './workplace-holiday-add-modal';
import WorkplaceHolidaysImportModal from './workplace-holidays-import-modal';
import WorkplaceHolidayDeleteModal from './workplace-holiday-delete-modal';
import { useWorkPlace } from '../../context/WorkPlaceContext';

interface WorkplaceHolidaysCardProps {
}

const WorkplaceHolidaysCard: React.FC<WorkplaceHolidaysCardProps> = () => {
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [holidayToDelete, setHolidayToDelete] = useState<Holiday | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { workplace } = useWorkPlace();

    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();

    const availableYears = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let year = currentYear - 5; year <= currentYear + 5; year++) {
            years.push(year);
        }
        return years;
    }, []);

    const loadHolidays = async () => {
        if (!orgId || !workplace?.id) return;

        try {
            const response = await getOrgWorkplaceHolidays(orgId, workplace.id, selectedYear.toString());

            if (response.success) {
                const newHolidays = response.success.holidays || [];
                setHolidays(newHolidays);
            } else {
                toast.error(t('workplaces.errorLoadingHolidays', 'Failed to load holidays'));
            }
        } catch (error) {
            console.error('Error loading holidays:', error);
            toast.error(t('workplaces.errorLoadingHolidays', 'Failed to load holidays'));
        }
    };

    useEffect(() => {
        loadHolidays();
    }, [workplace?.id, selectedYear]);

    const handleHolidayCreated = () => {
        loadHolidays();
        setIsCreateModalOpen(false);
    };

    const handleHolidaysImported = () => {
        loadHolidays();
        setIsImportModalOpen(false);
    };

    const handleDeleteClick = (holiday: Holiday) => {
        setHolidayToDelete(holiday);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!orgId || !workplace?.id || !holidayToDelete) return;

        setIsDeleting(true);
        try {
            const response = await deleteOrgWorkplaceHoliday(orgId, workplace.id, [holidayToDelete.id]);

            if (response.success) {
                toast.success(t('workplaces.holidayDeleted', 'Holiday deleted successfully'));
                loadHolidays();
            } else {
                toast.error(t('workplaces.errorDeletingHoliday', 'Failed to delete holiday'));
            }
        } catch (error) {
            console.error('Error deleting holiday:', error);
            toast.error(t('workplaces.errorDeletingHoliday', 'Failed to delete holiday'));
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
            setHolidayToDelete(null);
        }
    };

    return (
        <>
            <Card className="shadow-none">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 justify-between">
                        <div className="flex items-center gap-2">
                            {t('workplaces.holidays', 'Holidays')}
                        </div>
                        <div className="flex items-center gap-2">
                            <Select
                                value={selectedYear.toString()}
                                onValueChange={(value) => setSelectedYear(parseInt(value))}
                            >
                                <SelectTrigger className="w-[100px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableYears.map((year) => (
                                        <SelectItem key={year} value={year.toString()}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button onClick={() => setIsImportModalOpen(true)} size="sm" variant="outline">
                                <Download className="h-4 w-4" />
                                {t('workplaces.importHolidays', 'Import')}
                            </Button>
                            <Button onClick={() => setIsCreateModalOpen(true)} size="sm" variant="outline">
                                <Plus className="h-4 w-4" />
                                {t('workplaces.addHoliday', 'Add')}
                            </Button>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="py-0 px-4">
                    {/* Holidays List */}
                    {holidays.length === 0 ? (

                        <div className="text-center py-4">
                            <CalendarIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <h3 className="text-md font-medium text-muted-foreground">
                                {t('workplaces.noHolidays', 'No holidays yet')
                                }
                            </h3>
                            <p className="text-muted-foreground mb-4 text-xs">
                                {t('workplaces.addFirstHoliday', 'Add your first holiday to get started')
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="max-h-[300px] overflow-y-auto">
                            {[...holidays]
                                .sort((a, b) => a.holiday_date.localeCompare(b.holiday_date))
                                .map((holiday, index, arr) => (
                                <div key={holiday.id}>
                                    <div className="hover:bg-accent/50 transition-colors p-3 rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <CalendarDayLabel data={new Date(holiday.holiday_date)} />
                                            <div className="flex flex-col items-start gap-0.5 min-w-0 flex-1">
                                                <h4 className="font-semibold text-base">{holiday.name}</h4>
                                                {holiday.description && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {holiday.description}
                                                    </span>
                                                )}
                                            </div>
                                            <Button
                                                onClick={() => handleDeleteClick(holiday)}
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    {index < arr.length - 1 && <Separator />}
                                </div>
                                ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal for creating holidays */}
            {orgId && workplace?.id && (
                <>
                    <WorkplaceHolidayAddModal
                        open={isCreateModalOpen}
                        onOpenChange={setIsCreateModalOpen}
                        onHolidayCreated={handleHolidayCreated}
                        orgId={orgId}
                        workplaceId={workplace.id}
                    />
                    <WorkplaceHolidaysImportModal
                        open={isImportModalOpen}
                        onOpenChange={setIsImportModalOpen}
                        onHolidaysImported={handleHolidaysImported}
                        orgId={orgId}
                        workplaceId={workplace.id}
                    />
                </>
            )}

            {/* Delete Confirmation Dialog */}
            <WorkplaceHolidayDeleteModal
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                holiday={holidayToDelete}
                onConfirm={handleDeleteConfirm}
                isDeleting={isDeleting}
            />
        </>
    );
};

export default WorkplaceHolidaysCard;

