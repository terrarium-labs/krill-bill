import type {
    Training,
    TrainingCategory,
    TrainingDeliveryType,
    TrainingStatus,
} from "@/types/trainings/trainings";

export function getTrainingCategoryIds(training: Training): string[] {
    if (training.category_ids?.length) return training.category_ids;
    if (training.category_id) return [training.category_id];
    return [];
}

export function getTrainingCategoriesDisplay(training: Training): TrainingCategory[] {
    if (training.categories?.length) return training.categories;
    if (training.category) return [training.category];
    return [];
}

export function getTrainingDeliveryTypes(training: Training): TrainingDeliveryType[] {
    if (training.delivery_types?.length) return training.delivery_types;
    return [training.delivery_type];
}

export function getTrainingStatuses(training: Training): TrainingStatus[] {
    if (training.statuses?.length) return training.statuses;
    return [training.status];
}
