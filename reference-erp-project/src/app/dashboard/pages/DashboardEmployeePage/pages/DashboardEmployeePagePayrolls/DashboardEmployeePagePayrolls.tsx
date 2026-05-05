import { Button } from "@/components/ui/button";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import { Payroll } from "@/types/employees/payrolls";
import { getEmployeePayrolls } from "@/api/employees/payrolls/payrolls";
import { toast } from "sonner";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import PayrollViewModal from "@/app/payrolls/components/payroll-view-modal";
import SensitiveDataWarningModal from "@/app/components/sensitive-data-warning-modal";
import { useOrgMe } from "@/app/contexts/OrgMeContext";
import SearchBar from "@/app/components/search-bar";
import PayrollsTable from "@/app/payrolls/components/payrolls-table";

const PAYROLL_VISIBILITY_KEY = "payroll_amounts_visible";

const DashboardEmployeePagePayrolls = () => {
  const { t } = useTranslation();
  const { orgId } = useParams<{ orgId: string }>();
  const { me } = useOrgMe();
  const employeeId = me?.employee?.id;

  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [payrollToView, setPayrollToView] = useState<Payroll | null>(null);
  const [amountsVisible, setAmountsVisible] = useState<boolean>(() => {
    const stored = localStorage.getItem(PAYROLL_VISIBILITY_KEY);
    return stored === "true";
  });
  const [visibilityConfirmModalOpen, setVisibilityConfirmModalOpen] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  // Handle visibility toggle
  const handleVisibilityToggle = () => {
    if (amountsVisible) {
      // Hiding - no confirmation needed
      setAmountsVisible(false);
      localStorage.setItem(PAYROLL_VISIBILITY_KEY, "false");
    } else {
      // Showing - need confirmation
      pendingActionRef.current = null;
      setVisibilityConfirmModalOpen(true);
    }
  };

  const confirmShowAmounts = () => {
    // Only change global visibility if there's no pending action (came from visibility toggle)
    if (!pendingActionRef.current) {
      setAmountsVisible(true);
      localStorage.setItem(PAYROLL_VISIBILITY_KEY, "true");
    }
    setVisibilityConfirmModalOpen(false);
    // Execute pending action if any (row click case)
    if (pendingActionRef.current) {
      pendingActionRef.current();
      pendingActionRef.current = null;
    }
  };

  // Fetch payrolls function
  const fetchPayrolls = async (query: string = "") => {
    if (!orgId || !employeeId) return;

    if (query) {
      setIsSearching(true);
    } else {
      setIsLoading(true);
    }
    try {
      const response = await getEmployeePayrolls(orgId, employeeId, undefined, undefined, query, undefined);
      if (response.success && response.success.payrolls) {
        setPayrolls(response.success.payrolls);
        setNextPageToken(response.success.next_page_token || null);
      } else {
        toast.error(t("payrolls.errorFetchingPayrolls", "Error fetching payrolls"));
      }
    } catch (error) {
      toast.error(t("payrolls.errorFetchingPayrolls", "Error fetching payrolls"));
    } finally {
      setIsSearching(false);
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPayrolls();
  }, [orgId, employeeId]);

  // Load more payrolls
  const loadMorePayrolls = async () => {
    if (!orgId || !employeeId || !nextPageToken || loadingMore || isLoading) return;

    setLoadingMore(true);
    try {
      const response = await getEmployeePayrolls(orgId, employeeId, undefined, undefined, searchQuery, nextPageToken);
      if (response.success && response.success.payrolls) {
        setPayrolls(prev => [...prev, ...response.success.payrolls]);
        setNextPageToken(response.success.next_page_token || null);
      } else {
        toast.error(t("payrolls.errorFetchingPayrolls", "Error fetching payrolls"));
      }
    } catch (error) {
      toast.error(t("payrolls.errorFetchingPayrolls", "Error fetching payrolls"));
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle view payroll
  const handleViewPayroll = (payroll: Payroll) => {
    if (!amountsVisible) {
      // Show warning modal first, then open view modal after confirmation
      pendingActionRef.current = () => {
        setPayrollToView(payroll);
        setViewModalOpen(true);
      };
      setVisibilityConfirmModalOpen(true);
    } else {
      setPayrollToView(payroll);
      setViewModalOpen(true);
    }
  };

  // Render actions for table
  const renderTableActions = (payroll: Payroll) => {
    return (
      <div className="flex justify-center items-center">
        <CustomActionsDropdown
          items={[
            {
              label: t("common.view", "View"),
              icon: "eye",
              onClick: () => handleViewPayroll(payroll),
            },
          ]}
        />
      </div>
    );
  };

  // Show loading if no employee
  if (!employeeId) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <SearchBar
          value={searchQuery}
          isLoading={isSearching}
          className="w-full"
          onChange={(query) => setSearchQuery(query)}
          onSearch={fetchPayrolls}
          placeholder={t("payrolls.searchPlaceholder", "Search payrolls...")}
        />
        <Button
          variant="outline"
          size="icon"
          onClick={handleVisibilityToggle}
          title={amountsVisible ? t("payrolls.hideAmounts", "Hide amounts") : t("payrolls.showAmounts", "Show amounts")}
        >
          {amountsVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
      </div>

      {/* Payrolls Table */}
      <PayrollsTable
        payrolls={payrolls}
        isLoading={isLoading}
        renderActions={renderTableActions}
        onRowClick={handleViewPayroll}
        clickableRows={true}
        hiddenColumns={["employee"]}
        emptyStateTitle={searchQuery ? undefined : t("payrolls.noPayrollsTitle", "No payrolls yet")}
        emptyStateDescription={searchQuery ? undefined : t("payrolls.noPayrollsDescriptionMe", "You have no payrolls registered")}
        searchQuery={searchQuery}
        amountsVisible={amountsVisible}
      />

      {/* Load More Button */}
      {nextPageToken && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={loadMorePayrolls}
            disabled={loadingMore}
            className="min-w-32"
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("common.loading", "Loading...")}
              </>
            ) : (
              t("common.loadMore", "Load More")
            )}
          </Button>
        </div>
      )}

      {/* Payroll View Modal */}
      {orgId && employeeId && payrollToView && (
        <PayrollViewModal
          open={viewModalOpen}
          onOpenChange={setViewModalOpen}
          orgId={orgId}
          employeeId={employeeId}
          payrollId={payrollToView.id}
        />
      )}

      {/* Visibility Confirmation Modal */}
      <SensitiveDataWarningModal
        open={visibilityConfirmModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            pendingActionRef.current = null;
          }
          setVisibilityConfirmModalOpen(open);
        }}
        onConfirm={confirmShowAmounts}
        title={t("payrolls.sensitiveDataWarning", "Sensitive Data Warning")}
        description={t("payrolls.sensitiveDataDescription", "You are about to view sensitive payroll information. Please ensure you are in a private environment and that no unauthorized persons can see your screen.")}
        confirmText={t("payrolls.showAmounts", "Show Amounts")}
      />
    </div>
  );
};

export default DashboardEmployeePagePayrolls;

