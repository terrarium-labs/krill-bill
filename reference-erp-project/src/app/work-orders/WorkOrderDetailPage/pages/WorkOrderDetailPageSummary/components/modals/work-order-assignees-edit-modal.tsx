import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { deleteWorkOrderAssignee } from "@/api/field-service/work-orders/assignees/assignees";
import { useParams } from "react-router-dom";
import { useState } from "react";
import WorkOrderAssigneeAddModal from "./work-order-assignee-add-modal";
import WorkOrderAssigneeEditModal from "./work-order-assignee-edit-modal";
import WorkOrderAssigneeDeleteModal from "./work-order-assignee-delete-modal";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import SearchBar from "@/app/components/search-bar";
import { Assignee } from "@/types/field-service/work-orders/assignees";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useWorkOrder } from "@/app/work-orders/contexts/WorkOrderContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface WorkOrderAssigneesEditModalProps {
    editMode?: boolean;
    /** When provided with onOpenChange, renders as a modal instead of a card. */
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

const WorkOrderAssigneesEditModal = ({ editMode = false, open: modalOpen, onOpenChange: onModalOpenChange }: WorkOrderAssigneesEditModalProps) => {
    const { t } = useTranslation();
    const { orgId, workOrderId } = useParams<{ orgId: string, workOrderId: string }>();
    const {
        assignees,
        refreshAssignees,
        isSearchingAssignees: isSearching,
        isLoadingAssignees: isLoading,
        loadingMoreAssignees: loadingMore,
        nextPageTokenAssignees: nextPageToken,
        searchQueryAssignees: searchQuery,
        setSearchQueryAssignees: setSearchQuery,
        loadMoreAssignees,
    } = useWorkOrder();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAssignee, setEditingAssignee] = useState<Assignee | null>(null);
    const [assigneeToUnassign, setAssigneeToUnassign] = useState<Assignee | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleOpenAddModal = () => {
        setEditingAssignee(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (assignee: Assignee) => {
        setEditingAssignee(assignee);
        setIsModalOpen(true);
    };

    const handleModalClose = (open: boolean) => {
        setIsModalOpen(open);
        if (!open) {
            setEditingAssignee(null);
        }
    };

    const handleOpenUnassignModal = (assignee: Assignee) => {
        setAssigneeToUnassign(assignee);
    };

    const handleConfirmUnassign = async (notes: string) => {
        if (!orgId || !workOrderId || !assigneeToUnassign) return;

        const response = await deleteWorkOrderAssignee(orgId, workOrderId, assigneeToUnassign.employee.id, {
            notes,
        });
        if (response?.success !== false) {
            toast.success(t("workOrders.assigneeDeletedSuccessfully", "Assignee deleted successfully"));
            await refreshAssignees(searchQuery || "");
            setAssigneeToUnassign(null);
            if (editingAssignee?.employee.id === assigneeToUnassign.employee.id) {
                setIsModalOpen(false);
                setEditingAssignee(null);
            }
        } else {
            toast.error(response?.error ?? t("workOrders.errorDeletingAssignee", "Error deleting assignee"));
            throw new Error(response?.error);
        }
    };

    // Modal mode: render as Dialog when open/onOpenChange are provided
    if (modalOpen !== undefined && onModalOpenChange) {
        return (
            <>
                <Dialog open={modalOpen} onOpenChange={onModalOpenChange}>
                    <DialogContent showCloseButton={false} className="max-w-lg max-h-[85vh] flex flex-col gap-4 p-4">
                        <DialogHeader className="flex flex-row items-center justify-between space-y-0 gap-2">
                            <DialogTitle className="text-lg">
                                {t('workOrdersDetail.assignees', 'Assignees')}
                            </DialogTitle>
                            {editMode && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleOpenAddModal}
                                >
                                    <Plus className="h-4 w-4" />
                                    {t('workOrdersDetail.addAssignee', 'Add')}
                                </Button>
                            )}
                        </DialogHeader>
                        <SearchBar
                            value={searchQuery ?? ""}
                            isLoading={isSearching}
                            onChange={(query) => setSearchQuery(query)}
                            onSearch={() => refreshAssignees()}
                            placeholder={t('workOrdersDetail.searchAssignees', 'Search assignees...')}
                        />
                        <div className="flex-1 min-h-0 overflow-y-auto -mx-2 px-2 space-y-2">
                            {isLoading ? (
                                <div className="flex items-center justify-center p-6">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : assignees.length === 0 ? (
                                <div className="text-sm text-muted-foreground py-6 text-center">
                                    {t('workOrdersDetail.noAssigneesAdded', 'No assignees added yet')}
                                </div>
                            ) : (
                                assignees.map((assignee) => (
                                    <div
                                        key={assignee.employee.id}
                                        onClick={() => editMode && handleOpenEditModal(assignee)}
                                        className={cn(
                                            "flex items-center justify-between text-sm py-2 px-2 rounded transition-colors",
                                            editMode ? "cursor-pointer hover:bg-muted/50" : "cursor-default"
                                        )}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <EmployeeAvatar
                                                employee={assignee.employee as any}
                                                showJobTitle={true}
                                            />
                                            {assignee.notes && (
                                                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                    {assignee.notes}
                                                </div>
                                            )}
                                        </div>
                                        {editMode && (
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <CustomActionsDropdown
                                                    items={[
                                                        {
                                                            label: t('common.edit', 'Edit'),
                                                            icon: 'edit',
                                                            onClick: () => handleOpenEditModal(assignee),
                                                        },
                                                        {
                                                            label: t('common.unassign', 'Unassign'),
                                                            icon: 'user-round-x',
                                                            onClick: () => handleOpenUnassignModal(assignee),
                                                            variant: 'destructive',
                                                        },
                                                    ]}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                            {!isLoading && nextPageToken && (
                                <div className="flex justify-center pt-2 pb-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => loadMoreAssignees()}
                                        disabled={loadingMore}
                                    >
                                        {loadingMore ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                {t('common.loading', 'Loading...')}
                                            </>
                                        ) : (
                                            t('common.showMore', 'Show More')
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
                {orgId && workOrderId && (
                    <>
                        <WorkOrderAssigneeAddModal
                            open={isModalOpen && editingAssignee === null}
                            onOpenChange={(open) => {
                                setIsModalOpen(open);
                                if (!open) setEditingAssignee(null);
                            }}
                            orgId={orgId}
                            workOrderId={workOrderId}
                            onSuccess={() => refreshAssignees(searchQuery || "")}
                        />
                        <WorkOrderAssigneeEditModal
                            open={isModalOpen && editingAssignee !== null}
                            onOpenChange={handleModalClose}
                            orgId={orgId}
                            workOrderId={workOrderId}
                            assignee={editingAssignee}
                            onSuccess={() => refreshAssignees(searchQuery || "")}
                            renderActions={
                                editingAssignee ? (
                                    <CustomActionsDropdown
                                        items={[
                                            {
                                                label: t("common.edit", "Edit"),
                                                icon: "edit",
                                                onClick: () => {},
                                                showOption: false,
                                            },
                                            {
                                                label: t("common.unassign", "Unassign"),
                                                icon: "user-round-x",
                                                onClick: () => handleOpenUnassignModal(editingAssignee),
                                                variant: "destructive",
                                            },
                                        ]}
                                    />
                                ) : undefined
                            }
                        />
                        <WorkOrderAssigneeDeleteModal
                            open={!!assigneeToUnassign}
                            onOpenChange={(open) => !open && setAssigneeToUnassign(null)}
                            assignee={assigneeToUnassign}
                            onConfirm={handleConfirmUnassign}
                        />
                    </>
                )}
            </>
        );
    }

    // Render assignees in collapsed view (show more avatars to fill the row)
    const renderAssigneesCollapsed = () => {
        if (assignees.length === 0) {
            return null;
        }
        if (assignees.length === 1) {
            return (
                <div className="flex items-center gap-1 ml-2 h-7">
                    <EmployeeAvatar
                        employee={assignees[0].employee as any}
                        showName={true}
                    />
                </div>
            );
        }

        // Show more avatars (7) before truncating to fill the row better
        const maxVisible = 7;
        const visibleAssignees = assignees.slice(0, maxVisible);
        const remainingAssignees = assignees.slice(maxVisible);
        const remainingNames = remainingAssignees.map(assignee => {
            const firstName = assignee.employee.first_name || '';
            const lastName = assignee.employee.last_name || '';
            return `${firstName} ${lastName}`.trim() || assignee.employee.email || 'Unknown';
        }).join(', ');

        return (
            <div className="flex items-center gap-1 ml-2 h-7">
                {visibleAssignees.map((assignee, index) => (
                    <div
                        key={assignee.employee.id}
                        style={{ marginLeft: index > 0 ? "-8px" : "0" }}
                        className="flex-shrink-0"
                    >
                        <EmployeeAvatar
                            employee={assignee.employee as any}
                            showName={false}
                            size="sm"
                            onHover={true}
                        />
                    </div>
                ))}
                {assignees.length > maxVisible && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium ml-[-8px] cursor-pointer hover:opacity-80 flex-shrink-0">
                                    +{assignees.length - maxVisible}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <div className="max-w-xs">
                                    {remainingNames}
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
        );
    };

    if (assignees.length === 0 && !isLoading && !isSearching) {
        return (
            <>
                <Card className="shadow-none max-h-[170px] h-auto">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 justify-between">
                            <span className="flex items-center gap-2">
                                {t('workOrdersDetail.assignees', 'Assignees')}
                            </span>
                            {editMode && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleOpenAddModal}
                                >
                                    <Plus className="h-4 w-4" />
                                    {t('workOrdersDetail.addAssignee', 'Add')}
                                </Button>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="text-sm text-muted-foreground py-4 text-center">
                            {t('workOrdersDetail.noAssigneesAdded', 'No assignees added yet')}
                        </div>
                    </CardContent>
                </Card>
                {orgId && workOrderId && (
                    <>
                        <WorkOrderAssigneeAddModal
                            open={isModalOpen && editingAssignee === null}
                            onOpenChange={(open) => {
                                setIsModalOpen(open);
                                if (!open) setEditingAssignee(null);
                            }}
                            orgId={orgId}
                            workOrderId={workOrderId}
                            onSuccess={() => refreshAssignees(searchQuery || "")}
                        />
                        <WorkOrderAssigneeEditModal
                            open={isModalOpen && editingAssignee !== null}
                            onOpenChange={handleModalClose}
                            orgId={orgId}
                            workOrderId={workOrderId}
                            assignee={editingAssignee}
                            onSuccess={() => refreshAssignees(searchQuery || "")}
                            renderActions={
                                editingAssignee ? (
                                    <CustomActionsDropdown
                                        items={[
                                            { label: t("common.edit", "Edit"), icon: "edit", onClick: () => {}, showOption: false },
                                            {
                                                label: t("common.unassign", "Unassign"),
                                                icon: "user-round-x",
                                                onClick: () => handleOpenUnassignModal(editingAssignee),
                                                variant: "destructive",
                                            },
                                        ]}
                                    />
                                ) : undefined
                            }
                        />
                        <WorkOrderAssigneeDeleteModal
                            open={!!assigneeToUnassign}
                            onOpenChange={(open) => !open && setAssigneeToUnassign(null)}
                            assignee={assigneeToUnassign}
                            onConfirm={handleConfirmUnassign}
                        />
                    </>
                )}
            </>
        );
    }

    return (
        <>
            <Card className={cn(
                "shadow-none p-0",
                isExpanded ? "flex flex-col h-auto max-h-[420px] gap-0" : "h-auto border-0 bg-transparent mb-2"
            )}>
                <CardHeader className="p-0">
                    <div
                        className={cn(
                            "w-full h-21 px-4 justify-center border border-border flex flex-col rounded-xl gap-0.5 cursor-pointer hover:bg-muted/50 transition-colors",
                            isExpanded && "rounded-b-none border-0"
                        )}
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                )}
                                <CardTitle className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="flex items-center gap-2 h-7">
                                        {!isExpanded && assignees.length === 1 ? t('workOrdersDetail.assignee', 'Assignee') : t('workOrdersDetail.assignees', 'Assignees')}
                                        {isExpanded && <Badge variant="secondary">{assignees.length}</Badge>}
                                    </span>
                                    {!isExpanded && renderAssigneesCollapsed()}
                                </CardTitle>
                            </div>
                            {isExpanded && editMode && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenAddModal();
                                    }}
                                >
                                    <Plus className="h-4 w-4" />
                                    {t('workOrdersDetail.addAssignee', 'Add')}
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                {isExpanded && (
                    <>
                        <CardContent className="pb-4">
                            <SearchBar
                                value={searchQuery}
                                isLoading={isSearching}
                                onChange={(query) => setSearchQuery(query)}
                                onSearch={() => refreshAssignees()}
                                placeholder={t('workOrdersDetail.searchAssignees', 'Search assignees...')}
                            />
                        </CardContent>
                        <div className="flex-1 flex flex-col min-h-0">
                            {isLoading ? (
                                <div className="flex-1 flex items-center justify-center p-6">
                                    <div className="text-sm text-muted-foreground">
                                        {t('common.loading', 'Loading...')}
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-muted/10 px-3 max-h-[420px]">
                                    {assignees.map((assignee) => (
                                        <div
                                            key={assignee.employee.id}
                                            onClick={() => editMode && handleOpenEditModal(assignee)}
                                            className={cn(
                                                "flex items-center justify-between text-sm py-2 px-2 rounded transition-colors group",
                                                editMode ? "cursor-pointer hover:bg-muted/50" : "cursor-default"
                                            )}
                                        >
                                            <div className="flex-1">
                                                <EmployeeAvatar
                                                    employee={assignee.employee as any}
                                                    showJobTitle={true}
                                                />
                                                {assignee.notes && (
                                                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                        {assignee.notes}
                                                    </div>
                                                )}
                                            </div>
                                            {editMode && (
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <CustomActionsDropdown
                                                        items={[
                                                            {
                                                                label: t('common.edit', 'Edit'),
                                                                icon: 'edit',
                                                                onClick: () => handleOpenEditModal(assignee),
                                                            },
                                                            {
                                                                label: t('common.unassign', 'Unassign'),
                                                                icon: 'user-round-x',
                                                                onClick: () => handleOpenUnassignModal(assignee),
                                                                variant: 'destructive',
                                                            },
                                                        ]}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {nextPageToken && (
                                        <div className="flex justify-center pt-2 pb-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => loadMoreAssignees()}
                                                disabled={loadingMore}
                                            >
                                                {loadingMore ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        {t('common.loading', 'Loading...')}
                                                    </>
                                                ) : (
                                                    t('common.showMore', 'Show More')
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </Card>
            {orgId && workOrderId && (
                <>
                    <WorkOrderAssigneeAddModal
                        open={isModalOpen && editingAssignee === null}
                        onOpenChange={(open) => {
                            setIsModalOpen(open);
                            if (!open) setEditingAssignee(null);
                        }}
                        orgId={orgId}
                        workOrderId={workOrderId}
                        onSuccess={() => refreshAssignees(searchQuery || "")}
                    />
                    <WorkOrderAssigneeEditModal
                        open={isModalOpen && editingAssignee !== null}
                        onOpenChange={handleModalClose}
                        orgId={orgId}
                        workOrderId={workOrderId}
                        assignee={editingAssignee}
                        onSuccess={() => refreshAssignees(searchQuery || "")}
                        renderActions={
                            editingAssignee ? (
                                <CustomActionsDropdown
                                    items={[
                                        { label: t("common.edit", "Edit"), icon: "edit", onClick: () => {}, showOption: false },
                                        {
                                            label: t("common.unassign", "Unassign"),
                                            icon: "user-round-x",
                                            onClick: () => handleOpenUnassignModal(editingAssignee),
                                            variant: "destructive",
                                        },
                                    ]}
                                />
                            ) : undefined
                        }
                    />
                    <WorkOrderAssigneeDeleteModal
                        open={!!assigneeToUnassign}
                        onOpenChange={(open) => !open && setAssigneeToUnassign(null)}
                        assignee={assigneeToUnassign}
                        onConfirm={handleConfirmUnassign}
                    />
                </>
            )}
        </>
    );
};

export default WorkOrderAssigneesEditModal;
