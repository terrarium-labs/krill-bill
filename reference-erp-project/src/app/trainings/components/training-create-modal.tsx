import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { postTraining, patchTraining } from "@/api/trainings/trainings";
import { getTrainingCategoriesForMultiSelect } from "@/api/trainings/categories";
import type {
    Training,
    TrainingDeliveryType,
    TrainingStatus,
} from "@/types/trainings/trainings";
import { MultiSelectApi } from "@/app/components/forms-elements/multi-select-api";
import Tag from "@/app/components/tag/tag";
import {
    DELIVERY_TYPE_META,
    TRAINING_STATUS_META,
    TRAINING_DELIVERY_IDS,
    TRAINING_STATUS_IDS,
} from "@/app/trainings/training-field-meta";
import {
    getTrainingCategoriesDisplay,
    getTrainingCategoryIds,
    getTrainingDeliveryTypes,
    getTrainingStatuses,
} from "@/app/trainings/training-normalize";

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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsContents,
    TabsList,
    TabsTrigger,
} from "@/components/ui/shadcn-io/tabs";
import { promptUnsavedChanges } from "@/app/components/forms-elements/modal-unsaved";
import { DateTimePicker } from "@/app/components/forms-elements/date-time-picker";
async function fetchTrainingDeliveryTypeOptions(
    ..._args: unknown[]
): Promise<{
    success: { items: { id: TrainingDeliveryType }[]; next_page_token: null };
}> {
    return {
        success: {
            items: TRAINING_DELIVERY_IDS.map((id) => ({ id })),
            next_page_token: null,
        },
    };
}

async function fetchTrainingStatusOptions(
    ..._args: unknown[]
): Promise<{ success: { items: { id: TrainingStatus }[]; next_page_token: null } }> {
    return {
        success: {
            items: TRAINING_STATUS_IDS.map((id) => ({ id })),
            next_page_token: null,
        },
    };
}

const formSchema = z
    .object({
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        category_ids: z.array(z.string()),
        delivery_type: z.enum(["online", "in_person", "hybrid"]),
        status: z.enum([
            "draft",
            "scheduled",
            "in_progress",
            "completed",
            "cancelled",
        ]),
        visibility: z.enum(["public", "private"]),
        provider: z.string().optional(),
        location: z.string().optional(),
        start_date: z.date().optional().nullable(),
        end_date: z.date().optional().nullable(),
        duration_hours: z.string().optional(),
        is_mandatory: z.boolean(),
        max_participants: z.string().optional(),
        validity_months: z.string().optional(),
        learning_platform_url: z.string().optional(),
        cost_per_participant: z.string().optional(),
        budget: z.string().optional(),
        is_subsidized: z.boolean(),
        subsidized_by: z.string().optional(),
    })
    .refine(
        (data) => {
            if (data.end_date && data.start_date) {
                return data.end_date >= data.start_date;
            }
            return true;
        },
        {
            message: "End date must be on or after start date",
            path: ["end_date"],
        }
    );

type FormValues = z.infer<typeof formSchema>;

interface TrainingCreateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved?: () => void;
    training?: Training | null;
    mode?: "create" | "edit";
}

