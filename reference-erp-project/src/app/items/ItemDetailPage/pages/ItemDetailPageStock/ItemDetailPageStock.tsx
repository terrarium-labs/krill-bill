import ItemStockLocationCard from "./components/item-stock-location-card";
import ItemStockHistorySection from "./components/item-stock-history-section";
import { useState } from "react";
import { StockLocationItem } from "@/types/items/stock";

const ItemDetailPageStock = () => {
    const [selectedLocation, setSelectedLocation] = useState<StockLocationItem | null>(null);
    return (<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="flex flex-col gap-4 mb-4 lg:col-span-1">
            <ItemStockLocationCard selectedLocation={selectedLocation} setSelectedLocation={setSelectedLocation} />
        </div>
        <div className="lg:col-span-2">
            <ItemStockHistorySection selectedLocation={selectedLocation} />
        </div>
    </div>)
};

export default ItemDetailPageStock;