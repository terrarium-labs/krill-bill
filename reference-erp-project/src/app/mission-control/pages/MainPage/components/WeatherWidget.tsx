import { useCallback, useEffect, useRef, useState } from "react";
import {
    Cloud,
    CloudDrizzle,
    CloudFog,
    CloudLightning,
    CloudRain,
    CloudSnow,
    CloudSun,
    Droplets,
    Eye,
    Info,
    MapPin,
    Pencil,
    RefreshCcw,
    Search,
    Sun,
    Wind,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const STORAGE_KEY = "mc-weather-location";

type LocationConfig = { name: string; latitude: number; longitude: number };

const DEFAULT_LOCATION: LocationConfig = {
    name: "Barcelona",
    latitude: 41.3874,
    longitude: 2.1686,
};

function loadLocation(): LocationConfig {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_LOCATION;
        return JSON.parse(raw) as LocationConfig;
    } catch {
        return DEFAULT_LOCATION;
    }
}

function saveLocation(loc: LocationConfig) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
}

type WmoEntry = { label: string; Icon: LucideIcon };

const WMO_MAP: Record<number, WmoEntry> = {
    0: { label: "Clear sky", Icon: Sun },
    1: { label: "Mainly clear", Icon: Sun },
    2: { label: "Partly cloudy", Icon: CloudSun },
    3: { label: "Overcast", Icon: Cloud },
    45: { label: "Fog", Icon: CloudFog },
    48: { label: "Rime fog", Icon: CloudFog },
    51: { label: "Light drizzle", Icon: CloudDrizzle },
    53: { label: "Drizzle", Icon: CloudDrizzle },
    55: { label: "Dense drizzle", Icon: CloudDrizzle },
    61: { label: "Light rain", Icon: CloudRain },
    63: { label: "Rain", Icon: CloudRain },
    65: { label: "Heavy rain", Icon: CloudRain },
    71: { label: "Light snow", Icon: CloudSnow },
    73: { label: "Snow", Icon: CloudSnow },
    75: { label: "Heavy snow", Icon: CloudSnow },
    80: { label: "Light showers", Icon: CloudRain },
    81: { label: "Showers", Icon: CloudRain },
    82: { label: "Heavy showers", Icon: CloudRain },
    95: { label: "Thunderstorm", Icon: CloudLightning },
    96: { label: "Thunderstorm + hail", Icon: CloudLightning },
    99: { label: "Severe thunderstorm", Icon: CloudLightning },
};

function wmoInfo(code: number): WmoEntry {
    return WMO_MAP[code] ?? { label: "Unknown", Icon: Cloud };
}

/** Sun / clear codes — subtle warm accent on icons (monochrome + hint of warmth) */
function isSunAccentCode(code: number): boolean {
    return code === 0 || code === 1 || code === 2;
}

function DayIcon({
    code,
    className,
    strokeWidth: sw,
}: {
    code: number;
    className?: string;
    strokeWidth?: number;
}) {
    const { Icon } = wmoInfo(code);
    return <Icon className={className} strokeWidth={sw} />;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type CurrentWeather = {
    temperature: number;
    apparentTemperature: number;
    weatherCode: number;
    humidity: number;
    windSpeed: number;
    /** 0–100 */
    precipitationProbability: number;
    /** meters */
    visibilityM: number;
};

type DailyForecast = {
    date: string;
    dayName: string;
    weatherCode: number;
    tempMax: number;
    tempMin: number;
    isToday: boolean;
};

type WeatherData = {
    current: CurrentWeather;
    daily: DailyForecast[];
    timezone: string;
};

async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set(
        "current",
        "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation_probability,visibility",
    );
    url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min");
    url.searchParams.set("timezone", "auto");

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
    const json = await res.json();

    const todayStr = new Date().toISOString().slice(0, 10);

    return {
        current: {
            temperature: Math.round(json.current.temperature_2m),
            apparentTemperature: Math.round(json.current.apparent_temperature),
            weatherCode: json.current.weather_code,
            humidity: json.current.relative_humidity_2m,
            windSpeed: Math.round(json.current.wind_speed_10m),
            precipitationProbability: Math.round(json.current.precipitation_probability ?? 0),
            visibilityM: typeof json.current.visibility === "number" ? json.current.visibility : 10000,
        },
        daily: (json.daily.time as string[]).map((date: string, i: number) => {
            const d = new Date(date + "T12:00:00");
            return {
                date,
                dayName: DAY_NAMES[d.getDay()],
                weatherCode: json.daily.weather_code[i],
                tempMax: Math.round(json.daily.temperature_2m_max[i]),
                tempMin: Math.round(json.daily.temperature_2m_min[i]),
                isToday: date === todayStr,
            };
        }),
        timezone: json.timezone,
    };
}

