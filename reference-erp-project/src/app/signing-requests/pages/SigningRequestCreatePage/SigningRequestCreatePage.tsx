import { useRef, useState } from "react";
import { promptUnsavedChanges } from "@/app/components/forms-elements/modal-unsaved";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { Loader2, Mail, Plus, Send, Trash2, Upload, User, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import PageHeader from "@/app/components/page-header";
import SigningRequestCreateEditor, {
    type SigningRequestCreateEditorHandle,
    type SigningRequestCreateEditorState,
} from "./components/signing-request-create-editor";

const SigningRequestCreatePage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { orgId } = useParams<{ orgId: string }>();

    const editorRef = useRef<SigningRequestCreateEditorHandle>(null);
    const [editorState, setEditorState] = useState<SigningRequestCreateEditorState>({
        canSubmit: false,
        submitting: false,
        hasDocument: false,
        areasCount: 0,
        pdfNumPages: 0,
        signers: [],
        selectedParallelSignerId: null,
    });

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [workflowType, setWorkflowType] = useState<"parallel" | "bulk" | null>(null);
    const [expireTimeDays, setExpireTimeDays] = useState(30);
    const [remindersInput, setRemindersInput] = useState("");

    const handleWorkflowChange = async (value: "parallel" | "bulk") => {
        if (workflowType !== null && workflowType !== value && editorState.areasCount > 0) {
            const discard = await promptUnsavedChanges();
            if (!discard) return;
            editorRef.current?.clearSignatureDraft();
        }
        setWorkflowType(value);
    };

    const backToList = () => {
        navigate(orgId ? `/${orgId}/signing-requests` : "..");
    };

    const disabledFields = editorState.submitting;

    return (
        <div className="mx-auto flex min-h-0 w-full max-w-[1800px] flex-1 flex-col px-4 pb-8 pt-6 md:px-6">
            <PageHeader
                title={t("signingRequests.create.title", "Create signing request")}
                description={t(
                    "signingRequests.create.pageHeaderSubtitle",
                    "Add envelope details, upload a PDF, then draw signature areas."
                )}
                showBackButton
                onBack={backToList}
                action={
                    <div className="flex shrink-0 items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={!editorState.hasDocument || editorState.submitting}
                            onClick={() => editorRef.current?.openReplaceDocument()}
                        >
                            <Upload className="mr-2 h-4 w-4" aria-hidden />
                            {t("signingRequests.create.replaceDocument", "Replace")}
                        </Button>
                        <Button
                            type="submit"
                            form="signing-request-create-form"
                            disabled={!editorState.canSubmit}
                        >
                            {editorState.submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t("common.saving", "Saving…")}
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" aria-hidden />
                                    {t("signingRequests.create.sendRequest", "Send request")}
                                </>
                            )}
                        </Button>
                    </div>
                }
            />

            <form
                id="signing-request-create-form"
                className="mt-5 flex min-h-0 flex-1 flex-col gap-0 lg:min-h-0 lg:flex-row"
                onSubmit={(e) => {
                    e.preventDefault();
                    editorRef.current?.submit();
                }}
            >
                <section
                    aria-label={t("signingRequests.create.envelopeDetailsHeading", "Envelope details")}
                    className="flex shrink-0 flex-col gap-5 border-b border-border/70 pb-6 lg:w-[min(100%,20rem)] lg:max-w-sm lg:shrink-0 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6 xl:w-80"
                >
                    <div className="space-y-2">
                        <Label htmlFor="sr-workflow">{t("signingRequests.workflowType", "Workflow")}</Label>
                        <Select
                            value={workflowType ?? undefined}
                            onValueChange={(v) => {
                                void handleWorkflowChange(v as "parallel" | "bulk");
                            }}
                            disabled={disabledFields}
                        >
                            <SelectTrigger id="sr-workflow" className="h-10 w-full">
                                <SelectValue
                                    placeholder={t(
                                        "signingRequests.create.workflowPlaceholder",
                                        "Select workflow"
                                    )}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="parallel">
                                    {t("signingRequests.workflow.parallel", "Parallel")}
                                </SelectItem>
                                <SelectItem value="bulk">
                                    {t("signingRequests.workflow.bulk", "Bulk")}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <div
                            className="space-y-2 border-t border-border/60 pt-3 text-xs leading-relaxed text-muted-foreground"
                            role="note"
                        >
                            <p>
                                <span className="font-medium text-foreground/90">
                                    {t("signingRequests.workflow.parallel", "Parallel")}
                                    {": "}
                                </span>
                                {t(
                                    "signingRequests.create.workflowHelpParallel",
                                    "Uses one original document: every signature is collected on that same request."
                                )}
                            </p>
                            <p>
                                <span className="font-medium text-foreground/90">
                                    {t("signingRequests.workflow.bulk", "Bulk")}
                                    {": "}
                                </span>
                                {t(
                                    "signingRequests.create.workflowHelpBulk",
                                    "Each signer gets their own individual signing request (separate envelopes per recipient)."
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sr-name">{t("common.name", "Name")} *</Label>
                        <Input
                            id="sr-name"
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t(
                                "signingRequests.create.namePlaceholder",
                                "e.g. Employment contract"
                            )}
                            disabled={disabledFields}
                            className="h-10"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sr-desc">{t("common.description", "Description")}</Label>
                        <Textarea
                            id="sr-desc"
                            name="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            placeholder={t("signingRequests.create.descriptionPlaceholder", "Optional")}
                            disabled={disabledFields}
                            className="min-h-[6rem] resize-y"
                        />
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="sr-expire-time">
                                {t("signingRequests.create.expireTimeLabel", "Expiration (days)")}
                            </Label>
                            <Input
                                id="sr-expire-time"
                                name="expire_time"
                                type="number"
                                min={1}
                                step={1}
                                value={expireTimeDays}
                                onChange={(e) => {
                                    const v = e.target.valueAsNumber;
                                    if (Number.isFinite(v) && v >= 1) {
                                        setExpireTimeDays(Math.floor(v));
                                    }
                                }}
                                disabled={disabledFields}
                                className="h-10"
                            />
                            <p className="text-xs text-muted-foreground">
                                {t(
                                    "signingRequests.create.expireTimeHint",
                                    "Number of days until the signing request expires."
                                )}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sr-reminders">
                                {t("signingRequests.create.remindersLabel", "Reminders (days)")}
                            </Label>
                            <Input
                                id="sr-reminders"
                                name="reminders"
                                value={remindersInput}
                                onChange={(e) => setRemindersInput(e.target.value)}
                                placeholder={t(
                                    "signingRequests.create.remindersPlaceholder",
                                    "e.g. 3 or 3, 7, 14 — leave empty to skip"
                                )}
                                disabled={disabledFields}
                                className="h-10"
                                inputMode="decimal"
                                autoComplete="off"
                            />
                            <p className="text-xs text-muted-foreground">
                                {t(
                                    "signingRequests.create.remindersHint",
                                    "Days to wait before each automatic reminder. Use one number or comma-separated values. Set to 0 to disable reminders."
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label id="sr-signers-heading" className="text-sm font-medium">
                            {t("signingRequests.create.signersHeading", "Signers")}
                        </Label>
                        {!editorState.hasDocument ? (
                            <p
                                className="rounded-md border border-dashed border-border/70 bg-muted/20 px-2.5 py-2 text-xs leading-relaxed text-muted-foreground"
                            >
                                {t(
                                    "signingRequests.create.signersEmptyNoDoc",
                                    "Upload a PDF and select the workflow type to assign signers."
                                )}
                            </p>
                        ) : workflowType === "parallel" ? (
                            <div className="space-y-2">
                                {editorState.signers.length === 0 ? (
                                    <p
                                        className="rounded-md border border-dashed border-border/70 bg-muted/20 px-2.5 py-2 text-xs leading-relaxed text-muted-foreground"
                                    >
                                        {t(
                                            "signingRequests.create.parallelSignersEmpty",
                                            "Add participants, select one, then draw their signature areas on the document."
                                        )}
                                    </p>
                                ) : null}
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    disabled={disabledFields}
                                    onClick={() => editorRef.current?.openRecipientAddModal()}
                                >
                                    <Plus className="mr-2 h-4 w-4" aria-hidden />
                                    {t("signingRequests.create.addParticipant", "Add participant")}
                                </Button>
                                {editorState.signers.length > 0 ? (
                                    <ul
                                        className="max-h-[min(40vh,16rem)] space-y-1.5 overflow-y-auto"
                                        aria-labelledby="sr-signers-heading"
                                    >
                                        {editorState.signers.map((s) => (
                                            <li
                                                key={s.key}
                                                className={cn(
                                                    "flex overflow-hidden rounded-md text-xs",
                                                    s.isParallelParticipant &&
                                                        "cursor-pointer transition-colors",
                                                    s.isParallelParticipant && s.isSelected
                                                        ? "bg-secondary shadow-none border-0"
                                                        : "border border-border/50 bg-background/80 shadow-none hover:bg-muted/40"
                                                )}
                                                role={s.isParallelParticipant ? "button" : undefined}
                                                tabIndex={s.isParallelParticipant ? 0 : undefined}
                                                onClick={() => {
                                                    if (!s.isParallelParticipant) return;
                                                    const id = s.key.slice("parallel:".length);
                                                    editorRef.current?.selectParallelSigner(id);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (!s.isParallelParticipant) return;
                                                    if (e.key === "Enter" || e.key === " ") {
                                                        e.preventDefault();
                                                        const id = s.key.slice("parallel:".length);
                                                        editorRef.current?.selectParallelSigner(id);
                                                    }
                                                }}
                                            >
                                                <div
                                                    className="w-1 shrink-0 self-stretch min-h-[2.75rem]"
                                                    style={{ backgroundColor: s.areaColor }}
                                                    aria-hidden
                                                />
                                                <div className="flex min-w-0 flex-1 items-start gap-1.5 py-1.5 pl-2 pr-1">
                                                    <span
                                                        className="mt-0.5 shrink-0"
                                                        style={{ color: s.areaColor }}
                                                        title={
                                                            s.target === "email"
                                                                ? t("common.email", "Email")
                                                                : t("common.entities.employee", "Employee")
                                                        }
                                                    >
                                                        {s.target === "email" ? (
                                                            <Mail className="h-3.5 w-3.5 opacity-90" aria-hidden />
                                                        ) : (
                                                            <User className="h-3.5 w-3.5 opacity-90" aria-hidden />
                                                        )}
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                                            {t(
                                                                "signingRequests.create.parallelParticipantMeta",
                                                                "Participant {{n}} · {{count}} signature areas",
                                                                {
                                                                    n: s.areaIndex,
                                                                    count: s.areaCount ?? 0,
                                                                }
                                                            )}
                                                        </span>
                                                        <span className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                                                            <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                                                                {s.label ??
                                                                    t(
                                                                        "signingRequests.create.signerLabelPending",
                                                                        "Selected"
                                                                    )}
                                                            </span>
                                                            <span
                                                                className="shrink-0 tabular-nums text-muted-foreground"
                                                                aria-label={
                                                                    (s.areaCount ?? 0) === 0
                                                                        ? t(
                                                                            "signingRequests.create.parallelNoAreasYet",
                                                                            "No areas yet"
                                                                        )
                                                                        : editorState.pdfNumPages > 1
                                                                        ? t(
                                                                            "signingRequests.create.parallelPagesAria",
                                                                            "Signature areas on pages {{pages}}",
                                                                            {
                                                                                pages:
                                                                                    (s.parallelPages ?? [])
                                                                                        .join(", ") ||
                                                                                    String(s.page),
                                                                            }
                                                                        )
                                                                        : t(
                                                                            "signingRequests.create.signerRowPageAria",
                                                                            "Page {{page}}",
                                                                            { page: s.page }
                                                                        )
                                                                }
                                                            >
                                                                {(s.areaCount ?? 0) === 0
                                                                    ? t(
                                                                        "signingRequests.create.parallelNoAreasYet",
                                                                        "No areas yet"
                                                                    )
                                                                    : editorState.pdfNumPages > 1
                                                                    ? t(
                                                                        "signingRequests.create.parallelPagesSuffix",
                                                                        "(pages {{pages}})",
                                                                        {
                                                                            pages: (
                                                                                s.parallelPages ?? []
                                                                            ).join(", "),
                                                                        }
                                                                    )
                                                                    : null}
                                                            </span>
                                                        </span>
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                                                        disabled={disabledFields}
                                                        aria-label={t(
                                                            "signingRequests.create.removeSignerFromList",
                                                            "Remove signer"
                                                        )}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            editorRef.current?.removeSigner(s.key);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" aria-hidden />
                                                    </Button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}
                            </div>
                        ) : workflowType === "bulk" ? (
                            <div className="space-y-2">
                                {editorState.signers.length === 0 ? (
                                    <p
                                        className="rounded-md border border-dashed border-border/70 bg-muted/20 px-2.5 py-2 text-xs leading-relaxed text-muted-foreground"
                                    >
                                        {t(
                                            "signingRequests.create.bulkSignersEmpty",
                                            "Add one or more recipients. Each signature area will apply to every recipient."
                                        )}
                                    </p>
                                ) : null}
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    disabled={disabledFields}
                                    onClick={() => editorRef.current?.openRecipientAddModal()}
                                >
                                    <Plus className="mr-2 h-4 w-4" aria-hidden />
                                    {t("signingRequests.create.addRecipient", "Add recipient")}
                                </Button>
                                {editorState.signers.length > 0 ? (
                                <ul
                                    className="max-h-[min(40vh,16rem)] space-y-1.5 overflow-y-auto"
                                    aria-labelledby="sr-signers-heading"
                                >
                                    {editorState.signers.map((s) => (
                                        <li
                                            key={s.key}
                                            className="flex overflow-hidden rounded-md border border-border/50 bg-background/80 text-xs shadow-none"
                                        >
                                            <div
                                                className="w-1 shrink-0 self-stretch min-h-[2.75rem]"
                                                style={{ backgroundColor: s.areaColor }}
                                                aria-hidden
                                            />
                                            <div className="flex min-w-0 flex-1 items-start gap-1.5 py-1.5 pl-2 pr-1">
                                                <span
                                                    className="mt-0.5 shrink-0"
                                                    style={{ color: s.areaColor }}
                                                    title={
                                                        s.target === "email"
                                                            ? t("common.email", "Email")
                                                            : s.target === "employee"
                                                        ? t("common.entities.employee", "Employee")
                                                        : t("common.entities.group", "Group")
                                                    }
                                                >
                                                    {s.target === "email" ? (
                                                        <Mail className="h-3.5 w-3.5 opacity-90" aria-hidden />
                                                    ) : s.target === "employee" ? (
                                                        <User className="h-3.5 w-3.5 opacity-90" aria-hidden />
                                                    ) : (
                                                        <UsersRound className="h-3.5 w-3.5 opacity-90" aria-hidden />
                                                    )}
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                                        {s.isBulkRecipient
                                                            ? t(
                                                            "signingRequests.create.bulkRecipientMeta",
                                                            "Recipient {{n}}",
                                                            { n: s.signatureIndex }
                                                        )
                                                            : t(
                                                            "signingRequests.create.signerRowAreaMeta",
                                                            "Signature area {{area}} · Signer {{n}}",
                                                            { area: s.areaIndex, n: s.signatureIndex }
                                                        )}
                                                    </span>
                                                    <span className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                                                        <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                                                            {s.hasSelection
                                                                ? s.label ??
                                                                  t(
                                                                      "signingRequests.create.signerLabelPending",
                                                                      "Selected"
                                                                  )
                                                                : t(
                                                                      "signingRequests.create.signerNotSelected",
                                                                      "Not selected"
                                                                  )}
                                                        </span>
                                                        <span
                                                            className="shrink-0 tabular-nums text-muted-foreground"
                                                            aria-label={
                                                                s.isBulkRecipient
                                                                    ? t(
                                                                        "signingRequests.create.bulkAllAreasAria",
                                                                        "Applies to all signature areas"
                                                                    )
                                                                    : t(
                                                                        "signingRequests.create.signerRowPageAria",
                                                                        "Page {{page}}",
                                                                        { page: s.page }
                                                                    )
                                                            }
                                                        >
                                                            {s.isBulkRecipient
                                                                ? t(
                                                                "signingRequests.create.bulkAllAreas",
                                                                "All areas"
                                                            )
                                                                : t(
                                                                "signingRequests.create.signerRowPageSuffix",
                                                                "(page {{page}})",
                                                                { page: s.page }
                                                            )}
                                                        </span>
                                                    </span>
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                                                    disabled={disabledFields}
                                                    aria-label={t(
                                                        "signingRequests.create.removeSignerFromList",
                                                        "Remove signer"
                                                    )}
                                                    onClick={() =>
                                                        editorRef.current?.removeSigner(s.key)
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4" aria-hidden />
                                                </Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                ) : null}
                            </div>
                        ) : (
                            <p
                                className="rounded-md border border-dashed border-border/70 bg-muted/20 px-2.5 py-2 text-xs leading-relaxed text-muted-foreground"
                            >
                                {t(
                                    "signingRequests.create.signersEmptyNoWorkflow",
                                    "Select a workflow to assign signers."
                                )}
                            </p>
                        )}
                    </div>
                </section>

                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pt-6 lg:min-h-0 lg:flex-1 lg:pl-6 lg:pt-0">
                    <SigningRequestCreateEditor
                        ref={editorRef}
                        name={name}
                        description={description}
                        workflowType={workflowType}
                        expireTimeDays={expireTimeDays}
                        remindersInput={remindersInput}
                        onSuccess={() => backToList()}
                        onStateChange={setEditorState}
                    />
                </div>
            </form>
        </div>
    );
};

export default SigningRequestCreatePage;