const TrainingCreateModal = ({
    open,
    onOpenChange,
    onSaved,
    training = null,
    mode = "create",
}: TrainingCreateModalProps) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            description: "",
            category_ids: [],
            delivery_type: "online",
            status: "draft",
            visibility: "public",
            provider: "",
            location: "",
            start_date: null,
            end_date: null,
            duration_hours: "",
            is_mandatory: false,
            max_participants: "",
            validity_months: "",
            learning_platform_url: "",
            cost_per_participant: "",
            budget: "",
            is_subsidized: false,
            subsidized_by: "",
        },
    });

    useEffect(() => {
        if (open && training && mode === "edit") {
            form.reset({
                title: training.title,
                description: training.description ?? "",
                category_ids: getTrainingCategoryIds(training),
                delivery_type: getTrainingDeliveryTypes(training)[0] ?? "online",
                status: getTrainingStatuses(training)[0] ?? "draft",
                visibility: training.visibility ?? "public",
                provider: training.provider ?? "",
                location: training.location ?? "",
                start_date: training.start_date
                    ? new Date(training.start_date)
                    : null,
                end_date: training.end_date
                    ? new Date(training.end_date)
                    : null,
                duration_hours:
                    training.duration_hours != null
                        ? training.duration_hours.toString()
                        : "",
                is_mandatory: training.is_mandatory,
                max_participants:
                    training.max_participants != null
                        ? training.max_participants.toString()
                        : "",
                validity_months:
                    training.validity_months != null
                        ? training.validity_months.toString()
                        : "",
                learning_platform_url:
                    training.learning_platform_url ?? "",
                cost_per_participant:
                    training.cost_per_participant != null
                        ? training.cost_per_participant.toString()
                        : "",
                budget:
                    training.budget != null
                        ? training.budget.toString()
                        : "",
                is_subsidized: training.is_subsidized ?? false,
                subsidized_by: training.subsidized_by ?? "",
            });
        } else if (open && mode === "create") {
            form.reset({
                title: "",
                description: "",
                category_ids: [],
                delivery_type: "online",
                status: "draft",
                visibility: "public",
                provider: "",
                location: "",
                start_date: null,
                end_date: null,
                duration_hours: "",
                is_mandatory: false,
                max_participants: "",
                validity_months: "",
                learning_platform_url: "",
                cost_per_participant: "",
                budget: "",
                is_subsidized: false,
                subsidized_by: "",
            });
        }
    }, [open, training, mode, form]);

    const onSubmit = async (values: FormValues) => {
        if (!orgId) return;
        setIsLoading(true);
        try {
            const payload: Record<string, unknown> = {
                title: values.title,
                visibility: values.visibility,
                is_mandatory: values.is_mandatory,
                is_subsidized: values.is_subsidized,
            };
            if (values.category_ids.length) {
                payload.category_ids = values.category_ids;
                payload.category_id = values.category_ids[0] ?? null;
            } else {
                payload.category_id = null;
            }
            payload.delivery_type = values.delivery_type;
            payload.status = values.status;
            if (values.description?.trim())
                payload.description = values.description.trim();
            if (values.provider?.trim())
                payload.provider = values.provider.trim();
            if (values.location?.trim())
                payload.location = values.location.trim();
            if (values.start_date)
                payload.start_date = values.start_date
                    .toISOString()
                    .split("T")[0];
            if (values.end_date)
                payload.end_date = values.end_date.toISOString().split("T")[0];
            if (values.duration_hours?.trim()) {
                const parsed = parseFloat(values.duration_hours);
                if (!isNaN(parsed)) payload.duration_hours = parsed;
            }
            if (values.max_participants?.trim()) {
                const parsed = parseInt(values.max_participants);
                if (!isNaN(parsed)) payload.max_participants = parsed;
            }
            if (values.validity_months?.trim()) {
                const parsed = parseInt(values.validity_months);
                if (!isNaN(parsed)) payload.validity_months = parsed;
            }
            if (values.learning_platform_url?.trim())
                payload.learning_platform_url =
                    values.learning_platform_url.trim();
            if (values.cost_per_participant?.trim()) {
                const parsed = parseFloat(values.cost_per_participant);
                if (!isNaN(parsed)) payload.cost_per_participant = parsed;
            }
            if (values.budget?.trim()) {
                const parsed = parseFloat(values.budget);
                if (!isNaN(parsed)) payload.budget = parsed;
            }
            if (values.subsidized_by?.trim())
                payload.subsidized_by = values.subsidized_by.trim();

            const response =
                mode === "edit" && training
                    ? await patchTraining(orgId, training.id, payload)
                    : await postTraining(orgId, payload);

            if (response.success) {
                toast.success(
                    mode === "edit"
                        ? t(
                            "trainings.updatedSuccess",
                            "Training updated successfully"
                        )
                        : t(
                            "trainings.createdSuccess",
                            "Training created successfully"
                        )
                );
                form.reset();
                onOpenChange(false);
                onSaved?.();
            } else {
                toast.error(
                    mode === "edit"
                        ? t("trainings.errorUpdating", "Error updating training")
                        : t("trainings.errorCreating", "Error creating training")
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

    const watchSubsidized = form.watch("is_subsidized");

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="sm:max-w-3xl flex h-[85vh] flex-col gap-0 overflow-hidden p-0"
                showCloseButton={false}
            >
                <Tabs
                    defaultValue="basic"
                    className="flex min-h-0 flex-1 flex-col gap-0"
                >
                    <div className="shrink-0 space-y-3 px-6 pt-6 pb-3">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-semibold">
                                {mode === "edit"
                                    ? t(
                                        "trainings.editTraining",
                                        "Edit Training"
                                    )
                                    : t(
                                        "trainings.newTraining",
                                        "New Training"
                                    )}
                            </DialogTitle>
                        </DialogHeader>

                        <TabsList
                            className="w-full justify-start border-b-2 border-border bg-background"
                            activeClassName="border-b-2 border-primary -mb-1.5"
                            transition={{ duration: 0 }}
                        >
                            <TabsTrigger className="py-0" value="basic">
                                {t("trainings.modal.basicInfo", "Basic Info")}
                            </TabsTrigger>
                            <TabsTrigger className="py-0" value="admin">
                                {t(
                                    "trainings.modal.administrative",
                                    "Administrative"
                                )}
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="flex min-h-0 flex-1 flex-col overflow-hidden"
                        >
                            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                                <div className="min-w-0 px-1">
                                <TabsContents className="min-h-0 px-1">
                                    <TabsContent
                                        value="basic"
                                        className="mt-0 gap-0 space-y-4"
                                    >
                                        <FormField
                                            control={form.control}
                                            name="title"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {t("trainings.fields.title", "Title")} *
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder={t(
                                                                "trainings.fields.titlePlaceholder",
                                                                "e.g. Fire Safety Training"
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
                                            name="visibility"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="sr-only">
                                                        {t("trainings.fields.visibility", "Visibility")}
                                                    </FormLabel>
                                                    <Card className="gap-0 border-border py-0 shadow-none">
                                                        <CardContent className="flex items-start justify-between gap-4 p-4">
                                                            <div className="min-w-0 flex-1 space-y-2">
                                                                <p className="text-sm font-medium leading-none">
                                                                    {t(
                                                                        "trainings.fields.visibility",
                                                                        "Visibility",
                                                                    )}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                                    {t(
                                                                        "trainings.visibility.cardIntro",
                                                                        "Control who is allowed to enroll in this training.",
                                                                    )}
                                                                </p>
                                                                <p className="text-xs leading-relaxed text-foreground/90">
                                                                    {field.value === "public"
                                                                        ? t(
                                                                            "trainings.visibility.cardDetailPublic",
                                                                            "Public: all users in your organization can enroll on their own.",
                                                                        )
                                                                        : t(
                                                                            "trainings.visibility.cardDetailPrivate",
                                                                            "Private: only users you invite can enroll; others will not see this training as available to join.",
                                                                        )}
                                                                </p>
                                                            </div>
                                                            <div className="flex shrink-0 flex-col items-start gap-2">
                                                                <span className="text-xs font-medium tabular-nums">
                                                                    {field.value === "public"
                                                                        ? t(
                                                                            "trainings.visibility.public",
                                                                            "Public",
                                                                        )
                                                                        : t(
                                                                            "trainings.visibility.private",
                                                                            "Private",
                                                                        )}
                                                                </span>
                                                                <FormControl>
                                                                    <Switch
                                                                        checked={field.value === "public"}
                                                                        onCheckedChange={(on) =>
                                                                            field.onChange(
                                                                                on ? "public" : "private",
                                                                            )
                                                                        }
                                                                        aria-label={t(
                                                                            "trainings.visibility.switchAria",
                                                                            "Toggle public enrollment",
                                                                        )}
                                                                    />
                                                                </FormControl>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
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
                                                        {t("trainings.fields.description", "Description")}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder={t(
                                                                "trainings.fields.descriptionPlaceholder",
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
                                                name="category_ids"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            {t("trainings.fields.category", "Category")}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <MultiSelectApi
                                                                fetchOptions={getTrainingCategoriesForMultiSelect}
                                                                fetchArgs={orgId ? [orgId] : []}
                                                                optionsKey="categories"
                                                                customValueKey={(item) => item.id}
                                                                customLabelKey={(item) => (
                                                                    <Tag
                                                                        text={item.name}
                                                                        color={item.color ?? undefined}
                                                                    />
                                                                )}
                                                                placeholder={t(
                                                                    "trainings.fields.selectCategories",
                                                                    "Select categories...",
                                                                )}
                                                                value={field.value}
                                                                onChangeValue={field.onChange}
                                                                defaultItems={
                                                                    training && mode === "edit"
                                                                        ? getTrainingCategoriesDisplay(training)
                                                                        : undefined
                                                                }
                                                                className="w-full"
                                                                isApiSearchable
                                                                disabled={!orgId}
                                                            />
                                                        </FormControl>
                                                        <FormDescription className="text-xs">
                                                            {t(
                                                                "trainings.hints.category",
                                                                "Optional. Groups this course with others for filters and reporting.",
                                                            )}
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="delivery_type"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            {t("trainings.fields.deliveryType", "Delivery Type")} *
                                                        </FormLabel>
                                                        <FormControl>
                                                            <MultiSelectApi
                                                                fetchOptions={fetchTrainingDeliveryTypeOptions}
                                                                fetchArgs={[]}
                                                                optionsKey="items"
                                                                customValueKey={(item) => item.id}
                                                                customLabelKey={(item: { id: TrainingDeliveryType }) => {
                                                                    const m = DELIVERY_TYPE_META[item.id];
                                                                    return (
                                                                        <Tag
                                                                            text={t(m.i18nKey, m.defaultLabel)}
                                                                            color={m.tagColor}
                                                                        />
                                                                    );
                                                                }}
                                                                placeholder={t(
                                                                    "trainings.fields.selectDeliveryType",
                                                                    "Select delivery type...",
                                                                )}
                                                                value={field.value ? [field.value] : []}
                                                                onChangeValue={(ids) =>
                                                                    field.onChange(
                                                                        (ids[0] as TrainingDeliveryType | undefined) ??
                                                                            "online",
                                                                    )
                                                                }
                                                                defaultItems={[{ id: field.value }]}
                                                                maxCount={1}
                                                                className="w-full"
                                                                isApiSearchable={false}
                                                            />
                                                        </FormControl>
                                                        <FormDescription className="text-xs">
                                                            {t(
                                                                "trainings.hints.deliveryType",
                                                                "Hybrid mixes remote and on-site; you can still set venue or link under Location.",
                                                            )}
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 items-start">
                                            <FormField
                                                control={form.control}
                                                name="status"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            {t("trainings.fields.status", "Status")} *
                                                        </FormLabel>
                                                        <FormControl>
                                                            <MultiSelectApi
                                                                fetchOptions={fetchTrainingStatusOptions}
                                                                fetchArgs={[]}
                                                                optionsKey="items"
                                                                customValueKey={(item) => item.id}
                                                                customLabelKey={(item: { id: TrainingStatus }) => {
                                                                    const m = TRAINING_STATUS_META[item.id];
                                                                    return (
                                                                        <Tag
                                                                            text={t(m.i18nKey, m.defaultLabel)}
                                                                            color={m.tagColor}
                                                                        />
                                                                    );
                                                                }}
                                                                placeholder={t(
                                                                    "trainings.fields.selectStatus",
                                                                    "Select status...",
                                                                )}
                                                                value={field.value ? [field.value] : []}
                                                                onChangeValue={(ids) =>
                                                                    field.onChange(
                                                                        (ids[0] as TrainingStatus | undefined) ??
                                                                            "draft",
                                                                    )
                                                                }
                                                                defaultItems={[{ id: field.value }]}
                                                                maxCount={1}
                                                                className="w-full"
                                                                isApiSearchable={false}
                                                            />
                                                        </FormControl>
                                                        <FormDescription className="text-xs">
                                                            {t(
                                                                "trainings.hints.status",
                                                                "Draft is usually for setup; move forward when you want enrollments or delivery to line up with this state.",
                                                            )}
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="provider"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            {t("trainings.fields.provider", "Provider")}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder={t("trainings.fields.providerPlaceholder", "Optional")}
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="location"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {t("trainings.fields.location", "Location")}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder={t("trainings.fields.locationPlaceholder", "e.g. Room 101 or https://meet.example.com")}
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-2 gap-4 items-start">
                                            <DateTimePicker
                                                form={form}
                                                name="start_date"
                                                label={t("trainings.fields.startDate", "Start Date")}
                                                showTime={false}
                                                placeholder={t("trainings.fields.selectDate", "Select date")}
                                                description={t(
                                                    "trainings.hints.courseDateSpan",
                                                    "Overall window for this offering; session-level schedules can differ if you add sessions later.",
                                                )}
                                                descriptionClassName="text-xs"
                                            />
                                            <DateTimePicker
                                                form={form}
                                                name="end_date"
                                                label={t("trainings.fields.endDate", "End Date")}
                                                showTime={false}
                                                placeholder={t("trainings.fields.selectDate", "Select date")}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 items-start">
                                            <FormField
                                                control={form.control}
                                                name="duration_hours"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            {t("trainings.fields.durationHours", "Duration (hours)")}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input type="number" min="0" step="0.5" placeholder={t("trainings.fields.optional", "Optional")} {...field} />
                                                        </FormControl>
                                                        <FormDescription className="text-xs">
                                                            {t(
                                                                "trainings.hints.durationHours",
                                                                "Total contact hours, not the calendar gap between start and end dates.",
                                                            )}
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="max_participants"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            {t("trainings.fields.maxParticipants", "Max Participants")}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input type="number" min="1" placeholder={t("trainings.fields.optional", "Optional")} {...field} />
                                                        </FormControl>
                                                        <FormDescription className="text-xs">
                                                            {t(
                                                                "trainings.hints.maxParticipants",
                                                                "Leave empty if there is no fixed cap; otherwise enrollment can stop at this count.",
                                                            )}
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="learning_platform_url"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {t("trainings.fields.learningPlatformUrl", "Learning Platform URL")}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="https://lms.example.com/course"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription className="text-xs">
                                                        {t(
                                                            "trainings.hints.learningPlatformUrl",
                                                            "Primary link employees use after enrolling (LMS, live session, recording hub, etc.).",
                                                        )}
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="is_mandatory"
                                            render={({ field }) => (
                                                <FormItem className="space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <FormControl>
                                                            <Switch
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="!mt-0 cursor-pointer">
                                                            {t("trainings.fields.isMandatory", "Mandatory training")}
                                                        </FormLabel>
                                                    </div>
                                                    <FormDescription className="text-xs">
                                                        {t(
                                                            "trainings.hints.isMandatory",
                                                            "Often used for compliance tracking and prioritization in employee-facing lists.",
                                                        )}
                                                    </FormDescription>
                                                </FormItem>
                                            )}
                                        />
                                    </TabsContent>

                                    <TabsContent
                                        value="admin"
                                        className="mt-0 gap-0 space-y-4"
                                    >
                                        <FormField
                                            control={form.control}
                                            name="validity_months"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {t("trainings.fields.validityMonths", "Course Validity (months)")}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            placeholder={t("trainings.fields.validityPlaceholder", "Leave empty for no expiry")}
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription className="text-xs">
                                                        {t(
                                                            "trainings.hints.validityMonths",
                                                            "If set, completion may be treated as expiring after this many months for renewals or reporting.",
                                                        )}
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-2 gap-4 items-start">
                                            <FormField
                                                control={form.control}
                                                name="cost_per_participant"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            {t("trainings.fields.costPerParticipant", "Cost per Participant")}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                placeholder={t("trainings.fields.optional", "Optional")}
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormDescription className="text-xs">
                                                            {t(
                                                                "trainings.hints.costPerParticipant",
                                                                "Expected cost for one seat; separate from the total budget cap.",
                                                            )}
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="budget"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            {t("trainings.fields.budget", "Total Budget")}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                placeholder={t("trainings.fields.optional", "Optional")}
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormDescription className="text-xs">
                                                            {t(
                                                                "trainings.hints.budget",
                                                                "Ceiling for the whole course run (all participants), not per person.",
                                                            )}
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="is_subsidized"
                                            render={({ field }) => (
                                                <FormItem className="space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <FormControl>
                                                            <Switch
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="!mt-0 cursor-pointer">
                                                            {t("trainings.fields.isSubsidized", "Subsidized course")}
                                                        </FormLabel>
                                                    </div>
                                                    <FormDescription className="text-xs">
                                                        {t(
                                                            "trainings.hints.isSubsidized",
                                                            "Turn on when an external program or institution covers part of the cost.",
                                                        )}
                                                    </FormDescription>
                                                </FormItem>
                                            )}
                                        />

                                        {watchSubsidized && (
                                            <FormField
                                                control={form.control}
                                                name="subsidized_by"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            {t("trainings.fields.subsidizedBy", "Subsidized by")}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder={t("trainings.fields.subsidizedByPlaceholder", "e.g. FUNDAE, OPCO")}
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormDescription className="text-xs">
                                                            {t(
                                                                "trainings.hints.subsidizedBy",
                                                                "Name of fund, agency, or scheme for audit trails—not just an internal note.",
                                                            )}
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    </TabsContent>
                                </TabsContents>
                                </div>
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
                                                    "trainings.updating",
                                                    "Updating..."
                                                )
                                                : t(
                                                    "trainings.creating",
                                                    "Creating..."
                                                )}
                                        </>
                                    ) : mode === "edit" ? (
                                        t(
                                            "trainings.updateTraining",
                                            "Update Training"
                                        )
                                    ) : (
                                        t(
                                            "trainings.createTraining",
                                            "Create Training"
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

export default TrainingCreateModal;
