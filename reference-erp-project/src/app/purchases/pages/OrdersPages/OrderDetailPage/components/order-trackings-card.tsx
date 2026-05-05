import React, { useState, useEffect } from 'react';
import { Plus, Package, Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { getOrgOrderTrackings, deleteOrgOrderTracking } from '@/api/orgs/orders/trackings/trackings';
import { Tracking } from '@/types/orders/trackings';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import TrackingModal from './tracking-modal';
import { useOrder } from '../../contexts/OrderContext';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import CustomActionsDropdown from '@/app/components/custom-actions-dropdown';
import { formatDate } from "@/utils/miscelanea";
import IdBadge from '@/app/components/id-badge';

interface OrderTrackingsCardProps { }

const OrderTrackingsCard: React.FC<OrderTrackingsCardProps> = () => {
    const [trackings, setTrackings] = useState<Tracking[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editTracking, setEditTracking] = useState<Tracking | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [trackingToDelete, setTrackingToDelete] = useState<Tracking | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const { order } = useOrder();

    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();

    const loadTrackings = async (pageToken: string | null = null, append = false) => {
        if (!orgId || !order.id) return;

        setIsLoading(true);
        try {
            const response = await getOrgOrderTrackings(orgId, order.id, undefined, pageToken || undefined);

            if (response.success) {
                const newTrackings = response.success.trackings || [];
                setTrackings(prevTrackings =>
                    append ? [...prevTrackings, ...newTrackings] : newTrackings
                );
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t('orders.errorLoadingTrackings', 'Failed to load trackings'));
            }
        } catch (error) {
            console.error('Error loading trackings:', error);
            toast.error(t('orders.errorLoadingTrackings', 'Failed to load trackings'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadTrackings();
    }, []);

    const handleTrackingSaved = () => {
        loadTrackings();
        setIsCreateModalOpen(false);
        setEditTracking(null);
    };

    const handleEditTracking = (tracking: Tracking) => {
        setEditTracking(tracking);
    };

    const handleDeleteClick = (tracking: Tracking) => {
        setTrackingToDelete(tracking);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!trackingToDelete || !orgId || !order.id) return;

        setIsDeleting(true);
        try {
            const response = await deleteOrgOrderTracking(orgId, order.id, trackingToDelete.id);
            if (response.success) {
                toast.success(t('orders.trackingDeleted', 'Tracking deleted successfully'));
                loadTrackings();
            } else {
                toast.error(t('orders.errorDeletingTracking', 'Failed to delete tracking'));
            }
        } catch (error) {
            console.error('Error deleting tracking:', error);
            toast.error(t('orders.errorDeletingTracking', 'Failed to delete tracking'));
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
            setTrackingToDelete(null);
        }
    };

    const handleCopyTrackingNumber = async (tracking: Tracking) => {
        if (!tracking.tracking_number) {
            toast.error(t('orders.noTrackingNumberToCopy', 'No tracking number available to copy'));
            return;
        }

        try {
            await navigator.clipboard.writeText(tracking.tracking_number);
            setCopiedId(tracking.id);
            toast.success(t('orders.trackingNumberCopied', 'Tracking number copied to clipboard'));

            // Reset the copied state after 2 seconds
            setTimeout(() => {
                setCopiedId(null);
            }, 2000);
        } catch (error) {
            console.error('Error copying tracking number:', error);
            toast.error(t('orders.errorCopyingTrackingNumber', 'Failed to copy tracking number'));
        }
    };

    const handleOpenUrl = (url: string) => {
        if (!url) {
            toast.error(t('orders.noUrlAvailable', 'No URL available'));
            return;
        }
        window.open(url, '_blank');
    };

    return (
        <>
            <Card className="shadow-none flex flex-col h-full">
                <CardHeader className="shrink-0">
                    <CardTitle className="flex items-center gap-2 justify-between">
                        {t('orders.trackings', 'Trackings')}
                        <Button onClick={() => setIsCreateModalOpen(true)} size="sm" variant="outline">
                            <Plus className="h-4 w-4" />
                            {t('orders.addTracking', 'Add')}
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="py-0 px-4 pt-0 flex-1 overflow-y-auto min-h-0">
                    {/* Trackings List */}
                    {trackings.length === 0 ? (
                        <div className="text-center py-4">
                            <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <h3 className="text-md font-medium text-muted-foreground">
                                {t('orders.noTrackings', 'No trackings yet')}
                            </h3>
                            <p className="text-muted-foreground mb-4 text-xs">
                                {t('orders.addFirstTracking', 'Add your first tracking to get started')}
                            </p>
                        </div>
                    ) : (
                        <div>
                            {trackings.map((tracking, index) => (
                                <div key={tracking.id}>
                                    <div className="hover:bg-accent/50 transition-colors p-2 rounded-lg">
                                        <div className="flex items-center justify-between gap-2">
                                            <div
                                                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                                                onClick={() => handleCopyTrackingNumber(tracking)}
                                            >
                                                <Package className="h-5 w-5 text-muted-foreground shrink-0" />
                                                <div className="flex flex-col items-start gap-0 min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 w-full">
                                                        <h4 className="font-medium text-sm truncate">
                                                            {tracking.tracking_number || t('orders.noTrackingNumber', 'No tracking number')}
                                                        </h4>

                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        {t('orders.deliveryDate', 'Delivery')}: {formatDate(tracking.delivery_date, { showTime: false })}
                                                    </span>
                                                    {tracking.notes && (
                                                        <span className="text-xs text-muted-foreground truncate w-full line-clamp-2">
                                                            {tracking.notes}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <IdBadge id={tracking.id} hideIcon={true} />
                                                {tracking.url && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 shrink-0"
                                                        onClick={() => handleOpenUrl(tracking.url)}
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 shrink-0"
                                                    onClick={() => handleCopyTrackingNumber(tracking)}
                                                >
                                                    {copiedId === tracking.id ? (
                                                        <Check className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <Copy className="h-4 w-4" />
                                                    )}
                                                </Button>
                                                <CustomActionsDropdown
                                                    items={[
                                                        {
                                                            label: t('common.edit', 'Edit'),
                                                            icon: "edit",
                                                            onClick: () => handleEditTracking(tracking),
                                                        },
                                                        {
                                                            label: t('common.delete', 'Delete'),
                                                            icon: "trash-2",
                                                            onClick: () => handleDeleteClick(tracking),
                                                            variant: "destructive",
                                                        },
                                                    ]}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {index < trackings.length - 1 && <Separator />}
                                </div>
                            ))}

                            {/* Load More Button */}
                            {nextPageToken && (
                                <div className="text-center pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => loadTrackings(nextPageToken, true)}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? t('common.loading', 'Loading...') : t('common.loadMore', 'Load More')}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal for both new and edit */}
            <TrackingModal
                open={isCreateModalOpen || !!editTracking}
                onOpenChange={(open: boolean) => {
                    if (!open) {
                        setIsCreateModalOpen(false);
                        setEditTracking(null);
                    }
                }}
                onTrackingSaved={handleTrackingSaved}
                tracking={editTracking}
                mode={editTracking ? 'update' : 'create'}
                orderId={order.id}
                orgId={orgId || ''}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle>{t('orders.deleteTracking', 'Delete Tracking')}</DialogTitle>
                        <DialogDescription>
                            {t('orders.deleteTrackingConfirmation', 'Are you sure you want to delete this tracking? This action cannot be undone.')}
                            {trackingToDelete && (
                                <div className="mt-2 p-2 bg-muted rounded">
                                    <strong>{trackingToDelete.tracking_number}</strong>
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={isDeleting}
                        >
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                        >
                            {isDeleting ? t('common.deleting', 'Deleting...') : t('common.delete', 'Delete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default OrderTrackingsCard;
