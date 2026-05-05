import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, MapPinPlus } from "lucide-react";
import { formatDate, formatDateForAPI, getFirstDayOfMonth, getLastDayOfMonth, isCurrentMonth } from "@/utils/miscelanea";
import { getOrgVehicleKilometersOverview } from "@/api/orgs/vehicles/vehicles";
import { getOrgVehicleCoordinates } from "@/api/orgs/vehicles/coordinates/coordinates";
import { VehicleKilometersOverview, VehicleCoordinates } from "@/types/general/vehicles";
import { Employee } from "@/types/employees/employees";
import { useVehicle } from "@/app/vehicles/contexts/VehicleContext";
import { useOrg } from "@/app/contexts/OrgContext";
import { Button } from "@/components/ui/button";
import VehicleInfoCard from "./components/vehicle-info-card";
import VehicleTravelSummaryCard from "./components/vehicle-travel-summary-card";
import VehicleChart from "./components/vehicle-chart";
import VehicleMap from "./components/vehicle-map";
import VehicleCoordinatesAddModal from "./components/vehicle-coordinates-add-modal";

// ─── Page ─────────────────────────────────────────────────────────────────────

const VehicleDetailPageSummary = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const { vehicle } = useVehicle();
    const { org } = useOrg();

    const [currentMonthStart, setCurrentMonthStart] = useState<Date>(() =>
        getFirstDayOfMonth(new Date())
    );

    const handlePrevMonth = () =>
        setCurrentMonthStart((prev) => {
            const d = new Date(prev);
            d.setMonth(d.getMonth() - 1);
            return d;
        });

    const handleNextMonth = () =>
        setCurrentMonthStart((prev) => {
            const d = new Date(prev);
            d.setMonth(d.getMonth() + 1);
            return d;
        });

    const canGoNextMonth = useMemo(() => {
        const next = new Date(currentMonthStart);
        next.setMonth(next.getMonth() + 1);
        return next <= new Date();
    }, [currentMonthStart]);

    const periodLabel = formatDate(currentMonthStart, {
        showTime: false,
        showDay: false,
        showMonthName: true,
        showYear: true,
    });

    const [travelDays, setTravelDays] = useState<VehicleKilometersOverview[]>([]);
    const [overviewCostPerKm, setOverviewCostPerKm] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>(() => formatDateForAPI(new Date()));

    const fromDate = getFirstDayOfMonth(currentMonthStart);
    const toDate = getLastDayOfMonth(currentMonthStart);

    useEffect(() => {
        if (!orgId || !vehicle?.id) return;

        const fetchKilometersOverview = async () => {
            try {
                setIsLoading(true);
                const response = await getOrgVehicleKilometersOverview(
                    orgId,
                    vehicle.id,
                    formatDateForAPI(fromDate),
                    formatDateForAPI(toDate)
                );
                if (response.success?.kilometers_overview) {
                    setTravelDays(response.success.kilometers_overview);
                    setOverviewCostPerKm(response.success.cost_per_km ?? null);
                } else {
                    setTravelDays([]);
                    setOverviewCostPerKm(null);
                }
            } catch {
                setTravelDays([]);
                setOverviewCostPerKm(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchKilometersOverview();
    }, [orgId, vehicle?.id, currentMonthStart]);

    const summaryStats = useMemo(() => {
        const estimatedKm = travelDays.reduce((s, d) => s + d.predicted_kilometers, 0);
        const actualKm = travelDays.reduce((s, d) => s + d.real_kilometers, 0);
        return { estimatedKm, actualKm };
    }, [travelDays]);

    const [lastCoordinate, setLastCoordinate] = useState<VehicleCoordinates | null>(null);
    const [coordinatesModalOpen, setCoordinatesModalOpen] = useState(false);
    const [coordinatesRefreshKey, setCoordinatesRefreshKey] = useState(0);

    useEffect(() => {
        if (!orgId || !vehicle?.id) return;
        let cancelled = false;

        const fetchLatestCoord = async () => {
            try {
                const today = formatDateForAPI(new Date());
                const response = await getOrgVehicleCoordinates(orgId, vehicle.id, today);
                if (!cancelled) {
                    if (response.success?.coordinates?.length) {
                        const sorted = [...response.success.coordinates].sort(
                            (a: VehicleCoordinates, b: VehicleCoordinates) =>
                                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                        );
                        setLastCoordinate(sorted[0]);
                    } else {
                        setLastCoordinate(null);
                    }
                }
            } catch {
                if (!cancelled) setLastCoordinate(null);
            }
        };

        fetchLatestCoord();
        return () => { cancelled = true; };
    }, [orgId, vehicle?.id, coordinatesRefreshKey]);

    const orgCostPerKm = org?.cost_per_km ?? 0;
    const effectiveCostPerKm = overviewCostPerKm ?? orgCostPerKm;

    const travelDaysWithFuel = useMemo(() => {
        return travelDays.map((d) => ({
            ...d,
            cost_per_km: d.cost_per_km ?? effectiveCostPerKm,
        }));
    }, [travelDays, effectiveCostPerKm]);

    const selectedDayStats = useMemo(() => {
        const map = new Map<string, { planned: number; actual: number; costPerKm: number; drivers: Employee[] }>();
        const toEmployee = (x: Employee | { employee: Employee }): Employee =>
            "employee" in x ? x.employee : x;
        for (const d of travelDaysWithFuel) {
            const key = d.day.slice(0, 10);
            const existing = map.get(key);
            const drivers = (d.drivers ?? []).map(toEmployee);
            const costPerKm = d.cost_per_km ?? effectiveCostPerKm;
            if (existing) {
                existing.planned += d.predicted_kilometers;
                existing.actual += d.real_kilometers;
                const seen = new Set(existing.drivers.map((e) => e.id));
                for (const emp of drivers) {
                    if (!seen.has(emp.id)) {
                        seen.add(emp.id);
                        existing.drivers.push(emp);
                    }
                }
            } else {
                map.set(key, {
                    planned: d.predicted_kilometers,
                    actual: d.real_kilometers,
                    costPerKm,
                    drivers: [...drivers],
                });
            }
        }
        return map.get(selectedDate) ?? null;
    }, [travelDaysWithFuel, selectedDate]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="flex flex-col gap-4 mb-24 lg:col-span-1">
                <VehicleInfoCard />
            </div>

            <div className="lg:col-span-2 flex flex-col gap-3">

                <div className="flex gap-2 justify-between">

                    <VehicleTravelSummaryCard
                        estimatedKm={summaryStats.estimatedKm}
                        actualKm={summaryStats.actualKm}
                        locationName={vehicle.location?.name || vehicle.location?.city}
                        lastUpdatedAt={lastCoordinate?.created_at ?? null}
                    />

                    <div className="flex items-center gap-2">
                        {!isCurrentMonth(currentMonthStart) && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentMonthStart(getFirstDayOfMonth(new Date()))}
                            >
                                {t("common.currentMonth", "Current Month")}
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                            <ChevronLeftIcon className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-semibold min-w-[140px] text-center">
                            {periodLabel}
                        </span>
                        <Button variant="outline" size="sm" onClick={handleNextMonth} disabled={!canGoNextMonth}>
                            <ChevronRightIcon className="h-4 w-4" />
                        </Button>
                        {/*<Button
                            variant="default"
                            size="sm"
                            onClick={() => setCoordinatesModalOpen(true)}
                        >
                            <MapPinPlus className="h-4 w-4" />
                            {t("vehicles.registerCoordinates", "Register coordinates")}
                        </Button>*/}
                    </div>
                </div>

                <VehicleChart
                    data={travelDaysWithFuel}
                    fromDate={fromDate}
                    toDate={toDate}
                    isLoading={isLoading}
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                />

                <VehicleCoordinatesAddModal
                    open={coordinatesModalOpen}
                    onOpenChange={setCoordinatesModalOpen}
                    onSuccess={() => setCoordinatesRefreshKey((k) => k + 1)}
                    selectedDate={selectedDate}
                />

                <VehicleMap
                    selectedDate={selectedDate}
                    selectedDayStats={selectedDayStats}
                    onDateSelect={(dateStr) => {
                        setSelectedDate(dateStr);
                        const newMonthStart = getFirstDayOfMonth(new Date(dateStr));
                        setCurrentMonthStart((prev) => {
                            if (prev.getMonth() === newMonthStart.getMonth() && prev.getFullYear() === newMonthStart.getFullYear()) {
                                return prev;
                            }
                            return newMonthStart;
                        });
                    }}
                />
            </div>
        </div>
    );
};

export default VehicleDetailPageSummary;
