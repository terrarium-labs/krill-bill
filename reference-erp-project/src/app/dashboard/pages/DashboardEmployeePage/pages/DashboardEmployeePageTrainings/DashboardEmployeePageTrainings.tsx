import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { GraduationCap, Library } from "lucide-react";

import {
    VerticalMenu,
    VerticalMenuItem,
} from "@/components/ui/vertical-menu";

import DashboardEmployeePageTrainingsAll from "./DashboardEmployeePageTrainingsAll";
import DashboardEmployeePageTrainingsMy from "./DashboardEmployeePageTrainingsMy";

const trainingMenuValues = ["all-trainings", "my-trainings"] as const;
type TrainingMenuValue = (typeof trainingMenuValues)[number];

const DashboardEmployeePageTrainings = () => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();

    const rawTab = searchParams.get("tab") ?? "training";
    const menuValue: TrainingMenuValue = trainingMenuValues.includes(
        rawTab as TrainingMenuValue,
    )
        ? (rawTab as TrainingMenuValue)
        : "all-trainings";

    const handleMenuChange = (value: string) => {
        if (trainingMenuValues.includes(value as TrainingMenuValue)) {
            setSearchParams({ tab: value });
        }
    };

    return (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-6">
            <aside className="w-full shrink-0 lg:w-auto lg:max-w-[min(100%,14rem)]">
                <VerticalMenu value={menuValue} onValueChange={handleMenuChange}>
                    <VerticalMenuItem value="all-trainings">
                        <div className="flex items-center gap-2">
                            <Library className="h-4 w-4" />
                            {t("dashboard.trainings.menuAll", "All trainings")}
                        </div>
                    </VerticalMenuItem>
                    <VerticalMenuItem value="my-trainings">
                        <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" />
                            {t("dashboard.trainings.menuMy", "My trainings")}
                        </div>
                    </VerticalMenuItem>
                </VerticalMenu>
            </aside>
            <div className="min-w-0 flex-1">
                {menuValue === "all-trainings" ? (
                    <DashboardEmployeePageTrainingsAll />
                ) : (
                    <DashboardEmployeePageTrainingsMy />
                )}
            </div>
        </div>
    );
};

export default DashboardEmployeePageTrainings;
