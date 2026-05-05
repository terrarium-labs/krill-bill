import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, Download, CheckCircle2, Check, ChevronsUpDown } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { createOrgWorkplaceHoliday } from '@/api/orgs/workplaces/holidays/holidays';
import { Holiday as HolidaySDK } from 'open-holiday-js';
import { cn } from '@/lib/utils';
import { COUNTRIES } from '@/utils/countries';
import { formatDate, formatDateForAPI } from '@/utils/miscelanea';
import { FlagComponent } from '@/app/components/flag-component';

import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from '@/components/ui/popover';
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from '@/components/ui/command';

interface WorkplaceHolidaysImportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onHolidaysImported?: () => void;
    orgId: string;
    workplaceId: string;
}

interface Country {
    isoCode: string;
    name: { language: string; text: string }[];
    officialLanguages: string[];
}

interface Subdivision {
    code: string;
    isoCode: string;
    shortName: string;
    name: { language: string; text: string }[];
    category?: { language: string; text: string }[];
    officialLanguages?: string[];
}

interface PublicHoliday {
    id: string;
    name: { language: string; text: string }[];
    startDate: Date;
    endDate: Date;
    type: string;
    nationwide: boolean;
    subdivisions?: { code: string; shortName: string }[];
}

// Form input schema
const formInputSchema = z.object({
    country: z.string().min(1, 'Country is required'),
    subdivision: z.string().optional(),
    year: z.number().int().min(2020).max(2030),
    includeSchoolHolidays: z.boolean(),
});

type FormValues = z.infer<typeof formInputSchema>;

