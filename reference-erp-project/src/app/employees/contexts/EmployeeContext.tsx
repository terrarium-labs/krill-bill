import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getEmployee } from "@/api/employees/employees";
import { useParams } from "react-router";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Employee } from "@/types/employees/employees";
import { Holiday } from "@/types/general/holidays";
import { SickLeave } from "@/types/employees/sick-leaves";
import { Absence, AbsenceTracker } from "@/types/employees/absences";
import { AbsenceType } from "@/types/general/absences";
import { getOrgWorkplaceHolidays } from "@/api/orgs/workplaces/holidays/holidays";
import { getEmployeeSickLeaves } from "@/api/employees/sick-leaves/sick-leaves";
import { getEmployeeAbsences, getEmployeeAbsenceTracker, getEmployeeAbsenceTypes } from "@/api/employees/absences/absences";
import { getTimePolicy } from "@/api/orgs/time-policies/time-policies";
import { TimePolicy } from "@/types/general/time-policies";

const ABSENCE_STATUS_TO_FETCH = ["pending", "approved", "rejected"];

interface EmployeeContextType {
    employee: Employee;
    refreshEmployee: () => void;
    selectedYear: number;
    setSelectedYear: (year: number) => void;
    holidays: Holiday[];
    sickLeaves: SickLeave[];
    refreshHolidaysAndSickLeaves: () => void;
    absences: Absence[];
    absenceTracker: AbsenceTracker[] | null;
    absenceTypesList: AbsenceType[];
    refreshAbsences: () => void;
    timePolicy: TimePolicy | null;
    refreshTimePolicy: () => void;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export const EmployeeProvider = ({ children }: { children: React.ReactNode }) => {
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedYearState, setSelectedYearState] = useState(new Date().getFullYear());
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [sickLeaves, setSickLeaves] = useState<SickLeave[]>([]);
    const [absences, setAbsences] = useState<Absence[]>([]);
    const [absenceTracker, setAbsenceTracker] = useState<AbsenceTracker[] | null>(null);
    const [absenceTypesList, setAbsenceTypesList] = useState<AbsenceType[]>([]);
    const [timePolicy, setTimePolicy] = useState<TimePolicy | null>(null);
    const { employeeId, orgId } = useParams<{ employeeId: string, orgId: string }>();

    const setSelectedYear = useCallback((year: number) => {
        if (Number.isFinite(year)) {
            setSelectedYearState(year);
        }
    }, []);

    const fetchEmployee = async (employeeId: string) => {
        if (!orgId) return;
        try {
            setIsLoading(true);
            const response = await getEmployee(orgId, employeeId);
            if (response.success) {
                setEmployee(response.success.employee);
            }
        } catch (error) {
            console.error("Error fetching employee:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchHolidaysAndSickLeaves = async () => {
        if (!orgId || !employeeId || !Number.isFinite(selectedYearState)) return;
        try {
            const yearStr = selectedYearState.toString();
            const [holidaysRes, sickLeavesRes] = await Promise.all([
                employee?.org_user_workplace?.id
                    ? getOrgWorkplaceHolidays(orgId, employee.org_user_workplace.id, yearStr)
                    : Promise.resolve({ success: { holidays: [] } }),
                getEmployeeSickLeaves(
                    orgId,
                    employeeId,
                    `${yearStr}-01-01`,
                    `${yearStr}-12-31`,
                    undefined,
                    undefined
                ),
            ]);
            if (holidaysRes?.success?.holidays) {
                setHolidays(holidaysRes.success.holidays);
            } else {
                setHolidays([]);
            }
            if (sickLeavesRes?.success?.sick_leaves) {
                setSickLeaves(sickLeavesRes.success.sick_leaves);
            } else {
                setSickLeaves([]);
            }
        } catch (error) {
            console.error("Error fetching holidays/sick leaves:", error);
            setHolidays([]);
            setSickLeaves([]);
        }
    };

    const fetchTimePolicy = async () => {
        if (!orgId || !employee?.org_time_policy?.id) return;
        try {
            const response = await getTimePolicy(orgId, employee.org_time_policy.id);
            if (response.success && response.success.time_policy) {
                setTimePolicy(response.success.time_policy);
            } else {
                setTimePolicy(null);
            }
        } catch (error) {
            console.error("Error fetching time policy:", error);
            setTimePolicy(null);
        }
    };

    useEffect(() => {
        if (orgId && employeeId) {
            fetchEmployee(employeeId);
        }
    }, [orgId, employeeId]);

    const fetchAbsencesData = async () => {
        if (!orgId || !employeeId || !employee || !Number.isFinite(selectedYearState)) return;
        try {
            const yearStr = selectedYearState.toString();
            const [absencesRes, trackerRes, typesRes] = await Promise.all([
                getEmployeeAbsences(orgId, employee.id, yearStr, ABSENCE_STATUS_TO_FETCH),
                getEmployeeAbsenceTracker(orgId, employee.id, yearStr),
                getEmployeeAbsenceTypes(orgId, employee.id, yearStr),
            ]);
            if (absencesRes.success) setAbsences(absencesRes.success.absences ?? []);
            if (trackerRes.success) setAbsenceTracker(trackerRes.success.tracker ?? []);
            if (typesRes.success?.absence_types) setAbsenceTypesList(typesRes.success.absence_types as AbsenceType[]);
            else setAbsenceTypesList([]);
        } catch (error) {
            console.error("Error fetching absences data:", error);
            setAbsences([]);
            setAbsenceTracker(null);
            setAbsenceTypesList([]);
        }
    };

    useEffect(() => {
        if (orgId && employeeId && employee) {
            fetchHolidaysAndSickLeaves();
        }
    }, [orgId, employeeId, employee, selectedYearState]);

    useEffect(() => {
        if (orgId && employeeId && employee) {
            fetchAbsencesData();
        }
    }, [orgId, employeeId, employee, selectedYearState]);

    useEffect(() => {
        if (orgId && employee?.org_time_policy?.id) {
            fetchTimePolicy();
        } else {
            setTimePolicy(null);
        }
    }, [orgId, employee?.org_time_policy?.id]);

    if (isLoading || !employee) {
        return <PageSkeleton showBackButton={true} showIcon={true} tabCount={7} variant="split" />;
    }

    const refreshEmployee = () => {
        if (orgId && employeeId) {
            fetchEmployee(employeeId);
        }
    };

    const refreshHolidaysAndSickLeaves = () => {
        fetchHolidaysAndSickLeaves();
    };

    const refreshAbsences = () => {
        fetchAbsencesData();
    };

    const refreshTimePolicy = () => {
        fetchTimePolicy();
    };

    return (
        <EmployeeContext.Provider
            value={{
                employee,
                refreshEmployee,
                selectedYear: selectedYearState,
                setSelectedYear,
                holidays,
                sickLeaves,
                refreshHolidaysAndSickLeaves,
                absences,
                absenceTracker,
                absenceTypesList,
                refreshAbsences,
                timePolicy,
                refreshTimePolicy,
            }}
        >
            {children}
        </EmployeeContext.Provider>
    );
};

export const useEmployee = () => {
    const context = useContext(EmployeeContext);
    if (context === undefined) {
        throw new Error("useEmployee must be used within an EmployeeContext");
    }
    return context;
};

