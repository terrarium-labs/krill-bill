import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { MultiSelectApi } from "@/app/components/forms-elements/multi-select-api";
import { getOrgSerialNumbers } from "@/api/orgs/serial-numbers/serial-numbers";
import { Label } from "@/components/ui/label";
import { generateNextDocumentNumber } from "@/utils/miscelanea";

interface ChangeNumberSeriesModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (serialNumberId: string) => void;
    currentSerialNumberId?: string | null;
    orgId: string;
    isLoading?: boolean;
}

export const ChangeNumberSeriesModal = ({
    open,
    onOpenChange,
    onConfirm,
    currentSerialNumberId,
    orgId,
    isLoading = false
}: ChangeNumberSeriesModalProps) => {
    const { t } = useTranslation();
    const [selectedSerialNumberId, setSelectedSerialNumberId] = useState<string | null>(currentSerialNumberId || null);

    const handleConfirm = () => {
        if (selectedSerialNumberId) {
            onConfirm(selectedSerialNumberId);
        }
    };

    const isConfirmDisabled = !selectedSerialNumberId || selectedSerialNumberId === currentSerialNumberId;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>{t('salesInvoices.changeNumberSeriesTitle', 'Change Document Series')}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="serial-number">
                            {t('salesInvoices.numberSeries', 'Document Series')}
                        </Label>
                        <MultiSelectApi
                            fetchOptions={getOrgSerialNumbers}
                            fetchArgs={[orgId, "sales_invoices"]}
                            optionsKey="serial_numbers"
                            customValueKey={(item) => item.id}
                            customLabelKey={(item) => `${item.name} (${generateNextDocumentNumber(item.value, item.last_num_value)})`}
                            value={selectedSerialNumberId ? [selectedSerialNumberId] : []}
                            onChangeValue={(values) => setSelectedSerialNumberId(values[0] || null)}
                            placeholder={t('salesInvoices.selectNumberSeries', 'Select document series...')}
                            searchPlaceholder={t('salesInvoices.searchNumberSeries', 'Search document series...')}
                            emptyText={t('salesInvoices.noNumberSeriesFound', 'No document series found for sales invoices')}
                            disabled={isLoading}
                            maxCount={1}
                            className="w-full"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading || isConfirmDisabled}
                    >
                        {isLoading ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