const WorkplaceHolidaysImportModal: React.FC<WorkplaceHolidaysImportModalProps> = ({
    open,
    onOpenChange,
    onHolidaysImported,
    orgId,
    workplaceId,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingHolidays, setIsFetchingHolidays] = useState(false);
    const [countries, setCountries] = useState<Country[]>([]);
    const [subdivisions, setSubdivisions] = useState<Subdivision[]>([]);
    const [fetchedHolidays, setFetchedHolidays] = useState<PublicHoliday[]>([]);
    const [selectedHolidays, setSelectedHolidays] = useState<Set<string>>(new Set());
    const [step, setStep] = useState<'setup' | 'preview'>('setup');
    const { t } = useTranslation();

    const holidaySDK = new HolidaySDK();

    const form = useForm<FormValues>({
        resolver: zodResolver(formInputSchema),
        defaultValues: {
            country: '',
            subdivision: '',
            year: new Date().getFullYear(),
            includeSchoolHolidays: false,
        },
    });

    const selectedCountry = form.watch('country');

    // Load countries on mount
    useEffect(() => {
        const loadCountries = async () => {
            try {
                const countriesData = await holidaySDK.getCountries('en');
                setCountries(countriesData);
            } catch (error) {
                console.error('Error loading countries:', error);
                toast.error(t('workplaces.import.errorLoadingCountries', 'Failed to load countries'));
            }
        };

        if (open) {
            loadCountries();
        }
    }, [open]);

    // Load subdivisions when country changes
    useEffect(() => {
        const loadSubdivisions = async () => {
            if (!selectedCountry) {
                setSubdivisions([]);
                return;
            }

            try {
                const subdivisionsData = await holidaySDK.getSubdivisions(selectedCountry, 'en');
                setSubdivisions(subdivisionsData);
            } catch (error) {
                console.error('Error loading subdivisions:', error);
                setSubdivisions([]);
            }
        };

        loadSubdivisions();
    }, [selectedCountry]);

    // Reset form when modal opens
    useEffect(() => {
        if (open) {
            form.reset({
                country: '',
                subdivision: '',
                year: new Date().getFullYear(),
                includeSchoolHolidays: false,
            });
            setStep('setup');
            setFetchedHolidays([]);
            setSelectedHolidays(new Set());
        }
    }, [open, form]);

    const onFetchHolidays = async (values: FormValues) => {
        setIsFetchingHolidays(true);
        try {
            const startDate = new Date(values.year, 0, 1);
            const endDate = new Date(values.year, 11, 31);

            const publicHolidays = await holidaySDK.getPublicHolidays(
                values.country,
                startDate,
                endDate,
                values.subdivision || undefined,
                'en'
            );

            let allHolidays = publicHolidays;

            if (values.includeSchoolHolidays) {
                const schoolHolidays = await holidaySDK.getSchoolHolidays(
                    values.country,
                    startDate,
                    endDate,
                    values.subdivision || undefined,
                    'en'
                );
                allHolidays = [...publicHolidays, ...schoolHolidays];
            }

            setFetchedHolidays(allHolidays);
            // Select all holidays by default
            setSelectedHolidays(new Set(allHolidays.map(h => h.id)));
            setStep('preview');
        } catch (error) {
            console.error('Error fetching holidays:', error);
            toast.error(t('workplaces.import.errorFetching', 'Failed to fetch holidays'));
        } finally {
            setIsFetchingHolidays(false);
        }
    };

    const toggleHoliday = (holidayId: string) => {
        const newSelected = new Set(selectedHolidays);
        if (newSelected.has(holidayId)) {
            newSelected.delete(holidayId);
        } else {
            newSelected.add(holidayId);
        }
        setSelectedHolidays(newSelected);
    };

    const toggleAll = () => {
        if (selectedHolidays.size === fetchedHolidays.length) {
            setSelectedHolidays(new Set());
        } else {
            setSelectedHolidays(new Set(fetchedHolidays.map(h => h.id)));
        }
    };

    const onImport = async () => {
        if (selectedHolidays.size === 0) {
            toast.error(t('workplaces.import.noHolidaysSelected', 'Please select at least one holiday'));
            return;
        }

        setIsLoading(true);
        try {
            const holidaysToImport = fetchedHolidays.filter(h => selectedHolidays.has(h.id));

            let successCount = 0;
            let errorCount = 0;

            // Import holidays one by one
            for (const holiday of holidaysToImport) {
                try {
                    const startDate = new Date(holiday.startDate);
                    const nameText = holiday.name.find(n => n.language === 'en')?.text ||
                        holiday.name[0]?.text ||
                        'Holiday';
                    const holiday_date = formatDateForAPI(startDate, "day");

                    const payload = {
                        name: nameText,
                        holiday_date,
                        description: `${holiday.type}${holiday.nationwide ? ' (Nationwide)' : ''}`,
                    };

                    const response = await createOrgWorkplaceHoliday(orgId, workplaceId, payload);

                    if (response.success) {
                        successCount++;
                    } else {
                        errorCount++;
                    }
                } catch (error) {
                    console.error('Error importing holiday:', error);
                    errorCount++;
                }
            }

            if (successCount > 0) {
                toast.success(
                    t('workplaces.import.successMessage', `Successfully imported ${successCount} holiday(s)`,
                        { count: successCount })
                );
            }

            if (errorCount > 0) {
                toast.error(
                    t('workplaces.import.partialError', `Failed to import ${errorCount} holiday(s)`,
                        { count: errorCount })
                );
            }

            onOpenChange(false);
            if (onHolidaysImported) {
                onHolidaysImported();
            }
        } catch (error) {
            console.error('Error importing holidays:', error);
            toast.error(t('workplaces.import.error', 'Failed to import holidays'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm md:max-w-sm max-h-[85vh]" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                        <Download className="h-5 w-5" />
                        {t('workplaces.import.title', 'Import Holidays')}
                    </DialogTitle>
                </DialogHeader>

                {step === 'setup' && (
                    <Form {...form}>
                        <div className="space-y-4 py-4">
                            {/* Country Select */}
                            <FormField
                                control={form.control}
                                name="country"
                                render={({ field }) => {
                                    const getCountryInfo = (isoCode: string) => {
                                        const localCountry = COUNTRIES.find(c => c.code === isoCode);
                                        const apiCountry = countries.find(c => c.isoCode === isoCode);
                                        return {
                                            code: isoCode,
                                            name: localCountry?.name || apiCountry?.name.find(n => n.language === 'en')?.text || isoCode,
                                        };
                                    };

                                    return (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>{t('workplaces.import.country', 'Country')} *</FormLabel>
                                            <Popover modal={true}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            disabled={isFetchingHolidays}
                                                            className={cn(
                                                                "justify-between",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                <div className="flex items-center gap-3">
                                                                    <FlagComponent
                                                                        country={field.value}
                                                                        countryName={getCountryInfo(field.value).name}
                                                                    />
                                                                    {getCountryInfo(field.value).name}
                                                                </div>
                                                            ) : (
                                                                t('workplaces.import.selectCountry', 'Select a country')
                                                            )}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent align="start" className="p-0 w-[var(--radix-popover-trigger-width)]">
                                                    <Command>
                                                        <CommandInput placeholder={t('workplaces.import.searchCountry', 'Search country...')} />
                                                        <CommandList>
                                                            <CommandEmpty>{t('workplaces.import.noCountryFound', 'No country found.')}</CommandEmpty>
                                                            <CommandGroup>
                                                                {countries.map((country) => {
                                                                    const countryInfo = getCountryInfo(country.isoCode);
                                                                    return (
                                                                        <CommandItem
                                                                            value={country.isoCode + " - " + countryInfo.name}
                                                                            key={country.isoCode}
                                                                            className="cursor-pointer"
                                                                            onSelect={() => {
                                                                                field.onChange(country.isoCode);
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    country.isoCode === field.value ? "opacity-100" : "opacity-0"
                                                                                )}
                                                                            />
                                                                            <div className="flex items-center gap-3">
                                                                                <FlagComponent
                                                                                    country={country.isoCode}
                                                                                    countryName={countryInfo.name}
                                                                                />
                                                                                <span>{countryInfo.name}</span>
                                                                            </div>
                                                                        </CommandItem>
                                                                    );
                                                                })}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    );
                                }}
                            />

                            {/* Subdivision Select (optional) */}
                            {subdivisions.length > 0 && (
                                <FormField
                                    control={form.control}
                                    name="subdivision"
                                    render={({ field }) => {
                                        const getSubdivisionDisplay = (subdivision: Subdivision) => {
                                            const fullName = subdivision.name.find((n: { language: string; text: string }) => n.language === 'EN')?.text || subdivision.shortName;
                                            return fullName;
                                        };

                                        return (
                                            <FormItem className="flex flex-col">
                                                <div className="flex items-center justify-between">
                                                    <FormLabel>{t('workplaces.import.subdivision', 'State/Region')} (Optional)</FormLabel>
                                                    {field.value && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => field.onChange('')}
                                                            disabled={isFetchingHolidays}
                                                            className="h-auto py-0 px-2 text-xs"
                                                        >
                                                            {t('common.clear', 'Clear')}
                                                        </Button>
                                                    )}
                                                </div>
                                                <Popover modal={true}>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                disabled={isFetchingHolidays}
                                                                className={cn(
                                                                    "justify-between",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value
                                                                    ? (() => {
                                                                        const subdivision = subdivisions.find((s) => s.code === field.value);
                                                                        return subdivision ? getSubdivisionDisplay(subdivision) : field.value;
                                                                    })()
                                                                    : t('workplaces.import.allRegions', 'All regions')}
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent align="start" className="p-0 w-[var(--radix-popover-trigger-width)]">
                                                        <Command>
                                                            <CommandInput placeholder={t('workplaces.import.searchRegion', 'Search region...')} />
                                                            <CommandList>
                                                                <CommandEmpty>{t('workplaces.import.noRegionFound', 'No region found.')}</CommandEmpty>
                                                                <CommandGroup>
                                                                    {subdivisions.map((subdivision) => {
                                                                        const displayName = getSubdivisionDisplay(subdivision);
                                                                        return (
                                                                            <CommandItem
                                                                                value={subdivision.code + " - " + displayName}
                                                                                key={subdivision.code}
                                                                                className="cursor-pointer"
                                                                                onSelect={() => {
                                                                                    field.onChange(subdivision.code);
                                                                                }}
                                                                            >
                                                                                <Check
                                                                                    className={cn(
                                                                                        "mr-2 h-4 w-4",
                                                                                        subdivision.code === field.value ? "opacity-100" : "opacity-0"
                                                                                    )}
                                                                                />
                                                                                {displayName}
                                                                            </CommandItem>
                                                                        );
                                                                    })}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                                <FormDescription>
                                                    {t('workplaces.import.subdivisionHelp', 'Filter holidays by state or region')}
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        );
                                    }}
                                />
                            )}

                            {/* Year Select */}
                            <FormField
                                control={form.control}
                                name="year"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('workplaces.import.year', 'Year')} *</FormLabel>
                                        <Select
                                            onValueChange={(value) => field.onChange(parseInt(value))}
                                            value={field.value?.toString()}
                                            disabled={isFetchingHolidays}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder={t('workplaces.import.selectYear', 'Select a year')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Array.from({ length: 11 }, (_, i) => 2020 + i).map((year) => (
                                                    <SelectItem key={year} value={year.toString()}>
                                                        {year}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Include School Holidays */}
                            <FormField
                                control={form.control}
                                name="includeSchoolHolidays"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                disabled={isFetchingHolidays}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>
                                                {t('workplaces.import.includeSchoolHolidays', 'Include school holidays')}
                                            </FormLabel>
                                            <FormDescription>
                                                {t('workplaces.import.schoolHolidaysHelp', 'Also import school vacation periods')}
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isFetchingHolidays}
                            >
                                {t('common.cancel', 'Cancel')}
                            </Button>
                            <Button
                                type="button"
                                onClick={form.handleSubmit(onFetchHolidays)}
                                disabled={isFetchingHolidays}
                            >
                                {isFetchingHolidays ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {t('workplaces.import.fetching', 'Fetching...')}
                                    </>
                                ) : (
                                    <>
                                        {t('workplaces.import.fetchHolidays', 'Fetch Holidays')}
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </Form>
                )}

                {step === 'preview' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <div className="text-sm text-muted-foreground">
                                {t('workplaces.import.foundHolidays', `Found ${fetchedHolidays.length} holidays`,
                                    { count: fetchedHolidays.length })}
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={toggleAll}
                            >
                                {selectedHolidays.size === fetchedHolidays.length
                                    ? t('common.deselectAll', 'Deselect All')
                                    : t('common.selectAll', 'Select All')
                                }
                            </Button>
                        </div>

                        <Separator />

                        <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-2">
                                {fetchedHolidays.map((holiday) => {
                                    const startDate = new Date(holiday.startDate);
                                    const name = holiday.name.find(n => n.language === 'en')?.text ||
                                        holiday.name[0]?.text ||
                                        'Holiday';
                                    const isSelected = selectedHolidays.has(holiday.id);

                                    return (
                                        <div
                                            key={holiday.id}
                                            className={`flex items-start space-x-3 rounded-md border p-3 cursor-pointer transition-colors ${isSelected ? 'bg-accent/50 border-primary' : 'hover:bg-accent/30'
                                                }`}
                                            onClick={() => toggleHoliday(holiday.id)}
                                        >
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => toggleHoliday(holiday.id)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{name}</span>
                                                    {isSelected && (
                                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                                    )}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {formatDate(startDate, {
                                                        showTime: false,
                                                        showDay: true,
                                                        showMonthName: true,
                                                        showYear: true,
                                                    })}
                                                    {' · '}
                                                    {holiday.type}
                                                    {holiday.nationwide && ' · Nationwide'}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>

                        <Separator />

                        <DialogFooter className="flex-col sm:flex-row gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setStep('setup')}
                                disabled={isLoading}
                            >
                                {t('common.back', 'Back')}
                            </Button>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    disabled={isLoading}
                                >
                                    {t('common.cancel', 'Cancel')}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={onImport}
                                    disabled={isLoading || selectedHolidays.size === 0}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            {t('workplaces.import.importing', 'Importing...')}
                                        </>
                                    ) : (
                                        <>
                                            {t('workplaces.import.import', `Import ${selectedHolidays.size} Holiday(s)`,
                                                { count: selectedHolidays.size })}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default WorkplaceHolidaysImportModal;

