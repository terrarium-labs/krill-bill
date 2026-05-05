import React, { useState, useEffect } from 'react';
import { Plus, CreditCard, Building2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { getSupplierPaymentsMethods, deleteSupplierPaymentsMethod, postSupplierDefaultPaymentsMethod } from '@/api/suppliers/payment-methods/payment-methods';
import { ClientPaymentMethod as SupplierPaymentMethod } from '@/types/clients/client';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

import PaymentMethodModal from './payment-method-modal';
import { useSupplier } from '../../../../contexts/SupplierContext';
import Tag from '@/app/components/tag/tag';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import CustomActionsDropdown from '@/app/components/custom-actions-dropdown';

interface SupplierPaymentMethodsCardProps {
}

const SupplierPaymentMethodsCard: React.FC<SupplierPaymentMethodsCardProps> = () => {
    const [paymentMethods, setPaymentMethods] = useState<SupplierPaymentMethod[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editPaymentMethod, setEditPaymentMethod] = useState<SupplierPaymentMethod | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [paymentMethodToDelete, setPaymentMethodToDelete] = useState<SupplierPaymentMethod | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const { supplier } = useSupplier();

    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string; supplierId: string }>();

    const loadPaymentMethods = async (pageToken: string | null = null, append = false) => {
        if (!orgId || !supplier.id) return;

        setIsLoading(true);
        try {
            const response = await getSupplierPaymentsMethods(orgId, supplier.id, pageToken);

            if (response.success) {
                const newPaymentMethods = response.success.payment_methods || [];
                setPaymentMethods(append ? [...paymentMethods, ...newPaymentMethods] : newPaymentMethods);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t('suppliers.errorLoadingPaymentMethods', 'Failed to load payment methods'));
            }
        } catch (error) {
            console.error('Error loading payment methods:', error);
            toast.error(t('suppliers.errorLoadingPaymentMethods', 'Failed to load payment methods'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadPaymentMethods();
    }, []);

    const handlePaymentMethodSaved = () => {
        loadPaymentMethods();
        setIsCreateModalOpen(false);
        setEditPaymentMethod(null);
    };

    const handleEditPaymentMethod = (paymentMethod: SupplierPaymentMethod) => {
        setEditPaymentMethod(paymentMethod);
    };

    const handleDeleteClick = (paymentMethod: SupplierPaymentMethod) => {
        setPaymentMethodToDelete(paymentMethod);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!paymentMethodToDelete || !orgId || !supplier.id) return;

        setIsDeleting(true);
        try {
            const response = await deleteSupplierPaymentsMethod(orgId, supplier.id, paymentMethodToDelete.id);
            if (response.success) {
                toast.success(t('suppliers.paymentMethodDeleted', 'Payment method deleted successfully'));
                loadPaymentMethods();
            } else {
                toast.error(t('suppliers.errorDeletingPaymentMethod', 'Failed to delete payment method'));
            }
        } catch (error) {
            console.error('Error deleting payment method:', error);
            toast.error(t('suppliers.errorDeletingPaymentMethod', 'Failed to delete payment method'));
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
            setPaymentMethodToDelete(null);
        }
    };

    const handleSetDefault = async (paymentMethod: SupplierPaymentMethod) => {
        if (!orgId || !supplier.id) return;

        try {
            const response = await postSupplierDefaultPaymentsMethod(orgId, supplier.id, paymentMethod.id, {});
            if (response.success) {
                toast.success(t('suppliers.defaultPaymentMethodSet', 'Default payment method set successfully'));
                loadPaymentMethods();
            } else {
                toast.error(t('suppliers.errorSettingDefaultPaymentMethod', 'Failed to set default payment method'));
            }
        } catch (error) {
            console.error('Error setting default payment method:', error);
            toast.error(t('suppliers.errorSettingDefaultPaymentMethod', 'Failed to set default payment method'));
        }
    };

    const handleCopyIban = async (paymentMethod: SupplierPaymentMethod) => {
        if (!paymentMethod.iban) {
            toast.error(t('suppliers.noIbanToCopy', 'No IBAN available to copy'));
            return;
        }

        try {
            await navigator.clipboard.writeText(paymentMethod.iban);
            setCopiedId(paymentMethod.id);
            toast.success(t('suppliers.ibanCopied', 'IBAN copied to clipboard'));

            // Reset the copied state after 2 seconds
            setTimeout(() => {
                setCopiedId(null);
            }, 2000);
        } catch (error) {
            console.error('Error copying IBAN:', error);
            toast.error(t('suppliers.errorCopyingIban', 'Failed to copy IBAN'));
        }
    };

    return (
        <>
            <Card className="shadow-none">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 justify-between">
                        {t('suppliers.paymentMethods', 'Payment Methods')}
                        <Button onClick={() => setIsCreateModalOpen(true)} size="sm" variant="outline">
                            <Plus className="h-4 w-4" />
                            {t('suppliers.addPaymentMethod', 'Add')}
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="py-0 px-4">
                    {/* Payment Methods List */}
                    {paymentMethods.length === 0 ? (
                        <div className="text-center py-4">
                            <CreditCard className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <h3 className="text-md font-medium text-muted-foreground">
                                {t('suppliers.noPaymentMethods', 'No payment methods yet')}
                            </h3>
                            <p className="text-muted-foreground mb-4 text-xs">
                                {t('suppliers.addFirstPaymentMethod', 'Add your first payment method to get started')}
                            </p>
                        </div>
                    ) : (
                        <div>
                            {paymentMethods.map((paymentMethod, index) => (
                                <div key={paymentMethod.id}>
                                    <div className="hover:bg-accent/50 transition-colors p-2 rounded-lg">
                                        <div className="flex items-center justify-between gap-2">
                                            <div
                                                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                                                onClick={() => handleCopyIban(paymentMethod)}
                                            >
                                                <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
                                                <div className="flex flex-col items-start gap-0 min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 w-full">
                                                        <h4 className="font-medium text-sm truncate">{paymentMethod.bank}</h4>
                                                        {paymentMethod.is_default && (
                                                            <Tag text={t('suppliers.default', 'Default')} color='yellow' />
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-muted-foreground font-mono">
                                                        {paymentMethod.iban}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 shrink-0"
                                                    onClick={() => handleCopyIban(paymentMethod)}
                                                >
                                                    {copiedId === paymentMethod.id ? (
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
                                                            onClick: () => handleEditPaymentMethod(paymentMethod),
                                                        },
                                                        {
                                                            label: t('suppliers.setAsDefault', 'Set as Default'),
                                                            icon: "star",
                                                            onClick: () => handleSetDefault(paymentMethod),
                                                            showOption: !paymentMethod.is_default,
                                                        },
                                                        {
                                                            label: t('common.delete', 'Delete'),
                                                            icon: "trash-2",
                                                            onClick: () => handleDeleteClick(paymentMethod),
                                                            variant: "destructive",
                                                        },
                                                    ]}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {index < paymentMethods.length - 1 && <Separator />}
                                </div>
                            ))}

                            {/* Load More Button */}
                            {nextPageToken && (
                                <div className="text-center pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => loadPaymentMethods(nextPageToken, true)}
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
            <PaymentMethodModal
                open={isCreateModalOpen || !!editPaymentMethod}
                onOpenChange={(open: boolean) => {
                    if (!open) {
                        setIsCreateModalOpen(false);
                        setEditPaymentMethod(null);
                    }
                }}
                onPaymentMethodCreated={handlePaymentMethodSaved}
                paymentMethod={editPaymentMethod}
                mode={editPaymentMethod ? 'update' : 'create'}
                supplierId={supplier.id}
                orgId={orgId || ''}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle>{t('suppliers.deletePaymentMethod', 'Delete Payment Method')}</DialogTitle>
                        <DialogDescription>
                            {t('suppliers.deletePaymentMethodConfirmation', 'Are you sure you want to delete this payment method? This action cannot be undone.')}
                            {paymentMethodToDelete && (
                                <div className="mt-2 p-2 bg-muted rounded">
                                    <strong>{paymentMethodToDelete.bank}</strong>
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

export default SupplierPaymentMethodsCard;

