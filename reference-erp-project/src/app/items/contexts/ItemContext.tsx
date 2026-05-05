import { createContext, useContext, useEffect, useState } from "react";
import { getOrgItem } from "@/api/items/items";
import { useParams } from "react-router";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Item } from "@/types/items/items";

interface ItemContextType {
    item: Item;
    refreshItem: () => void;
}

const ItemContext = createContext<ItemContextType | undefined>(undefined);

export const ItemProvider = ({ children }: { children: React.ReactNode }) => {
    const [item, setItem] = useState<Item | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { itemId, orgId } = useParams<{ itemId: string, orgId: string }>();

    const fetchItem = async (itemId: string) => {
        if (!orgId) return;
        try {
            setIsLoading(true);
            const response = await getOrgItem(orgId || "", itemId);
            if (response.success) {
                setItem(response.success.item);
            }
        } catch (error) {
            console.error("Error fetching item:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (orgId && itemId) {
            fetchItem(itemId);
        }
    }, []);

    if (isLoading || !item) {
        return <PageSkeleton showBackButton={true} showIcon={true} tabCount={5} variant="split" />;
    }

    const refreshItem = () => {
        if (orgId && itemId) {
            fetchItem(itemId);
        }
    };

    return (
        <ItemContext.Provider
            value={{
                item,
                refreshItem,
            }}
        >
            {children}
        </ItemContext.Provider>
    );
};

export const useItem = () => {
    const context = useContext(ItemContext);
    if (context === undefined) {
        throw new Error("useItem must be used within an ItemContext");
    }
    return context;
};

