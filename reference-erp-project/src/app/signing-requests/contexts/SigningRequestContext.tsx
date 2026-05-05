import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useParams } from "react-router";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import {
    getSigningRequest,
    getSigningRequestOriginalDocument,
    getSigningRequestSignedDocument,
    getSigningRequestEvidenceDocument,
    getSigningRequestSigners,
    parseSigningRequestDocumentResponse,
    parseSigningRequestDocumentEntriesList,
    type SigningRequestDocumentRow,
} from "@/api/orgs/signing-requests/signing-requests";
import { Signer, SigningRequest } from "@/types/general/signing-requests";
import type { File as OrgFile } from "@/types/general/files";

function revokeDocumentBlobUrl(url: string | undefined) {
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
}

function revokeSigningRequestDocumentRows(rows: SigningRequestDocumentRow[]) {
    rows.forEach((r) => revokeDocumentBlobUrl(r.file.url));
}

interface SigningRequestContextType {
    signingRequest: SigningRequest;
    refreshSigningRequest: () => void;
    originalDocument: OrgFile | null;
    signedDocument: OrgFile | null;
    evidenceDocument: OrgFile | null;
    /** Email from the first API row (decoded Base64 document), if present. */
    originalDocumentSignerEmail: string | null;
    isLoadingOriginalDocument: boolean;
    isLoadingSignedDocument: boolean;
    isLoadingEvidenceDocument: boolean;
    signedDocumentSignerEmail: string | null;
    evidenceDocumentSignerEmail: string | null;
    /** Decoded signed PDFs per API row (match signers by `email` / `employee_id`). */
    signedDocumentEntries: SigningRequestDocumentRow[];
    evidenceDocumentEntries: SigningRequestDocumentRow[];
    signers: Signer[];
    refreshSigners: () => void;
    loadMoreSigners: () => void;
    isLoadingSigners: boolean;
    loadingMoreSigners: boolean;
    nextPageTokenSigners: string | null;
    isSearchingSigners: boolean;
    searchQuerySigners: string;
    setSearchQuerySigners: (query: string) => void;
    searchSigners: (query: string) => void;
}

const SigningRequestContext = createContext<SigningRequestContextType | undefined>(undefined);