type GeoResult = { name: string; latitude: number; longitude: number; country: string; admin1?: string };

async function searchLocations(query: string): Promise<GeoResult[]> {
    if (query.trim().length < 2) return [];
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", query.trim());
    url.searchParams.set("count", "6");
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");

    const res = await fetch(url.toString());
    if (!res.ok) return [];
    const json = await res.json();
    return (json.results ?? []).map((r: Record<string, unknown>) => ({
        name: r.name as string,
        latitude: r.latitude as number,
        longitude: r.longitude as number,
        country: r.country as string,
        admin1: r.admin1 as string | undefined,
    }));
}

function MetricCell({
    icon: Icon,
    label,
    value,
    inPopup,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
    inPopup?: boolean;
}) {
    const mutedClass = inPopup ? "text-background/70" : "text-muted-foreground";
    return (
        <div className="flex items-start gap-2 min-w-0">
            <Icon className={cn("h-3.5 w-3.5 shrink-0 mt-0.5", mutedClass)} strokeWidth={1.25} />
            <div className="min-w-0 flex-1 space-y-0.5">
                <p className={cn("text-[10px] leading-none tracking-wide", mutedClass)}>{label}</p>
                <p className="text-xs font-medium tabular-nums leading-none whitespace-nowrap">{value}</p>
            </div>
        </div>
    );
}

function WeatherMetricsGrid({
    current,
    visibilityKm,
    className,
    inPopup,
}: {
    current: CurrentWeather;
    visibilityKm: number;
    className?: string;
    inPopup?: boolean;
}) {
    return (
        <div className={cn("grid grid-cols-2 gap-x-1 gap-y-1", className)}>
            <MetricCell
                icon={CloudRain}
                label="Rain"
                value={`${current.precipitationProbability}%`}
                inPopup={inPopup}
            />
            <MetricCell icon={Wind} label="Wind" value={`${current.windSpeed} km/h`} inPopup={inPopup} />
            <MetricCell icon={Droplets} label="Humidity" value={`${current.humidity}%`} inPopup={inPopup} />
            <MetricCell icon={Eye} label="Visibility" value={`${visibilityKm} km`} inPopup={inPopup} />
        </div>
    );
}

