import React, { useState, useRef, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { Loader2, Upload, FileSpreadsheet, FileText, X, File, Plus, Trash2, ChevronRight, Expand, Minimize, Check, AlertCircle, XIcon } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { formatDecimal, formatDateForAPI } from '@/utils/miscelanea';
import { postOrgPayrollImport, postOrgPayrollsCreate } from '@/api/orgs/payrolls/payrolls';
import { PayrollMappingValidate, PayrollLineMapping, PayrollLineType, PayrollLineSubType } from '@/types/employees/payrolls';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import CurrencyLabel from '@/app/components/labels/currency-label';
import { DateTimePicker } from '@/app/components/forms-elements/date-time-picker';
import PageHeader from '@/app/components/page-header';
import UnsavedChangesModal from '@/app/components/forms-elements/modal-unsaved';
import TipsCard from '@/app/components/cards/tips-card';

function apiDateStringToPickerDate(iso: string | null | undefined): Date | undefined {
    if (iso == null || String(iso).trim() === "") return undefined;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? undefined : d;
}

function normalizeImportedPayrolls(payrolls: PayrollMappingValidate[]): PayrollMappingValidate[] {
    const today = formatDateForAPI(new Date(), "start");
    return payrolls.map((p) => {
        const raw = p.payment_date;
        const hasValid =
            raw != null &&
            String(raw).trim() !== "" &&
            !Number.isNaN(new Date(String(raw)).getTime());
        return {
            ...p,
            payment_date: hasValid ? raw : today,
        };
    });
}

const SUB_TYPES_BY_TYPE: Record<PayrollLineType, PayrollLineSubType[]> = {
    earning: [
        "base_salary", "fixed_salary_allowance", "variable_salary_allowance", "overtime_hours",
        "prorated_extra_payments", "non_salary_earning", "per_diems", "mileage_compensation",
        "reimbursed_expense", "compensation_or_severance_payment", "collective_agreement_salary_bonus",
        "collective_agreement_non_salary_bonus", "other",
    ],
    deduction: [
        "employee_social_security_common_contingencies", "employee_social_security_unemployment",
        "employee_social_security_professional_training", "employee_social_security_overtime",
        "income_tax_withholding", "salary_advance", "court_ordered_garnishment",
        "company_loan_repayment", "union_fee", "other_voluntary_deduction", "other",
    ],
    employer_cost: [
        "employer_social_security_common_contingencies", "employer_social_security_accidents_occupational_illness",
        "employer_social_security_unemployment", "employer_social_security_professional_training",
        "employer_social_security_fogasa", "employer_social_security_mei_contribution",
        "employer_social_security_overtime", "group_insurance", "pension_plan_contribution",
        "social_benefit_expense", "other",
    ],
};

interface ImportPayrollsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPayrollsImported?: () => void;
    orgId: string;
}

