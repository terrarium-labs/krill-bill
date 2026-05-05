import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useParams } from "react-router-dom";
import { Skill } from "@/types/general/skills";
import { getSkillDescriptionForLevel } from "@/utils/skills";
import { getWorkOrderHardSkills, deleteWorkOrderHardSkill } from "@/api/field-service/work-orders/hard-skills/hard-skills";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Hexagon, List, Trash2, SquarePen } from "lucide-react";
import { toast } from "sonner";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { RadarChart, PolarAngleAxis, PolarGrid, Radar, PolarRadiusAxis } from 'recharts';
import { AddSkillModal } from "./modals/add-skill-modal";
import WorkOrderHardSkillEditModal from "./modals/work-order-hard-skill-edit-modal";
import StarsLabel from "@/app/components/labels/stars-label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface WorkOrderTechnologiesCardProps {
    editMode?: boolean;
}

const WorkOrderTechnologiesCard = ({ editMode = false }: WorkOrderTechnologiesCardProps) => {
    const { t } = useTranslation();
    const { orgId, workOrderId } = useParams<{ orgId: string, workOrderId: string }>();
    const [loading, setLoading] = useState(false);
    const [existingSkills, setExistingSkills] = useState<Skill[]>([]);
    const [showChartSkills, setShowChartSkills] = useState<boolean>(false);
    const [isAddSkillsModalOpen, setIsAddSkillsModalOpen] = useState<boolean>(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
    const [skillToDelete, setSkillToDelete] = useState<Skill | null>(null);
    const [deletingSkill, setDeletingSkill] = useState<boolean>(false);
    const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
    const [skillToEdit, setSkillToEdit] = useState<Skill | null>(null);

    const chartConfig = {
        skill: {
            label: "Skill",
            color: "var(--chart-1)",
        },
    } satisfies ChartConfig

    // Handle get skills
    const fetchSkills = async () => {
        if (!workOrderId || !orgId) return;

        setLoading(true);
        try {
            const response = await getWorkOrderHardSkills(orgId, workOrderId);
            if (response.success) {
                setExistingSkills(response.success.hard_skills.sort((a: Skill, b: Skill) => {
                    if ((b.level || 0) !== (a.level || 0)) {
                        return (b.level || 0) - (a.level || 0);
                    }
                    return a.name.localeCompare(b.name);
                }));
            } else {
                toast.error(t("workOrders.errorFetchingTechnologies", "Error fetching technologies"));
            }
        } catch (error) {
            toast.error(t("workOrders.errorFetchingTechnologies", "Error fetching technologies"));
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSkill = async () => {
        if (!skillToDelete || !orgId || !workOrderId) return;

        setDeletingSkill(true);
        try {
            const response = await deleteWorkOrderHardSkill(orgId, workOrderId, { skills: [skillToDelete.id] });
            if (response.success) {
                toast.success(t("workOrders.technologyDeletedSuccessfully", "Technology deleted successfully"));
                setDeleteModalOpen(false);
                setSkillToDelete(null);
                await fetchSkills();
            } else {
                toast.error(t("workOrders.errorDeletingTechnology", "Error deleting technology"));
            }
        } catch (error) {
            toast.error(t("workOrders.errorDeletingTechnology", "Error deleting technology"));
        } finally {
            setDeletingSkill(false);
        }
    };

    const refreshWorkOrderSkills = () => {
        fetchSkills();
    }

    useEffect(() => {
        if (orgId && workOrderId) {
            fetchSkills();
        }
    }, [orgId, workOrderId]);

    if (loading) {
        return <Loader2 className="h-4 w-4 animate-spin" />;
    }

    return (
        <>
            {/* Skills */}
            <div className="w-full space-y-4">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        {t('workOrdersDetail.technologies', 'Technologies')}
                        <Badge variant="secondary">{existingSkills.length}</Badge>
                    </h3>
                    <div className="flex items-center">
                        {existingSkills.length > 2 && (
                            <>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    size="icon"
                                    onClick={() => setShowChartSkills(!showChartSkills)}
                                >
                                    {!showChartSkills ?
                                        <Hexagon className="h-4 w-4 text-muted-foreground" /> :
                                        <List className="h-4 w-4 text-muted-foreground" />}
                                </Button>
                            </>
                        )}
                        {editMode && (
                            <Button
                                type="button"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                size="icon"
                                onClick={() => setIsAddSkillsModalOpen(true)}
                            >
                                <Plus className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        )}
                    </div>
                </div>
                <div>
                    {existingSkills.length > 0 ? (
                        <>
                            {!showChartSkills && (
                                <div className="space-y-2">
                                    {existingSkills.map((skill) => (
                                        <div key={skill.id} className="flex items-center justify-between gap-4">
                                            <p className="flex text-sm font-normal text-foreground flex-col">
                                                {skill.name}
                                                {getSkillDescriptionForLevel(skill.description, skill.level ?? 1) && (
                                                    <span className="text-xs text-muted-foreground line-clamp-1">
                                                        {getSkillDescriptionForLevel(skill.description, skill.level ?? 1)}
                                                    </span>
                                                )}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <StarsLabel level={skill.level ?? 0} variant="default" size="md" />
                                                {editMode && (
                                                    <>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => {
                                                                setSkillToEdit(skill);
                                                                setEditModalOpen(true);
                                                            }}
                                                        >
                                                            <SquarePen className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => {
                                                                setSkillToDelete(skill);
                                                                setDeleteModalOpen(true);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {showChartSkills && (
                                <ChartContainer
                                    config={chartConfig}
                                    className="max-h-[220px] w-full mx-auto"
                                >
                                    <RadarChart data={existingSkills}>
                                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                        <PolarAngleAxis dataKey="name" />
                                        <PolarRadiusAxis domain={[0, 5]} tickFormatter={(_) => ''} axisLine={false} />
                                        <PolarGrid />
                                        <Radar
                                            dataKey="level"
                                            fill="var(--chart-1)"
                                            fillOpacity={0.6}
                                        />
                                    </RadarChart>
                                </ChartContainer>
                            )}
                        </>
                    ) : (
                        <div className="text-sm text-muted-foreground py-6 text-center">
                            {t('workOrdersDetail.noTechnologiesAdded', 'No technologies added yet')}
                        </div>
                    )}

                </div>
            </div>

            {/* Add Skill Modal */}
            <AddSkillModal
                open={isAddSkillsModalOpen}
                onOpenChange={setIsAddSkillsModalOpen}
                orgId={orgId || ''}
                workOrderId={workOrderId || ''}
                currentSkills={existingSkills}
                onSuccess={refreshWorkOrderSkills}
            />

            {/* Edit Skill Modal */}
            <WorkOrderHardSkillEditModal
                open={editModalOpen}
                onOpenChange={(open) => {
                    setEditModalOpen(open);
                    if (!open) setSkillToEdit(null);
                }}
                orgId={orgId || ''}
                workOrderId={workOrderId || ''}
                skill={skillToEdit}
                currentSkills={existingSkills}
                onSuccess={refreshWorkOrderSkills}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle>{t("common.confirmDelete", "Confirm Delete")}</DialogTitle>
                        <DialogDescription>
                            {t("workOrders.confirmDeleteTechnology", "Are you sure you want to delete this technology?")}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeleteModalOpen(false)}
                            disabled={deletingSkill}
                        >
                            {t("common.cancel", "Cancel")}
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDeleteSkill}
                            disabled={deletingSkill}
                        >
                            {deletingSkill && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {t("common.delete", "Delete")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default WorkOrderTechnologiesCard;