import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import type { ReactNode } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { getTraining } from "@/api/trainings/trainings";
import type { Training } from "@/types/trainings/trainings";

interface TrainingContextValue {
    training: Training;
    refreshTraining: () => Promise<void>;
    isLoading: boolean;
}

const TrainingContext = createContext<TrainingContextValue | undefined>(
    undefined
);

export function TrainingProvider({ children }: { children: ReactNode }) {
    const { t } = useTranslation();
    const { orgId, trainingId } = useParams<{
        orgId: string;
        trainingId: string;
    }>();
    const [training, setTraining] = useState<Training | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshTraining = useCallback(async () => {
        if (!orgId || !trainingId) return;
        setIsLoading(true);
        try {
            const response = await getTraining(orgId, trainingId);
            if (response.success) {
                setTraining(response.success.training);
            } else {
                toast.error(
                    t("trainings.errorFetching", "Error fetching training")
                );
            }
        } catch {
            toast.error(t("trainings.errorFetching", "Error fetching training"));
        } finally {
            setIsLoading(false);
        }
    }, [orgId, trainingId, t]);

    useEffect(() => {
        refreshTraining();
    }, [refreshTraining]);

    if (isLoading || !training) {
        return (
            <div className="flex items-center justify-center flex-1 h-full">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <TrainingContext.Provider value={{ training, refreshTraining, isLoading }}>
            {children}
        </TrainingContext.Provider>
    );
}

export function useTraining() {
    const ctx = useContext(TrainingContext);
    if (!ctx)
        throw new Error("useTraining must be used within TrainingProvider");
    return ctx;
}
