import { useState } from "react";
import { useTranslation } from "react-i18next";
import PageHeader from "@/app/components/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from "@/components/ui/shadcn-io/tabs";
import HardSkillsPage from "./pages/HardSkillsPage";
import SoftSkillsPage from "./pages/SoftSkillsPage";

const SkillsPage = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<"hard" | "soft">("hard");

    return (
        <>
            <PageHeader
                title={t("skills.title", "Skills")}
                description={t("skills.description", "Manage technical skills and competencies.")}
                showBackButton={true}
                docs={{ slug: "pd_admin_skills" }}
            />

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "hard" | "soft")}>
                <TabsList className="w-full justify-start border-b-2 border-border bg-background mb-4" activeClassName="border-b-2 border-primary -mb-1.5">
                    <TabsTrigger className="py-0" value="hard">
                        {t("skills.hard", "Hard")}
                    </TabsTrigger>
                    <TabsTrigger className="py-0" value="soft">
                        {t("skills.soft", "Soft")}
                    </TabsTrigger>
                </TabsList>

                <TabsContents transition={{ duration: 0 }}>
                    <TabsContent value="hard" transition={{ duration: 0 }}>
                        <HardSkillsPage />
                    </TabsContent>

                    <TabsContent value="soft" transition={{ duration: 0 }}>
                        <SoftSkillsPage />
                    </TabsContent>
                </TabsContents>
            </Tabs>
        </>
    );
};

export default SkillsPage;
