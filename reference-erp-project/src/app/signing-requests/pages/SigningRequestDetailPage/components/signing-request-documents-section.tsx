import { useMemo, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BadgeCheck, Download, FileCheck, FileText, Loader2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useSigningRequest } from "@/app/signing-requests/contexts/SigningRequestContext";
import { getSigningRequestProgressCounts } from "@/app/signing-requests/utils/signing-request-progress";
import type { File as OrgFile } from "@/types/general/files";

function DocumentSection({
    title,
    description,
    file,
    icon: Icon,
    className,
    isLoading,
}: {
    title: string;
    description: string;
    file: OrgFile | null;
    icon: LucideIcon;
    /** From API row (`email`); document bytes come from Base64 `content` decoded in context. */
    signerEmail?: string | null;
    className?: string;
    /** When true, only the Open control shows a loading state. */
    isLoading?: boolean;
}) {
    const { t } = useTranslation();

    return (
        <div className={cn("flex min-h-0 min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5", className)}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                        <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-medium leading-tight">{title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
                    </div>
                </div>
            </div>
            {file ? (
                <div className="mt-auto w-full">
                    {isLoading ? (
                        <Button variant="secondary" size="sm" className="w-full" disabled>
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
                            {t("signingRequests.detail.loading", "Loading")}
                        </Button>
                    ) : (
                        <Button variant="secondary" size="sm" className="w-full" asChild>
                            <a href={file.url} target="_blank" rel="noopener noreferrer">
                                <Download className="mr-1.5 h-3.5 w-3.5" />
                                {t("signingRequests.detail.open", "Open")}
                            </a>
                        </Button>
                    )}
                </div>
            ) : isLoading ? (
                <div className="mt-auto w-full">
                    <Button variant="secondary" size="sm" className="w-full" disabled>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
                        {t("signingRequests.detail.loading", "Loading")}
                    </Button>
                </div>
            ) : (
                <p className="mt-auto w-full text-center text-sm text-muted-foreground">
                    {t("signingRequests.detail.notAvailable", "Not available yet")}
                </p>
            )}
        </div>
    );
}

/** Same footprint and palette as `Progress` root (`bg-primary/20`); brightness pulse + sweeping highlight while loading. */
function ProgressLoadingTrack({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
                className,
            )}
            aria-hidden
        >
            <div className="pointer-events-none absolute inset-0 rounded-full bg-primary/30 animate-progress-bar-brightness" />
            <div className="pointer-events-none absolute inset-y-0 left-0 w-[36%] bg-gradient-to-r from-transparent via-primary/55 to-transparent animate-progress-bar-sweep" />
        </div>
    );
}

function DocumentProgressSection({
    title,
    description,
    icon: Icon,
    receivedCount,
    totalCount,
    className,
    isLoading,
}: {
    title: string;
    description: string;
    icon: LucideIcon;
    receivedCount: number;
    /** Denominator from signing request (`number_of_signers`). */
    totalCount: number;
    className?: string;
    /** When true, show loading motion on the same track as `Progress` (signers still loading). */
    isLoading?: boolean;
}) {
    const { t } = useTranslation();
    const pct =
        totalCount > 0 ? Math.min(100, Math.round((receivedCount / totalCount) * 100)) : 0;

    const [displayPct, setDisplayPct] = useState(() => (isLoading ? 0 : pct));
    const wasLoadingRef = useRef(isLoading);

    useEffect(() => {
        if (isLoading) {
            setDisplayPct(0);
            wasLoadingRef.current = true;
            return;
        }
        if (wasLoadingRef.current) {
            wasLoadingRef.current = false;
            setDisplayPct(0);
            const id = requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setDisplayPct(pct);
                });
            });
            return () => cancelAnimationFrame(id);
        }
        setDisplayPct(pct);
    }, [isLoading, pct]);

    return (
        <div className={cn("flex min-h-0 min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5", className)}>
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-medium leading-tight">{title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
                </div>
            </div>
            <div
                className="mt-auto w-full space-y-2"
                aria-busy={isLoading}
                aria-live="polite"
            >
                {isLoading ? (
                    <ProgressLoadingTrack />
                ) : (
                    <Progress
                        value={displayPct}
                        className={cn(
                            "h-2",
                            "[&_[data-slot=progress-indicator]]:duration-700 [&_[data-slot=progress-indicator]]:ease-out",
                            "[&_[data-slot=progress-indicator]]:transition-transform",
                        )}
                    />
                )}
                <p
                    className={cn(
                        "text-xs tabular-nums text-muted-foreground",
                        isLoading && "animate-pulse text-muted-foreground/70",
                    )}
                >
                    {isLoading
                        ? t("signingRequests.detail.documentProgressLoading", "…")
                        : totalCount > 0
                          ? t(
                                "signingRequests.detail.documentProgressCount",
                                "{{received}} of {{total}}",
                                { received: receivedCount, total: totalCount }
                            )
                          : t("signingRequests.detail.documentProgressEmpty", "—")}
                </p>
            </div>
        </div>
    );
}

