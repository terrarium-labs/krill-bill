import PageHeader from "@/app/components/page-header";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router";
import { Loader2 } from "lucide-react";
import SearchBar from "@/app/components/search-bar";
import {
  getOrgCurrencies,
  postOrgCurrency,
  patchOrgCurrency,
  deleteOrgCurrency,
} from "@/api/orgs/currencies/currencies";
import { Currency } from "@/types/general/currencies";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useOrg } from "@/app/contexts/OrgContext";
import CURRENCIES from "@/utils/currencies";
import CurrenciesTable from "./components/currencies-table";
import TipsCard from "@/app/components/cards/tips-card";
import { useCurrenciesTablePreferences } from "@/hooks/use-currencies-table-preferences";
import { CurrenciesColumnSelector } from "./components/currencies-column-selector";
const CurrenciesPage = () => {
  const { t } = useTranslation();
  const { orgId } = useParams<{ orgId: string }>();
  const { org } = useOrg();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const {
    columnVisibility,
    setColumnVisibility,
    columnOrder,
    setColumnOrder,
    columnSizing,
    setColumnSizing,
    resetPreferences,
  } = useCurrenciesTablePreferences();

  const handleColumnVisibilityChange = useCallback(
    (id: string, visible: boolean) =>
      setColumnVisibility((prev) => ({ ...prev, [id]: visible })),
    [setColumnVisibility],
  );
  const handleColumnOrderChange = useCallback(
    (order: string[]) => setColumnOrder(order),
    [setColumnOrder],
  );
  const [updatingCurrencies, setUpdatingCurrencies] = useState<Set<string>>(new Set());
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const fetchCurrencies = async (query: string = "", pageToken?: string | null) => {
    if (!orgId) return;

    if (query) {
      setIsSearching(true);
    } else if (!pageToken) {
      setIsLoading(true);
    }

    try {
      const response = await getOrgCurrencies(orgId, query || undefined, pageToken);
      if (response.success?.currencies) {
        if (pageToken) {
          // Loading more - append to existing
          setCurrencies(prev => [...prev, ...response.success.currencies]);
        } else {
          // Initial load or search - replace existing
          setCurrencies(response.success.currencies);
        }
        setNextPageToken(response.success.next_page_token || null);
      }
    } catch (error) {
      console.error("Error fetching currencies:", error);
      toast.error(t("settings.currencies.fetchError", "Failed to load currencies"));
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const loadMoreCurrencies = async () => {
    if (!nextPageToken || loadingMore || isLoading) return;

    setLoadingMore(true);
    try {
      await fetchCurrencies(searchQuery, nextPageToken);
    } catch (error) {
      console.error("Error loading more currencies:", error);
      toast.error(t("settings.currencies.fetchError", "Failed to load currencies"));
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchCurrencies();
  }, [orgId]);

  const handleFixedToggle = useCallback(async (currency: Currency) => {
    if (!orgId || !currency.symbol) return;

    const currencyKey = currency.id || currency.symbol;
    setUpdatingCurrencies((prev) => new Set(prev).add(currencyKey));

    try {
      if (currency.is_fixed) {
        // Deactivate: DELETE
        if (currency.id) {
          const response = await deleteOrgCurrency(orgId, currency.id);
          if (response.success) {
            toast.success(
              t("settings.currencies.unfixedSuccess", "Currency unfixed successfully")
            );
            // Update local state without refetching
            setCurrencies((prev) =>
              prev.map((c) =>
                c.symbol === currency.symbol
                  ? { ...c, is_fixed: false, id: null, exchange_rate: c.exchange_rate }
                  : c
              )
            );
          } else {
            toast.error(
              response.error || t("settings.currencies.unfixedError", "Failed to unfix currency")
            );
          }
        }
      } else {
        // Activate: POST with symbols
        const response = await postOrgCurrency(orgId, { symbols: [currency.symbol] });
        if (response.success) {
          toast.success(
            t("settings.currencies.fixedSuccess", "Currency fixed successfully")
          );
          // Update local state with the response data
          const createdCurrency = response.success.currencies?.[0];
          setCurrencies((prev) =>
            prev.map((c) =>
              c.symbol === currency.symbol
                ? { ...c, ...createdCurrency, is_fixed: true }
                : c
            )
          );
        } else {
          toast.error(
            response.error || t("settings.currencies.fixedError", "Failed to fix currency")
          );
        }
      }
    } catch (error) {
      console.error("Error toggling currency fixed status:", error);
      toast.error(t("settings.currencies.updateError", "Failed to update currency"));
    } finally {
      setUpdatingCurrencies((prev) => {
        const next = new Set(prev);
        next.delete(currencyKey);
        return next;
      });
    }
  }, [orgId, t]);

  const handleExchangeRateBlur = useCallback(async (currency: Currency, newRate: string) => {
    if (!orgId || !currency.id) return;

    const parsedRate = parseFloat(newRate);
    if (isNaN(parsedRate) || parsedRate === currency.exchange_rate) return;

    const currencyKey = currency.id;
    setUpdatingCurrencies((prev) => new Set(prev).add(currencyKey));

    try {
      const response = await patchOrgCurrency(orgId, currency.id, {
        exchange_rate: parsedRate,
      });
      if (response.success) {
        toast.success(
          t("settings.currencies.rateUpdated", "Exchange rate updated successfully")
        );
        // Update local state with the response data
        const updatedCurrency = response.success.currency;
        if (updatedCurrency) {
          setCurrencies((prev) =>
            prev.map((c) => (c.id === currency.id ? { ...c, ...updatedCurrency } : c))
          );
        } else {
          // Fallback: update just the exchange rate locally
          setCurrencies((prev) =>
            prev.map((c) =>
              c.id === currency.id ? { ...c, exchange_rate: parsedRate, updated_at: new Date().toISOString() } : c
            )
          );
        }
      } else {
        toast.error(
          response.error || t("settings.currencies.rateError", "Failed to update exchange rate")
        );
      }
    } catch (error) {
      console.error("Error updating exchange rate:", error);
      toast.error(t("settings.currencies.updateError", "Failed to update currency"));
    } finally {
      setUpdatingCurrencies((prev) => {
        const next = new Set(prev);
        next.delete(currencyKey);
        return next;
      });
    }
  }, [orgId, t]);

  return (
    <>
      <PageHeader
        title={t("settings.currencies.title", "Currencies")}
        description={t(
          "settings.currencies.description",
          "Manage currencies and exchange rates for your organization"
        )}
        showBackButton={true}
      />

      <TipsCard
        summary={
          <div className="flex items-center justify-between gap-4">
            <p>
              {t(
                "settings.currencies.infoText",
                "Exchange rates are updated automatically every day at midnight UTC. All rates are referenced to your default currency."
              )}{" "}
              {t("settings.currencies.changeDefaultCurrency", "You can change it in")}{" "}
              <Link
                to={`/${orgId}/admin/org`}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {t("settings.currencies.orgSettings", "Organization Settings")}
              </Link>
              .
            </p>
            <div className="flex items-center gap-2 shrink-0 rounded-md bg-muted px-3 py-2">
              <span className="text-lg font-semibold">
                {CURRENCIES.find((c) => c.code === org?.currency)?.symbol || "€"}
              </span>
              <span className="text-sm font-medium">
                {CURRENCIES.find((c) => c.code === org?.currency)?.name || "Euro"} ({org?.currency || "EUR"})
              </span>
            </div>
          </div>
        }
        variant="row"
        doc={{ slug: "pd_admin_currencies" }}
      />

      <div className="flex items-center gap-2">
        <SearchBar
          value={searchQuery}
          className="flex-1"
          isLoading={isSearching}
          onChange={(query) => setSearchQuery(query)}
          onSearch={fetchCurrencies}
          placeholder={t("settings.currencies.searchPlaceholder", "Search currencies...")}
        />
        <CurrenciesColumnSelector
          columnVisibility={columnVisibility}
          columnOrder={columnOrder}
          onColumnVisibilityChange={handleColumnVisibilityChange}
          onColumnOrderChange={handleColumnOrderChange}
          onReset={resetPreferences}
        />
      </div>

      <CurrenciesTable
        currencies={currencies}
        isLoading={isLoading}
        searchQuery={searchQuery}
        updatingCurrencies={updatingCurrencies}
        onFixedToggle={handleFixedToggle}
        onExchangeRateBlur={handleExchangeRateBlur}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        columnOrder={columnOrder}
        onColumnOrderChange={setColumnOrder}
        columnSizing={columnSizing}
        onColumnSizingChange={setColumnSizing}
      />

      {nextPageToken && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={loadMoreCurrencies}
            disabled={loadingMore || isLoading}
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
    </>
  );
};

export default CurrenciesPage;
