import type {
    TrainingDeliveryType,
    TrainingStatus,
    TrainingVisibility,
} from "@/types/trainings/trainings";

/** Named colors for `Tag` (Tailwind token set in miscelanea). */
export const DELIVERY_TYPE_META: Record<
    TrainingDeliveryType,
    { i18nKey: string; defaultLabel: string; tagColor: string }
> = {
    online: {
        i18nKey: "trainings.deliveryType.online",
        defaultLabel: "Online",
        tagColor: "green",
    },
    in_person: {
        i18nKey: "trainings.deliveryType.inPerson",
        defaultLabel: "In person",
        tagColor: "violet",
    },
    hybrid: {
        i18nKey: "trainings.deliveryType.hybrid",
        defaultLabel: "Hybrid",
        tagColor: "fuchsia",
    },
};

export const TRAINING_STATUS_META: Record<
    TrainingStatus,
    { i18nKey: string; defaultLabel: string; tagColor: string }
> = {
    draft: {
        i18nKey: "trainings.statuses.draft",
        defaultLabel: "Draft",
        tagColor: "slate",
    },
    scheduled: {
        i18nKey: "trainings.statuses.scheduled",
        defaultLabel: "Scheduled",
        tagColor: "blue",
    },
    in_progress: {
        i18nKey: "trainings.statuses.inProgress",
        defaultLabel: "In progress",
        tagColor: "amber",
    },
    completed: {
        i18nKey: "trainings.statuses.completed",
        defaultLabel: "Completed",
        tagColor: "emerald",
    },
    cancelled: {
        i18nKey: "trainings.statuses.cancelled",
        defaultLabel: "Cancelled",
        tagColor: "red",
    },
};

export const TRAINING_VISIBILITY_META: Record<
    TrainingVisibility,
    { i18nKey: string; defaultLabel: string; tagColor: string }
> = {
    public: {
        i18nKey: "trainings.visibility.public",
        defaultLabel: "Public",
        tagColor: "emerald",
    },
    private: {
        i18nKey: "trainings.visibility.private",
        defaultLabel: "Private",
        tagColor: "violet",
    },
};

export const TRAINING_DELIVERY_IDS: TrainingDeliveryType[] = [
    "online",
    "in_person",
    "hybrid",
];

export const TRAINING_STATUS_IDS: TrainingStatus[] = [
    "draft",
    "scheduled",
    "in_progress",
    "completed",
    "cancelled",
];
