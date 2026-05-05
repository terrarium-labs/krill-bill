import { LocationInfoCard } from "../components/warehouse-info-card";
import WarehouseDetailPageStock from "./WarehouseDetailPageStock/WarehouseDetailPageStock";

interface WarehouseDetailPageSummaryProps {
    onEdit?: () => void;
}

const WarehouseDetailPageSummary: React.FC<WarehouseDetailPageSummaryProps> = ({ onEdit }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="flex flex-col gap-4 mb-24 lg:col-span-1">
                <LocationInfoCard onEdit={onEdit} />
            </div>
            <div className="lg:col-span-2">
                <WarehouseDetailPageStock />
            </div>
        </div>
    );
};

export default WarehouseDetailPageSummary;