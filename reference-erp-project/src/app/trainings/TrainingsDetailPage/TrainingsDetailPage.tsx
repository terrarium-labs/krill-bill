import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { GraduationCap } from "lucide-react";

import { useTraining } from "../contexts/TrainingContext";

import PageHeader from "@/app/components/page-header";
import IdBadge from "@/app/components/id-badge";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from "@/components/ui/shadcn-io/tabs";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import TrainingCreateModal from "../components/training-create-modal";
import TrainingDeleteModal from "../components/training-delete-modal";
import TrainingsDetailPageEnrollments from "./pages/TrainingsDetailPageEnrollments/TrainingsDetailPageEnrollments";
import TrainingsDetailPageSessions from "./pages/TrainingsDetailPageSessions/TrainingsDetailPageSessions";

const validTabs = ["sessions", "enrollments"] as const;
type Tab = (typeof validTabs)[number];

const TrainingsDetailPage = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();
    const { training, refreshTraining } = useTraining();
    const [searchParams, setSearchParams] = useSearchParams();

    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const rawTab = searchParams.get("tab") ?? "sessions";
    const activeTab: Tab = validTabs.includes(rawTab as Tab)
        ? (rawTab as Tab)
        : "sessions";

    const handleTabChange = (value: string) => {
        if (validTabs.includes(value as Tab)) {
            setSearchParams({ tab: value });
        }
    };

    return (
        <>
            <PageHeader
                beforeTextChildren={
                    <div className="flex min-h-14 min-w-14 shrink-0 items-center justify-center rounded-md bg-muted">
                        <GraduationCap className="h-6 w-6 text-muted-foreground" />
                    </div>
                }
                title={training.title}
                showBackButton={true}
                action={
                    <div className="flex items-center gap-2">
                        <IdBadge
                            id={training.id}
                            className="h-6 px-4 text-xs"
                        />
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("common.actions.edit", "Edit"),
                                    icon: "edit",
                                    onClick: () => setEditOpen(true),
                                },
                                {
                                    label: t("common.actions.delete", "Delete"),
                                    icon: "trash-2",
                                    onClick: () => setDeleteOpen(true),
                                    variant: "destructive",
                                },
                            ]}
                        />
                    </div>
                }
            />

            <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList
                    className="w-full justify-start border-b-2 border-border bg-background mb-4"
                    activeClassName="border-b-2 border-primary -mb-1.5"
                >
                    <TabsTrigger className="py-0" value="sessions">
                        {t("trainings.tabs.sessions", "Sessions")}
                    </TabsTrigger>
                    <TabsTrigger className="py-0" value="enrollments">
                        {t("trainings.tabs.enrollments", "Enrolled Employees")}
                    </TabsTrigger>
                </TabsList>

                <TabsContents transition={{ duration: 0 }}>
                    <TabsContent value="sessions" transition={{ duration: 0 }}>
                        <TrainingsDetailPageSessions />
                    </TabsContent>
                    <TabsContent
                        value="enrollments"
                        transition={{ duration: 0 }}
                    >
                        <TrainingsDetailPageEnrollments />
                    </TabsContent>
                </TabsContents>
            </Tabs>

            <TrainingCreateModal
                open={editOpen}
                onOpenChange={setEditOpen}
                training={training}
                mode="edit"
                onSaved={refreshTraining}
            />

            <TrainingDeleteModal
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                training={training}
                onDeleted={() => navigate(`/${orgId}/trainings`)}
            />
        </>
    );
};

export default TrainingsDetailPage;
