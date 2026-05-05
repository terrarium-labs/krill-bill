import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Pencil, X, Users } from "lucide-react";

import { useOrg } from "@/app/contexts/OrgContext";
import { useTraining } from "../../contexts/TrainingContext";
import TrainingCreateModal from "../../components/training-create-modal";
import Tag from "@/app/components/tag/tag";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconInfoItem } from "@/app/components/custom-labels";
import DateLabel from "@/app/components/labels/date-label";
import TextLabel from "@/app/components/labels/text-label";
import {
    DELIVERY_TYPE_META,
    TRAINING_STATUS_META,
    TRAINING_VISIBILITY_META,
} from "@/app/trainings/training-field-meta";
import {
    getTrainingCategoriesDisplay,
    getTrainingDeliveryTypes,
    getTrainingStatuses,
} from "@/app/trainings/training-normalize";
import { formatCurrency } from "@/utils/miscelanea";

const TrainingsDetailPageInfo = () => {
    const { t } = useTranslation();
    const { org } = useOrg();
    const { training, refreshTraining } = useTraining();
    const [editOpen, setEditOpen] = useState(false);

    const visibility = training.visibility ?? "public";
    const visMeta = TRAINING_VISIBILITY_META[visibility];
    const currency = org.currency;

    return (
        <div className="space-y-4 w-full min-w-0">
            <Card className="w-full shadow-none gap-2">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>
                            {t("trainings.details.title", "Training Details")}
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">

                    <IconInfoItem
                        icon="book-open"
                        label={t("trainings.columns.category", "Category")}
                    >
                        {getTrainingCategoriesDisplay(training).length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                                {getTrainingCategoriesDisplay(training).map((cat) => (
                                    <Tag
                                        key={cat.id}
                                        text={cat.name}
                                        color={cat.color ?? undefined}
                                    />
                                ))}
                            </div>
                        ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                        )}
                    </IconInfoItem>

                    <IconInfoItem
                        icon="layers"
                        label={t("trainings.columns.deliveryType", "Type")}
                    >
                        <div className="flex flex-wrap gap-1">
                            {getTrainingDeliveryTypes(training).map((dt) => {
                                const m = DELIVERY_TYPE_META[dt];
                                return (
                                    <Tag
                                        key={dt}
                                        text={t(m.i18nKey, m.defaultLabel)}
                                        color={m.tagColor}
                                    />
                                );
                            })}
                        </div>
                    </IconInfoItem>

                    <IconInfoItem
                        icon="circle-alert"
                        label={t("trainings.columns.status", "Status")}
                    >
                        <div className="flex flex-wrap gap-1">
                            {getTrainingStatuses(training).map((st) => {
                                const m = TRAINING_STATUS_META[st];
                                return (
                                    <Tag
                                        key={st}
                                        text={t(m.i18nKey, m.defaultLabel)}
                                        color={m.tagColor}
                                    />
                                );
                            })}
                        </div>
                    </IconInfoItem>

                    <IconInfoItem
                        icon="eye"
                        label={t("trainings.columns.visibility", "Visibility")}
                    >
                        <Tag
                            text={t(visMeta.i18nKey, visMeta.defaultLabel)}
                            color={visMeta.tagColor}
                        />
                    </IconInfoItem>

                    <IconInfoItem
                        icon="calendar"
                        label={t("trainings.columns.startDate", "Start Date")}
                    >
                        <DateLabel data={training.start_date} />
                    </IconInfoItem>

                    <IconInfoItem
                        icon="calendar"
                        label={t("trainings.columns.endDate", "End Date")}
                    >
                        <DateLabel data={training.end_date} />
                    </IconInfoItem>

                    <IconInfoItem
                        icon="building-2"
                        label={t("trainings.columns.provider", "Provider")}
                    >
                        <TextLabel data={training.provider} className="text-sm" />
                    </IconInfoItem>

                    <IconInfoItem
                        icon="circle-alert"
                        label={t("trainings.columns.mandatory", "Mandatory")}
                    >
                        {training.is_mandatory ? (
                            <Check className="h-4 w-4 text-green-500" />
                        ) : (
                            <X className="h-4 w-4 text-red-500" />
                        )}
                    </IconInfoItem>

                    <IconInfoItem
                        icon="users"
                        label={t("trainings.columns.enrolled", "Enrolled")}
                    >
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 shrink-0" />
                            <span className="tabular-nums text-sm">
                                {training.enrolled_count ?? 0}
                            </span>
                        </div>
                    </IconInfoItem>

                    {training.description && (
                        <IconInfoItem
                            icon="file-text"
                            label={t("trainings.fields.description", "Description")}
                            value={training.description}
                        />
                    )}

                    {training.location && (
                        <IconInfoItem
                            icon="map-pin"
                            label={t("trainings.fields.location", "Location")}
                            value={training.location}
                        />
                    )}

                    {training.duration_hours != null && (
                        <IconInfoItem
                            icon="clock"
                            label={t("trainings.fields.durationHours", "Duration (hours)")}
                            value={`${training.duration_hours}h`}
                        />
                    )}

                    {training.max_participants != null && (
                        <IconInfoItem
                            icon="users"
                            label={t("trainings.fields.maxParticipants", "Max Participants")}
                            value={`${training.enrolled_count ?? 0} / ${training.max_participants}`}
                        />
                    )}

                    {training.learning_platform_url && (
                        <IconInfoItem
                            icon="external-link"
                            label={t("trainings.fields.learningPlatformUrl", "Learning Platform")}
                            link
                            linkValue={training.learning_platform_url}
                            value={t("trainings.details.openPlatform", "Open Platform")}
                        />
                    )}

                    {training.validity_months != null && (
                        <IconInfoItem
                            icon="timer"
                            label={t("trainings.fields.validityMonths", "Course Validity")}
                            value={`${training.validity_months} ${t("trainings.details.months", "months")}`}
                        />
                    )}
                </CardContent>
            </Card>

            {(training.cost_per_participant != null ||
                training.budget != null ||
                training.is_subsidized) && (
                <Card className="w-full shadow-none gap-2">
                    <CardHeader>
                        <CardTitle>
                            {t("trainings.details.adminInfo", "Administrative Info")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {training.cost_per_participant != null && (
                            <IconInfoItem
                                icon="dollar-sign"
                                label={t("trainings.fields.costPerParticipant", "Cost per Participant")}
                                value={formatCurrency(
                                    training.cost_per_participant,
                                    currency,
                                )}
                            />
                        )}

                        {training.budget != null && (
                            <IconInfoItem
                                icon="dollar-sign"
                                label={t("trainings.fields.budget", "Total Budget")}
                                value={formatCurrency(training.budget, currency)}
                            />
                        )}

                        {training.is_subsidized && (
                            <IconInfoItem
                                icon="badge-check"
                                label={t("trainings.fields.subsidized", "Subsidized")}
                            >
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                        {t("trainings.details.subsidized", "Subsidized")}
                                    </Badge>
                                    {training.subsidized_by && (
                                        <span className="text-muted-foreground">
                                            {training.subsidized_by}
                                        </span>
                                    )}
                                </div>
                            </IconInfoItem>
                        )}
                    </CardContent>
                </Card>
            )}

            <TrainingCreateModal
                open={editOpen}
                onOpenChange={setEditOpen}
                training={training}
                mode="edit"
                onSaved={refreshTraining}
            />
        </div>
    );
};

export default TrainingsDetailPageInfo;
