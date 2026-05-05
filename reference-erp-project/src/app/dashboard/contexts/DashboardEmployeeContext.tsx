import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getEmployee } from "@/api/employees/employees";
import { getEmployeeActiveTimeRecord } from "@/api/employees/time-records/time-records";
import { useParams } from "react-router";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Employee } from "@/types/employees/employees";
import { TimeRecord } from "@/types/employees/time-records";
import { Holiday } from "@/types/general/holidays";
import { SickLeave } from "@/types/employees/sick-leaves";
import { Absence, AbsenceTracker } from "@/types/employees/absences";
import { AbsenceType } from "@/types/general/absences";
import { getOrgWorkplaceHolidays } from "@/api/orgs/workplaces/holidays/holidays";
import { getEmployeeSickLeaves } from "@/api/employees/sick-leaves/sick-leaves";
import { getEmployeeAbsences, getEmployeeAbsenceTracker, getEmployeeAbsenceTypes } from "@/api/employees/absences/absences";
import { getTimePolicy } from "@/api/orgs/time-policies/time-policies";
import { TimePolicy } from "@/types/general/time-policies";
import { getMyPendingSignatures } from "@/api/orgs/signing-requests/signing-requests";
import { SigningRequest } from "@/types/general/signing-requests";

const ABSENCE_STATUS_TO_FETCH = ["pending", "approved", "rejected"];

interface DashboardEmployeeContextType {
    employee: Employee;
    activeTimeRecord: TimeRecord | null;
    timeRecordsRefreshTrigger: number;
    refreshEmployee: () => void;
    refreshTimeRecords: () => void;
    refreshActiveTimeRecord: () => void;
    handleEmptyActiveTimeRecord: () => void;
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
    pendingSignatures: SigningRequest[];
    refreshPendingSignatures: () => void;
}

const DashboardEmployeeContext = createContext<DashboardEmployeeContextType | undefined>(undefined);

export const DashboardEmployeeProvider = ({ children }: { children: React.ReactNode }) => {
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [activeTimeRecord, setActiveTimeRecord] = useState<TimeRecord | null>(null);
    const [timeRecordsRefreshTrigger, setTimeRecordsRefreshTrigger] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedYearState, setSelectedYearState] = useState(new Date().getFullYear());
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [sickLeaves, setSickLeaves] = useState<SickLeave[]>([]);
    const [absences, setAbsences] = useState<Absence[]>([]);
    const [absenceTracker, setAbsenceTracker] = useState<AbsenceTracker[] | null>(null);
    const [absenceTypesList, setAbsenceTypesList] = useState<AbsenceType[]>([]);
    const [timePolicy, setTimePolicy] = useState<TimePolicy | null>(null);
    const [pendingSignatures, setPendingSignatures] = useState<SigningRequest[]>([]);
    const { orgId } = useParams<{ orgId: string }>();

    const setSelectedYear = useCallback((year: number) => {
        if (Number.isFinite(year)) {
            setSelectedYearState(year);
        }
    }, []);

    const fetchEmployeeMe = async () => {
        if (!orgId) return;
        try {
            setIsLoading(true);
            const response = await getEmployee(orgId, "me");
            if (response.success) {
                setEmployee(response.success.employee);
            }
        } catch (error) {
            console.error("Error fetching me:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchHolidaysAndSickLeaves = async () => {
        if (!orgId || !employee || !Number.isFinite(selectedYearState)) return;
        try {
            const yearStr = selectedYearState.toString();
            const [holidaysRes, sickLeavesRes] = await Promise.all([
                employee?.org_user_workplace?.id
                    ? getOrgWorkplaceHolidays(orgId, employee.org_user_workplace.id, yearStr)
                    : Promise.resolve({ success: { holidays: [] } }),
                getEmployeeSickLeaves(
                    orgId,
                    "me",
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

    // When fetch returns error 404 means its ok, simply there arent any active time records
    const fetchActiveTimeRecord = async () => {
        if (!orgId) return;
        try {
            const response = await getEmployeeActiveTimeRecord(orgId, "me");
            if (response.success) {
                setActiveTimeRecord(response.success.time_record);
            }
        } catch (error) {
            console.error("Error fetching active time record:", error);
        }
    };

    const refreshActiveTimeRecord = async () => {
        if (orgId) {
            fetchActiveTimeRecord();
        }
    };

    const refreshTimeRecords = () => {
        fetchActiveTimeRecord();
        setTimeRecordsRefreshTrigger(prev => prev + 1);
    };

    const handleEmptyActiveTimeRecord = () => {
        setActiveTimeRecord(null);
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

    const fetchAbsencesData = async () => {
        if (!orgId || !employee || !Number.isFinite(selectedYearState)) return;
        try {
            const yearStr = selectedYearState.toString();
            const [absencesRes, trackerRes, typesRes] = await Promise.all([
                getEmployeeAbsences(orgId, "me", yearStr, ABSENCE_STATUS_TO_FETCH),
                getEmployeeAbsenceTracker(orgId, "me", yearStr),
                getEmployeeAbsenceTypes(orgId, "me", yearStr),
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

    const fetchPendingSignatures = async () => {
        if (!orgId) return;
        try {
            const response = await getMyPendingSignatures(orgId);
            if (response.success) {
                setPendingSignatures(response.success.pending_signing_requests ?? []);
            }
        } catch (error) {
            console.error("Error fetching pending signatures:", error);
            setPendingSignatures([]);
        }
    };

    useEffect(() => {
        if (orgId) {
            fetchEmployeeMe();
            fetchActiveTimeRecord();
            fetchPendingSignatures();
        }
    }, [orgId]);

    useEffect(() => {
        if (orgId && employee) {
            fetchHolidaysAndSickLeaves();
        }
    }, [orgId, employee, selectedYearState]);

    useEffect(() => {
        if (orgId && employee) {
            fetchAbsencesData();
        }
    }, [orgId, employee, selectedYearState]);

    useEffect(() => {
        if (orgId && employee?.org_time_policy?.id) {
            fetchTimePolicy();
        } else {
            setTimePolicy(null);
        }
    }, [orgId, employee?.org_time_policy?.id]);

    if (isLoading || !employee) {
        return <PageSkeleton showBackButton={false} showIcon={true} tabCount={7} variant="split" />;
    }

    const refreshEmployee = () => {
        if (orgId) {
            fetchEmployeeMe();
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

    const refreshPendingSignatures = () => {
        fetchPendingSignatures();
    };

    return (
        <DashboardEmployeeContext.Provider
            value={{
                employee,
                activeTimeRecord,
                timeRecordsRefreshTrigger,
                refreshEmployee,
                refreshTimeRecords,
                refreshActiveTimeRecord,
                handleEmptyActiveTimeRecord,
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
                pendingSignatures,
                refreshPendingSignatures,
            }}
        >
            {children}
        </DashboardEmployeeContext.Provider>
    );
};

export const useEmployee = () => {
    const context = useContext(DashboardEmployeeContext);
    if (context === undefined) {
        throw new Error("useEmployee must be used within a DashboardEmployeeProvider");
    }
    return context;
};