const SigningRequestDocumentsSection = () => {
    const { t } = useTranslation();
    const {
        signingRequest,
        originalDocument,
        signedDocument,
        evidenceDocument,
        originalDocumentSignerEmail,
        signedDocumentSignerEmail,
        evidenceDocumentSignerEmail,
        isLoadingOriginalDocument,
        isLoadingSignedDocument,
        isLoadingEvidenceDocument,
        isLoadingSigners,
        isSearchingSigners,
    } = useSigningRequest();

    const { completed, total: signerTotal } = useMemo(
        () => getSigningRequestProgressCounts(signingRequest),
        [signingRequest]
    );

    const expectedSignerTotal = Math.max(
        signerTotal,
        signingRequest.number_of_signers ?? 0,
        1
    );
    /** Progress bars when more than one signer is expected (API count). */
    const multiSigner = expectedSignerTotal > 1;

    return (
        <Card className="overflow-hidden border shadow-none">
            <CardContent className="flex flex-row items-stretch divide-x divide-border p-0">
                <DocumentSection
                    title={t("signingRequests.detail.originalTitle", "Original")}
                    description={t(
                        "signingRequests.detail.originalDesc",
                        "File submitted for signature"
                    )}
                    file={originalDocument}
                    signerEmail={originalDocumentSignerEmail}
                    icon={FileText}
                    isLoading={isLoadingOriginalDocument}
                />
                {multiSigner ? (
                    <DocumentProgressSection
                        title={t("signingRequests.detail.signedTitle", "Signed PDF")}
                        description={t(
                            "signingRequests.detail.signedDesc",
                            "Final document with captured signatures"
                        )}
                        icon={FileCheck}
                        receivedCount={completed}
                        totalCount={signerTotal}
                        isLoading={isLoadingSigners || isSearchingSigners}
                    />
                ) : (
                    <DocumentSection
                        title={t("signingRequests.detail.signedTitle", "Signed PDF")}
                        description={t(
                            "signingRequests.detail.signedDesc",
                            "Final document with captured signatures"
                        )}
                        file={signedDocument}
                        signerEmail={signedDocumentSignerEmail}
                        icon={FileCheck}
                        isLoading={isLoadingSignedDocument}
                    />
                )}
                {multiSigner ? (
                    <DocumentProgressSection
                        title={t("signingRequests.detail.evidenceTitle", "Evidence")}
                        description={t(
                            "signingRequests.detail.evidenceDesc",
                            "Audit trail, timestamps, and proof of signing"
                        )}
                        icon={BadgeCheck}
                        receivedCount={completed}
                        totalCount={signerTotal}
                        isLoading={isLoadingSigners || isSearchingSigners}
                    />
                ) : (
                    <DocumentSection
                        title={t("signingRequests.detail.evidenceTitle", "Certificate")}
                        description={t(
                            "signingRequests.detail.evidenceDesc",
                            "Audit trail, timestamps, and proof of signing"
                        )}
                        file={evidenceDocument}
                        signerEmail={evidenceDocumentSignerEmail}
                        icon={BadgeCheck}
                        isLoading={isLoadingEvidenceDocument}
                    />
                )}
            </CardContent>
        </Card>
    );
};

export default SigningRequestDocumentsSection;