const ImportPayrollsModal: React.FC<ImportPayrollsModalProps> = ({
    open,
    onOpenChange,
    onPayrollsImported,
    orgId,
}) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [step, setStep] = useState<'upload' | 'confirm'>('upload');
    const [importedPayrolls, setImportedPayrolls] = useState<PayrollMappingValidate[]>([]);
    const [collapsedPayrolls, setCollapsedPayrolls] = useState<Set<number>>(new Set());
    const [importError, setImportError] = useState<string | null>(null);
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

    const acceptedFileTypes = '.csv,.xlsx,.xls,.pdf';
    const acceptedMimeTypes = [
        'text/csv',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/pdf',
    ];

    const getTypeLabel = useCallback((type: PayrollLineType): string => {
        const labels: Record<PayrollLineType, string> = {
            earning: t("payrolls.types.earning", "Earning"),
            deduction: t("payrolls.types.deduction", "Deduction"),
            employer_cost: t("payrolls.types.employerCost", "Company Cost"),
        };
        return labels[type] || type;
    }, [t]);

    const getSubTypeLabel = useCallback((subType: PayrollLineSubType): string => {
        const labels: Record<PayrollLineSubType, string> = {
            base_salary: "Base Salary",
            fixed_salary_allowance: "Fixed Allowance",
            variable_salary_allowance: "Variable Allowance",
            overtime_hours: "Overtime",
            prorated_extra_payments: "Prorated Extra",
            non_salary_earning: "Non-Salary",
            per_diems: "Per Diems",
            mileage_compensation: "Mileage",
            reimbursed_expense: "Reimbursement",
            compensation_or_severance_payment: "Severance",
            collective_agreement_salary_bonus: "Collective Bonus",
            collective_agreement_non_salary_bonus: "Non-Salary Bonus",
            employee_social_security_common_contingencies: "SS Common",
            employee_social_security_unemployment: "SS Unemployment",
            employee_social_security_professional_training: "SS Training",
            employee_social_security_overtime: "SS Overtime",
            income_tax_withholding: "IRPF",
            salary_advance: "Salary Advance",
            court_ordered_garnishment: "Garnishment",
            company_loan_repayment: "Loan Repayment",
            union_fee: "Union Fee",
            other_voluntary_deduction: "Other Deduction",
            employer_social_security_common_contingencies: "Employer SS Common",
            employer_social_security_accidents_occupational_illness: "Employer SS Accidents",
            employer_social_security_unemployment: "Employer SS Unemployment",
            employer_social_security_professional_training: "Employer SS Training",
            employer_social_security_fogasa: "FOGASA",
            employer_social_security_mei_contribution: "MEI",
            employer_social_security_overtime: "Employer SS Overtime",
            group_insurance: "Group Insurance",
            pension_plan_contribution: "Pension Plan",
            social_benefit_expense: "Social Benefit",
            other: "Other",
        };
        return labels[subType] || subType;
    }, []);

    // --- File helpers ---

    const isValidFile = (file: File): boolean => {
        return acceptedMimeTypes.includes(file.type) || file.name.match(/\.(csv|xlsx|xls|pdf)$/i) !== null;
    };

    const isPdfFile = (file: File): boolean => {
        return file.type === 'application/pdf' || file.name.match(/\.pdf$/i) !== null;
    };

    const isExcelFile = (file: File): boolean => {
        return file.type.includes('spreadsheet') ||
            file.type === 'text/csv' ||
            file.type === 'application/vnd.ms-excel' ||
            file.name.match(/\.(csv|xlsx|xls)$/i) !== null;
    };

    const handleFilesSelect = (files: FileList | File[]) => {
        const fileArray = Array.from(files);
        const validFiles: File[] = [];
        const invalidFiles: string[] = [];

        fileArray.forEach((file) => {
            if (isValidFile(file)) {
                const exists = selectedFiles.some(f => f.name === file.name && f.size === file.size);
                if (!exists) {
                    validFiles.push(file);
                }
            } else {
                invalidFiles.push(file.name);
            }
        });

        if (invalidFiles.length > 0) {
            toast.error(
                t('payrolls.import.invalidFileType', 'Invalid file type: {{files}}. Please select CSV, Excel, or PDF files.', {
                    files: invalidFiles.join(', ')
                })
            );
        }

        if (validFiles.length > 0) {
            setSelectedFiles(prev => [...prev, ...validFiles]);
            setImportError(null);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFilesSelect(files);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFilesSelect(files);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleClearAllFiles = () => {
        setSelectedFiles([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return formatDecimal(0) + ' Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return formatDecimal(bytes / Math.pow(k, i)) + ' ' + sizes[i];
    };

    const getFileIcon = (file: File) => {
        if (isPdfFile(file)) {
            return <FileText className="h-5 w-5 text-red-500 shrink-0" />;
        }
        if (isExcelFile(file)) {
            return <FileSpreadsheet className="h-5 w-5 text-green-600 shrink-0" />;
        }
        return <File className="h-5 w-5 text-muted-foreground shrink-0" />;
    };

    const excelFiles = selectedFiles.filter(f => isExcelFile(f));
    const pdfFiles = selectedFiles.filter(f => isPdfFile(f));

    // --- Step 1: Upload & parse ---

    const handleImport = async () => {
        if (selectedFiles.length === 0) {
            toast.error(t('payrolls.import.noFileSelected', 'Please select files to import'));
            return;
        }

        setIsLoading(true);
        setImportError(null);
        try {
            const response = await postOrgPayrollImport(orgId, selectedFiles);

            if (response.success) {
                const payrolls: PayrollMappingValidate[] = response.success.payrolls || [];
                if (payrolls.length === 0) {
                    setImportError(t('payrolls.import.noPayrollsFound', 'No payrolls were found in the uploaded files. Please check that the files contain valid payroll data and try again.'));
                    return;
                }
                setImportedPayrolls(normalizeImportedPayrolls(payrolls));
                setCollapsedPayrolls(new Set());
                setStep('confirm');
            } else {
                setImportError(response.error || t('payrolls.import.error', 'Failed to import payrolls'));
            }
        } catch (error) {
            console.error('Error importing payrolls:', error);
            setImportError(t('payrolls.import.error', 'Failed to import payrolls'));
        } finally {
            setIsLoading(false);
        }
    };

    // --- Step 2: Confirm (edit + create) ---

    const handlePayrollFieldChange = useCallback((payrollIndex: number, field: keyof PayrollMappingValidate, value: string | null) => {
        setImportedPayrolls(prev => prev.map((p, i) =>
            i === payrollIndex ? { ...p, [field]: value } : p
        ));
    }, []);

    const handleRemovePayroll = useCallback((payrollIndex: number) => {
        setImportedPayrolls(prev => prev.filter((_, i) => i !== payrollIndex));
        setCollapsedPayrolls(prev => {
            const next = new Set<number>();
            prev.forEach(idx => {
                if (idx < payrollIndex) next.add(idx);
                else if (idx > payrollIndex) next.add(idx - 1);
            });
            return next;
        });
    }, []);

    const handleLineFieldChange = useCallback((payrollIndex: number, lineIndex: number, field: keyof PayrollLineMapping, value: any) => {
        setImportedPayrolls(prev => prev.map((p, pi) => {
            if (pi !== payrollIndex) return p;
            const newLines = p.lines.map((l, li) => {
                if (li !== lineIndex) return l;
                if (field === 'type') {
                    const newType = value as PayrollLineType;
                    return { ...l, type: newType, sub_type: SUB_TYPES_BY_TYPE[newType][0] };
                }
                return { ...l, [field]: value };
            });
            return { ...p, lines: newLines };
        }));
    }, []);

    const handleRemoveLine = useCallback((payrollIndex: number, lineIndex: number) => {
        setImportedPayrolls(prev => prev.map((p, pi) => {
            if (pi !== payrollIndex) return p;
            return { ...p, lines: p.lines.filter((_, li) => li !== lineIndex) };
        }));
    }, []);

    const handleAddLine = useCallback((payrollIndex: number) => {
        setImportedPayrolls(prev => prev.map((p, pi) => {
            if (pi !== payrollIndex) return p;
            const newLine: PayrollLineMapping = {
                amount: 0,
                concept: '',
                type: 'earning',
                sub_type: 'base_salary',
            };
            return { ...p, lines: [...p.lines, newLine] };
        }));
    }, []);

    const togglePayrollCollapse = useCallback((index: number) => {
        setCollapsedPayrolls(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    }, []);

    const expandAllPayrollLines = useCallback(() => {
        setCollapsedPayrolls(new Set());
    }, []);

    const collapseAllPayrollLines = useCallback(() => {
        if (importedPayrolls.length === 0) return;
        setCollapsedPayrolls(new Set(importedPayrolls.map((_, i) => i)));
    }, [importedPayrolls]);

    const getPayrollTotals = useCallback((lines: PayrollLineMapping[]) => {
        const earnings_total = lines.filter(l => l.type === 'earning').reduce((sum, l) => sum + (l.amount || 0), 0);
        const deductions_total = lines.filter(l => l.type === 'deduction').reduce((sum, l) => sum + (l.amount || 0), 0);
        const company_costs_total = lines.filter(l => l.type === 'employer_cost').reduce((sum, l) => sum + (l.amount || 0), 0);
        const net_amount_to_receive = earnings_total - deductions_total;
        const gross_payroll_amount = earnings_total + company_costs_total;
        return {
            earnings_total,
            deductions_total,
            net_amount_to_receive,
            company_costs_total,
            gross_payroll_amount,
        };
    }, []);

    const handleConfirmCreate = async () => {
        if (importedPayrolls.length === 0) {
            toast.error(t('payrolls.import.noPayrollsToCreate', 'No payrolls to create'));
            return;
        }

        setIsCreating(true);
        try {
            const response = await postOrgPayrollsCreate(orgId, importedPayrolls);

            if (response.success !== undefined) {
                toast.success(
                    t('payrolls.import.createSuccess', 'Successfully created {{count}} payroll(s)', {
                        count: importedPayrolls.length,
                    })
                );
                handleOpenChange(false);
                onPayrollsImported?.();
            } else {
                toast.error(response.error || t('payrolls.import.createError', 'Failed to create payrolls'));
            }
        } catch (error) {
            console.error('Error creating payrolls:', error);
            toast.error(t('payrolls.import.createError', 'Failed to create payrolls'));
        } finally {
            setIsCreating(false);
        }
    };

    // --- Shared ---

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setSelectedFiles([]);
            setStep('upload');
            setImportedPayrolls([]);
            setCollapsedPayrolls(new Set());
            setImportError(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
        onOpenChange(open);
    };

    const handleAttemptClose = () => {
        if (step === 'confirm') {
            setShowDiscardConfirm(true);
        } else {
            handleOpenChange(false);
        }
    };

    const handleBack = () => {
        setStep('upload');
        setImportedPayrolls([]);
        setCollapsedPayrolls(new Set());
    };

    // --- Render ---

    return (
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleAttemptClose(); }}>
            <DialogContent
                className={cn(
                    "flex flex-col",
                    step === 'upload'
                        ? 'max-w-lg sm:max-w-lg max-h-[90vh]'
                        : [
                            "w-[min(95vw,calc(100vw-2rem))] max-w-[min(95vw,calc(100vw-2rem))]",
                            "sm:max-w-[min(95vw,calc(100vw-2rem))]",
                            "h-[90vh] max-h-[90vh]",
                        ].join(" ")
                )}
                showCloseButton={false}
                onPointerDownOutside={(e) => {
                    if (step === 'confirm') {
                        e.preventDefault();
                        handleAttemptClose();
                    }
                }}
                onEscapeKeyDown={(e) => {
                    if (step === 'confirm') {
                        e.preventDefault();
                        handleAttemptClose();
                    }
                }}
            >
                <DialogHeader className={cn(step === 'confirm' && 'space-y-3 text-left')}>
                    {step === 'upload' ? (
                        <>
                            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                                {t('payrolls.import.title', 'Import Payrolls')}
                            </DialogTitle>
                            <DialogDescription>
                                <TipsCard
                                    title={t('payrolls.import.fileFormatTitle', 'File Format Guide')}
                                    summary={
                                        <div className="space-y-2 text-sm">
                                            <p>
                                                {t('payrolls.import.formatDescription', 'Your Excel file should contain at least the column for Employee DNI or NIE.')}
                                            </p>
                                            <ul className="list-disc list-inside space-y-1 ml-2 text-xs text-muted-foreground">
                                                <li>{t('payrolls.import.tip1', 'Upload Excel files (XLSX, XLS) with payroll data')}</li>
                                                <li>{t('payrolls.import.tip2', 'PDF documents require the Payroll to be initialized in the platform first')}</li>
                                                <li>{t('payrolls.import.tip4', 'All data is editable after import')}</li>
                                            </ul>
                                        </div>
                                    }
                                    doc={{ slug: 'pd_mod_payrolls' }}
                                />
                            </DialogDescription>
                        </>
                    ) : (
                        <>
                            <DialogTitle className="sr-only">
                                {t('payrolls.import.confirmTitle', 'Review Imported Payrolls')}
                            </DialogTitle>
                            <PageHeader
                                showBackButton={false}
                                title={t('payrolls.import.confirmTitle', 'Review Imported Payrolls')}
                                description={t(
                                    'payrolls.import.confirmDescription',
                                    'Review and edit the imported payroll data before saving. {{count}} payroll(s) found.',
                                    { count: importedPayrolls.length }
                                )}
                                className="shrink-0 flex-col gap-3 sm:flex-row sm:items-start"
                                action={
                                    <div className="flex shrink-0 items-center gap-2">
                                        {importedPayrolls.length > 0 && (
                                            collapsedPayrolls.size === 0 ? (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={isCreating}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        collapseAllPayrollLines();
                                                    }}
                                                    className="flex shrink-0 items-center gap-2"
                                                >
                                                    <Minimize className="h-4 w-4" />
                                                    {t('common.collapse_all', 'Collapse all')}
                                                </Button>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={isCreating}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        expandAllPayrollLines();
                                                    }}
                                                    className="flex shrink-0 items-center gap-2"
                                                >
                                                    <Expand className="h-4 w-4" />
                                                    {t('common.expand_all', 'Expand all')}
                                                </Button>
                                            )
                                        )}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            disabled={isCreating}
                                            onClick={handleAttemptClose}
                                            className="h-8 w-8 shrink-0 rounded-md opacity-70 hover:opacity-100"
                                            aria-label={t('common.close', 'Close')}
                                        >
                                            <XIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                }
                            />
                        </>
                    )}
                </DialogHeader>

                {step === 'upload' && (
                    <UploadStep
                        isDragging={isDragging}
                        selectedFiles={selectedFiles}
                        excelFiles={excelFiles}
                        pdfFiles={pdfFiles}
                        fileInputRef={fileInputRef}
                        acceptedFileTypes={acceptedFileTypes}
                        isLoading={isLoading}
                        importError={importError}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onFileInputChange={handleFileInputChange}
                        onRemoveFile={handleRemoveFile}
                        onClearAllFiles={handleClearAllFiles}
                        onImport={handleImport}
                        onClose={() => handleOpenChange(false)}
                        formatFileSize={formatFileSize}
                        getFileIcon={getFileIcon}
                        t={t}
                    />
                )}

                {step === 'confirm' && (
                    <ConfirmStep
                        payrolls={importedPayrolls}
                        collapsedPayrolls={collapsedPayrolls}
                        isCreating={isCreating}
                        onPayrollFieldChange={handlePayrollFieldChange}
                        onRemovePayroll={handleRemovePayroll}
                        onLineFieldChange={handleLineFieldChange}
                        onRemoveLine={handleRemoveLine}
                        onAddLine={handleAddLine}
                        onToggleCollapse={togglePayrollCollapse}
                        onConfirm={handleConfirmCreate}
                        onBack={handleBack}
                        onClose={() => handleOpenChange(false)}
                        getTypeLabel={getTypeLabel}
                        getSubTypeLabel={getSubTypeLabel}
                        getPayrollTotals={getPayrollTotals}
                        t={t}
                    />
                )}
            </DialogContent>

            <UnsavedChangesModal
                isOpen={showDiscardConfirm}
                onClose={(confirmed) => {
                    setShowDiscardConfirm(false);
                    if (confirmed) handleOpenChange(false);
                }}
            />
        </Dialog>
    );
};

