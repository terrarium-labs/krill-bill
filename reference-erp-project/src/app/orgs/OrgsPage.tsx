import {
  Card,
  CardContent,
  CardDescription,
  CardHeader
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "../components/user-avatar";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building, Users, ChevronRight, Sparkles, Loader2, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/auth/AuthContext";
import { useUser } from "@/contexts/UserContext";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import SearchBar from "../components/search-bar";
import { useNavigate, useParams } from "react-router";
import { getMeOrgs } from "@/api/me/me";
import NewOrgModal from "./components/new-org-modal";
import { UserDropdownContent } from "../components/user-dropdown-content";
import EmptySpace from "../components/empty-space";
import { getColorFromString } from "@/utils/miscelanea";
import PageHeader from "../components/page-header";
import { OrgAvatar } from "../components/avatars/org-avatar";
import { Org } from "@/types/general/org";

interface Organization {
  id: string;
  name: string;
  description: string;
  photo_url: string;
  n_users: number;
  created_at: string;
}

const OrgsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { signOut } = useAuth();
  const { user } = useUser();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isNewOrgModalOpen, setIsNewOrgModalOpen] = useState(false);
  const handleOrgSelect = (orgId: string) => {
    localStorage.setItem("last-org-id", orgId);
    navigate(`/${orgId}`);
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      toast.error(t("orgs.logoutError"));
    }
  };

  const fetchOrgs = async (query: string, page_token: string | null) => {
    // Set loading state for search (not for pagination)
    if (!page_token) {
      setIsSearching(true);
    }

    try {
      const response = await getMeOrgs(query, page_token);
      if (response.success) {
        if (page_token) {
          // Loading more results - append to existing
          setOrganizations((prev) => [
            ...prev,
            ...(response.success.orgs as Organization[]),
          ]);
        } else {
          // New search or initial load - replace existing
          setOrganizations(response.success.orgs as Organization[]);
        }
        if (response.success.next_page_token) {
          setNextPageToken(response.success.next_page_token);
        } else {
          setNextPageToken(null);
        }
      }
    } finally {
      // Clear loading state for search
      if (!page_token) {
        setIsSearching(false);
      }
    }
  };

  const loadMore = async () => {
    if (!nextPageToken || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      await fetchOrgs(searchQuery, nextPageToken);
    } catch (error) {
      toast.error(t("common.error"));
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleOrgCreated = async () => {
    fetchOrgs(searchQuery, null);
  };

  useEffect(() => {
    fetchOrgs(searchQuery, null);
  }, [searchQuery]);

  const getAvailableOrgId = async (): Promise<string | null> => {
    // Primero intentar obtener el último orgId del localStorage
    const lastOrgId = localStorage.getItem("last-org-id");
    if (lastOrgId) {
      return lastOrgId;
    }

    // Si no hay en localStorage, usar la primera organización disponible
    if (organizations.length > 0) {
      return organizations[0].id;
    }

    // Si no hay organizaciones cargadas, intentar obtenerlas
    try {
      const response = await getMeOrgs("", null);
      if (response.success && response.success.orgs.length > 0) {
        return response.success.orgs[0].id;
      }
    } catch (error) {
      toast.error(t("common.error"));
    }

    return null;
  };

  const { orgId } = useParams<{ orgId: string }>();
  const handleGoToProfile = async () => {
    const targetOrgId = orgId || (await getAvailableOrgId());
    if (targetOrgId) {
      navigate(`/${targetOrgId}/profile`);
    } else {
      toast.error(t("orgs.noOrganizationAvailable"));
    }
  };

  const handleGoToApiKeys = async () => {
    const targetOrgId = orgId || (await getAvailableOrgId());
    if (targetOrgId) {
      navigate(`/${targetOrgId}/profile/api-keys`);
    } else {
      toast.error(t("orgs.noOrganizationAvailable"));
    }
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-6 w-6" />
            <span className="font-semibold text-lg">LAIA_LOGO</span>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="outline-none focus:outline-none">
                <UserAvatar
                  src={user.photo_url}
                  name={user.first_name + " " + user.last_name}
                  fallbackColor={getColorFromString(user.first_name + " " + user.last_name)}
                  size="md"
                  className="cursor-pointer"
                />
              </button>
            </DropdownMenuTrigger>
            <UserDropdownContent
              side="bottom"
              align="end"
              onGoToProfile={handleGoToProfile}
              onGoToApiKeys={handleGoToApiKeys}
              onLogout={handleLogout}
              showApiKeys={false}
              disableProfileClick={true}
            />
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 pt-6 space-y-6">

        <PageHeader
          title={t("orgs.hello", "Welcome back, {{name}}", { name: user.first_name + " " + user.last_name || "User" })}
          description={t("orgs.chooseOrgDescription", "Choose an organization to continue")}
          showBackButton={false}
          action={
            <Button onClick={() => setIsNewOrgModalOpen(true)}>
              <Plus className="h-4 w-4" />
              {t("orgs.createNewOrg", "New Organization")}
            </Button>
          }
        />

        {/* Search Bar */}
        <SearchBar
          className="mb-4"
          onSearch={setSearchQuery}
          placeholder={t("orgs.searchPlaceholder", "Search for an organization")}
          isLoading={isSearching}
        />

        {/* Loading State */}
        {isSearching && organizations.length === 0 && (
          <div className="flex flex-col items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {/* No Results Placeholder */}
        {searchQuery && organizations.length === 0 && !isSearching && (
          <div className="flex flex-col items-center justify-center max-w-lg mx-auto h-96">
            <Label className="text-xl font-semibold text-foreground mb-2 block">
              {t("orgs.noResultsFound", "No results found")}
            </Label>
            <p className="text-muted-foreground text-center mb-4 max-w-lg">
              {t("orgs.noResultsDescription", "No results found for {{searchQuery}}", { searchQuery })}
            </p>
          </div>
        )}

        {/* Conditional Organizations Section */}
        {organizations.length > 0 && (
          <>
            {/* Organization Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {organizations.map((org) => (
                <Card
                  key={org.id}
                  className="hover:border-primary cursor-pointer shadow-none"
                  onClick={() => handleOrgSelect(org.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <OrgAvatar org={org as Org | null} size="md" />
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                    <CardDescription className="text-sm text-muted-foreground line-clamp-2">
                      {org.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>
                            {org.n_users} {t("orgs.members", "Members")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More Button */}
            {nextPageToken && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="cursor-pointer"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("common.loading", "Loading")}
                    </>
                  ) : (
                    t("common.loadMore", "Load More")
                  )}
                </Button>
              </div>
            )}

            {/* Divider */}
            <div className="my-8 flex items-center">
              <div className="flex-1 border-t border-border"></div>
              <span className="px-4 text-sm text-muted-foreground">
                {t("common.or", "Or")}
              </span>
              <div className="flex-1 border-t border-border"></div>
            </div>
          </>
        )}

        {/* Create New Organization */}
        <EmptySpace
          icon={Building}
          title={t("orgs.createNewOrg", "Create New Organization")}
          description={t("orgs.postOrgDescription", "Create a new organization to get started")}
          buttonText={t("orgs.postOrgButton", "Create Organization")}
          onButtonClick={() => setIsNewOrgModalOpen(true)}
        />

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          {t("orgs.cantFindOrg", "Can't find an organization?")}
        </div>
      </div>

      {/* New Organization Modal */}
      <NewOrgModal
        open={isNewOrgModalOpen}
        onOpenChange={setIsNewOrgModalOpen}
        onOrgCreated={handleOrgCreated}
      />
    </div>
  );
};

export default OrgsPage;
