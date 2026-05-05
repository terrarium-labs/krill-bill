import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    type ReactNode,
} from "react";
import { useNavigate, useParams } from "react-router";

interface MissionControlShellContextValue {
    /** Navigate back to the org home (exits full-screen mission control shell). */
    exitMissionControlShell: () => void;
}

const MissionControlShellContext = createContext<MissionControlShellContextValue | undefined>(
    undefined
);

export function MissionControlShellProvider({ children }: { children: ReactNode }) {
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();

    const exitMissionControlShell = useCallback(() => {
        if (orgId) {
            navigate(`/${orgId}`);
        }
    }, [navigate, orgId]);

    const value = useMemo(
        () => ({ exitMissionControlShell }),
        [exitMissionControlShell]
    );

    return (
        <MissionControlShellContext.Provider value={value}>
            {children}
        </MissionControlShellContext.Provider>
    );
}

export function useMissionControlShell() {
    const ctx = useContext(MissionControlShellContext);
    if (!ctx) {
        throw new Error("useMissionControlShell must be used within MissionControlShellProvider");
    }
    return ctx;
}
