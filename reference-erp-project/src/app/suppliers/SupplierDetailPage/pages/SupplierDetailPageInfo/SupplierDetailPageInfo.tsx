import { useSupplier } from "../../../contexts/SupplierContext";
import { SupplierInfoCard } from "./components/supplier-info-card";
import SupplierContactsCard from "./components/supplier-contacts-card";
import SupplierPaymentMethodsCard from "./components/supplier-payment-methods-card";
import { useTranslation } from "react-i18next";

interface SupplierDetailPageInfoProps {
    onEdit?: () => void;
}

const SupplierDetailPageInfo: React.FC<SupplierDetailPageInfoProps> = ({ onEdit }) => {
    const { supplier } = useSupplier();
    const { t } = useTranslation();
    return (

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="flex flex-col gap-4 mb-24 lg:col-span-1">
                <SupplierInfoCard onEdit={onEdit} />
                {/* Note: No stakeholders for suppliers */}
                {supplier?.id && (
                    <>
                        <SupplierContactsCard />
                        <SupplierPaymentMethodsCard />
                    </>
                )}
            </div>
            <div className="lg:col-span-2">
                {/* TODO: Implement summary */}
                <div className="flex items-center justify-center h-64 border border-dashed border-border rounded-lg">
                    <div className="text-center">
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">
                            {t('suppliersDetail.summaryTodo', 'Summary Tab')}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {t('suppliersDetail.summaryTodoDescription', 'This tab is under construction')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupplierDetailPageInfo;

