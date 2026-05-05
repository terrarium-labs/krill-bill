import { useTranslation } from "react-i18next";
import AbsencesPolicies from "./pages/AbsencesPolicies/AbsencesPolicies";
import AbsencesTypes from "./pages/AbsencesTypes/AbsencesTypes";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from "@/components/ui/shadcn-io/tabs";
import PageHeader from "@/app/components/page-header";

const AbsencesPage = () => {
    const { t } = useTranslation();

    return (
        <>
            {/* Page Header */}
            <PageHeader
                title={t("admin.absences.title", "Absences settings")}
                description={t("admin.absences.description", "Set and manage your organization's absence policies and types.")}
                docs={{ slug: "pd_admin_absences" }}
            />

            {/* Tabs */}
            <Tabs defaultValue="policies">
                <TabsList className="w-full justify-start border-b-2 border-border bg-background" activeClassName='border-b-2 border-primary -mb-1.5'>
                    <TabsTrigger className="py-0" value="policies">{t("admin.absences.tabs.policies", "Policies")}</TabsTrigger>
                    <TabsTrigger className="py-0" value="types">{t("admin.absences.tabs.types", "Types")}</TabsTrigger>
                </TabsList>
                <TabsContents transition={{ duration: 0 }}>
                    <TabsContent value="policies" transition={{ duration: 0 }}>
                        <AbsencesPolicies />
                    </TabsContent>
                    <TabsContent value="types" transition={{ duration: 0 }}>
                        <AbsencesTypes />
                    </TabsContent>
                </TabsContents>
            </Tabs>
        </>
    );
};

export default AbsencesPage;