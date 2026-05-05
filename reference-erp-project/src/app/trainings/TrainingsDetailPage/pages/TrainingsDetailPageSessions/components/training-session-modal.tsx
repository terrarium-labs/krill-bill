import { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { Loader2, Plus, Upload, File, Info } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
    postTrainingSession,
    patchTrainingSession,
    postTrainingSessionMaterial,
    patchTrainingSessionMaterial,
    deleteTrainingSessionMaterial,
} from "@/api/trainings/sessions";
import type {
    TrainingSession,
    TrainingSessionMaterial,
} from "@/types/trainings/trainings";

import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
    Tabs,
    TabsContent,
    TabsContents,
    TabsList,
    TabsTrigger,
} from "@/components/ui/shadcn-io/tabs";
import { promptUnsavedChanges } from "@/app/components/forms-elements/modal-unsaved";
import { DateTimePicker } from "@/app/components/forms-elements/date-time-picker";
import { NewsEditor } from "@/components/ui/news-editor";
import TrainingSessionMaterialRow from "./training-session-material-row";

const formSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    content: z.string().optional(),
    order: z.string().min(1, "Order is required"),
    is_visible: z.boolean(),
    is_required: z.boolean(),
    date: z.date().optional().nullable(),
    duration_minutes: z.string().optional(),
    location: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TrainingSessionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved?: () => void;
    session?: TrainingSession | null;
    mode?: "create" | "edit";
    nextOrder?: number;
}

