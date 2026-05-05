import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { Plus, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/app/components/page-header";
import { useAbsencePolicy } from "../context/AbsencePolicyContext";
import IdBadge from "@/app/components/id-badge";
import { Button } from "@/components/ui/button";
import AbsencePolicyEditModal from "../components/absence-policy-edit-modal";
import AbsencePolicyDeleteModal from "../components/absence-policy-delete-modal";
import AbsencePolicyCounterEditModal from "./components/absence-policy-counter-edit-modal";
import DeleteDialog from "./components/absence-policy-counter-delete-modal";
import { CustomActionsDropdown } from "@/app/components/custom-actions-dropdown";
import {
    getAbsencePolicyCounters,
    deleteAbsencePolicyCounters,
    deleteAbsencePolicy,
} from "@/api/orgs/absences/absences";
import TableFiltersRow from "@/app/components/table-filters/table-filters";
import SearchBar from "@/app/components/search-bar";
import { AbsenceCounter } from "@/types/general/absences";
import { useTableFilters } from "@/hooks/use-table-filters";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import AbsencePolicyCounterInboxList from "./components/absence-policy-counter-inbox-list";
import AbsencePolicyCounterDetailView from "./components/absence-policy-counter-detail-view";

const AbsencePolicyDetailPage = React.memo(() => {
    const { t } = useTranslation();
    const { absencePolicy, refetchAbsencePolicy } = useAbsencePolicy();
    const { orgId, policyId } = useParams<{ orgId: string; policyId: string }>();
    const navigate = useNavigate();

    const [counters, setCounters] = useState<AbsenceCounter[]>([]);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const { tableFilters, setTableFilters } = useTableFilters();

    const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
    const [searchQuery, setSearchQuery] = useState("");

    const availableYears = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const years: number[] = [];
        for (let year = currentYear - 5; year <= currentYear + 5; year++) {
            years.push(year);
        }
        return years;
    }, []);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeletePolicyModalOpen, setIsDeletePolicyModalOpen] = useState(false);
    const [isDeletingPolicy, setIsDeletingPolicy] = useState(false);
    const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);
    /** When set, create modal opens prefilled from this counter (duplicate). */
    const [counterDuplicateSource, setCounterDuplicateSource] = useState<AbsenceCounter | null>(
        null
    );
    /** Counter shown in the right-hand preview panel */
    const [previewCounter, setPreviewCounter] = useState<AbsenceCounter | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [counterToDelete, setCounterToDelete] = useState<AbsenceCounter | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchCounters = async (queryArg?: string) => {
        if (!orgId || !policyId) return;

        const queryParam = (queryArg !== undefined ? queryArg : searchQuery).trim() || undefined;

        setIsLoading(true);
        try {
            const response = await getAbsencePolicyCounters(
                orgId,
                policyId,
                String(selectedYear),
                queryParam,
                undefined,
                tableFilters || undefined
            );
            if (response.success) {
                const data = response.success;
                const list = data.policy_counters || [];
                setCounters(list);
                setNextPageToken(data.next_page_token || null);
                if (!tableFilters) {
                    setTableFilters(data.params);
                }
                setPreviewCounter((prev) => {
                    if (list.length === 0) return null;
                    if (prev) {
                        const updated = list.find((c: AbsenceCounter) => c.id === prev.id);
                        if (updated) return updated;
                    }
                    return list[0];
                });
            } else {
                toast.error(t("absences.counters.errorFetchingCounters") || "Error fetching counters");
            }
        } catch (error) {
            toast.error(t("absences.counters.errorFetchingCounters") || "Error fetching counters");
            console.error("Error fetching counters:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (orgId && policyId) {
            fetchCounters();
        }
    }, [orgId, policyId, selectedYear]);

    const loadMoreCounters = async () => {
        if (!orgId || !policyId || !nextPageToken || isLoadingMore || isLoading) return;

        setIsLoadingMore(true);
        try {
            const queryParam = searchQuery.trim() || undefined;
            const response = await getAbsencePolicyCounters(
                orgId,
                policyId,
                String(selectedYear),
                queryParam,
                nextPageToken,
                tableFilters || undefined
            );
            if (response.success && response.success.policy_counters) {
                setCounters((prev) => [...prev, ...response.success.policy_counters]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("absences.counters.errorFetchingCounters") || "Error fetching counters");
            }
        } catch (error) {
            toast.error(t("absences.counters.errorFetchingCounters") || "Error fetching counters");
            console.error("Error fetching counters:", error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const handleEdit = () => {
        setIsEditModalOpen(true);
    };

    const handleEditModalClose = (open: boolean) => {
        setIsEditModalOpen(open);
        if (!open) {
            setIsDeletePolicyModalOpen(false);
        }
    };

    const handlePolicyUpdated = async () => {
        await refetchAbsencePolicy();
    };

    const handleDeletePolicy = () => {
        setIsDeletePolicyModalOpen(true);
    };

    const handleDeletePolicyConfirm = async () => {
        if (!absencePolicy || !orgId) return;

        setIsDeletingPolicy(true);
        try {
            const response = await deleteAbsencePolicy(orgId, absencePolicy.id);
            if (response.success) {
                toast.success(t("absence-policies.policyDeleted", "Absence policy deleted successfully"));
                navigate(`/${orgId}/admin/absence-policies`);
            } else {
                toast.error(t("absence-policies.errorDeletingPolicy", "Error deleting absence policy"));
            }
        } catch (error) {
            toast.error(t("absence-policies.errorDeletingPolicy", "Error deleting absence policy"));
        } finally {
            setIsDeletingPolicy(false);
            setIsDeletePolicyModalOpen(false);
        }
    };

    const handleAddCounter = () => {
        setCounterDuplicateSource(null);
        setIsCounterModalOpen(true);
    };

    const handleDuplicateCounter = (source: AbsenceCounter) => {
        setCounterDuplicateSource(source);
        setIsCounterModalOpen(true);
    };

    const handleCounterModalClose = (open: boolean) => {
        setIsCounterModalOpen(open);
        if (!open) {
            setIsDeleteModalOpen(false);
        }
    };

    const handleCounterCreatedOrUpdated = () => {
        fetchCounters();
        handleCounterModalClose(false);
    };

    const handleOpenDeleteModal = (counter: AbsenceCounter) => {
        setCounterToDelete(counter);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = (open: boolean) => {
        if (!open) {
            setIsDeleteModalOpen(false);
            setCounterToDelete(null);
            setIsDeleting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!counterToDelete || !orgId || !policyId) return;

        setIsDeleting(true);
        try {
            const response = await deleteAbsencePolicyCounters(orgId, policyId, counterToDelete.id);
            if (response.success) {
                toast.success(t("absence-policies.counters.deletedSuccess", "Counter deleted successfully"));
                setPreviewCounter((prev) =>
                    prev?.id === counterToDelete.id ? null : prev
                );
                await fetchCounters();
                handleCloseDeleteModal(false);
            } else {
                toast.error(t("absence-policies.counters.deleteError", "Failed to delete counter"));
            }
        } catch (error) {
            console.error("Error deleting counter:", error);
            toast.error(t("absence-policies.counters.deleteError", "Failed to delete counter"));
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCounterClick = (counter: AbsenceCounter) => {
        setPreviewCounter(counter);
    };

    return (
        <>
            <PageHeader
                title={absencePolicy?.name || ""}
                description={absencePolicy?.description || ""}
                action={
                    <div className="flex items-center gap-2">
                        <IdBadge id={absencePolicy?.id || ""} />
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("common.edit", "Edit"),
                                    icon: "edit",
                                    onClick: handleEdit,
                                },
                                {
                                    label: t("common.delete", "Delete"),
                                    icon: "trash-2",
                                    onClick: handleDeletePolicy,
                                    variant: "destructive",
                                },
                            ]}
                        />
                    </div>
                }
            />

            <div className="space-y-6">
                <ResizablePanelGroup direction="horizontal" className="max-h-[calc(100vh-10rem)]">
                    <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
                        <div className="h-full flex flex-col pr-2">
                            <div className="pr-4 flex flex-col gap-4 pb-4">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <SearchBar
                                        value={searchQuery}
                                        onChange={setSearchQuery}
                                        onSearch={(q) => fetchCounters(q)}
                                        placeholder={t(
                                            "absence-policies.counters.searchPlaceholder",
                                            "Search counters…"
                                        )}
                                        disabled={isLoading}
                                        isLoading={isLoading}
                                        className="w-full sm:max-w-md sm:flex-1"
                                    />
                                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                                        <Select
                                            value={selectedYear.toString()}
                                            onValueChange={(value) =>
                                                setSelectedYear(parseInt(value, 10))
                                            }
                                            disabled={isLoading}
                                        >
                                            <SelectTrigger className="w-fit min-w-[5rem]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableYears.map((year) => (
                                                    <SelectItem key={year} value={year.toString()}>
                                                        {year}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Button onClick={handleAddCounter}>
                                            <Plus className="mr-0 h-4 w-4" />
                                            {t("common.add", "Add")}
                                        </Button>
                                    </div>
                                </div>
                                {tableFilters && (
                                    <TableFiltersRow
                                        value={tableFilters}
                                        onChange={(filters) => setTableFilters(filters)}
                                        onFilter={(_) => fetchCounters()}
                                    />
                                )}
                            </div>
                            <AbsencePolicyCounterInboxList
                                counters={counters}
                                isLoading={isLoading}
                                nextPageToken={nextPageToken}
                                loadingMore={isLoadingMore}
                                onLoadMore={loadMoreCounters}
                                onCounterClick={handleCounterClick}
                                selectedCounterId={previewCounter?.id ?? null}
                            />
                        </div>
                    </ResizablePanel>

                    <ResizableHandle />

                    <ResizablePanel defaultSize={65} minSize={50}>
                        <ScrollArea className="h-full pl-4">
                            {previewCounter ? (
                                <AbsencePolicyCounterDetailView
                                    counter={previewCounter}
                                    orgId={orgId!}
                                    policyId={policyId!}
                                    onSaved={fetchCounters}
                                    onDeleteClick={() => handleOpenDeleteModal(previewCounter)}
                                    onDuplicateClick={() => handleDuplicateCounter(previewCounter)}
                                />
                            ) : (
                                <Card className="p-6 h-[calc(100vh-6rem)] shadow-none">
                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                        <Inbox className="h-16 w-16 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-medium text-muted-foreground mb-2">
                                            {t(
                                                "absence-policies.counters.selectCounter",
                                                "Select a counter"
                                            )}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {t(
                                                "absence-policies.counters.selectCounterDescription",
                                                "Choose a counter from the list to view its details"
                                            )}
                                        </p>
                                    </div>
                                </Card>
                            )}
                        </ScrollArea>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>

            {absencePolicy && orgId && (
                <AbsencePolicyEditModal
                    open={isEditModalOpen}
                    onOpenChange={handleEditModalClose}
                    onAbsencePolicyCreatedOrUpdated={handlePolicyUpdated}
                    orgId={orgId}
                    policy={absencePolicy}
                    mode="edit"
                    renderActions={() => (
                        <CustomActionsDropdown
                            items={[
                                {
                                    label: t("common.delete", "Delete"),
                                    icon: "trash-2",
                                    onClick: () => {
                                        setIsEditModalOpen(false);
                                        handleDeletePolicy();
                                    },
                                    variant: "destructive",
                                },
                            ]}
                        />
                    )}
                />
            )}

            {absencePolicy && (
                <AbsencePolicyDeleteModal
                    open={isDeletePolicyModalOpen}
                    onOpenChange={setIsDeletePolicyModalOpen}
                    policy={absencePolicy as any}
                    onConfirm={handleDeletePolicyConfirm}
                    isDeleting={isDeletingPolicy}
                />
            )}

            {orgId && absencePolicy && (
                <AbsencePolicyCounterEditModal
                    open={isCounterModalOpen}
                    onOpenChange={handleCounterModalClose}
                    onCounterCreatedOrUpdated={handleCounterCreatedOrUpdated}
                    orgId={orgId}
                    policyId={absencePolicy.id}
                    counter={undefined}
                    duplicateSource={counterDuplicateSource ?? undefined}
                    mode="create"
                />
            )}

            <DeleteDialog
                open={isDeleteModalOpen}
                onOpenChange={handleCloseDeleteModal}
                title={t("absence-policies.counters.deleteCounter", "Delete Counter")}
                description={t(
                    "absence-policies.counters.deleteCounterConfirmation",
                    "Are you sure you want to delete this counter? This action cannot be undone."
                )}
                itemName={counterToDelete?.name}
                itemDescription={
                    counterToDelete?.description ? `(${counterToDelete.description})` : undefined
                }
                onConfirm={handleConfirmDelete}
                isDeleting={isDeleting}
            />
        </>
    );
});

export default AbsencePolicyDetailPage;
