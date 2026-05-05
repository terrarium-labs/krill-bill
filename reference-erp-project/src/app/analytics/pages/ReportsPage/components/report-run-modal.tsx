import { useState } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Loader2, Download, FileBarChart2 } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Report, ReportParameterValues } from "@/types/general/reports";
import { runReport } from "@/api/orgs/reports/reports";
import DynamicField from "./dynamic-field";

interface ReportRunModalProps {
    report: Report;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/** Derives which keys matter for a given parameter (date_range uses two keys) */
function getParameterKeys(param: Report["parameters"][number]): string[] {
    if (param.type === "date_range") {
        return [`${param.key}_from`, `${param.key}_to`];
    }
    return [param.key];
}

const ReportRunModal = ({ report, open, onOpenChange }: ReportRunModalProps) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();

    const [values, setValues] = useState<ReportParameterValues>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isRunning, setIsRunning] = useState(false);
    const [downloadReady, setDownloadReady] = useState<{ url: string; fileName: string } | null>(null);

    const handleChange = (key: string, value: ReportParameterValues[string]) => {
        setValues((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        for (const param of report.parameters) {
            if (!param.required) continue;

            if (param.type === "date_range") {
                const fromKey = `${param.key}_from`;
                const toKey = `${param.key}_to`;
                if (!values[fromKey]) {
                    newErrors[fromKey] = t("reports.validation.required", "This field is required");
                }
                if (!values[toKey]) {
                    newErrors[toKey] = t("reports.validation.required", "This field is required");
                }
            } else {
                const val = values[param.key];
                const isEmpty =
                    val === undefined ||
                    val === null ||
                    val === "" ||
                    (Array.isArray(val) && val.length === 0);
                if (isEmpty) {
                    newErrors[param.key] = t("reports.validation.required", "This field is required");
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRun = async () => {
        if (!orgId) return;
        if (!validate()) return;

        setIsRunning(true);
        setDownloadReady(null);

        try {
            const response = await runReport(orgId, report.id, values);

            if (response.success) {
                const result = response.success;

                if (result.download_url) {
                    setDownloadReady({
                        url: result.download_url,
                        fileName: result.file_name ?? `${report.id}_report.xlsx`,
                    });
                    toast.success(t("reports.readyToDownload", "Report generated — click Download to save the file"));
                } else {
                    toast.success(t("reports.success", "Report generated successfully"));
                    handleClose();
                }
            } else {
                toast.error(t("reports.error", "Failed to generate report. Please try again."));
            }
        } catch {
            toast.error(t("reports.error", "Failed to generate report. Please try again."));
        } finally {
            setIsRunning(false);
        }
    };

    const handleDownload = () => {
        if (!downloadReady) return;
        const a = document.createElement("a");
        a.href = downloadReady.url;
        a.download = downloadReady.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        handleClose();
    };

    const handleClose = () => {
        setValues({});
        setErrors({});
        setDownloadReady(null);
        onOpenChange(false);
    };

    const hasParameters = report.parameters.length > 0;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary shrink-0">
                            <FileBarChart2 className="h-4 w-4" />
                        </div>
                        <div>
                            <DialogTitle>{report.name}</DialogTitle>
                            {report.description && (
                                <DialogDescription className="mt-0.5">
                                    {report.description}
                                </DialogDescription>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                {hasParameters ? (
                    <div className="space-y-4 py-2">
                        {report.parameters.map((param) => {
                            const keys = getParameterKeys(param);
                            const error = keys.map((k) => errors[k]).find(Boolean);
                            return (
                                <DynamicField
                                    key={param.key}
                                    param={param}
                                    values={values}
                                    onChange={handleChange}
                                    error={error}
                                />
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground py-2">
                        {t("reports.noParams", "This report requires no additional parameters.")}
                    </p>
                )}

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleClose} disabled={isRunning}>
                        {t("common.cancel", "Cancel")}
                    </Button>

                    {downloadReady ? (
                        <Button onClick={handleDownload}>
                            <Download className="h-4 w-4 mr-1.5" />
                            {t("reports.download", "Download")}
                        </Button>
                    ) : (
                        <Button onClick={handleRun} disabled={isRunning}>
                            {isRunning ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                                    {t("reports.generating", "Generating...")}
                                </>
                            ) : (
                                t("reports.run", "Run Report")
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ReportRunModal;
