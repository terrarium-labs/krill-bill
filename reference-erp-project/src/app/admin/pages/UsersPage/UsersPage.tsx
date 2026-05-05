import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import PageHeader from "@/app/components/page-header";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from "@/components/ui/shadcn-io/tabs";
import UsersTab from "./pages/UsersTab";
import InvitationsTab from "./pages/InvitationsTab";
import InvitationAddModal from "./components/modals/invitation-add-modal";

const UsersPage = () => {
    const { t } = useTranslation();
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("users");
    const [refreshInvitations, setRefreshInvitations] = useState(0);
    return (
        <div className="flex flex-col space-y-6">
            {/* Header */}
            <PageHeader
                title={t("admin.users.title", "Organization users")}
                description={t(
                    "admin.users.description",
                    "Manage organization users and invitations."
                )}
                docs={{ slug: "pd_admin_users" }}
                action={
                    <Button onClick={() => setInviteModalOpen(true)}>
                        <UserPlus className="h-4 w-4" />
                        {t("admin.users.newInvitation", "New Invitation")}
                    </Button>
                }
            />

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)} >
                <TabsList className="w-full justify-start border-b-2 border-border bg-background" activeClassName='border-b-2 border-primary -mb-1.5'>
                    <TabsTrigger className="py-0" value="users">{t("admin.users.tabs.users", "Users")}</TabsTrigger>
                    <TabsTrigger className="py-0" value="invitations">{t("admin.users.tabs.invitations", "Invitations")}</TabsTrigger>
                </TabsList>
                <TabsContents transition={{ duration: 0 }}>
                    <TabsContent value="users" transition={{ duration: 0 }}>
                        <UsersTab />
                    </TabsContent>
                    <TabsContent value="invitations" transition={{ duration: 0 }}   >
                        <InvitationsTab refreshTrigger={refreshInvitations} />
                    </TabsContent>
                </TabsContents>
            </Tabs>

            {/* Invite Users Modal */}
            <InvitationAddModal
                open={inviteModalOpen}
                onOpenChange={setInviteModalOpen}
                onUsersInvited={() => {
                    // Switch to invitations tab and refresh the data
                    setActiveTab("invitations");

                    // Trigger refresh by updating the refreshTrigger state
                    // Add a small delay to ensure backend processing is complete
                    setTimeout(() => {
                        setRefreshInvitations(prev => prev + 1);
                    }, 500); // 500ms delay to allow backend processing
                }}
            />
        </div>
    );
};

export default UsersPage;