export const SigningRequestProvider = ({ children }: { children: React.ReactNode }) => {
    const [signingRequest, setSigningRequest] = useState<SigningRequest | null>(null);
    const [originalDocument, setOriginalDocument] = useState<OrgFile | null>(null);
    const [signedDocument, setSignedDocument] = useState<OrgFile | null>(null);
    const [evidenceDocument, setEvidenceDocument] = useState<OrgFile | null>(null);
    const [originalDocumentSignerEmail, setOriginalDocumentSignerEmail] = useState<string | null>(null);
    const [isLoadingOriginalDocument, setIsLoadingOriginalDocument] = useState(false);
    const [isLoadingSignedDocument, setIsLoadingSignedDocument] = useState(false);
    const [isLoadingEvidenceDocument, setIsLoadingEvidenceDocument] = useState(false);
    const [signedDocumentSignerEmail, setSignedDocumentSignerEmail] = useState<string | null>(null);
    const [evidenceDocumentSignerEmail, setEvidenceDocumentSignerEmail] = useState<string | null>(null);
    const [signedDocumentEntries, setSignedDocumentEntries] = useState<SigningRequestDocumentRow[]>([]);
    const [evidenceDocumentEntries, setEvidenceDocumentEntries] = useState<SigningRequestDocumentRow[]>([]);
    const [signers, setSigners] = useState<Signer[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingSigners, setIsLoadingSigners] = useState(false);
    const [loadingMoreSigners, setLoadingMoreSigners] = useState(false);
    const [nextPageTokenSigners, setNextPageTokenSigners] = useState<string | null>(null);
    const [searchQuerySigners, setSearchQuerySigners] = useState<string>("");
    const [isSearchingSigners, setIsSearchingSigners] = useState(false);
    const { signingRequestId, orgId } = useParams<{ signingRequestId: string, orgId: string }>();

    const fetchSigningRequest = async (id: string) => {
        if (!orgId || !id) return;
        try {
            setIsLoading(true);
            const response = await getSigningRequest(orgId, id);
            if (response.success) {
                setSigningRequest(response.success.signing_request);
            }
        } catch (error) {
            console.error("Error fetching signing request:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchOriginalDocument = async (signingRequestId: string) => {
        setIsLoadingOriginalDocument(true);
        if (!orgId) return;
        try {
            const response = await getSigningRequestOriginalDocument(orgId, signingRequestId);
            if (response.success) {
                const parsed = parseSigningRequestDocumentResponse(response.success.documents, "original");
                setOriginalDocument((prev) => {
                    revokeDocumentBlobUrl(prev?.url);
                    return parsed?.file ?? null;
                });
                setOriginalDocumentSignerEmail(parsed?.signerEmail ?? null);
            }
        } catch (error) {
            console.error("Error fetching original document:", error);
        } finally {
            setIsLoadingOriginalDocument(false);
        }
    };

    const fetchSignedDocument = async (signingRequestId: string) => {
        setIsLoadingSignedDocument(true);
        if (!orgId) return;
        try {
            const response = await getSigningRequestSignedDocument(orgId, signingRequestId);
            if (response.success) {
                const list = parseSigningRequestDocumentEntriesList(response.success.documents, "signed");
                setSignedDocumentEntries((prev) => {
                    revokeSigningRequestDocumentRows(prev);
                    return list;
                });
                const first = list[0];
                setSignedDocument((prev) => {
                    revokeDocumentBlobUrl(prev?.url);
                    return first?.file ?? null;
                });
                setSignedDocumentSignerEmail(first?.email?.trim() ?? null);
            }
        } catch (error) {
            console.error("Error fetching signed document:", error);
        } finally {
            setIsLoadingSignedDocument(false);
        }
    };

    const fetchEvidenceDocument = async (signingRequestId: string) => {
        setIsLoadingEvidenceDocument(true);
        if (!orgId) return;
        try {
            const response = await getSigningRequestEvidenceDocument(orgId, signingRequestId);
            if (response.success) {
                const list = parseSigningRequestDocumentEntriesList(response.success.documents, "evidence");
                setEvidenceDocumentEntries((prev) => {
                    revokeSigningRequestDocumentRows(prev);
                    return list;
                });
                const first = list[0];
                setEvidenceDocument((prev) => {
                    revokeDocumentBlobUrl(prev?.url);
                    return first?.file ?? null;
                });
                setEvidenceDocumentSignerEmail(first?.email?.trim() ?? null);
            }
        } catch (error) {
            console.error("Error fetching evidence document:", error);
        } finally {
            setIsLoadingEvidenceDocument(false);
        }
    };

    const fetchSignersFirstPage = useCallback(
        async (query: string = "") => {
            if (!orgId || !signingRequestId) return;
            setSearchQuerySigners(query);
            if (query.trim()) {
                setIsSearchingSigners(true);
            } else {
                setIsLoadingSigners(true);
            }
            try {
                const response = await getSigningRequestSigners(orgId, signingRequestId, query || undefined);
                if (response.success) {
                    setSigners(response.success.signers);
                    setNextPageTokenSigners(response.success.next_page_token || null);
                }
            } catch (error) {
                console.error("Error fetching signers:", error);
            } finally {
                setIsSearchingSigners(false);
                setIsLoadingSigners(false);
            }
        },
        [orgId, signingRequestId]
    );

    const loadMoreSigners = async () => {
        if (!orgId || !signingRequestId || !nextPageTokenSigners || loadingMoreSigners || isLoadingSigners) return;
        setLoadingMoreSigners(true);
        try {
            const response = await getSigningRequestSigners(orgId, signingRequestId, searchQuerySigners || undefined, nextPageTokenSigners);
            if (response.success) {
                setSigners(prev => [...prev, ...response.success.signers]);
                setNextPageTokenSigners(response.success.next_page_token || null);
            }
        } catch (error) {
            console.error("Error loading more signers:", error);
        } finally {
            setLoadingMoreSigners(false);
        }
    };

    useEffect(() => {
        if (orgId && signingRequestId) {
            setOriginalDocument((prev) => {
                revokeDocumentBlobUrl(prev?.url);
                return null;
            });
            setSignedDocument((prev) => {
                revokeDocumentBlobUrl(prev?.url);
                return null;
            });
            setEvidenceDocument((prev) => {
                revokeDocumentBlobUrl(prev?.url);
                return null;
            });
            setSignedDocumentEntries((prev) => {
                revokeSigningRequestDocumentRows(prev);
                return [];
            });
            setEvidenceDocumentEntries((prev) => {
                revokeSigningRequestDocumentRows(prev);
                return [];
            });
            setOriginalDocumentSignerEmail(null);
            setSignedDocumentSignerEmail(null);
            setEvidenceDocumentSignerEmail(null);

            fetchSigningRequest(signingRequestId);
            fetchOriginalDocument(signingRequestId);
            fetchSignedDocument(signingRequestId);
            fetchEvidenceDocument(signingRequestId);
            void fetchSignersFirstPage("");
        }
    }, [orgId, signingRequestId, fetchSignersFirstPage]);

    if (isLoading || !signingRequest) {
        return <PageSkeleton showBackButton={true} showIcon={true} tabCount={4} variant="split" />;
    }

    const refreshSigningRequest = () => {
        if (orgId && signingRequestId) {
            fetchSigningRequest(signingRequestId);
            fetchOriginalDocument(signingRequestId);
            fetchSignedDocument(signingRequestId);
            fetchEvidenceDocument(signingRequestId);
            void fetchSignersFirstPage(searchQuerySigners);
        }
    };

    const refreshSigners = () => {
        void fetchSignersFirstPage(searchQuerySigners);
    };

    return (
        <SigningRequestContext.Provider
            value={{
                signingRequest,
                refreshSigningRequest,
                originalDocument,
                signedDocument,
                evidenceDocument,
                originalDocumentSignerEmail,
                isLoadingOriginalDocument,
                isLoadingSignedDocument,
                isLoadingEvidenceDocument,
                signedDocumentSignerEmail,
                evidenceDocumentSignerEmail,
                signedDocumentEntries,
                evidenceDocumentEntries,
                signers,
                refreshSigners,
                loadMoreSigners,
                isLoadingSigners,
                loadingMoreSigners,
                nextPageTokenSigners,
                isSearchingSigners,
                searchQuerySigners,
                setSearchQuerySigners,
                searchSigners: fetchSignersFirstPage,
            }}
        >
            {children}
        </SigningRequestContext.Provider>
    );
};

export const useSigningRequest = () => {
    const context = useContext(SigningRequestContext);
    if (context === undefined) {
        throw new Error("useSigningRequest must be used within an SigningRequestContext");
    }
    return context;
};

