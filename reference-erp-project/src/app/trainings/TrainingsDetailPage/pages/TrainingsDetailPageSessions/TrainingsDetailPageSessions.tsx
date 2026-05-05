import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Plus,
  ChevronDown,
  Clock,
  MapPin,
  CalendarDays,
  Pencil,
  Trash2,
  File,
  Eye,
  EyeOff,
} from "lucide-react";

import {
  getTrainingSessions,
  deleteTrainingSession,
} from "@/api/trainings/sessions";
import type { TrainingSession } from "@/types/trainings/trainings";

import Tag from "@/app/components/tag/tag";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import DateLabel from "@/app/components/labels/date-label";
import TrainingSessionModal from "./components/training-session-modal";
import TrainingSessionMaterialRow from "./components/training-session-material-row";
import TrainingsDetailPageInfo from "../TrainingsDetailPageInfo";
import TrainingInsightsSection from "@/app/trainings/components/training-insights-section";
import { useTraining } from "@/app/trainings/contexts/TrainingContext";

const TrainingsDetailPageSessions = () => {
  const { t } = useTranslation();
  const { orgId, trainingId } = useParams<{
    orgId: string;
    trainingId: string;
  }>();
  const { training } = useTraining();

  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editSession, setEditSession] = useState<TrainingSession | null>(null);
  const [insightsRefreshKey, setInsightsRefreshKey] = useState(0);

  const fetchSessions = useCallback(async () => {
    if (!orgId || !trainingId) return;
    setIsLoading(true);
    try {
      const response = await getTrainingSessions(orgId, trainingId);
      if (response.success) {
        const list: TrainingSession[] = response.success.sessions ?? [];
        list.sort((a, b) => a.order - b.order);
        setSessions(list);
      } else {
        toast.error(
          t("trainings.sessions.errorFetching", "Error fetching sessions"),
        );
      }
    } catch {
      toast.error(t("common.error", "An error occurred"));
    } finally {
      setIsLoading(false);
    }
  }, [orgId, trainingId, t]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleDelete = async (session: TrainingSession) => {
    if (!orgId || !trainingId) return;
    try {
      const response = await deleteTrainingSession(
        orgId,
        trainingId,
        session.id,
      );
      if (response.success) {
        toast.success(
          t("trainings.sessions.deletedSuccess", "Session deleted"),
        );
        setSessions((prev) => prev.filter((s) => s.id !== session.id));
        setInsightsRefreshKey((k) => k + 1);
      } else {
        toast.error(
          t("trainings.sessions.errorDeleting", "Error deleting session"),
        );
      }
    } catch {
      toast.error(t("common.error", "An error occurred"));
    }
  };

  const openCreate = () => {
    setEditSession(null);
    setModalOpen(true);
  };

  const openEdit = (session: TrainingSession) => {
    setEditSession(session);
    setModalOpen(true);
  };

  const nextOrder =
    sessions.length > 0 ? Math.max(...sessions.map((s) => s.order)) + 1 : 1;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="mb-24 flex flex-col gap-4 min-w-0 lg:col-span-1">
        <TrainingsDetailPageInfo />
      </div>
      <div className="min-w-0 shadow-none border-none lg:col-span-2">
        <div className="flex flex-col gap-4">
          {orgId && trainingId ? (
            <TrainingInsightsSection
              orgId={orgId}
              trainingId={trainingId}
              trainingMaxParticipants={training.max_participants}
              trainingEnrolledCount={training.enrolled_count}
              trainingBudget={training.budget}
              refreshKey={insightsRefreshKey}
            />
          ) : null}
          <div className="flex items-center justify-between gap-3">
            <div className="text-md font-semibold">
              {t("trainings.sessions.title", "Sessions")}
            </div>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              {t("trainings.sessions.add", "Add Session")}
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-4">
              <CalendarDays className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">
                  {t("trainings.sessions.empty.title", "No sessions yet")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t(
                    "trainings.sessions.empty.description",
                    "Create sessions to structure your training content.",
                  )}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                {t("trainings.sessions.add", "Add Session")}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => {
                const isExpanded = expandedId === session.id;
                const materialCount = session.materials?.length ?? 0;

                return (
                  <Collapsible
                    key={session.id}
                    open={isExpanded}
                    onOpenChange={(open) =>
                      setExpandedId(open ? session.id : null)
                    }
                  >
                    <Card className="shadow-none gap-0 py-0 overflow-hidden">
                      <CollapsibleTrigger asChild>
                        <div className="flex w-full items-center gap-3 px-4 py-3 cursor-pointer rounded-none hover:bg-muted/50 transition-colors outline-none">
                          <div className="flex items-center justify-center h-8 w-8 rounded-md bg-muted text-muted-foreground shrink-0">
                            <span className="text-xs font-bold">
                              {session.order}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">
                                {session.title}
                              </span>
                              {session.is_required ? (
                                <Tag
                                  className="shrink-0"
                                  text={t(
                                    "trainings.sessions.required",
                                    "Required",
                                  )}
                                  color="red"
                                />
                              ) : (
                                <Tag
                                  className="shrink-0"
                                  text={t(
                                    "trainings.sessions.optional",
                                    "Optional",
                                  )}
                                  color="slate"
                                />
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                              <span
                                className="flex items-center gap-1 shrink-0 text-xs text-muted-foreground"
                                title={
                                  session.is_visible === false
                                    ? t(
                                        "trainings.sessions.hiddenFromLearners",
                                        "Hidden from learners",
                                      )
                                    : t(
                                        "trainings.sessions.visibleToLearners",
                                        "Visible to learners",
                                      )
                                }
                              >
                                {session.is_visible === false ? (
                                  <EyeOff className="h-3 w-3 text-amber-600 dark:text-amber-500" />
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                              </span>
                              {session.date && (
                                <span className="flex items-center gap-1 text-sm text-muted-foreground justify-center">
                                  <CalendarDays className="h-3 w-3 shrink-0 mb-0.5" />
                                  <DateLabel
                                    className="text-xs"
                                    data={session.date}
                                  />
                                </span>
                              )}
                              {session.duration_minutes != null && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {session.duration_minutes}
                                  min
                                </span>
                              )}
                              {session.location && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  <span className="truncate max-w-32">
                                    {session.location}
                                  </span>
                                </span>
                              )}
                              {materialCount > 0 && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <File className="h-3 w-3" />
                                  {materialCount}
                                </span>
                              )}
                            </div>
                          </div>

                          <div
                            className="flex items-center gap-1 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEdit(session)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(session)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                          <ChevronDown
                            className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <CardContent className="pt-0 pb-4 px-4 space-y-4">
                          {session.description && (
                            <p className="text-sm text-muted-foreground">
                              {session.description}
                            </p>
                          )}

                          {session.content && (
                            <div
                              className="prose prose-sm dark:prose-invert max-w-none"
                              dangerouslySetInnerHTML={{
                                __html: session.content,
                              }}
                            />
                          )}

                          {session.materials &&
                            session.materials.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-foreground">
                                  {t(
                                    "trainings.sessions.materials.title",
                                    "Materials",
                                  )}
                                </p>
                                <div className="rounded-lg border border-border divide-y divide-border">
                                  {session.materials.map((material) => (
                                    <TrainingSessionMaterialRow
                                      key={material.id}
                                      material={material}
                                      variant="view"
                                      onDownload={() =>
                                        window.open(
                                          material.file_url,
                                          "_blank",
                                        )
                                      }
                                    />
                                  ))}
                                </div>
                              </div>
                            )}

                          {!session.description &&
                            !session.content &&
                            (!session.materials ||
                              session.materials.length === 0) && (
                              <p className="text-sm text-muted-foreground italic">
                                {t(
                                  "trainings.sessions.noContent",
                                  "No content added to this session yet.",
                                )}
                              </p>
                            )}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </div>
          )}

          <TrainingSessionModal
            open={modalOpen}
            onOpenChange={setModalOpen}
            session={editSession}
            mode={editSession ? "edit" : "create"}
            nextOrder={nextOrder}
            onSaved={() => {
              void fetchSessions();
              setInsightsRefreshKey((k) => k + 1);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default TrainingsDetailPageSessions;