// --- Upload Step ---

interface UploadStepProps {
    isDragging: boolean;
    selectedFiles: File[];
    excelFiles: File[];
    pdfFiles: File[];
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    acceptedFileTypes: string;
    isLoading: boolean;
    importError: string | null;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveFile: (index: number) => void;
    onClearAllFiles: () => void;
    onImport: () => void;
    onClose: () => void;
    formatFileSize: (bytes: number) => string;
    getFileIcon: (file: File) => React.ReactNode;
    t: any;
}

const UploadStep: React.FC<UploadStepProps> = ({
    isDragging, selectedFiles, excelFiles, pdfFiles, fileInputRef, acceptedFileTypes,
    isLoading, importError, onDragOver, onDragLeave, onDrop, onFileInputChange, onRemoveFile,
    onClearAllFiles, onImport, onClose, formatFileSize, getFileIcon, t,
}) => {
    return (
        <>
            <div className="space-y-4 py-2">
                <div
                    className={cn(
                        'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
                        isDragging
                            ? 'border-primary bg-primary/5'
                            : 'border-muted-foreground/25 hover:border-primary/50',
                        selectedFiles.length > 0 && 'border-primary/50'
                    )}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <div className="flex flex-col items-center">
                            <span className="font-medium text-sm">
                                {t('payrolls.import.dropzone', 'Drop your files here or click to browse')}
                            </span>
                            <span className="text-xs text-muted-foreground mt-1">
                                {t('payrolls.import.supportedFormats', 'Supports CSV, XLSX, XLS and PDF')}
                            </span>
                        </div>
                    </div>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept={acceptedFileTypes}
                    onChange={onFileInputChange}
                    className="hidden"
                    multiple
                />

                {importError && (
                    <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-3">
                        <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-destructive">
                                {t('payrolls.import.importFailed', 'Import failed')}
                            </p>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                {importError}
                            </p>
                        </div>
                    </div>
                )}

                {selectedFiles.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                                {t('payrolls.import.selectedFiles', '{{count}} file(s) selected', { count: selectedFiles.length })}
                            </span>
                            <Button type="button" variant="ghost" size="sm" onClick={onClearAllFiles} className="h-7 text-xs">
                                {t('common.clearAll', 'Clear all')}
                            </Button>
                        </div>

                        <ScrollArea className="max-h-48">
                            <div className="space-y-2 pr-3">
                                {excelFiles.length > 0 && (
                                    <div className="space-y-1">
                                        <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                            <FileSpreadsheet className="h-3 w-3" />
                                            {t('payrolls.import.excelFiles', 'Excel/CSV Files')} ({excelFiles.length})
                                        </div>
                                        {excelFiles.map((file) => {
                                            const originalIndex = selectedFiles.indexOf(file);
                                            return (
                                                <div key={`excel-${originalIndex}-${file.name}`} className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded-md">
                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                        {getFileIcon(file)}
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-medium truncate">{file.name}</p>
                                                            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                                        </div>
                                                    </div>
                                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={(e) => { e.stopPropagation(); onRemoveFile(originalIndex); }}>
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {pdfFiles.length > 0 && (
                                    <div className="space-y-1">
                                        <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                            <FileText className="h-3 w-3" />
                                            {t('payrolls.import.pdfFiles', 'PDF Documents')} ({pdfFiles.length})
                                        </div>
                                        {pdfFiles.map((file) => {
                                            const originalIndex = selectedFiles.indexOf(file);
                                            return (
                                                <div key={`pdf-${originalIndex}-${file.name}`} className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded-md">
                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                        {getFileIcon(file)}
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-medium truncate">{file.name}</p>
                                                            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                                        </div>
                                                    </div>
                                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={(e) => { e.stopPropagation(); onRemoveFile(originalIndex); }}>
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                )}

            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                    {t('common.cancel', 'Cancel')}
                </Button>
                <Button type="button" onClick={onImport} disabled={isLoading || selectedFiles.length === 0}>
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t('payrolls.import.importing', 'Importing...')}
                        </>
                    ) : (
                        <>
                            <Upload className="h-4 w-4 mr-2" />
                            {t('payrolls.import.importFiles', 'Import {{count}} file(s)', { count: selectedFiles.length })}
                        </>
                    )}
                </Button>
            </DialogFooter>
        </>
    );
};

// --- Confirm Step (Excel-like spreadsheet) ---

interface ConfirmStepProps {
    payrolls: PayrollMappingValidate[];
    collapsedPayrolls: Set<number>;
    isCreating: boolean;
    onPayrollFieldChange: (index: number, field: keyof PayrollMappingValidate, value: string | null) => void;
    onRemovePayroll: (index: number) => void;
    onLineFieldChange: (payrollIndex: number, lineIndex: number, field: keyof PayrollLineMapping, value: any) => void;
    onRemoveLine: (payrollIndex: number, lineIndex: number) => void;
    onAddLine: (payrollIndex: number) => void;
    onToggleCollapse: (index: number) => void;
    onConfirm: () => void;
    onBack: () => void;
    onClose: () => void;
    getTypeLabel: (type: PayrollLineType) => string;
    getSubTypeLabel: (subType: PayrollLineSubType) => string;
    getPayrollTotals: (lines: PayrollLineMapping[]) => {
        earnings_total: number;
        deductions_total: number;
        net_amount_to_receive: number;
        company_costs_total: number;
        gross_payroll_amount: number;
    };
    t: any;
}

const CELL = "h-8 text-sm border-0 shadow-none focus-visible:ring-1 bg-background/80";

const ConfirmStep: React.FC<ConfirmStepProps> = ({
    payrolls, collapsedPayrolls, isCreating,
    onPayrollFieldChange, onRemovePayroll, onLineFieldChange, onRemoveLine, onAddLine,
    onToggleCollapse, onConfirm, onBack, onClose,
    getTypeLabel, getSubTypeLabel, getPayrollTotals, t,
}) => {
    const globalTotals = useMemo(() => {
        let earnings_total = 0;
        let deductions_total = 0;
        let company_costs_total = 0;
        payrolls.forEach(p => {
            const rowTotals = getPayrollTotals(p.lines);
            earnings_total += rowTotals.earnings_total;
            deductions_total += rowTotals.deductions_total;
            company_costs_total += rowTotals.company_costs_total;
        });
        const net_amount_to_receive = earnings_total - deductions_total;
        const gross_payroll_amount = earnings_total + company_costs_total;
        return {
            earnings_total,
            deductions_total,
            net_amount_to_receive,
            company_costs_total,
            gross_payroll_amount,
        };
    }, [payrolls, getPayrollTotals]);

    return (
        <>
            <div className="relative flex-1 min-h-0 overflow-auto rounded-md border bg-card">
                <table className="w-full min-w-[1120px] caption-bottom text-sm">
                    <TableHeader className="sticky top-0 z-20 bg-muted/95 shadow-[inset_0_-1px_0_0_hsl(var(--border))] backdrop-blur-sm supports-[backdrop-filter]:bg-muted/80">
                        <TableRow className="border-b-0 hover:bg-transparent">
                            <TableHead className="w-8"></TableHead>
                            <TableHead className="w-10">#</TableHead>
                            <TableHead className="min-w-[180px]">{t('payrolls.import.employeeName', 'Employee')}</TableHead>
                            <TableHead className="min-w-[120px]">{t('payrolls.import.nationalId', 'NIF/DNI')}</TableHead>
                            <TableHead className="min-w-[132px]">{t('payrolls.startDate', 'Start Date')}</TableHead>
                            <TableHead className="min-w-[132px]">{t('payrolls.endDate', 'End Date')}</TableHead>
                            <TableHead className="min-w-[132px]">{t('payrolls.paymentDate', 'Payment Date')}</TableHead>
                            <TableHead className="min-w-[100px] text-right">{t('payrolls.earningsTotal', 'Earnings')}</TableHead>
                            <TableHead className="min-w-[100px] text-right">{t('payrolls.deductionsTotal', 'Deductions')}</TableHead>
                            <TableHead className="min-w-[100px] text-right">{t('payrolls.netAmount', 'Net Amount')}</TableHead>
                            <TableHead className="min-w-[100px] text-right">{t('payrolls.companyContributions', 'Company Contrib.')}</TableHead>
                            <TableHead className="min-w-[100px] text-right">{t('payrolls.companyCost', 'Company Cost')}</TableHead>
                            <TableHead className="w-10"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payrolls.map((payroll, pi) => {
                            const expanded = !collapsedPayrolls.has(pi);
                            const totals = getPayrollTotals(payroll.lines);
                            return (
                                <React.Fragment key={pi}>
                                    {/* Payroll summary row */}
                                    <TableRow className={cn(expanded && "bg-muted/40")}>
                                        <TableCell className="w-8 p-1 align-middle">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 shrink-0 rounded-md p-0 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onToggleCollapse(pi);
                                                }}
                                                aria-expanded={expanded}
                                                aria-label={
                                                    expanded
                                                        ? t('common.collapse', 'Collapse')
                                                        : t('common.expand', 'Expand')
                                                }
                                            >
                                                <ChevronRight
                                                    className={cn(
                                                        "h-4 w-4 transition-all duration-300",
                                                        expanded ? "rotate-90" : "rotate-0"
                                                    )}
                                                />
                                            </Button>
                                        </TableCell>
                                        <TableCell className="w-10 text-muted-foreground font-mono tabular-nums text-xs">{pi + 1}</TableCell>
                                        <TableCell className="whitespace-normal">
                                            <Input
                                                value={payroll.employee_name || ''}
                                                onChange={(e) => onPayrollFieldChange(pi, 'employee_name', e.target.value || null)}
                                                placeholder={t('payrolls.import.employeeName', 'Employee')}
                                                className={cn(CELL, "font-medium h-8")}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                value={payroll.national_id_number}
                                                onChange={(e) => onPayrollFieldChange(pi, 'national_id_number', e.target.value)}
                                                placeholder={t('payrolls.import.nationalId', 'NIF/DNI')}
                                                className={cn(CELL, "font-mono h-8")}
                                            />
                                        </TableCell>
                                        <TableCell className="align-top">
                                            <DateTimePicker
                                                showTime={false}
                                                value={apiDateStringToPickerDate(payroll.start_date)}
                                                onChange={(d) =>
                                                    onPayrollFieldChange(
                                                        pi,
                                                        'start_date',
                                                        d ? formatDateForAPI(d, "start") : ""
                                                    )
                                                }
                                                className="h-8 min-w-[9rem] text-xs"
                                                disabled={isCreating}
                                            />
                                        </TableCell>
                                        <TableCell className="align-top">
                                            <DateTimePicker
                                                showTime={false}
                                                value={apiDateStringToPickerDate(payroll.end_date)}
                                                onChange={(d) =>
                                                    onPayrollFieldChange(
                                                        pi,
                                                        'end_date',
                                                        d ? formatDateForAPI(d, "start") : ""
                                                    )
                                                }
                                                className="h-8 min-w-[9rem] text-xs"
                                                disabled={isCreating}
                                            />
                                        </TableCell>
                                        <TableCell className="align-top">
                                            <DateTimePicker
                                                showTime={false}
                                                value={apiDateStringToPickerDate(payroll.payment_date) ?? null}
                                                onChange={(d) =>
                                                    onPayrollFieldChange(
                                                        pi,
                                                        'payment_date',
                                                        d ? formatDateForAPI(d, "start") : null
                                                    )
                                                }
                                                className="h-8 min-w-[9rem] text-xs"
                                                disabled={isCreating}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            <CurrencyLabel
                                                data={totals.earnings_total != null ? { value: totals.earnings_total } : null}
                                                variant="gain"
                                            />
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            <CurrencyLabel
                                                data={totals.deductions_total != null ? totals.deductions_total : null}
                                                variant="negative-loss"
                                            />
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            <CurrencyLabel
                                                data={totals.net_amount_to_receive != null ? { value: totals.net_amount_to_receive } : null}
                                                className="font-semibold"
                                            />
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            <CurrencyLabel
                                                data={totals.company_costs_total != null ? { value: totals.company_costs_total } : null}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            <CurrencyLabel
                                                data={totals.gross_payroll_amount != null ? { value: totals.gross_payroll_amount } : null}
                                            />
                                        </TableCell>
                                        <TableCell className="w-10 p-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => onRemovePayroll(pi)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>

                                    {/* Expanded lines sub-rows */}
                                    {expanded && (
                                        <>
                                            {payroll.lines.map((line, li) => {
                                                const availableSubTypes = SUB_TYPES_BY_TYPE[line.type] || [];
                                                return (
                                                    <TableRow key={`${pi}-line-${li}`} className="group bg-muted/25 hover:bg-muted/40 border-l-2 border-l-primary/30">
                                                        <TableCell className="p-1"></TableCell>
                                                        <TableCell className="p-1"></TableCell>
                                                        <TableCell className="p-1 whitespace-normal" colSpan={2}>
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <Select
                                                                    value={line.type}
                                                                    onValueChange={(v) => onLineFieldChange(pi, li, 'type', v)}
                                                                >
                                                                    <SelectTrigger className={cn(
                                                                        "h-8 text-sm border border-input shadow-sm bg-background min-w-[10.5rem] w-44 shrink-0",
                                                                        line.type === "earning" && "text-green-600",
                                                                        line.type === "deduction" && "text-orange-600",
                                                                        line.type === "employer_cost" && "text-foreground",
                                                                    )}>
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="earning" className="text-green-600">{getTypeLabel("earning")}</SelectItem>
                                                                        <SelectItem value="deduction" className="text-orange-600">{getTypeLabel("deduction")}</SelectItem>
                                                                        <SelectItem value="employer_cost">{getTypeLabel("employer_cost")}</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <Select
                                                                    value={line.sub_type}
                                                                    onValueChange={(v) => onLineFieldChange(pi, li, 'sub_type', v)}
                                                                >
                                                                    <SelectTrigger className="h-8 text-sm border border-input shadow-sm bg-background min-w-[14rem] flex-1">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {availableSubTypes.map((st) => (
                                                                            <SelectItem key={st} value={st}>{getSubTypeLabel(st)}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="p-1 whitespace-normal" colSpan={3}>
                                                            <Input
                                                                value={line.concept || ''}
                                                                onChange={(e) => onLineFieldChange(pi, li, 'concept', e.target.value || null)}
                                                                placeholder={t('payrolls.lines.conceptPlaceholder', 'Description...')}
                                                                className={cn(CELL, "h-8")}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="p-1 whitespace-normal" colSpan={2}>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={line.amount || ''}
                                                                onChange={(e) => onLineFieldChange(pi, li, 'amount', parseFloat(e.target.value) || 0)}
                                                                className={cn(
                                                                    CELL, "h-8 text-right font-medium tabular-nums",
                                                                    line.type === "earning" && "text-green-600",
                                                                    line.type === "deduction" && "text-orange-600",
                                                                    line.type === "employer_cost" && "text-foreground",
                                                                )}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="p-1"></TableCell>
                                                        <TableCell className="p-1"></TableCell>
                                                        <TableCell className="p-1"></TableCell>
                                                        <TableCell className="w-10 p-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                                                onClick={() => onRemoveLine(pi, li)}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                            {/* Add line row */}
                                            <TableRow className="border-l-2 border-l-primary/30 bg-muted/15 hover:bg-muted/25">
                                                <TableCell colSpan={13} className="p-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 gap-1.5 text-muted-foreground ml-8"
                                                        onClick={() => onAddLine(pi)}
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                        {t('payrolls.lines.addLine', 'Add Line')}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        </>
                                    )}
                                </React.Fragment>
                            );
                        })}

                        {payrolls.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={13} className="text-center py-16 text-muted-foreground">
                                    {t('payrolls.import.allPayrollsRemoved', 'All payrolls have been removed. Go back to upload new files.')}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    {payrolls.length > 0 && (
                        <TableFooter className="sticky bottom-0 z-10 border-t-2 border-border !bg-muted shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.08)] [&>tr]:border-0 [&>tr]:hover:!bg-muted">
                            <TableRow className="border-0 bg-muted hover:bg-muted">
                                <TableCell
                                    colSpan={7}
                                    className="bg-muted py-3 pl-2 pr-4 text-left align-middle text-sm font-medium text-foreground"
                                >
                                    {t('payrolls.import.totalPayrolls', '{{count}} payroll(s)', { count: payrolls.length })}
                                </TableCell>
                                <TableCell className="min-w-[100px] bg-muted py-3 text-right align-middle tabular-nums">
                                    <CurrencyLabel
                                        data={globalTotals.earnings_total != null ? { value: globalTotals.earnings_total } : null}
                                        variant="gain"
                                    />
                                </TableCell>
                                <TableCell className="min-w-[100px] bg-muted py-3 text-right align-middle tabular-nums">
                                    <CurrencyLabel
                                        data={globalTotals.deductions_total != null ? globalTotals.deductions_total : null}
                                        variant="negative-loss"
                                    />
                                </TableCell>
                                <TableCell className="min-w-[100px] bg-muted py-3 text-right align-middle tabular-nums">
                                    <CurrencyLabel
                                        data={globalTotals.net_amount_to_receive != null ? { value: globalTotals.net_amount_to_receive } : null}
                                        className="font-semibold"
                                    />
                                </TableCell>
                                <TableCell className="min-w-[100px] bg-muted py-3 text-right align-middle tabular-nums">
                                    <CurrencyLabel
                                        data={globalTotals.company_costs_total != null ? { value: globalTotals.company_costs_total } : null}
                                    />
                                </TableCell>
                                <TableCell className="min-w-[100px] bg-muted py-3 text-right align-middle tabular-nums">
                                    <CurrencyLabel
                                        data={globalTotals.gross_payroll_amount != null ? { value: globalTotals.gross_payroll_amount } : null}
                                    />
                                </TableCell>
                                <TableCell className="w-10 bg-muted p-1" aria-hidden />
                            </TableRow>
                        </TableFooter>
                    )}
                </table>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onBack} disabled={isCreating}>
                    {t('common.back', 'Back')}
                </Button>
                <div className="flex gap-2 ml-auto">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isCreating}>
                        {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button type="button" onClick={onConfirm} disabled={isCreating || payrolls.length === 0}>
                        {isCreating ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {t('payrolls.import.creating', 'Creating...')}
                            </>
                        ) : (
                            <>
                                <Check className="h-4 w-4 mr-2" />
                                {t('payrolls.import.confirmCreate', 'Confirm Import ({{count}})', { count: payrolls.length })}
                            </>
                        )}
                    </Button>
                </div>
            </DialogFooter>
        </>
    );
};

export default ImportPayrollsModal;
