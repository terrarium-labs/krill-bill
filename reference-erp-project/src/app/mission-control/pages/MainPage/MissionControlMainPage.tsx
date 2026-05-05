import { useEffect, useState } from "react";
import PageHeader from "@/app/components/page-header";
import { formatDate, formatTime } from "@/utils/miscelanea";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Check, Loader2, RefreshCcw, X } from "lucide-react";
import {
    RelativeTime,
    RelativeTimeZone,
    RelativeTimeZoneDate,
    RelativeTimeZoneDisplay,
    RelativeTimeZoneLabel,
} from "@/components/ui/shadcn-io/relative-time";
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
} from "@/components/ui/tooltip";
import DashboardGrid from "./components/DashboardGrid";
import LayoutSelector from "./components/LayoutSelector";
import { useDashboardLayout } from "./hooks/useDashboardLayout";

function MissionControlMainPage() {
    const { t } = useTranslation();
    const [clockNow, setClockNow] = useState(() => new Date());
    useEffect(() => {
        const id = setInterval(() => setClockNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);
    const {
        layouts,
        savedLayouts,
        activeLayoutId,
        isEditing,
        isSaving,
        isLoading,
        startEditing,
        cancelEditing,
        saveLayoutAs,
        updateActiveLayout,
        selectLayout,
        deleteLayout,
        renameLayout,
        onLayoutChange,
    } = useDashboardLayout();

    const actionMenu = isEditing ? (
        <>
            <Button variant="ghost" size="sm" onClick={cancelEditing}>
                <X className="h-4 w-4 mr-1" />
                {t("missionControl.main.cancel", "Cancel")}
            </Button>
            <Button
                variant="default"
                size="sm"
                onClick={activeLayoutId ? updateActiveLayout : () => saveLayoutAs("Untitled")}
                disabled={isSaving}
            >
                <Check className="h-4 w-4 mr-1" />
                {isSaving
                    ? t("missionControl.main.saving", "Saving…")
                    : t("missionControl.main.done", "Done")}
            </Button>
        </>
    ) : (
        <>
            <div className="flex items-center gap-3 shrink-0">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                className="flex items-start justify-start flex-col"
                            >
                     
                                <span className="text-lg sm:text-3xl tabular-nums tracking-tight leading-none">
                                    {formatTime(clockNow, { showSeconds: true })}
                                </span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent
                            align="end"
                            className="bg-popover text-popover-foreground border shadow-md p-3"
                        >
                            <RelativeTime time={clockNow}>
                                <RelativeTimeZone zone="UTC">
                                    <RelativeTimeZoneLabel>UTC</RelativeTimeZoneLabel>
                                    <div className="flex items-center gap-2">
                                        <RelativeTimeZoneDate />
                                        <RelativeTimeZoneDisplay />
                                    </div>
                                </RelativeTimeZone>
                                <RelativeTimeZone
                                    zone={Intl.DateTimeFormat().resolvedOptions().timeZone}
                                >
                                    <RelativeTimeZoneLabel>
                                        {t("common.local", "Local")}
                                    </RelativeTimeZoneLabel>
                                    <div className="flex items-center gap-2">
                                        <RelativeTimeZoneDate />
                                        <RelativeTimeZoneDisplay />
                                    </div>
                                </RelativeTimeZone>
                            </RelativeTime>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <div className="h-8 w-px bg-border" />
                <Button
                    variant="default"
                    className="bg-red-600 hover:bg-red-900 text-white shrink-0"
                >
                    <AlertTriangle className="h-5 w-5" />
                    {t("missionControl.main.emergency", "Urgent Plan")}
                </Button>
            </div>
            <LayoutSelector
                savedLayouts={savedLayouts}
                activeLayoutId={activeLayoutId}
                isEditing={isEditing}
                isSaving={isSaving}
                onSelect={selectLayout}
                onSaveAs={saveLayoutAs}
                onUpdateActive={updateActiveLayout}
                onDelete={deleteLayout}
                onRename={renameLayout}
                onStartEditing={startEditing}
            />
        </>
    );

    return (
        <div className="flex flex-col h-full">
            <PageHeader
                title="Mission Control"
                description={
                    <div className="flex items-center gap-2 justify-center">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse mt-0.5"></div>
                        <span>
                            {t("missionControl.main.lastUpdated", "Last updated {{date}}", {
                                date: formatDate(new Date(), {
                                    showTime: true,
                                    showDay: true,
                                    showMonth: true,
                                    showYear: true,
                                }),
                            })}
                        </span>
                        <Tooltip>
                            <TooltipTrigger>
                                <Button variant="ghost" size="icon" className="h-4! w-4!" onClick={() => { }}>
                                    <RefreshCcw className="max-h-3 max-w-3" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {t("missionControl.main.refresh", "Refresh now")}
                            </TooltipContent>
                        </Tooltip>
                    </div>
                }
                showBackButton={false}
                action={actionMenu}
            />
            <div className="py-4 flex-1 min-h-0">
                {isLoading ? (
                    <div className="flex items-center justify-center h-screen">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <DashboardGrid
                        layouts={layouts}
                        isEditing={isEditing}
                        onLayoutChange={onLayoutChange}
                    />
                )}
            </div>
        </div>
    );
}

export default MissionControlMainPage;
