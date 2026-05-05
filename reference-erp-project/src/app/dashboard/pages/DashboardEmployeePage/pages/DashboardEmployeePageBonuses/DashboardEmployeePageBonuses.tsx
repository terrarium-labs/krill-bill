import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getEmployeeBonusTypes } from "@/api/employees/bonus-types/bonus-types";
import { BonusTypeEmployee } from "@/types/employees/bonus-types";
import { useOrgMe } from "@/app/contexts/OrgMeContext";
import SearchBar from "@/app/components/search-bar";
import EmployeeBonusTypesTable from "@/app/employees/EmployeeDetailPage/pages/EmployeeDetailPageBonus/components/employee-bonus-types-table";

const DashboardEmployeePageBonuses = () => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const { me } = useOrgMe();
    const employeeId = me?.employee?.id;

    const [bonusTypeEmployees, setBonusTypeEmployees] = useState<BonusTypeEmployee[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchBonusTypes = useCallback(
        async (query: string = "", pageToken?: string | null) => {
            if (!orgId || !employeeId) return;
            if (pageToken) {
                setLoadingMore(true);
            } else if (query) {
                setIsSearching(true);
            } else {
                setIsLoading(true);
            }
            try {
                const response = await getEmployeeBonusTypes(orgId, employeeId, query || undefined, pageToken);
                if (response.success) {
                    setBonusTypeEmployees((prev) =>
                        pageToken
                            ? [...prev, ...(response.success.bonus_types_employees ?? [])]
                            : (response.success.bonus_types_employees ?? [])
                    );
                    setNextPageToken(response.success.next_page_token || null);
                } else {
                    toast.error(t("employees.bonusTypes.errorFetching", "Error fetching bonus types"));
                }
            } catch {
                toast.error(t("employees.bonusTypes.errorFetching", "Error fetching bonus types"));
            } finally {
                setIsLoading(false);
                setIsSearching(false);
                setLoadingMore(false);
            }
        },
        [orgId, employeeId, t]
    );

    useEffect(() => {
        fetchBonusTypes();
    }, [fetchBonusTypes]);

    return (
        <div className="space-y-4">
            <SearchBar
                value={searchQuery}
                isLoading={isSearching}
                onChange={(query) => setSearchQuery(query)}
                onSearch={(query) => fetchBonusTypes(query)}
                placeholder={t("employees.bonusTypes.searchPlaceholder", "Search bonus types...")}
            />

            <EmployeeBonusTypesTable
                bonusTypeEmployees={bonusTypeEmployees}
                isLoading={isLoading}
                loadingMore={loadingMore}
                hasMore={!!nextPageToken}
                searchQuery={searchQuery}
                readOnly={true}
                onLoadMore={() => fetchBonusTypes(searchQuery, nextPageToken)}
            />
        </div>
    );
};

export default DashboardEmployeePageBonuses;
