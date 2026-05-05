import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

interface OrderCancelModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isLoading?: boolean;
}

export const OrderCancelModal = ({ open, onOpenChange, onConfirm, isLoading = false }: OrderCancelModalProps) => {
    const { t } = useTranslation();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>{t('orders.cancelOrderTitle', 'Cancel Order')}</DialogTitle>
                    <DialogDescription>
                        {t('orders.cancelOrderDescription', 'Are you sure you want to cancel this order? This action cannot be undone.')}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        {t('common.goBack', 'Go Back')}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        <X className="h-4 w-4 mr-2" />
                        {isLoading ? t('common.cancelling', 'Cancelling...') : t('common.cancelOrder', 'Cancel Order')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
