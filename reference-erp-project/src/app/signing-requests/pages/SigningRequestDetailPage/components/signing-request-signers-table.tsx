import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FileCheck, Loader2, ShieldCheck, Users } from "lucide-react";
import {
    TableProvider,
    TableHeader,
    TableHeaderGroup,
    TableHead,
    TableBody,
    TableCell,
    type ColumnDef,
} from "@/components/ui/shadcn-io/table";
import { TableRow as TableRowRaw, TableCell as TableCellRaw } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import TextLabel from "@/app/components/labels/text-label";
import EmployeeLabel from "@/app/components/labels/employee-label";
import { Button } from "@/components/ui/button";
import type { SigningRequestDocumentRow } from "@/api/orgs/signing-requests/signing-requests";
import { Signer } from "@/types/general/signing-requests";
import { matchSignerToDocumentRow } from "@/app/signing-requests/utils/signing-request-document-matching";
import { useSigningRequest } from "@/app/signing-requests/contexts/SigningRequestContext";
import Tag from "@/app/components/tag/tag";

const notSignedBoxClassName =
    "inline-flex min-h-8 min-w-[5.5rem] items-center justify-center rounded-md border border-dashed border-muted-foreground/40 bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground";

export type SigningRequestSignersTableProps = {
    /** Signed PDF rows (decoded from API); matched to each signer by email or employee id. */
    signedDocumentEntries: SigningRequestDocumentRow[];
    evidenceDocumentEntries: SigningRequestDocumentRow[];
    signers: Signer[];
    isLoading: boolean;
    searchQuery: string;
};

