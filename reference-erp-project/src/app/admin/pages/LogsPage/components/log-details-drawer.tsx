import { useTranslation } from "react-i18next";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Copy, Info } from "lucide-react";
import Tag from "@/app/components/tag/tag";
import IdBadge from "@/app/components/id-badge";
import { OrgUserAvatar } from "@/app/components/avatars/org-user-avatar";
import { FlagComponent } from "@/app/components/flag-component";
import {
    RelativeTime,
    RelativeTimeZone,
    RelativeTimeZoneDate,
    RelativeTimeZoneDisplay,
    RelativeTimeZoneLabel,
} from "@/components/ui/shadcn-io/relative-time";
import { AuditLog } from "@/types/general/audit_logs";
import { IpLocationData } from "@/types/general/location";
import { COUNTRIES } from "@/utils/countries";
import { formatDate } from "@/utils/miscelanea";

type LogDetailsDrawerProps = {
    open: boolean;
    log: AuditLog | null;
    ipLocationMap: Record<string, IpLocationData>;
    onOpenChange: (open: boolean) => void;
    getStatusColor: (status: number) => string;
    getMethodColor: (method: string) => string;
    onCopy: (text: string) => void;
};

const LogDetailsDrawer = ({
    open,
    log,
    ipLocationMap,
    onOpenChange,
    getStatusColor,
    getMethodColor,
    onCopy,
}: LogDetailsDrawerProps) => {
    const { t } = useTranslation();

    if (!log) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-2xl overflow-y-auto rounded-l-xl">
                <SheetHeader className="pb-0">
                    <SheetTitle>{t("admin.logs.logDetails", "Log Details")}</SheetTitle>
                    <SheetDescription>
                        {t("admin.logs.logDetailsDescription", "Detailed information about this API request")}
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-6 mt-6 p-6 pt-0">
                    {/* User Info */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-muted-foreground">{t("admin.logs.user", "User")}</h3>
                        <OrgUserAvatar
                            orgUser={log.org_user}
                            showEmail={true}
                            size="sm"
                            className="gap-3"
                            iconClassName="h-10 w-10"
                            textClassName="text-base"
                        />
                    </div>

                    {/* Request Info */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-muted-foreground">{t("admin.logs.requestInfo", "Request Information")}</h3>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-sm font-medium">{t("admin.logs.id", "Unique Log ID")}</span>
                                <IdBadge id={log.id} />
                            </div>
                            <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-sm font-medium">{t("admin.logs.method", "Method")}</span>
                                <Tag text={log.req_method} color={getMethodColor(log.req_method)} />
                            </div>
                            <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-sm font-medium">{t("admin.logs.status", "Status")}</span>
                                <Tag text={log.res_status.toString()} color={getStatusColor(log.res_status)} />
                            </div>
                            <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-sm font-medium">{t("admin.logs.duration", "Duration")}</span>
                                <span className="text-xs font-mono">{log.duration_ms}ms</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-sm font-medium">{t("admin.logs.apiVersion", "API Version")}</span>
                                <span className="text-sm">{log.api_version || "-"}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b">
                                <div className="flex items-center gap-0">
                                    <span className="text-sm font-medium">{t("admin.logs.ipAddress", "IP Address")}</span>
                                    {log.ip_address && ipLocationMap[log.ip_address] && (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="link"
                                                    size="icon"
                                                >
                                                    <Info className="h-4 w-4" />

                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-80" align="end">
                                                <div className="space-y-3">
                                                    <h4 className="font-semibold text-sm text-muted-foreground">{t("admin.logs.locationDetails", "Location Details")}</h4>
                                                    <div className="space-y-2 text-sm">
                                                        {ipLocationMap[log.ip_address].location?.country_name && ipLocationMap[log.ip_address].location?.country_code2 && (
                                                            <div className="flex justify-between">
                                                                <span className="font-medium">{t("admin.logs.country", "Country")}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <FlagComponent country={ipLocationMap[log.ip_address].location.country_code2!} countryName={ipLocationMap[log.ip_address].location.country_name!} />
                                                                    <span className="text-sm">{ipLocationMap[log.ip_address].location.country_name}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {ipLocationMap[log.ip_address].location?.state_prov && (
                                                            <div className="flex justify-between">
                                                                <span className="font-medium">{t("admin.logs.region", "Region")}</span>
                                                                <span className="text-sm">{ipLocationMap[log.ip_address].location.state_prov}</span>
                                                            </div>
                                                        )}
                                                        {ipLocationMap[log.ip_address].location?.city && (
                                                            <div className="flex justify-between">
                                                                <span className="font-medium">{t("admin.logs.city", "City")}</span>
                                                                <span className="text-sm">{ipLocationMap[log.ip_address].location.city}</span>
                                                            </div>
                                                        )}
                                                        {ipLocationMap[log.ip_address].location?.zipcode && (
                                                            <div className="flex justify-between">
                                                                <span className="font-medium">{t("admin.logs.zip", "ZIP")}</span>
                                                                <span className="text-sm">{ipLocationMap[log.ip_address].location.zipcode}</span>
                                                            </div>
                                                        )}
                                                        {ipLocationMap[log.ip_address].location?.latitude && ipLocationMap[log.ip_address].location?.longitude && (
                                                            <div className="flex justify-between">
                                                                <span className="font-medium">{t("admin.logs.coordinates", "Coordinates")}</span>
                                                                <span className="text-sm text-blue-500 hover:underline cursor-pointer hover:text-blue-600"
                                                                    onClick={() => window.open(`https://www.google.com/maps?q=${ipLocationMap[log.ip_address].location.latitude},${ipLocationMap[log.ip_address].location.longitude}`, "_blank")}>{ipLocationMap[log.ip_address].location.latitude}, {ipLocationMap[log.ip_address].location.longitude}</span>
                                                            </div>
                                                        )}
                                                        {ipLocationMap[log.ip_address].time_zone?.name && (
                                                            <div className="flex justify-between">
                                                                <span className="font-medium">{t("admin.logs.timezone", "Timezone")}</span>
                                                                <span className="text-sm line-clamp-1">{ipLocationMap[log.ip_address].time_zone?.name}</span>
                                                            </div>
                                                        )}
                                                        {ipLocationMap[log.ip_address].network?.asn?.organization && (
                                                            <div className="flex justify-between">
                                                                <span className="font-medium">{t("admin.logs.org", "Organization")}</span>
                                                                <span className="text-sm">{ipLocationMap[log.ip_address].network?.asn?.organization}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {log.ip_address && ipLocationMap[log.ip_address] && (() => {
                                        const location = ipLocationMap[log.ip_address];
                                        const country = COUNTRIES.find((c) => c.code === location.location?.country_code2);
                                        return country ? <FlagComponent country={country.code} countryName={country.name} /> : null;
                                    })()}
                                    <span className="text-xs font-mono">{log.ip_address || "-"}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-sm font-medium">{t("admin.logs.city", "City")}</span>
                                <span className="text-sm">{log.ip_address && ipLocationMap[log.ip_address]?.location?.city || "-"}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-sm font-medium">{t("common.createdAt", "Created At")}</span>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="text-sm cursor-help">{formatDate(log.created_at, { showTime: true })}</span>
                                        </TooltipTrigger>
                                        <TooltipContent align="end" className="bg-popover text-popover-foreground border shadow-md p-3">
                                            <RelativeTime time={new Date(log.created_at)}>
                                                <RelativeTimeZone zone="UTC">
                                                    <RelativeTimeZoneLabel>UTC</RelativeTimeZoneLabel>
                                                    <div className="flex items-center gap-2">
                                                        <RelativeTimeZoneDate />
                                                        <RelativeTimeZoneDisplay />
                                                    </div>
                                                </RelativeTimeZone>
                                                <RelativeTimeZone zone={Intl.DateTimeFormat().resolvedOptions().timeZone}>
                                                    <RelativeTimeZoneLabel>Local</RelativeTimeZoneLabel>
                                                    <div className="flex items-center gap-2">
                                                        <RelativeTimeZoneDate />
                                                        <RelativeTimeZoneDisplay />
                                                    </div>
                                                </RelativeTimeZone>
                                            </RelativeTime>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>
                    </div>

                    {/* Path */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold text-muted-foreground">{t("admin.logs.path", "Path")}</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7"
                                onClick={() => onCopy(log.req_path)}
                            >
                                <Copy className="h-3 w-3 mr-1" />
                                {t("common.copy", "Copy")}
                            </Button>
                        </div>
                        <div className="bg-muted p-3 rounded border font-mono text-xs break-all">
                            {log.req_path || <span className="text-muted-foreground">-</span>}
                        </div>
                    </div>

                    {/* Request Parameters */}
                    {log.req_params && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-muted-foreground">{t("admin.logs.requestParams", "Request Parameters")}</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7"
                                    onClick={() => onCopy(log.req_params)}
                                >
                                    <Copy className="h-3 w-3 mr-1" />
                                    {t("common.copy", "Copy")}
                                </Button>
                            </div>
                            <div className="bg-muted p-3 rounded border font-mono text-xs max-h-96 overflow-auto">
                                <pre className="whitespace-pre-wrap break-all">
                                    {JSON.stringify(JSON.parse(log.req_params), null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* User Agent */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold text-muted-foreground">{t("admin.logs.userAgent", "User Agent")}</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7"
                                onClick={() => onCopy(log.user_agent)}
                            >
                                <Copy className="h-3 w-3 mr-1" />
                                {t("common.copy", "Copy")}
                            </Button>
                        </div>
                        <div className="bg-muted p-3 rounded border font-mono text-xs break-all">
                            {log.user_agent || <span className="text-muted-foreground">-</span>}
                        </div>
                    </div>

                    {/* Request Body */}
                    {log.req_body && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-muted-foreground">{t("admin.logs.requestBody", "Request Body")}</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7"
                                    onClick={() => onCopy(log.req_body)}
                                >
                                    <Copy className="h-3 w-3 mr-1" />
                                    {t("common.copy", "Copy")}
                                </Button>
                            </div>
                            <div className="bg-muted p-3 rounded border font-mono text-xs max-h-96 overflow-auto">
                                <pre className="whitespace-pre-wrap break-all">
                                    {JSON.stringify(JSON.parse(log.req_body), null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* Response Body */}
                    {log.res_body && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-muted-foreground">{t("admin.logs.responseBody", "Response Body")}</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7"
                                    onClick={() => onCopy(log.res_body)}
                                >
                                    <Copy className="h-3 w-3 mr-1" />
                                    {t("common.copy", "Copy")}
                                </Button>
                            </div>
                            <div className="bg-muted p-3 rounded border font-mono text-xs max-h-96 overflow-auto">
                                <pre className="whitespace-pre-wrap break-all">
                                    {JSON.stringify(JSON.parse(log.res_body), null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default LogDetailsDrawer;