function LocationPicker({
    current,
    onSelect,
}: {
    current: string;
    onSelect: (loc: LocationConfig) => void;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<GeoResult[]>([]);
    const [searching, setSearching] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (query.trim().length < 2) {
            setResults([]);
            return;
        }
        setSearching(true);
        debounceRef.current = setTimeout(async () => {
            const r = await searchLocations(query);
            setResults(r);
            setSearching(false);
        }, 350);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={(e) => e.stopPropagation()}
                >
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="text-[11px] font-medium truncate max-w-28">{current}</span>
                </button>
            </PopoverTrigger>
            <PopoverContent
                side="bottom"
                align="start"
                className="w-64 p-2"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search city..."
                        className="pl-7 h-8 text-sm"
                        autoFocus
                    />
                </div>
                <div className="mt-1.5 max-h-48 overflow-y-auto">
                    {searching && (
                        <p className="text-xs text-muted-foreground px-2 py-1.5">Searching...</p>
                    )}
                    {!searching && results.length === 0 && query.trim().length >= 2 && (
                        <p className="text-xs text-muted-foreground px-2 py-1.5">No results</p>
                    )}
                    {results.map((r, i) => (
                        <button
                            key={`${r.latitude}-${r.longitude}-${i}`}
                            type="button"
                            className="w-full text-left px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-colors flex flex-col"
                            onClick={() => {
                                onSelect({ name: r.name, latitude: r.latitude, longitude: r.longitude });
                                setOpen(false);
                                setQuery("");
                                setResults([]);
                            }}
                        >
                            <span className="font-medium text-xs">{r.name}</span>
                            <span className="text-[10px] text-muted-foreground">
                                {[r.admin1, r.country].filter(Boolean).join(", ")}
                            </span>
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}

const METRICS_ROW_COMPACT_PX = 300;

export default function WeatherWidget() {
    const [location, setLocation] = useState<LocationConfig>(loadLocation);
    const [data, setData] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const fetchRef = useRef(false);
    const metricsRowRef = useRef<HTMLDivElement>(null);
    const [metricsInTooltip, setMetricsInTooltip] = useState(false);

    useEffect(() => {
        const el = metricsRowRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => {
            const w = el.getBoundingClientRect().width;
            setMetricsInTooltip(w < METRICS_ROW_COMPACT_PX);
        });
        ro.observe(el);
        setMetricsInTooltip(el.getBoundingClientRect().width < METRICS_ROW_COMPACT_PX);
        return () => ro.disconnect();
        // Re-run when `data` first becomes available: loading/error branches omit the metrics
        // row, so ref is null on initial mount. `data != null` avoids re-running on every refresh.
    }, [data != null]);

    const load = useCallback(async (loc: LocationConfig) => {
        setLoading(true);
        setError(null);
        try {
            const weather = await fetchWeather(loc.latitude, loc.longitude);
            setData(weather);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load weather");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (fetchRef.current) return;
        fetchRef.current = true;
        load(location);
    }, [load, location]);

    useEffect(() => {
        const id = setInterval(() => load(location), 15 * 60 * 1000);
        return () => clearInterval(id);
    }, [load, location]);

    const handleLocationChange = useCallback(
        (loc: LocationConfig) => {
            setLocation(loc);
            saveLocation(loc);
            fetchRef.current = false;
            setData(null);
            load(loc);
        },
        [load],
    );

    if (loading && !data) {
        return (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground bg-card rounded-lg border border-border">
                <RefreshCcw className="h-4 w-4 animate-spin mr-2" />
                Loading weather...
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground p-4 text-center bg-card rounded-lg border border-border">
                {error}
            </div>
        );
    }

    if (!data) return null;

    const { current, daily } = data;
    const wmo = wmoInfo(current.weatherCode);
    const WeatherIcon = wmo.Icon;
    const visibilityKm = Math.round((current.visibilityM / 1000) * 10) / 10;
    const forecastDays = daily.slice(0, 7);

    return (
        <div className="group h-full flex flex-col rounded-lg overflow-hidden bg-card text-card-foreground border border-border">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 px-4 pt-3.5 pb-0 shrink-0">
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-foreground">Weather Status</h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <LocationPicker current={location.name} onSelect={handleLocationChange} />
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            load(location);
                        }}
                        className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                        aria-label="Refresh weather"
                    >
                        <RefreshCcw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Main: icon + temp | metrics grid (or compact tooltip when row is narrow) */}
            <div
                ref={metricsRowRef}
                className="flex flex-1 min-h-0 items-center gap-4 px-4 py-3 min-w-0"
            >
                <div className="flex items-center shrink-0 gap-2">
                    <WeatherIcon
                        className={cn(
                            "h-12 w-12 shrink-0",
                            isSunAccentCode(current.weatherCode) ? "text-amber-500" : "text-foreground/90",
                        )}
                        strokeWidth={1.15}
                    />
                    <span className="text-[2.75rem] font-extralight tabular-nums tracking-tighter leading-none text-foreground">
                        {current.temperature}°
                    </span>
                </div>
                {metricsInTooltip ? (
                    <div className="flex flex-1 min-w-0 justify-end shrink-0">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted/80 -m-1"
                                    aria-label="Weather details"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Info className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent
                                side="bottom"
                                align="end"
                                sideOffset={6}
                            >
                                <WeatherMetricsGrid
                                    current={current}
                                    visibilityKm={visibilityKm}
                                    className="gap-x-3 gap-y-2 w-[220px]"
                                    inPopup
                                />
                            </TooltipContent>
                        </Tooltip>
                    </div>
                ) : (
                    <WeatherMetricsGrid
                        current={current}
                        visibilityKm={visibilityKm}
                        className="flex-1 min-w-0"
                    />
                )}
            </div>

            {/* 7-day strip */}
            <div className="shrink-0 flex border-border">
                {forecastDays.map((day) => (
                    <div
                        key={day.date}
                        className={cn(
                            "relative flex-1 flex flex-col items-center justify-center gap-1.5 py-2.5 min-w-0 after:pointer-events-none after:absolute after:right-0 after:top-4 after:bottom-4 after:w-px after:bg-border last:after:hidden",
                        )}
                    >
                        <DayIcon
                            code={day.weatherCode}
                            className={cn(
                                "h-4 w-4",
                                isSunAccentCode(day.weatherCode)
                                    ? "text-amber-500"
                                    : "text-muted-foreground",
                            )}
                            strokeWidth={1.35}
                        />
                        <span className="text-xs font-medium tabular-nums text-foreground leading-none">
                            {day.tempMax}°
                        </span>
                        <span
                            className={cn(
                                "text-[9px] tabular-nums uppercase tracking-wide leading-none",
                                day.isToday ? "text-foreground font-medium" : "text-muted-foreground",
                            )}
                        >
                            {day.dayName}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
