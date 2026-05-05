import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { ItemPriceResponse } from "@/types/items/items";
import CurrencyLabel from "@/app/components/labels/currency-label";

interface ItemBuyPriceDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    price: ItemPriceResponse | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

const ItemBuyPriceDeleteModal = ({
    isOpen,
    onClose,
    price,
    onConfirm,
    isDeleting,
}: ItemBuyPriceDeleteModalProps) => {
    const { t } = useTranslation();

    return (
        <DeleteModal
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            title={t("items.prices.deletePrice", "Delete Price")}
            description={
                <>
                    {t(
                        "items.prices.deletePriceConfirmation",
                        "Are you sure you want to delete this price? This action cannot be undone."
                    )}
                    {price && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            <strong>
                                <CurrencyLabel
                                    data={{
                                        value: price.price_quantity ?? 0,
                                        currency:
                                            price.price_currency ?? undefined,
                                    }}
                                />
                            </strong>
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default ItemBuyPriceDeleteModal;