const TrainingSessionModal = ({
    open,
    onOpenChange,
    onSaved,
    session = null,
    mode = "create",
    nextOrder = 1,
}: TrainingSessionModalProps) => {
    const { t } = useTranslation();
    const { orgId, trainingId } = useParams<{
        orgId: string;
        trainingId: string;
    }>();
    const [isLoading, setIsLoading] = useState(false);
    const [materials, setMaterials] = useState<TrainingSessionMaterial[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [materialReadPatchId, setMaterialReadPatchId] = useState<
        string | null
    >(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            description: "",
            content: "",
            order: String(nextOrder),
            is_visible: true,
            is_required: true,
            date: null,
            duration_minutes: "",
            location: "",
        },
    });

    useEffect(() => {
        if (open && session && mode === "edit") {
            form.reset({
                title: session.title,
                description: session.description ?? "",
                content: session.content ?? "",
                order: String(session.order),
                is_visible: session.is_visible !== false,
                is_required: session.is_required,
                date: session.date ? new Date(session.date) : null,
                duration_minutes:
                    session.duration_minutes != null
                        ? String(session.duration_minutes)
                        : "",
                location: session.location ?? "",
            });
            setMaterials(session.materials ?? []);
        } else if (open && mode === "create") {
            form.reset({
                title: "",
                description: "",
                content: "",
                order: String(nextOrder),
                is_visible: true,
                is_required: true,
                date: null,
                duration_minutes: "",
                location: "",
            });
            setMaterials([]);
        }
    }, [open, session, mode, form, nextOrder]);

    const onSubmit = async (values: FormValues) => {
        if (!orgId || !trainingId) return;
        setIsLoading(true);
        try {
            const payload: Record<string, unknown> = {
                title: values.title,
                order: parseInt(values.order),
                is_visible: values.is_visible,
                is_required: values.is_required,
            };
            if (values.description?.trim())
                payload.description = values.description.trim();
            if (values.content?.trim()) payload.content = values.content;
            if (values.date)
                payload.date = values.date.toISOString().split("T")[0];
            if (values.duration_minutes?.trim()) {
                const parsed = parseInt(values.duration_minutes);
                if (!isNaN(parsed)) payload.duration_minutes = parsed;
            }
            if (values.location?.trim())
                payload.location = values.location.trim();

            const response =
                mode === "edit" && session
                    ? await patchTrainingSession(
                        orgId,
                        trainingId,
                        session.id,
                        payload
                    )
                    : await postTrainingSession(orgId, trainingId, payload);

            if (response.success) {
                toast.success(
                    mode === "edit"
                        ? t(
                            "trainings.sessions.updatedSuccess",
                            "Session updated successfully"
                        )
                        : t(
                            "trainings.sessions.createdSuccess",
                            "Session created successfully"
                        )
                );
                form.reset();
                onOpenChange(false);
                onSaved?.();
            } else {
                toast.error(
                    mode === "edit"
                        ? t(
                            "trainings.sessions.errorUpdating",
                            "Error updating session"
                        )
                        : t(
                            "trainings.sessions.errorCreating",
                            "Error creating session"
                        )
                );
            }
        } catch {
            toast.error(t("common.error", "An error occurred"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenChange = async (newOpen: boolean) => {
        if (!newOpen && form.formState.isDirty) {
            const discard = await promptUnsavedChanges();
            if (discard) {
                form.reset();
                onOpenChange(false);
            }
        } else {
            if (!newOpen) form.reset();
            onOpenChange(newOpen);
        }
    };

    const handleUpload = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file || !orgId || !trainingId || !session) return;

            const maxSize = 300 * 1024 * 1024;
            if (file.size > maxSize) {
                toast.error(
                    t(
                        "trainings.materials.fileTooLarge",
                        "File too large. Maximum allowed size is 300 MB."
                    )
                );
                return;
            }

            setIsUploading(true);
            try {
                const response = await postTrainingSessionMaterial(
                    orgId,
                    trainingId,
                    session.id,
                    file,
                    file.name
                );
                if (response.success) {
                    toast.success(
                        t(
                            "trainings.materials.uploadedSuccess",
                            "Material uploaded successfully"
                        )
                    );
                    const newMaterial = response.success.material;
                    if (newMaterial) {
                        setMaterials((prev) => [...prev, newMaterial]);
                    }
                } else {
                    toast.error(
                        t(
                            "trainings.materials.errorUploading",
                            "Error uploading material"
                        )
                    );
                }
            } catch {
                toast.error(t("common.error", "An error occurred"));
            } finally {
                setIsUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        },
        [orgId, trainingId, session, t]
    );

    const handleDeleteMaterial = useCallback(
        async (material: TrainingSessionMaterial) => {
            if (!orgId || !trainingId || !session) return;
            try {
                const response = await deleteTrainingSessionMaterial(
                    orgId,
                    trainingId,
                    session.id,
                    material.id
                );
                if (response.success) {
                    toast.success(
                        t("trainings.materials.deletedSuccess", "Material deleted")
                    );
                    setMaterials((prev) =>
                        prev.filter((m) => m.id !== material.id)
                    );
                } else {
                    toast.error(
                        t(
                            "trainings.materials.errorDeleting",
                            "Error deleting material"
                        )
                    );
                }
            } catch {
                toast.error(t("common.error", "An error occurred"));
            }
        },
        [orgId, trainingId, session, t]
    );

    const handleMaterialReadRequired = useCallback(
        async (material: TrainingSessionMaterial, read_required: boolean) => {
            if (!orgId || !trainingId || !session) return;
            setMaterialReadPatchId(material.id);
            try {
                const response = await patchTrainingSessionMaterial(
                    orgId,
                    trainingId,
                    session.id,
                    material.id,
                    { read_required }
                );
                if (response.success) {
                    setMaterials((prev) =>
                        prev.map((m) =>
                            m.id === material.id ? { ...m, read_required } : m
                        )
                    );
                } else {
                    toast.error(
                        t(
                            "trainings.materials.errorUpdating",
                            "Error updating material"
                        )
                    );
                }
            } catch {
                toast.error(t("common.error", "An error occurred"));
            } finally {
                setMaterialReadPatchId(null);
            }
        },
        [orgId, trainingId, session, t]
    );

    const isEditMode = mode === "edit" && session;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="sm:max-w-3xl flex h-[85vh] flex-col gap-0 overflow-hidden p-0"
                showCloseButton={false}
            >
                <Tabs
                    defaultValue="details"
                    className="flex min-h-0 flex-1 flex-col gap-0"
                >
                    <div className="shrink-0 space-y-3 px-6 pt-6 pb-3">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-semibold">
                                {mode === "edit"
                                    ? t(
                                        "trainings.sessions.editSession",
                                        "Edit Session"
                                    )
                                    : t(
                                        "trainings.sessions.newSession",
                                        "New Session"
                                    )}
                            </DialogTitle>
                        </DialogHeader>

                        <TabsList
                            className="w-full justify-start border-b-2 border-border bg-background"
                            activeClassName="border-b-2 border-primary -mb-1.5"
                            transition={{ duration: 0 }}
                        >
                            <TabsTrigger className="py-0" value="details">
                                {t("trainings.sessions.modal.details", "Details")}
                            </TabsTrigger>
                            <TabsTrigger className="py-0" value="content">
                                {t("trainings.sessions.modal.content", "Content")}
                            </TabsTrigger>
                            {isEditMode && (
                                <TabsTrigger className="py-0" value="materials">
                                    {t(
                                        "trainings.sessions.modal.materials",
                                        "Materials"
                                    )}
                                    {materials.length > 0 && (
                                        <Badge
                                            variant="secondary"
                                            className="ml-2 tabular-nums text-xs"
                                        >
                                            {materials.length}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                            )}
                        </TabsList>
                    </div>

                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="flex min-h-0 flex-1 flex-col overflow-hidden"
                        >
                            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                                <TabsContents className="min-h-0 py-0 px-1">
                                    <TabsContent
                                        value="details"
                                        className="mt-0 gap-0 space-y-4"
                                    >
                                        {mode === "create" && (
                                            <Alert className="border-muted-foreground/20 bg-muted/30">
                                                <Info className="size-4" />
                                                <AlertDescription className="text-xs text-muted-foreground">
                                                    {t(
                                                        "trainings.sessions.createMaterialsHint",
                                                        "After you save, edit this session to upload materials (PDFs, slides, and other files)."
                                                    )}
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        <FormField
                                            control={form.control}
                                            name="title"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {t(
                                                            "trainings.sessions.fields.title",
                                                            "Title"
                                                        )}{" "}
                                                        *
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder={t(
                                                                "trainings.sessions.fields.titlePlaceholder",
                                                                "e.g. Introduction to Fire Safety"
                                                            )}
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="description"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {t(
                                                            "trainings.sessions.fields.description",
                                                            "Description"
                                                        )}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder={t(
                                                                "trainings.sessions.fields.descriptionPlaceholder",
                                                                "Optional description..."
                                                            )}
                                                            rows={3}
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-2 gap-4 items-start">
                                            <FormField
                                                control={form.control}
                                                name="order"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            {t(
                                                                "trainings.sessions.fields.order",
                                                                "Order"
                                                            )}{" "}
                                                            *
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormDescription className="text-xs">
                                                            {t(
                                                                "trainings.sessions.fields.orderDescription",
                                                                "Lower numbers appear first in the training sequence."
                                                            )}
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="duration_minutes"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            {t(
                                                                "trainings.sessions.fields.durationMinutes",
                                                                "Duration (minutes)"
                                                            )}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                placeholder={t(
                                                                    "trainings.fields.optional",
                                                                    "Optional"
                                                                )}
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <DateTimePicker
                                            form={form}
                                            name="date"
                                            label={t(
                                                "trainings.sessions.fields.date",
                                                "Date"
                                            )}
                                            showTime={false}
                                            placeholder={t(
                                                "trainings.fields.selectDate",
                                                "Select date"
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="location"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {t(
                                                            "trainings.sessions.fields.location",
                                                            "Location"
                                                        )}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder={t(
                                                                "trainings.sessions.fields.locationPlaceholder",
                                                                "e.g. Room 101 or https://meet.example.com"
                                                            )}
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
                                            <FormField
                                                control={form.control}
                                                name="is_visible"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-0">
                                                        <div className="flex items-start gap-3">
                                                            <FormControl>
                                                                <Switch
                                                                    className="mt-0.5 shrink-0"
                                                                    checked={
                                                                        field.value
                                                                    }
                                                                    onCheckedChange={
                                                                        field.onChange
                                                                    }
                                                                />
                                                            </FormControl>
                                                            <div className="min-w-0 flex-1 space-y-1.5">
                                                                <FormLabel className="mt-0! block cursor-pointer text-sm font-medium leading-snug">
                                                                    {t(
                                                                        "trainings.sessions.fields.visible",
                                                                        "Visible to learners"
                                                                    )}
                                                                </FormLabel>
                                                                <FormDescription className="text-xs leading-relaxed text-muted-foreground">
                                                                    {t(
                                                                        "trainings.sessions.fields.visibleDescription",
                                                                        "Turn off to hide this session from learners until you are ready to publish it."
                                                                    )}
                                                                </FormDescription>
                                                            </div>
                                                        </div>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
                                            <FormField
                                                control={form.control}
                                                name="is_required"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-0">
                                                        <div className="flex items-start gap-3">
                                                            <FormControl>
                                                                <Switch
                                                                    className="mt-0.5 shrink-0"
                                                                    checked={
                                                                        field.value
                                                                    }
                                                                    onCheckedChange={
                                                                        field.onChange
                                                                    }
                                                                />
                                                            </FormControl>
                                                            <div className="min-w-0 flex-1 space-y-1.5">
                                                                <FormLabel className="mt-0! block cursor-pointer text-sm font-medium leading-snug">
                                                                    {t(
                                                                        "trainings.sessions.fields.isRequired",
                                                                        "Required to complete training"
                                                                    )}
                                                                </FormLabel>
                                                                <FormDescription className="text-xs leading-relaxed text-muted-foreground">
                                                                    {t(
                                                                        "trainings.sessions.fields.isRequiredDescription",
                                                                        "Turn off if learners may finish the training without completing this session."
                                                                    )}
                                                                </FormDescription>
                                                            </div>
                                                        </div>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </TabsContent>

                                    <TabsContent
                                        value="content"
                                        className="mt-0 gap-0"
                                    >
                                        <FormField
                                            control={form.control}
                                            name="content"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {t(
                                                            "trainings.sessions.fields.content",
                                                            "Content"
                                                        )}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <NewsEditor
                                                            content={
                                                                field.value ?? ""
                                                            }
                                                            onChange={
                                                                field.onChange
                                                            }
                                                            placeholder={t(
                                                                "trainings.sessions.fields.contentPlaceholder",
                                                                "Write the session content here..."
                                                            )}
                                                            className="min-h-[400px]"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </TabsContent>

                                    {isEditMode && (
                                        <TabsContent
                                            value="materials"
                                            className="mt-0 gap-0 space-y-4"
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm text-muted-foreground">
                                                    {t(
                                                        "trainings.sessions.materials.description",
                                                        "Upload PDFs, slides, or documents for this session."
                                                    )}
                                                </p>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        fileInputRef.current?.click()
                                                    }
                                                    disabled={isUploading}
                                                >
                                                    {isUploading ? (
                                                        <>
                                                            <Upload className="h-3.5 w-3.5 mr-1 animate-pulse" />
                                                            {t(
                                                                "trainings.materials.uploading",
                                                                "Uploading..."
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus className="h-3.5 w-3.5 mr-1" />
                                                            {t(
                                                                "trainings.materials.upload",
                                                                "Upload Material"
                                                            )}
                                                        </>
                                                    )}
                                                </Button>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv"
                                                    className="hidden"
                                                    onChange={handleUpload}
                                                />
                                            </div>

                                            {materials.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-32 gap-2 text-center rounded-lg border border-dashed border-border">
                                                    <File className="h-6 w-6 text-muted-foreground" />
                                                    <p className="text-sm text-muted-foreground">
                                                        {t(
                                                            "trainings.materials.empty.title",
                                                            "No materials yet"
                                                        )}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="rounded-lg border border-border divide-y divide-border">
                                                    {materials.map((material) => (
                                                        <TrainingSessionMaterialRow
                                                            key={material.id}
                                                            material={material}
                                                            variant="edit"
                                                            onDownload={() =>
                                                                window.open(
                                                                    material.file_url,
                                                                    "_blank"
                                                                )
                                                            }
                                                            onDelete={() =>
                                                                handleDeleteMaterial(
                                                                    material
                                                                )
                                                            }
                                                            onReadRequiredChange={(
                                                                v
                                                            ) =>
                                                                handleMaterialReadRequired(
                                                                    material,
                                                                    v
                                                                )
                                                            }
                                                            readPatching={
                                                                materialReadPatchId ===
                                                                material.id
                                                            }
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </TabsContent>
                                    )}
                                </TabsContents>
                            </div>

                            <DialogFooter className="shrink-0 gap-2 bg-background px-6 py-4 sm:justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleOpenChange(false)}
                                    disabled={isLoading}
                                >
                                    {t("common.cancel", "Cancel")}
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {mode === "edit"
                                                ? t(
                                                    "trainings.sessions.updating",
                                                    "Updating..."
                                                )
                                                : t(
                                                    "trainings.sessions.creating",
                                                    "Creating..."
                                                )}
                                        </>
                                    ) : mode === "edit" ? (
                                        t(
                                            "trainings.sessions.updateSession",
                                            "Update Session"
                                        )
                                    ) : (
                                        t(
                                            "trainings.sessions.createSession",
                                            "Create Session"
                                        )
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default TrainingSessionModal;
