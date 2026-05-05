import ItemInfoCard from "./components/item-info-card";
import ItemChecklistsCard from "./components/item-checklists-card";

interface ItemDetailPageSummaryProps {
    onEdit?: () => void;
}
const ItemDetailPageSummary: React.FC<ItemDetailPageSummaryProps> = ({ onEdit }) => {

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="flex flex-col gap-4 mb-24 lg:col-span-1">
                <ItemInfoCard onEdit={onEdit} />
                <ItemChecklistsCard />
            </div>
            <div className="lg:col-span-2">
                {/* Future: Add analytics or additional item information */}
                <div className="p-6 border rounded-lg bg-card">
                    <h3 className="text-lg font-semibold mb-2">Item Analytics</h3>
                    <p className="text-muted-foreground">Analytics and insights coming soon...</p>
                </div>
            </div>
        </div>
    );
};

export default ItemDetailPageSummary;