const SigningRequestSignersTableComponent = ({
    signedDocumentEntries,
    evidenceDocumentEntries,
    signers,
    isLoading,
    searchQuery,
}: SigningRequestSignersTableProps) => {
    const { t } = useTranslation();
    const { isLoadingSignedDocument, isLoadingEvidenceDocument } = useSigningRequest();

    const columns = useMemo<ColumnDef<Signer>[]>(
        () => [
            {
                id: "party",
                header: t("signingRequests.detail.signerParty", "Signer"),
                enableResizing: true,
                size: 180,
                cell: ({ row }) => {
                    const s = row.original;
                    if (s.employee) {
                        return <EmployeeLabel data={s.employee} link />;
                    }
                    if (s.group) {
                        return (
                            <div className="flex min-w-0 items-center gap-2">
                                <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <TextLabel data={s.group.name} className="truncate font-medium" />
                            </div>
                        );
                    }
                    return <span className="text-muted-foreground">—</span>;
                },
            },
            {
                accessorKey: "email",
                header: t("common.email", "Email"),
                enableResizing: true,
                size: 200,
                cell: ({ row }) => (
                    <TextLabel data={row.original.email} />
                ),
            },
            {
                id: "signature_status",
                header: t("signingRequests.detail.signatureStatus", "Signature"),
                enableResizing: true,
                size: 120,
                cell: ({ row }) => {
                    const s = row.original;
                    return (<Tag text={s.status} />);
                },
            },
            {
                id: "actions",
                enableResizing: false,
                size: 52,
                header: () => (
                    <span className="sr-only">{t("common.actions", "Actions")}</span>
                ),
                cell: ({ row }) => {
                    const s = row.original;
                    const signedRow = matchSignerToDocumentRow(s, signedDocumentEntries);
                    const evidenceRow = matchSignerToDocumentRow(s, evidenceDocumentEntries);
                    const loadingSigned = isLoadingSignedDocument;
                    const loadingEvidence = isLoadingEvidenceDocument;
                    const bothLoading = loadingSigned && loadingEvidence;
                    const bothNotAvailable =
                        !signedRow &&
                        !evidenceRow &&
                        !loadingSigned &&
                        !loadingEvidence;

                    if (bothLoading) {
                        return (
                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                                <Button variant="outline" size="sm" className="h-8" disabled>
                                    <Loader2
                                        className="mr-1.5 h-3.5 w-3.5 shrink-0 animate-spin"
                                        aria-hidden
                                    />
                                    {t(
                                        "signingRequests.detail.loadingDocuments",
                                        "Loading documents"
                                    )}
                                </Button>
                            </div>
                        );
                    }

                    if (bothNotAvailable) {
                        return (
                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                                <div className={notSignedBoxClassName} role="status">
                                    {t("signingRequests.detail.notSigned", "Not signed")}
                                </div>
                            </div>
                        );
                    }

                    const signedPdfControl = loadingSigned ? (
                        <Button variant="outline" size="sm" className="h-8" disabled>
                            <Loader2
                                className="mr-1.5 h-3.5 w-3.5 shrink-0 animate-spin"
                                aria-hidden
                            />
                            {t("signingRequests.detail.viewSignedPdf", "Signed PDF")}
                        </Button>
                    ) : signedRow ? (
                        <Button variant="outline" size="sm" className="h-8" asChild>
                            <a
                                href={signedRow.file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <FileCheck className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                                {t("signingRequests.detail.viewSignedPdf", "Signed PDF")}
                            </a>
                        </Button>
                    ) : (
                        <div className={notSignedBoxClassName} role="status">
                            {t("signingRequests.detail.notSigned", "Not signed")}
                        </div>
                    );

                    const certificateControl = loadingEvidence ? (
                        <Button variant="outline" size="sm" className="h-8" disabled>
                            <Loader2
                                className="mr-1.5 h-3.5 w-3.5 shrink-0 animate-spin"
                                aria-hidden
                            />
                            {t("signingRequests.detail.viewCertificate", "Certificate")}
                        </Button>
                    ) : evidenceRow ? (
                        <Button variant="outline" size="sm" className="h-8" asChild>
                            <a
                                href={evidenceRow.file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                                {t("signingRequests.detail.viewCertificate", "Certificate")}
                            </a>
                        </Button>
                    ) : (
                        <div className={notSignedBoxClassName} role="status">
                            {t("signingRequests.detail.notSigned", "Not signed")}
                        </div>
                    );

                    return (
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                            {signedPdfControl}
                            {certificateControl}
                        </div>
                    );
                },
                meta: { sticky: "right" as const },
            },
        ],
        [
            t,
            signedDocumentEntries,
            evidenceDocumentEntries,
            isLoadingSignedDocument,
            isLoadingEvidenceDocument,
        ]
    );

    return (
        <div className="w-full overflow-x-auto rounded-lg">
            <TableProvider data={signers} columns={columns} enableColumnResizing>
                <TableHeader>
                    {({ headerGroup }) => (
                        <TableHeaderGroup key={headerGroup.id} headerGroup={headerGroup}>
                            {({ header }) => <TableHead key={header.id} header={header} />}
                        </TableHeaderGroup>
                    )}
                </TableHeader>
                <TableBody
                    isLoading={isLoading}
                    loadingState={<TableSkeleton columnCount={columns.length} />}
                    emptyState={
                        <TableRowRaw className="hover:bg-transparent">
                            <TableCellRaw
                                className="h-96 text-center hover:bg-transparent"
                                colSpan={columns.length}
                            >
                                <div className="flex flex-col items-center justify-center space-y-4">
                                    <Users className="h-10 w-10 text-muted-foreground" />
                                    <div className="flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-medium">
                                            {searchQuery
                                                ? t("signingRequests.detail.noSignersSearch", "No signers found")
                                                : t("signingRequests.detail.noSigners", "No signers to display.")}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {searchQuery
                                                ? t(
                                                    "signingRequests.detail.noSignersSearchDescription",
                                                    "No signers match your search for “{{searchQuery}}”.",
                                                    { searchQuery }
                                                )
                                                : t(
                                                    "signingRequests.detail.noSignersDescription",
                                                    "Participants will appear here when they are added to this request."
                                                )}
                                        </p>
                                    </div>
                                </div>
                            </TableCellRaw>
                        </TableRowRaw>
                    }
                >
                    {({ row }) => (
                        <TableRowRaw
                            key={row.id}
                            className="hover:bg-muted/50"
                            data-state={row.getIsSelected() && "selected"}
                        >
                            {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id} cell={cell} />
                            ))}
                        </TableRowRaw>
                    )}
                </TableBody>
            </TableProvider>
        </div>
    );
};

export const SigningRequestSignersTable = memo(SigningRequestSignersTableComponent);
export default SigningRequestSignersTable;
