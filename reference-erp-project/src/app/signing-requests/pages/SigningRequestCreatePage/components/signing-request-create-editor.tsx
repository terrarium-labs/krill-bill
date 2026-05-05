import {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { toast } from "sonner";
import { FileUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    BULK_SIGNATURE_AREA_COLOR,
    PdfMultiSignatureCanvas,
    type ParallelDrawBlockedReason,
    type SignatureRectPdf,
    type SignatureAreaVisual,
    type SignatureAreaColorMode,
} from "@/app/signing-requests/pages/SigningRequestCreatePage/components/pdf-multi-signature-canvas";
import { PdfPageThumbnailsStrip } from "@/app/signing-requests/pages/SigningRequestCreatePage/components/pdf-page-thumbnails-strip";
import SigningRequestRecipientAddModal, {
    type SigningRequestRecipientAddModalResult,
} from "@/app/signing-requests/pages/SigningRequestCreatePage/components/signing-request-recipient-add-modal";
import { postSigningRequest } from "@/api/orgs/signing-requests/signing-requests";
import { fitSignaturitRectToConstraints } from "@/app/signing-requests/utils/signaturit-field-geometry";
import {
    DEFAULT_NEW_SIGNER_SIGNATURE_TYPE,
    type NewSigner,
    type SignatureArea,
    type SignaturitFieldFormState,
} from "@/types/general/signing-requests";
import {
    createDefaultSignaturitFieldState,
    parseRemindersInput,
    signaturitFieldStateToSignatureArea,
} from "@/utils/signing-requests";
import SigningRequestSignatureAreaFieldSheet from "@/app/signing-requests/pages/SigningRequestCreatePage/components/signing-request-signature-area-field-sheet";

/** Same palette as `PdfMultiSignatureCanvas` fallback; one stable color per parallel participant. */
const PARALLEL_PARTICIPANT_PALETTE = [
    "#2563eb",
    "#16a34a",
    "#ca8a04",
    "#db2777",
    "#9333ea",
    "#ea580c",
    "#0891b2",
];

export type ParallelParticipant =
    | { id: string; kind: "email"; email: string; color: string }
    | { id: string; kind: "employee"; employee_id: string; label: string | null; color: string };

/** Bulk workflow: global recipients; each recipient is one signer with all signature areas in `widgets`. */
export type BulkRecipient =
    | { id: string; kind: "email"; email: string }
    | { id: string; kind: "employee"; employee_id: string; label: string | null }
    | { id: string; kind: "group"; group_id: string; label: string | null };

function isValidEmail(value: string): boolean {
    const t = value.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

/** At least one `type: "signature"` widget is required per signer; default placement is signature. */
function isSignatureWidgetArea(area: SignatureAreaVisual): boolean {
    return (area.signaturit?.fieldType ?? "signature") === "signature";
}

export type SigningRequestCreateEditorHandle = {
    submit: () => void;
    /** Opens the PDF file picker (replace flow when a document is already loaded). */
    openReplaceDocument: () => void;
    /**
     * Remove a signer by summary key (`parallel:id` for parallel participants, `bulk:id` for bulk recipients).
     */
    removeSigner: (signerKey: string) => void;
    /** Clears signature areas and signer assignments; keeps the uploaded PDF. */
    clearSignatureDraft: () => void;
    /** Opens add recipient / participant modal (bulk or parallel). */
    openRecipientAddModal: () => void;
    /** @deprecated Use `openRecipientAddModal`. */
    openBulkAddSignerModal: () => void;
    /** Parallel: select which participant new signature areas are drawn for. */
    selectParallelSigner: (participantId: string | null) => void;
};

export type SigningRequestSignerSummary = {
    key: string;
    page: number;
    /** 1-based index of this signature box in document order (matches `areas` order). */
    areaIndex: number;
    signatureIndex: number;
    /** Matches `SignatureAreaVisual.color` on the PDF canvas; bulk rows use `BULK_SIGNATURE_AREA_COLOR`. */
    areaColor: string;
    target: "employee" | "group" | "email";
    label: string | null;
    hasSelection: boolean;
    /** Sidebar copy: bulk list is recipients only (areas apply to all). */
    isBulkRecipient?: boolean;
    /** Parallel: number of signature areas for this participant. */
    areaCount?: number;
    /** Parallel: this participant row is selected for drawing. */
    isSelected?: boolean;
    isParallelParticipant?: boolean;
    /** Parallel: distinct sorted page numbers where this participant has signature areas. */
    parallelPages?: number[];
};

export type SigningRequestCreateEditorState = {
    canSubmit: boolean;
    submitting: boolean;
    hasDocument: boolean;
    /** Number of signature areas on the document (for workflow-change confirmation). */
    areasCount: number;
    /** Total pages in the uploaded PDF (for UI, e.g. hiding redundant page hints on single-page docs). */
    pdfNumPages: number;
    signers: SigningRequestSignerSummary[];
    /** Parallel: highlighted participant for new signature areas. */
    selectedParallelSignerId: string | null;
};

type SigningRequestCreateEditorProps = {
    name: string;
    description: string;
    workflowType: "parallel" | "bulk" | null;
    /** Days until the envelope expires. */
    expireTimeDays: number;
    /** Comma-separated reminder offsets (days); empty leaves reminders unset. */
    remindersInput: string;
    onSuccess?: () => void;
    /** Fires when `canSubmit` / `submitting` change (for header primary action). */
    onStateChange?: (state: SigningRequestCreateEditorState) => void;
};

const SigningRequestCreateEditor = forwardRef<
    SigningRequestCreateEditorHandle,
    SigningRequestCreateEditorProps
>(function SigningRequestCreateEditor(
    { name, description, workflowType, expireTimeDays, remindersInput, onSuccess, onStateChange },
    ref
) {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();

    const [documentFile, setDocumentFile] = useState<globalThis.File | null>(null);
    /** Bumped whenever the PDF is replaced so viewers remount with a clean slate. */
    const [documentSessionId, setDocumentSessionId] = useState(0);
    const [pdfNumPages, setPdfNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [areas, setAreas] = useState<SignatureAreaVisual[]>([]);
    const [bulkRecipients, setBulkRecipients] = useState<BulkRecipient[]>([]);
    const [parallelParticipants, setParallelParticipants] = useState<ParallelParticipant[]>([]);
    const [selectedParallelSignerId, setSelectedParallelSignerId] = useState<string | null>(null);
    const [recipientModalOpen, setRecipientModalOpen] = useState(false);
    const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
    const [fieldSheetOpen, setFieldSheetOpen] = useState(false);
    /** Rendered bitmap size per PDF page (for Signaturit geometry when the sheet updates field type). */
    const [pageBitmapSizes, setPageBitmapSizes] = useState<Record<number, { w: number; h: number }>>({});
    const [submitting, setSubmitting] = useState(false);
    const [documentDropActive, setDocumentDropActive] = useState(false);
    const documentFileInputRef = useRef<HTMLInputElement>(null);
    const onStateChangeRef = useRef(onStateChange);
    onStateChangeRef.current = onStateChange;

    useEffect(() => {
        if (pdfNumPages > 0 && currentPage > pdfNumPages) {
            setCurrentPage(pdfNumPages);
        }
    }, [pdfNumPages, currentPage]);

    useEffect(() => {
        if (workflowType === "parallel") {
            setBulkRecipients([]);
        } else if (workflowType === "bulk") {
            setParallelParticipants([]);
            setSelectedParallelSignerId(null);
        }
    }, [workflowType]);

    const signersSummary = useMemo((): SigningRequestSignerSummary[] => {
        if (workflowType === "bulk") {
            return bulkRecipients.map((r, idx) => {
                if (r.kind === "email") {
                    return {
                        key: `bulk:${r.id}`,
                        page: areas[0]?.page ?? 1,
                        areaIndex: 0,
                        signatureIndex: idx + 1,
                        areaColor: BULK_SIGNATURE_AREA_COLOR,
                        target: "email" as const,
                        label: r.email,
                        hasSelection: true,
                        isBulkRecipient: true,
                    };
                }
                if (r.kind === "group") {
                    return {
                        key: `bulk:${r.id}`,
                        page: areas[0]?.page ?? 1,
                        areaIndex: 0,
                        signatureIndex: idx + 1,
                        areaColor: BULK_SIGNATURE_AREA_COLOR,
                        target: "group" as const,
                        label: r.label,
                        hasSelection: true,
                        isBulkRecipient: true,
                    };
                }
                return {
                    key: `bulk:${r.id}`,
                    page: areas[0]?.page ?? 1,
                    areaIndex: 0,
                    signatureIndex: idx + 1,
                    areaColor: BULK_SIGNATURE_AREA_COLOR,
                    target: "employee" as const,
                    label: r.label,
                    hasSelection: true,
                    isBulkRecipient: true,
                };
            });
        }
        if (workflowType === "parallel") {
            return parallelParticipants.map((p, idx) => {
                const forSigner = areas.filter((a) => a.signerId === p.id);
                const parallelPages = [...new Set(forSigner.map((a) => a.page))].sort(
                    (a, b) => a - b
                );
                const firstPage = parallelPages[0] ?? areas[0]?.page ?? 1;
                const label = p.kind === "email" ? p.email : p.label;
                return {
                    key: `parallel:${p.id}`,
                    page: firstPage,
                    areaIndex: idx + 1,
                    signatureIndex: forSigner.length,
                    areaColor: p.color,
                    target: p.kind === "email" ? ("email" as const) : ("employee" as const),
                    label,
                    hasSelection: true,
                    isParallelParticipant: true,
                    areaCount: forSigner.length,
                    isSelected: selectedParallelSignerId === p.id,
                    parallelPages,
                };
            });
        }
        return [];
    }, [areas, workflowType, bulkRecipients, parallelParticipants, selectedParallelSignerId]);

    useEffect(() => {
        const bulkReady =
            workflowType === "bulk" ? bulkRecipients.length > 0 && areas.length > 0 : true;
        const parallelReady =
            workflowType === "parallel"
                ? areas.length > 0 &&
                  areas.every(
                      (a) =>
                          a.signerId &&
                          parallelParticipants.some((p) => p.id === a.signerId)
                  )
                : true;
        /** Bulk: shared widgets — at least one signature-type placement. Parallel: each participant needs ≥1 signature area. */
        const bulkHasSignatureWidget =
            workflowType !== "bulk" ||
            bulkRecipients.length === 0 ||
            areas.some(isSignatureWidgetArea);
        const parallelEverySignerHasSignatureWidget =
            workflowType !== "parallel" ||
            (parallelParticipants.length > 0 &&
                parallelParticipants.every((p) =>
                    areas.some(
                        (a) => a.signerId === p.id && isSignatureWidgetArea(a)
                    )
                ));
        onStateChangeRef.current?.({
            canSubmit:
                !!documentFile &&
                workflowType !== null &&
                areas.length > 0 &&
                bulkReady &&
                parallelReady &&
                bulkHasSignatureWidget &&
                parallelEverySignerHasSignatureWidget &&
                !submitting,
            submitting,
            hasDocument: !!documentFile,
            areasCount: areas.length,
            pdfNumPages,
            signers: signersSummary,
            selectedParallelSignerId,
        });
    }, [
        documentFile,
        workflowType,
        areas,
        submitting,
        signersSummary,
        bulkRecipients.length,
        parallelParticipants,
        selectedParallelSignerId,
        pdfNumPages,
    ]);

    useEffect(() => {
        if (selectedAreaId && !areas.some((a) => a.id === selectedAreaId)) {
            setSelectedAreaId(null);
        }
    }, [areas, selectedAreaId]);

    useEffect(() => {
        if (!selectedAreaId) {
            setFieldSheetOpen(false);
        }
    }, [selectedAreaId]);

    const handleSelectArea = useCallback((id: string) => {
        setSelectedAreaId(id);
        setFieldSheetOpen(true);
    }, []);

    const handlePageBitmapSize = useCallback((page: number, size: { w: number; h: number }) => {
        setPageBitmapSizes((prev) => ({ ...prev, [page]: size }));
    }, []);

    const handleSignaturitFieldChange = useCallback(
        (areaId: string, next: SignaturitFieldFormState) => {
            setAreas((prev) => {
                const pageSize = (p: number) => pageBitmapSizes[p] ?? { w: 612, h: 792 };
                const withUpdate = prev.map((a) => {
                    if (a.id !== areaId) return a;
                    const { w, h } = pageSize(a.page);
                    const newRect = fitSignaturitRectToConstraints(a.rect, next.fieldType, w, h);
                    return { ...a, signaturit: next, rect: newRect };
                });
                if (next.fieldType === "radio" && next.radioIsDefault) {
                    const fid = next.fieldId.trim();
                    return withUpdate.map((a) => {
                        if (a.id === areaId) return a;
                        if (
                            a.signaturit?.fieldType === "radio" &&
                            (a.signaturit.fieldId?.trim() ?? "") === fid
                        ) {
                            return {
                                ...a,
                                signaturit: { ...a.signaturit, radioIsDefault: false },
                            };
                        }
                        return a;
                    });
                }
                return withUpdate;
            });
        },
        [pageBitmapSizes]
    );

    const handleAddRadioGroupMember = useCallback((sourceAreaId: string) => {
        const newId = crypto.randomUUID();
        setAreas((prev) => {
            const source = prev.find((a) => a.id === sourceAreaId);
            if (!source?.signaturit || source.signaturit.fieldType !== "radio") return prev;
            const fid = source.signaturit.fieldId.trim();
            if (!fid) return prev;
            const sig = source.signaturit;
            const newSignaturit: SignaturitFieldFormState = {
                ...createDefaultSignaturitFieldState(),
                fieldType: "radio",
                fieldName: sig.fieldName,
                fieldId: fid,
                defaultValue: "",
                radioIsDefault: false,
                mandatory: sig.mandatory,
                editable: sig.editable,
            };
            const OFFSET = 24;
            const { w: pw, h: ph } = pageBitmapSizes[source.page] ?? { w: 612, h: 792 };
            const newRectRaw: SignatureRectPdf = {
                coordinate_x: source.rect.coordinate_x + OFFSET,
                coordinate_y: source.rect.coordinate_y + OFFSET,
                width: source.rect.width,
                height: source.rect.height,
            };
            const newRect = fitSignaturitRectToConstraints(newRectRaw, "radio", pw, ph);
            const newArea: SignatureAreaVisual = {
                id: newId,
                page: source.page,
                rect: newRect,
                color: source.color,
                signaturit: newSignaturit,
                ...(source.signerId ? { signerId: source.signerId } : {}),
            };
            queueMicrotask(() => {
                setSelectedAreaId(newId);
                setFieldSheetOpen(true);
            });
            return [...prev, newArea];
        });
    }, [pageBitmapSizes]);

    useEffect(() => {
        if (workflowType !== "parallel" || !selectedAreaId) return;
        const a = areas.find((x) => x.id === selectedAreaId);
        if (a?.signerId) {
            setSelectedParallelSignerId(a.signerId);
        }
    }, [workflowType, selectedAreaId, areas]);

    const applyPdfFile = (f: File) => {
        if (f.type !== "application/pdf") {
            toast.error(t("signingRequests.create.pdfOnly", "Please upload a PDF file."));
            return;
        }
        setDocumentFile(f);
        setDocumentSessionId((n) => n + 1);
        setPdfNumPages(0);
        setPageBitmapSizes({});
        setAreas([]);
        setBulkRecipients([]);
        setParallelParticipants([]);
        setSelectedParallelSignerId(null);
        setSelectedAreaId(null);
        setFieldSheetOpen(false);
        setCurrentPage(1);
    };

    const handleDocumentFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (!f) return;
        applyPdfFile(f);
    };

    const removeSignerByKey = useCallback((signerKey: string) => {
        if (signerKey.startsWith("bulk:")) {
            const id = signerKey.slice("bulk:".length);
            setBulkRecipients((prev) => prev.filter((r) => r.id !== id));
            return;
        }
        if (signerKey.startsWith("parallel:")) {
            const id = signerKey.slice("parallel:".length);
            setParallelParticipants((prev) => prev.filter((p) => p.id !== id));
            setAreas((prev) => prev.filter((a) => a.signerId !== id));
            setSelectedParallelSignerId((sel) => (sel === id ? null : sel));
            setSelectedAreaId((sel) => {
                if (!sel) return null;
                const cur = areas.find((a) => a.id === sel);
                if (cur?.signerId === id) return null;
                return sel;
            });
            return;
        }
    }, [areas]);

    const validateAndBuildSigners = useCallback((): NewSigner[] | null => {
        const pageSizeFor = (page: number) => pageBitmapSizes[page] ?? { w: 612, h: 792 };

        const widgetForArea = (area: SignatureAreaVisual) =>
            signaturitFieldStateToSignatureArea(
                area.signaturit ?? createDefaultSignaturitFieldState(),
                area.rect,
                area.page,
                {
                    allAreasInOrder: areas,
                    currentAreaId: area.id,
                    pageSize: pageSizeFor(area.page),
                }
            );

        if (workflowType === "bulk") {
            if (bulkRecipients.length === 0) {
                toast.error(
                    t(
                        "signingRequests.create.bulkNeedsRecipient",
                        "Add at least one recipient for bulk sending."
                    )
                );
                return null;
            }
            if (!areas.some(isSignatureWidgetArea)) {
                toast.error(
                    t(
                        "signingRequests.create.signatureWidgetRequired",
                        "Add at least one signature field on the document (each signer must have a signature widget)."
                    )
                );
                return null;
            }
            /** One Signaturit signer per recipient; all document widgets in document order (Signaturit format). */
            const out: NewSigner[] = [];
            const widgets = areas.map((area) => widgetForArea(area));
            for (const r of bulkRecipients) {
                if (r.kind === "email") {
                    out.push({
                        employee_id: null,
                        group_id: null,
                        email: r.email.trim(),
                        signature_type: DEFAULT_NEW_SIGNER_SIGNATURE_TYPE,
                        widgets,
                    });
                } else if (r.kind === "group") {
                    out.push({
                        employee_id: null,
                        group_id: r.group_id,
                        email: null,
                        signature_type: DEFAULT_NEW_SIGNER_SIGNATURE_TYPE,
                        widgets,
                    });
                } else {
                    out.push({
                        employee_id: r.employee_id,
                        group_id: null,
                        email: null,
                        signature_type: DEFAULT_NEW_SIGNER_SIGNATURE_TYPE,
                        widgets,
                    });
                }
            }
            return out;
        }

        for (const p of parallelParticipants) {
            if (!areas.some((a) => a.signerId === p.id && isSignatureWidgetArea(a))) {
                toast.error(
                    t(
                        "signingRequests.create.signatureWidgetRequiredPerSigner",
                        "Each participant must have at least one signature field on the document."
                    )
                );
                return null;
            }
        }

        const widgetsBySignerId = new Map<string, SignatureArea[]>();
        for (const area of areas) {
            const sid = area.signerId;
            if (!sid) {
                toast.error(
                    t(
                        "signingRequests.create.areaMissingParticipant",
                        "Each signature area must belong to a participant."
                    )
                );
                return null;
            }
            const p = parallelParticipants.find((x) => x.id === sid);
            if (!p) {
                toast.error(t("signingRequests.create.error", "Could not create signing request"));
                return null;
            }
            const widget = widgetForArea(area);
            const list = widgetsBySignerId.get(sid);
            if (list) list.push(widget);
            else widgetsBySignerId.set(sid, [widget]);
        }

        const out: NewSigner[] = [];
        for (const p of parallelParticipants) {
            const widgets = widgetsBySignerId.get(p.id);
            if (!widgets?.length) continue;

            if (p.kind === "email") {
                out.push({
                    employee_id: null,
                    group_id: null,
                    email: p.email.trim(),
                    signature_type: DEFAULT_NEW_SIGNER_SIGNATURE_TYPE,
                    widgets,
                });
            } else {
                out.push({
                    employee_id: p.employee_id,
                    group_id: null,
                    email: null,
                    signature_type: DEFAULT_NEW_SIGNER_SIGNATURE_TYPE,
                    widgets,
                });
            }
        }
        return out;
    }, [areas, bulkRecipients, parallelParticipants, workflowType, pageBitmapSizes, t]);

    const clearSignatureDraft = useCallback(() => {
        setAreas([]);
        setBulkRecipients([]);
        setParallelParticipants([]);
        setSelectedParallelSignerId(null);
        setSelectedAreaId(null);
        setFieldSheetOpen(false);
    }, []);

    const handleRecipientModalConfirm = useCallback(
        (result: SigningRequestRecipientAddModalResult) => {
            if (workflowType === "parallel") {
                if (result.kind === "group") return;
                const color =
                    PARALLEL_PARTICIPANT_PALETTE[
                        parallelParticipants.length % PARALLEL_PARTICIPANT_PALETTE.length
                    ];
                if (result.kind === "email") {
                    const email = result.email.trim();
                    if (!isValidEmail(email)) {
                        toast.error(t("signingRequests.create.invalidEmail", "Enter a valid email address."));
                        return;
                    }
                    const lower = email.toLowerCase();
                    if (
                        parallelParticipants.some(
                            (p) => p.kind === "email" && p.email.toLowerCase() === lower
                        )
                    ) {
                        toast.error(
                            t(
                                "signingRequests.create.duplicateRecipient",
                                "This recipient is already in the list."
                            )
                        );
                        return;
                    }
                    const id = crypto.randomUUID();
                    setParallelParticipants((prev) => [...prev, { id, kind: "email", email, color }]);
                    setSelectedParallelSignerId(id);
                } else {
                    if (
                        parallelParticipants.some(
                            (p) => p.kind === "employee" && p.employee_id === result.employee_id
                        )
                    ) {
                        toast.error(
                            t(
                                "signingRequests.create.duplicateRecipient",
                                "This recipient is already in the list."
                            )
                        );
                        return;
                    }
                    const id = crypto.randomUUID();
                    setParallelParticipants((prev) => [
                        ...prev,
                        {
                            id,
                            kind: "employee",
                            employee_id: result.employee_id,
                            label: result.label,
                            color,
                        },
                    ]);
                    setSelectedParallelSignerId(id);
                }
                setRecipientModalOpen(false);
                return;
            }
            if (result.kind === "email") {
                const email = result.email.trim();
                if (!isValidEmail(email)) {
                    toast.error(t("signingRequests.create.invalidEmail", "Enter a valid email address."));
                    return;
                }
                const lower = email.toLowerCase();
                if (bulkRecipients.some((r) => r.kind === "email" && r.email.toLowerCase() === lower)) {
                    toast.error(
                        t(
                            "signingRequests.create.duplicateRecipient",
                            "This recipient is already in the list."
                        )
                    );
                    return;
                }
                setBulkRecipients((prev) => [
                    ...prev,
                    { id: crypto.randomUUID(), kind: "email", email },
                ]);
            } else if (result.kind === "employee") {
                if (bulkRecipients.some((r) => r.kind === "employee" && r.employee_id === result.employee_id)) {
                    toast.error(
                        t(
                            "signingRequests.create.duplicateRecipient",
                            "This recipient is already in the list."
                        )
                    );
                    return;
                }
                setBulkRecipients((prev) => [
                    ...prev,
                    {
                        id: crypto.randomUUID(),
                        kind: "employee",
                        employee_id: result.employee_id,
                        label: result.label,
                    },
                ]);
            } else {
                if (bulkRecipients.some((r) => r.kind === "group" && r.group_id === result.group_id)) {
                    toast.error(
                        t(
                            "signingRequests.create.duplicateRecipient",
                            "This recipient is already in the list."
                        )
                    );
                    return;
                }
                setBulkRecipients((prev) => [
                    ...prev,
                    {
                        id: crypto.randomUUID(),
                        kind: "group",
                        group_id: result.group_id,
                        label: result.label,
                    },
                ]);
            }
            setRecipientModalOpen(false);
        },
        [bulkRecipients, parallelParticipants, t, workflowType]
    );

    const submitInternal = useCallback(async () => {
        if (!orgId || !documentFile) {
            toast.error(t("signingRequests.create.missingFile", "Upload a PDF document first."));
            return;
        }
        if (!workflowType) {
            toast.error(
                t("signingRequests.create.workflowRequired", "Select a workflow before sending.")
            );
            return;
        }
        const trimmed = name.trim();
        if (!trimmed) {
            toast.error(t("signingRequests.create.nameRequired", "Name is required"));
            return;
        }
        if (!Number.isFinite(expireTimeDays) || expireTimeDays < 1) {
            toast.error(
                t(
                    "signingRequests.create.expireTimeInvalid",
                    "Enter a valid expiration (at least 1 day)."
                )
            );
            return;
        }
        const remindersParsed = parseRemindersInput(remindersInput);
        if (remindersParsed === undefined && remindersInput.trim() !== "") {
            toast.error(
                t(
                    "signingRequests.create.remindersInvalid",
                    "Reminders must be non-negative numbers, separated by commas (or 0 to disable)."
                )
            );
            return;
        }
        if (areas.length === 0) {
            toast.error(
                t(
                    "signingRequests.create.drawAtLeastOne",
                    "Draw at least one signature area on the document."
                )
            );
            return;
        }
        const signers = validateAndBuildSigners();
        if (!signers) return;

        setSubmitting(true);
        try {
            const response = await postSigningRequest(orgId, {
                name: trimmed,
                description: description.trim() || null,
                workflow_type: workflowType,
                expire_time: Math.floor(expireTimeDays),
                reminders: remindersParsed,
                signers,
                file: documentFile,
            });
            if (response.success) {
                toast.success(t("signingRequests.create.success", "Signing request created"));
                onSuccess?.();
            } else {
                toast.error(t("signingRequests.create.error", "Could not create signing request"));
            }
        } catch {
            toast.error(t("signingRequests.create.error", "Could not create signing request"));
        } finally {
            setSubmitting(false);
        }
    }, [
        orgId,
        documentFile,
        name,
        description,
        workflowType,
        expireTimeDays,
        remindersInput,
        areas,
        validateAndBuildSigners,
        t,
        onSuccess,
    ]);

    useImperativeHandle(
        ref,
        () => ({
            submit: () => {
                void submitInternal();
            },
            openReplaceDocument: () => {
                documentFileInputRef.current?.click();
            },
            removeSigner: (signerKey: string) => {
                removeSignerByKey(signerKey);
            },
            clearSignatureDraft: () => {
                clearSignatureDraft();
            },
            openRecipientAddModal: () => {
                if (workflowType === "bulk" || workflowType === "parallel") {
                    setRecipientModalOpen(true);
                }
            },
            openBulkAddSignerModal: () => {
                if (workflowType === "bulk" || workflowType === "parallel") {
                    setRecipientModalOpen(true);
                }
            },
            selectParallelSigner: (participantId: string | null) => {
                if (workflowType === "parallel") {
                    setSelectedParallelSignerId(participantId);
                }
            },
        }),
        [submitInternal, removeSignerByKey, clearSignatureDraft, workflowType]
    );

    const areaColorMode: SignatureAreaColorMode =
        workflowType === "bulk" ? "primary" : "palette";
    const drawingEnabled = workflowType !== null;

    const selectedParallelParticipant = useMemo(
        () => parallelParticipants.find((p) => p.id === selectedParallelSignerId) ?? null,
        [parallelParticipants, selectedParallelSignerId]
    );

    const parallelDrawBlockedReason: ParallelDrawBlockedReason = useMemo(() => {
        if (workflowType !== "parallel") return "none";
        if (parallelParticipants.length === 0) return "add-participant";
        if (!selectedParallelSignerId) return "select-participant";
        return "none";
    }, [workflowType, parallelParticipants.length, selectedParallelSignerId]);

    const selectedAreaForSheet = useMemo(
        () => (selectedAreaId ? areas.find((a) => a.id === selectedAreaId) ?? null : null),
        [areas, selectedAreaId]
    );

    return (
        <>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2 md:px-4">
                        <input
                            ref={documentFileInputRef}
                            type="file"
                            accept="application/pdf"
                            className="sr-only"
                            disabled={submitting}
                            onChange={handleDocumentFileInputChange}
                        />
                        {!documentFile ? (
                            <span className="text-sm text-muted-foreground">
                                {t("signingRequests.create.addDocumentHintShort", "Upload a PDF to begin.")}
                            </span>
                        ) : (
                            <span className="max-w-[min(100%,min(28rem,calc(100vw-12rem)))] truncate text-sm font-medium">
                                {documentFile.name}
                            </span>
                        )}
                    </div>

                    {!documentFile ? (
                        <div className="flex min-h-[min(50vh,420px)] flex-1 flex-col p-4">
                            <button
                                type="button"
                                disabled={submitting}
                                aria-label={t("signingRequests.create.addDocument", "Add document")}
                                onClick={() => documentFileInputRef.current?.click()}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setDocumentDropActive(true);
                                }}
                                onDragEnter={(e) => {
                                    e.preventDefault();
                                    setDocumentDropActive(true);
                                }}
                                onDragLeave={() => setDocumentDropActive(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setDocumentDropActive(false);
                                    const f = e.dataTransfer.files?.[0];
                                    if (f) applyPdfFile(f);
                                }}
                                className={cn(
                                    "flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors",
                                    documentDropActive
                                        ? "border-primary bg-primary/5"
                                        : "border-muted-foreground/25 bg-muted/20 hover:border-muted-foreground/40",
                                    submitting && "pointer-events-none opacity-50"
                                )}
                            >
                                <FileUp className="mb-4 h-10 w-10 text-muted-foreground" aria-hidden />
                                <span className="text-base font-medium">
                                    {t("signingRequests.create.addDocument", "Add document")}
                                </span>
                                <span className="mt-2 text-sm text-muted-foreground">
                                    {t("signingRequests.create.addDocumentSub", "PDF only · click or drop a file")}
                                </span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex min-h-0 flex-1 flex-row overflow-hidden">
                            <PdfPageThumbnailsStrip
                                key={documentSessionId}
                                file={documentFile}
                                currentPage={currentPage}
                                onSelectPage={setCurrentPage}
                                areas={areas}
                                orientation="vertical"
                            />
                            <div className="min-h-0 min-w-0 flex-1 overflow-auto p-3 md:p-4">
                                {!drawingEnabled ? (
                                    <p className="mb-3 rounded-md border border-dashed border-border/80 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                                        {t(
                                            "signingRequests.create.selectWorkflowBeforeDraw",
                                            "Select a workflow in the envelope panel before drawing signature areas."
                                        )}
                                    </p>
                                ) : (
                                    <p className="mb-3 text-xs text-muted-foreground">
                                        {workflowType === "bulk"
                                            ? t(
                                                "signingRequests.create.drawAreasHintBulk",
                                                "Click and drag on the page to add signature areas. Recipients are added in the envelope panel; every area applies to each recipient. Click an area to configure the Signaturit field; drag corners to resize."
                                            )
                                            : t(
                                                "signingRequests.create.drawAreasHintParallel",
                                                "Add participants in the envelope panel, select a participant, then click and drag on the page to add signature areas for them. All areas for one participant share the same color. Click an area to configure the Signaturit field; drag corners to resize."
                                            )}
                                    </p>
                                )}
                                <div className="flex justify-center">
                                    <PdfMultiSignatureCanvas
                                        key={documentSessionId}
                                        file={documentFile}
                                        pageNumber={currentPage}
                                        areas={areas}
                                        setAreas={setAreas}
                                        selectedAreaId={selectedAreaId}
                                        onSelectArea={handleSelectArea}
                                        onDocumentLoaded={setPdfNumPages}
                                        maxRenderWidth={1100}
                                        drawingEnabled={drawingEnabled}
                                        colorMode={areaColorMode}
                                        parallelSignerColor={selectedParallelParticipant?.color ?? null}
                                        parallelSignerId={selectedParallelSignerId}
                                        parallelDrawBlockedReason={parallelDrawBlockedReason}
                                        onPageBitmapSize={handlePageBitmapSize}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <SigningRequestSignatureAreaFieldSheet
                open={fieldSheetOpen && selectedAreaForSheet !== null}
                onOpenChange={setFieldSheetOpen}
                area={selectedAreaForSheet}
                pageLabel={selectedAreaForSheet?.page ?? 1}
                allAreas={areas}
                onChange={handleSignaturitFieldChange}
                onAddRadioGroupMember={handleAddRadioGroupMember}
            />

            <SigningRequestRecipientAddModal
                open={recipientModalOpen}
                onOpenChange={setRecipientModalOpen}
                orgId={orgId}
                onConfirm={handleRecipientModalConfirm}
                disableGroupTab={workflowType === "parallel"}
                title={
                    workflowType === "parallel"
                        ? t("signingRequests.create.parallelAddParticipantTitle", "Add participant")
                        : undefined
                }
                description={
                    workflowType === "parallel"
                        ? t(
                            "signingRequests.create.parallelAddParticipantDesc",
                            "Select a participant, then draw their signature areas on the document. You can add several areas per person."
                        )
                        : undefined
                }
                confirmLabel={
                    workflowType === "parallel"
                        ? t("signingRequests.create.parallelAddParticipantConfirm", "Add participant")
                        : undefined
                }
            />
        </>
    );
});

export default SigningRequestCreateEditor;
