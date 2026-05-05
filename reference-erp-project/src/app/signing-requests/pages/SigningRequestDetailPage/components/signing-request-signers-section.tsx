import { useTranslation } from "@/hooks/useTranslation";
import SearchBar from "@/app/components/search-bar";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useSigningRequest } from "@/app/signing-requests/contexts/SigningRequestContext";
import SigningRequestDocumentsSection from "./signing-request-documents-section";
import SigningRequestSignersTable from "./signing-request-signers-table";

const SigningRequestSignersSection = () => {
    const { t } = useTranslation();
    const {
        signedDocumentEntries,
        evidenceDocumentEntries,
        signers,
        isLoadingSigners,
        loadMoreSigners,
        loadingMoreSigners,
        nextPageTokenSigners,
        searchQuerySigners,
        setSearchQuerySigners,
        searchSigners,
        isSearchingSigners,
    } = useSigningRequest();

    return (
        <div className="flex min-h-0 flex-col gap-6">
            <SigningRequestDocumentsSection />

            <div className="space-y-4">
                <SearchBar
                    value={searchQuerySigners}
                    className="w-full"
                    isLoading={isSearchingSigners}
                    onChange={(query) => setSearchQuerySigners(query)}
                    onSearch={searchSigners}
                    placeholder={t(
                        "signingRequests.detail.searchSignersPlaceholder",
                        "Search signers…"
                    )}
                />

                <SigningRequestSignersTable
                    signedDocumentEntries={signedDocumentEntries}
                    evidenceDocumentEntries={evidenceDocumentEntries}
                    signers={signers}
                    isLoading={isLoadingSigners}
                    searchQuery={searchQuerySigners}
                />

                {nextPageTokenSigners && (
                    <div className="flex justify-center pt-2">
                        <Button
                            variant="outline"
                            onClick={() => loadMoreSigners()}
                            disabled={loadingMoreSigners}
                            className="min-w-32"
                        >
                            {loadingMoreSigners ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {t("common.loading", "Loading…")}
                                </>
                            ) : (
                                t("common.loadMore", "Load more")
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SigningRequestSignersSection;
