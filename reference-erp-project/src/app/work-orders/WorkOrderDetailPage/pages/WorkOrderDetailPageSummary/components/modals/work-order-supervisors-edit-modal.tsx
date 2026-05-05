import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { deleteWorkOrderSupervisor } from "@/api/field-service/work-orders/supervisors/supervisors";
import { useParams } from "react-router-dom";
import { useState } from "react";
import WorkOrderSupervisorAddModal from "./work-order-supervisor-add-modal";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import SearchBar from "@/app/components/search-bar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useWorkOrder } from "@/app/work-orders/contexts/WorkOrderContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface WorkOrderSupervisorsEditModalProps {
    editMode?: boolean;
    /** When provided with onOpenChange, renders as a modal instead of a card. */
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

const WorkOrderSupervisorsEditModal = ({ editMode = false, open: modalOpen, onOpenChange: onModalOpenChange }: WorkOrderSupervisorsEditModalProps) => {
    const { t } = useTranslation();
    const { orgId, workOrderId } = useParams<{ orgId: string, workOrderId: string }>();
    const {
        supervisors,
        refreshSupervisors,
        isSearchingSupervisors: isSearching,
        isLoadingSupervisors: isLoading,
        loadingMoreSupervisors: loadingMore,
        nextPageTokenSupervisors: nextPageToken,
        searchQuerySupervisors: searchQuery,
        setSearchQuerySupervisors: setSearchQuery,
        loadMoreSupervisors,
    } = useWorkOrder();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleOpenAddModal = () => {
        setIsModalOpen(true);
    };

    const handleModalClose = (open: boolean) => {
        setIsModalOpen(open);
    };

    const handleDeleteSupervisor = async (supervisorId: string) => {
        if (!orgId || !workOrderId) return;

        try {
            const response = await deleteWorkOrderSupervisor(orgId, workOrderId, supervisorId);
            if (response.success || response === undefined) {
                toast.success(t('workOrders.supervisorDeletedSuccessfully', 'Supervisor deleted successfully'));
                await refreshSupervisors();
            } else {
                toast.error(response.error || t('workOrders.errorDeletingSupervisor', 'Error deleting supervisor'));
            }
        } catch (error) {
            console.error('Error deleting work order supervisor:', error);
            toast.error(t('workOrders.errorDeletingSupervisor', 'Error deleting supervisor'));
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
                                {t('workOrdersDetail.supervisors', 'Supervisors')}
                            </DialogTitle>
                            {editMode && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleOpenAddModal}
                                >
                                    <Plus className="h-4 w-4" />
                                    {t('workOrdersDetail.addSupervisor', 'Add')}
                                </Button>
                            )}
                        </DialogHeader>
                        <SearchBar
                            value={searchQuery ?? ""}
                            isLoading={isSearching}
                            onChange={(query) => setSearchQuery(query)}
                            onSearch={() => refreshSupervisors()}
                            placeholder={t('workOrdersDetail.searchSupervisors', 'Search supervisors...')}
                        />
                        <div className="flex-1 min-h-0 overflow-y-auto -mx-2 px-2 space-y-2">
                            {isLoading ? (
                                <div className="flex items-center justify-center p-6">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : supervisors.length === 0 ? (
                                <div className="text-sm text-muted-foreground py-6 text-center">
                                    {t('workOrdersDetail.noSupervisorsAdded', 'No supervisors added yet')}
                                </div>
                            ) : (
                                supervisors.map((supervisor) => (
                                    <div
                                        key={supervisor.id}
                                        className={cn(
                                            "flex items-center justify-between text-sm py-2 px-2 rounded transition-colors",
                                            "cursor-default"
                                        )}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <EmployeeAvatar
                                                employee={supervisor as any}
                                                showJobTitle={true}
                                            />
                                            {supervisor.notes && (
                                                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                    {supervisor.notes}
                                                </div>
                                            )}
                                        </div>
                                        {editMode && (
                                            <div>
                                                <CustomActionsDropdown
                                                    items={[
                                                        {
                                                            label: t('common.unassign', 'Unassign'),
                                                            icon: 'user-round-x',
                                                            onClick: () => handleDeleteSupervisor(supervisor.id),
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
                                        onClick={loadMoreSupervisors}
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
                    <WorkOrderSupervisorAddModal
                        open={isModalOpen}
                        onOpenChange={handleModalClose}
                        orgId={orgId}
                        workOrderId={workOrderId}
                        onSuccess={() => refreshSupervisors()}
                    />
                )}
            </>
        );
    }

    // Render supervisors in collapsed view (show more avatars to fill the row)
    const renderSupervisorsCollapsed = () => {
        if (supervisors.length === 0) {
            return null;
        }

        if (supervisors.length === 1) {
            return (
                <div className="flex items-center gap-1 ml-2 h-7">
                    <EmployeeAvatar
                        employee={supervisors[0] as any}
                        showName={true}
                    />
                </div>
            );
        }

        // Show more avatars (7) before truncating to fill the row better
        const maxVisible = 7;
        const visibleSupervisors = supervisors.slice(0, maxVisible);
        const remainingSupervisors = supervisors.slice(maxVisible);
        const remainingNames = remainingSupervisors.map(supervisor => {
            const firstName = supervisor.first_name || '';
            const lastName = supervisor.last_name || '';
            return `${firstName} ${lastName}`.trim() || supervisor.email || 'Unknown';
        }).join(', ');

        return (
            <div className="flex items-center gap-1 ml-2 h-7">
                {visibleSupervisors.map((supervisor, index) => (
                    <div
                        key={supervisor.id}
                        style={{ marginLeft: index > 0 ? "-8px" : "0" }}
                        className="flex-shrink-0"
                    >
                        <EmployeeAvatar
                            employee={supervisor as any}
                            showName={false}
                            size="sm"
                            onHover={true}
                        />
                    </div>
                ))}
                {supervisors.length > maxVisible && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium ml-[-8px] cursor-pointer hover:opacity-80 flex-shrink-0">
                                    +{supervisors.length - maxVisible}
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

    if (supervisors.length === 0 && !isLoading && !isSearching) {
        return (
            <>
                <Card className="shadow-none max-h-[170px] h-auto">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 justify-between">
                            <span className="flex items-center gap-2">
                                {t('workOrdersDetail.supervisors', 'Supervisors')}
                            </span>
                            {editMode && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleOpenAddModal}
                                >
                                    <Plus className="h-4 w-4" />
                                    {t('workOrdersDetail.addSupervisor', 'Add')}
                                </Button>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="text-sm text-muted-foreground py-4 text-center">
                            {t('workOrdersDetail.noSupervisorsAdded', 'No supervisors added yet')}
                        </div>
                    </CardContent>
                </Card>
                {orgId && workOrderId && (
                    <WorkOrderSupervisorAddModal
                        open={isModalOpen}
                        onOpenChange={handleModalClose}
                        orgId={orgId}
                        workOrderId={workOrderId}
                        onSuccess={() => refreshSupervisors()}
                    />
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
                                        {!isExpanded && supervisors.length === 1 ? t('workOrdersDetail.supervisor', 'Supervisor') : t('workOrdersDetail.supervisors', 'Supervisors')}
                                        {isExpanded && <Badge variant="secondary">{supervisors.length}</Badge>}
                                    </span>
                                    {!isExpanded && renderSupervisorsCollapsed()}
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
                                    {t('workOrdersDetail.addSupervisor', 'Add')}
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
                                onSearch={() => refreshSupervisors()}
                                placeholder={t('workOrdersDetail.searchSupervisors', 'Search supervisors...')}
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
                                    {supervisors.map((supervisor) => (
                                        <div
                                            key={supervisor.id}
                                            className={cn(
                                                "flex items-center justify-between text-sm py-2 px-2 rounded transition-colors group",
                                                "cursor-default"
                                            )}
                                        >
                                            <div className="flex-1">
                                                <EmployeeAvatar
                                                    employee={supervisor as any}
                                                    showJobTitle={true}
                                                />
                                                {supervisor.notes && (
                                                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                        {supervisor.notes}
                                                    </div>
                                                )}
                                            </div>
                                            {editMode && (
                                                <div>
                                                    <CustomActionsDropdown
                                                        items={[
                                                            {
                                                                label: t('common.unassign', 'Unassign'),
                                                                icon: 'user-round-x',
                                                                onClick: () => handleDeleteSupervisor(supervisor.id),
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
                                                onClick={loadMoreSupervisors}
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
                <WorkOrderSupervisorAddModal
                    open={isModalOpen}
                    onOpenChange={handleModalClose}
                    orgId={orgId}
                    workOrderId={workOrderId}
                    onSuccess={() => refreshSupervisors()}
                />
            )}
        </>
    );
};

export default WorkOrderSupervisorsEditModal;
