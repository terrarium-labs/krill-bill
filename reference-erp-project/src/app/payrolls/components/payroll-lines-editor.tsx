import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { useTranslation } from "@/hooks/useTranslation";
import { PayrollLine, PayrollLineType, PayrollLineSubType } from "@/types/employees/payrolls";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import CurrencyLabel from "@/app/components/labels/currency-label";

// Generate a unique ID
const generateId = () => `new_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// Sub-type options grouped by type
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

interface EditableLine extends Omit<PayrollLine, "id"> {
    id: string;
    isNew?: boolean;
    isDeleted?: boolean;
}

interface SortableRowProps {
    line: EditableLine;
    onUpdate: (id: string, field: keyof EditableLine, value: any) => void;
    onDelete: (id: string) => void;
    getSubTypeLabel: (subType: PayrollLineSubType) => string;
    getTypeLabel: (type: PayrollLineType) => string;
}

const SortableRow: React.FC<SortableRowProps> = ({ line, onUpdate, onDelete, getSubTypeLabel, getTypeLabel }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: line.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const availableSubTypes = SUB_TYPES_BY_TYPE[line.type] || [];

    const handleTypeChange = (newType: PayrollLineType) => {
        onUpdate(line.id, "type", newType);
        onUpdate(line.id, "sub_type", SUB_TYPES_BY_TYPE[newType][0]);
    };

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            className={cn(
                "group",
                isDragging && "opacity-50 bg-muted",
                line.isDeleted && "opacity-30"
            )}
        >
            {/* Drag Handle */}
            <TableCell className="w-8 p-0 pl-1">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
                    disabled={line.isDeleted}
                >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                </button>
            </TableCell>

            {/* Type */}
            <TableCell className="w-32 p-1">
                <Select
                    value={line.type}
                    onValueChange={(value) => handleTypeChange(value as PayrollLineType)}
                    disabled={line.isDeleted}
                >
                    <SelectTrigger className={cn(
                        "h-8 text-sm border-0 shadow-none focus:ring-0 bg-transparent",
                        line.type === "earning" && "text-green-600",
                        line.type === "deduction" && "text-orange-600",
                        line.type === "employer_cost" && "text-foreground"
                    )}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="earning" className="text-green-600">{getTypeLabel("earning")}</SelectItem>
                        <SelectItem value="deduction" className="text-orange-600">{getTypeLabel("deduction")}</SelectItem>
                        <SelectItem value="employer_cost">{getTypeLabel("employer_cost")}</SelectItem>
                    </SelectContent>
                </Select>
            </TableCell>

            {/* Sub Type */}
            <TableCell className="w-48 p-1">
                <Select
                    value={line.sub_type}
                    onValueChange={(value) => onUpdate(line.id, "sub_type", value as PayrollLineSubType)}
                    disabled={line.isDeleted}
                >
                    <SelectTrigger className="h-8 text-sm border-0 shadow-none focus:ring-0 bg-transparent w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {availableSubTypes.map((subType) => (
                            <SelectItem key={subType} value={subType}>{getSubTypeLabel(subType)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </TableCell>

            {/* Concept */}
            <TableCell className="p-1">
                <Input
                    value={line.concept}
                    onChange={(e) => onUpdate(line.id, "concept", e.target.value)}
                    placeholder="Description..."
                    className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 bg-transparent"
                    disabled={line.isDeleted}
                />
            </TableCell>

            {/* Amount */}
            <TableCell className="w-32 p-1">
                <Input
                    type="number"
                    step="0.01"
                    value={line.amount || ""}
                    onChange={(e) => onUpdate(line.id, "amount", parseFloat(e.target.value) || 0)}
                    className={cn(
                        "h-8 text-sm text-right border-0 shadow-none focus-visible:ring-0 bg-transparent font-medium tabular-nums",
                        line.type === "earning" && "text-green-600",
                        line.type === "deduction" && "text-orange-600",
                        line.type === "employer_cost" && "text-foreground"
                    )}
                    disabled={line.isDeleted}
                />
            </TableCell>

            {/* Actions */}
            <TableCell className="w-10 p-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(line.id)}
                    disabled={line.isDeleted}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </TableCell>
        </TableRow>
    );
};

interface PayrollLinesEditorProps {
    isEditMode: boolean;
    initialLines?: PayrollLine[];
    onChange?: (lines: EditableLine[]) => void;
}

const PayrollLinesEditor: React.FC<PayrollLinesEditorProps> = ({
    isEditMode,
    initialLines = [],
    onChange,
}) => {
    const { t } = useTranslation();
    const [lines, setLines] = useState<EditableLine[]>([]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

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

    // Initialize lines from initialLines prop or defaults for new payrolls
    useEffect(() => {
        if (isEditMode && initialLines.length > 0) {
            // Edit mode - use provided initial lines
            setLines(initialLines.map((line: PayrollLine) => ({ ...line, isNew: false, isDeleted: false })));
        } else if (!isEditMode) {
            // Create mode - use default lines
            const defaultLines: EditableLine[] = [
                {
                    id: generateId(),
                    concept: "",
                    amount: 0,
                    type: "earning",
                    sub_type: "base_salary",
                    order: 0,
                    isNew: true,
                    isDeleted: false,
                },
                {
                    id: generateId(),
                    concept: "",
                    amount: 0,
                    type: "deduction",
                    sub_type: "income_tax_withholding",
                    order: 1,
                    isNew: true,
                    isDeleted: false,
                },
                {
                    id: generateId(),
                    concept: "",
                    amount: 0,
                    type: "employer_cost",
                    sub_type: "employer_social_security_common_contingencies",
                    order: 2,
                    isNew: true,
                    isDeleted: false,
                },
            ];
            setLines(defaultLines);
        }
    }, [isEditMode, initialLines]);

    useEffect(() => {
        if (onChange) onChange(lines);
    }, [lines, onChange]);

    const handleUpdateLine = useCallback((id: string, field: keyof EditableLine, value: any) => {
        setLines((prev) => prev.map((line) => line.id === id ? { ...line, [field]: value } : line));
    }, []);

    const handleDeleteLine = useCallback((id: string) => {
        setLines((prev) => prev.map((line) => line.id === id ? { ...line, isDeleted: true } : line).filter((line) => !(line.isNew && line.isDeleted)));
    }, []);

    const handleAddLine = useCallback(() => {
        const activeLines = lines.filter((l) => !l.isDeleted);

        // If no lines exist, add one of each type
        if (activeLines.length === 0) {
            const newLines: EditableLine[] = [
                {
                    id: generateId(),
                    concept: "",
                    amount: 0,
                    type: "earning",
                    sub_type: "base_salary",
                    order: 0,
                    isNew: true,
                    isDeleted: false,
                },
                {
                    id: generateId(),
                    concept: "",
                    amount: 0,
                    type: "deduction",
                    sub_type: "income_tax_withholding",
                    order: 1,
                    isNew: true,
                    isDeleted: false,
                },
                {
                    id: generateId(),
                    concept: "",
                    amount: 0,
                    type: "employer_cost",
                    sub_type: "employer_social_security_common_contingencies",
                    order: 2,
                    isNew: true,
                    isDeleted: false,
                },
            ];
            setLines((prev) => [...prev, ...newLines]);
        } else {
            // Add a single earning line
            const newLine: EditableLine = {
                id: generateId(),
                concept: "",
                amount: 0,
                type: "earning",
                sub_type: "base_salary",
                order: activeLines.length,
                isNew: true,
                isDeleted: false,
            };
            setLines((prev) => [...prev, newLine]);
        }
    }, [lines]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setLines((prev) => {
                const oldIndex = prev.findIndex((l) => l.id === active.id);
                const newIndex = prev.findIndex((l) => l.id === over.id);
                return arrayMove(prev, oldIndex, newIndex).map((line, index) => ({ ...line, order: index }));
            });
        }
    };

    const totals = useMemo(() => {
        const activeLines = lines.filter((l) => !l.isDeleted);
        const earnings = activeLines.filter((l) => l.type === "earning").reduce((sum, l) => sum + l.amount, 0);
        const deductions = activeLines.filter((l) => l.type === "deduction").reduce((sum, l) => sum + l.amount, 0);
        const employerCosts = activeLines.filter((l) => l.type === "employer_cost").reduce((sum, l) => sum + l.amount, 0);
        return { earnings, deductions, employerCosts, net: earnings - deductions, totalCost: earnings + employerCosts };
    }, [lines]);

    const activeLines = lines.filter((l) => !l.isDeleted);

    return (
        <div>
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="w-8"></TableHead>
                        <TableHead className="w-32">{t("payrolls.lines.type", "Type")}</TableHead>
                        <TableHead className="w-48">{t("payrolls.lines.category", "Category")}</TableHead>
                        <TableHead>{t("payrolls.lines.description", "Description")}</TableHead>
                        <TableHead className="w-32 text-right">{t("payrolls.lines.amount", "Amount")}</TableHead>
                        <TableHead className="w-10"></TableHead>
                    </TableRow>
                </TableHeader>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={activeLines.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                        <TableBody>
                            {activeLines.length > 0 ? (
                                activeLines.map((line) => (
                                    <SortableRow
                                        key={line.id}
                                        line={line}
                                        onUpdate={handleUpdateLine}
                                        onDelete={handleDeleteLine}
                                        getSubTypeLabel={getSubTypeLabel}
                                        getTypeLabel={getTypeLabel}
                                    />
                                ))
                            ) : null}
                        </TableBody>
                    </SortableContext>
                </DndContext>
            </Table>

            <Button variant="ghost" size="sm"
                className="gap-1.5 my-2 text-muted-foreground w-full mx-auto justify-center" onClick={handleAddLine}>
                <Plus className="h-4 w-4" />
                {t("payrolls.lines.addLine", "Add Line")}
            </Button>

            <Table>
                <TableFooter>
                    <TableRow className="hover:bg-transparent bg-muted/50">
                        <TableCell colSpan={4} className="text-right">
                            {t("payrolls.summary.netSalary", "Net Salary")}
                        </TableCell>
                        <TableCell className="text-right font-bold tabular-nums text-base">
                            <CurrencyLabel data={totals.net} />
                        </TableCell>
                        <TableCell></TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-transparent bg-muted/50 text-muted-foreground">
                        <TableCell colSpan={4} className="text-right">
                            {t("payrolls.summary.totalCost", "Total Company Cost")}
                        </TableCell>
                        <TableCell className="text-right font-bold tabular-nums text-base">
                            <CurrencyLabel data={totals.totalCost} />
                        </TableCell>
                        <TableCell></TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </div >
    );
};

export default PayrollLinesEditor;
