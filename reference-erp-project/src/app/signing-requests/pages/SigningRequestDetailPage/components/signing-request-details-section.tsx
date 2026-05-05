import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSigningRequest } from "@/app/signing-requests/contexts/SigningRequestContext";
import { getSigningRequestProgressCounts } from "@/app/signing-requests/utils/signing-request-progress";
import DateLabel from "@/app/components/labels/date-label";
import { IconInfoItem } from "@/app/components/custom-labels";
import Tag from "@/app/components/tag/tag";

const SigningRequestDetailsSection = () => {
    const { t } = useTranslation();
    const { signingRequest } = useSigningRequest();

    const { completed, total, errors } = useMemo(
        () => getSigningRequestProgressCounts(signingRequest),
        [signingRequest]
    );

    const requestStatus = signingRequest.overall_status;

    return (
        <div className="flex min-h-0 flex-col lg:min-h-[calc(100vh-12rem)]">
            <Card
                className={cn(
                    "w-full gap-2 shadow-none",
                    "border-border bg-muted/15"
                )}
            >
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                            <p className="text-lg font-semibold tracking-tight">{t("signingRequests.detail.title", "Signature Request Details")}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <IconInfoItem icon="activity" label={t("signingRequests.columnStatus", "Status")}>
                            <Tag text={requestStatus} />
                        </IconInfoItem>
                        <IconInfoItem
                            icon="users"
                            label={t("signingRequests.detail.signedProgress", "Progress")}
                            value={total ? `${completed}/${total}` : undefined}
                            emptyText="—"
                        />
                        <IconInfoItem
                            icon="git-branch"
                            label={t("signingRequests.detail.workflow", "Workflow")}
                            value={signingRequest.workflow_type === "parallel" ? t("signingRequests.workflowType.parallel", "Parallel") : t("signingRequests.workflowType.bulk", "Bulk")}
                        />
                        <IconInfoItem icon="alert-circle" label={t("signingRequests.detail.exceptions", "Exceptions")}>
                            <span
                                className={cn(
                                    "text-sm font-normal",
                                    errors > 0 ? "font-medium text-destructive" : "text-muted-foreground"
                                )}
                            >
                                {errors > 0 ? errors : "—"}
                            </span>
                        </IconInfoItem>
                        <IconInfoItem icon="calendar" label={t("common.createdAt", "Created")}>
                            <DateLabel data={signingRequest.created_at} options={{ hide: ["seconds"] }} />
                        </IconInfoItem>
                        <IconInfoItem icon="calendar-clock" label={t("signingRequests.detail.dueDate", "Due date")}>
                            <span className="text-sm text-muted-foreground">—</span>
                        </IconInfoItem>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default SigningRequestDetailsSection;
