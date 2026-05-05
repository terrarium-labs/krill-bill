import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { Inventory } from '@/types/clients/inventory';
import { getClientInventoryChecklists, deleteClientInventoryChecklist } from '@/api/clients/checklists/checklists';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Tag from '@/app/components/tag/tag';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import IdBadge from '@/app/components/id-badge';
import FilesSection from '@/app/components/files/files-section';
import { ItemAvatar } from '@/app/components/avatars/item-avatar';
import CustomActionsDropdown from '@/app/components/custom-actions-dropdown';
import ChecklistViewModal, { type ChecklistViewItem } from "@/app/admin/pages/ChecklistsPage/components/checklist-view-modal";

interface InventoryItemViewModalProps {
    inventory: Inventory | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Render custom action buttons in the header (right side, next to ID badge). */
    renderActions?: (inventory: Inventory) => React.ReactNode;
}

const InventoryItemViewModal: React.FC<InventoryItemViewModalProps> = ({
    inventory,
    open,
    onOpenChange,
    renderActions,
}) => {
    const { t } = useTranslation();
    const { orgId, clientId } = useParams<{ orgId: string; clientId: string }>();
    const navigate = useNavigate();
    const [checklists, setChecklists] = useState<ChecklistViewItem[]>([]);
    const [loadingChecklists, setLoadingChecklists] = useState(false);
    const [viewModalChecklistId, setViewModalChecklistId] = useState<string | null>(null);

    const fetchChecklists = useCallback(async () => {
        if (!orgId || !clientId || !inventory?.id) return;
        setLoadingChecklists(true);
        try {
            const response = await getClientInventoryChecklists(orgId, clientId, inventory.id);
            const rawList = response.success?.checklists ?? response.success?.items ?? [];
            if (response.success && Array.isArray(rawList)) {
                setChecklists((rawList as any[]).map((c: any) => ({
                    id: c.id,
                    name: c.name ?? c.data?.name ?? 'Checklist',
                    description: c.description ?? c.data?.description,
                    data: c.data,
                    completed: c.completed,
                })));
            }
        } catch (error) {
            console.error('Error fetching checklists:', error);
        } finally {
            setLoadingChecklists(false);
        }
    }, [orgId, clientId, inventory?.id]);

    useEffect(() => {
        if (open && inventory?.id) {
            fetchChecklists();
        }
    }, [open, inventory?.id, fetchChecklists]);

    const handleDeleteChecklist = useCallback(async (checklistId: string) => {
        if (!orgId || !clientId || !inventory?.id) return;
        try {
            const response = await deleteClientInventoryChecklist(orgId, clientId, inventory.id, { checklists_ids: [checklistId] });
            if (response.success) {
                toast.success(t('inventory.checklist.deletedSuccessfully', 'Checklist removed successfully'));
                setViewModalChecklistId(null);
                fetchChecklists();
            } else {
                toast.error(t('inventory.checklist.errorDeleting', 'Error removing checklist'));
            }
        } catch (error) {
            console.error('Error deleting checklist:', error);
            toast.error(t('inventory.checklist.errorDeleting', 'Error removing checklist'));
        }
    }, [orgId, clientId, inventory?.id, t, fetchChecklists]);

    const viewModalChecklist = viewModalChecklistId ? checklists.find((c) => c.id === viewModalChecklistId) ?? null : null;

    if (!inventory) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="min-h-[70vh] max-h-[70vh] w-full md:max-w-5xl flex flex-col " showCloseButton={false}>
                <DialogHeader>
                    <div className="flex items-start gap-2">
                        <DialogTitle className="flex flex-col items-start gap-1">
                            <div className="flex items-center gap-2">
                                {inventory.name}
                            </div>
                        </DialogTitle>
                        <div className="flex items-center gap-2 ml-auto">
                            <Tag
                                text={inventory.is_service ? t("inventory.type.service", "Service") : t("inventory.type.component", "Component")}
                                color={inventory.is_service ? "blue" : "green"}
                            />
                            <IdBadge id={inventory.id} />
                            {renderActions?.(inventory)}
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 overflow-y-auto max-h-[70vh] px-2 scrollbar-hide">
                    {/* Item Information */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                        <div className="space-y-1">
                            <h4 className="font-medium text-sm">{t('inventory.catalogItem', 'Catalog Item')}</h4>
                            {inventory.item ?
                                <div className="flex items-center gap-2">
                                    <ItemAvatar item={inventory.item} onClick={() => navigate(`/${orgId}/items/${inventory.item?.id}`)} />
                                    <IdBadge id={inventory.item.id} hideIcon={true} />
                                </div>
                                : <span className="text-sm text-muted-foreground">-</span>}
                        </div>

                        <div className="space-y-1">
                            <h4 className="font-medium text-sm">{t('inventory.serialNumber', 'Serial Number')}</h4>
                            {inventory.serial_number ?
                                <IdBadge id={inventory.serial_number} />
                                : <span className="text-sm text-muted-foreground">-</span>}
                        </div>

                        <div className="space-y-1">
                            <h4 className="font-medium text-sm">{t('inventory.location', 'Location')}</h4>
                            {inventory.location_name ?
                                <span className="text-sm">{inventory.location_name}</span>
                                : <span className="text-sm text-muted-foreground">-</span>}
                        </div>

                        <div className="space-y-1">
                            <h4 className="font-medium text-sm">{t('inventory.parentItem', 'Parent Item')}</h4>
                            {inventory.parent ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">{inventory.parent.name}</span>
                                    <IdBadge id={inventory.parent.id} />
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">-</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <h4 className="font-medium text-sm">{t('inventory.description', 'Description')}</h4>
                        <p className="text-sm">
                            {inventory.description ?
                                inventory.description
                                : <span className="text-sm text-muted-foreground">-</span>}
                        </p>
                    </div>

                    {/* Checklists - 2 columns grid */}
                    <div className="space-y-2">
                        <h4 className="font-medium text-sm">{t('inventory.checklists', 'Checklists')}</h4>
                        {loadingChecklists ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : checklists.length === 0 ? (
                            <p className="text-sm text-muted-foreground">-</p>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                {checklists.map((checklist) => (
                                    <div
                                        key={checklist.id}
                                        className="flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-colors hover:bg-muted/50"
                                        onClick={() => setViewModalChecklistId(checklist.id)}
                                    >
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="font-medium text-sm">{checklist.name}</div>
                                            {checklist.description && (
                                                <div className="text-xs text-muted-foreground line-clamp-2">{checklist.description}</div>
                                            )}
                                        </div>
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <CustomActionsDropdown
                                                items={[
                                                    {
                                                        label: t('common.view', 'View'),
                                                        icon: 'eye',
                                                        onClick: () => setViewModalChecklistId(checklist.id),
                                                    },
                                                ]}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <ChecklistViewModal
                        open={!!viewModalChecklistId}
                        onOpenChange={(open) => !open && setViewModalChecklistId(null)}
                        checklist={viewModalChecklist}
                        renderActions={(checklist) => (
                            <CustomActionsDropdown
                                items={[
                                    {
                                        label: t('common.actions.delete', 'Delete'),
                                        icon: 'trash-2',
                                        onClick: () => handleDeleteChecklist(checklist.id),
                                        variant: 'destructive',
                                    },
                                ]}
                            />
                        )}
                    />

                    <Separator className="my-12 mb-4" />
                    <div className="space-y-2">
                        <FilesSection key={`inventory-files-${inventory.id}`} entity_id={inventory.id} />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default InventoryItemViewModal;
