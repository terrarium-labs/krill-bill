import { createContext, useContext, useEffect, useState } from "react";
import { getSupplier } from "@/api/suppliers/suppliers";
import { useParams } from "react-router";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Supplier } from "@/types/suppliers/supplier";

interface SupplierContextType {
    supplier: Supplier;
    refreshSupplier: () => void;
}

const SupplierContext = createContext<SupplierContextType | undefined>(undefined);

export const SupplierProvider = ({ children }: { children: React.ReactNode }) => {
    const [supplier, setSupplier] = useState<Supplier | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { supplierId, orgId } = useParams<{ supplierId: string, orgId: string }>();

    const fetchSupplier = async (supplierId: string) => {
        if (!orgId) return;
        try {
            setIsLoading(true);
            const response = await getSupplier(orgId || "", supplierId);
            if (response.success) {
                setSupplier(response.success.supplier);
            }
        } catch (error) {
            console.error("Error fetching supplier:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (orgId && supplierId) {
            fetchSupplier(supplierId);
        }
    }, []);

    if (isLoading || !supplier) {
        return <PageSkeleton showBackButton={true} showIcon={true} tabCount={3} variant="split" />;
    }

    const refreshSupplier = () => {
        if (orgId && supplierId) {
            fetchSupplier(supplierId);
        }
    };

    return (
        <SupplierContext.Provider
            value={{
                supplier,
                refreshSupplier,
            }}
        >
            {children}
        </SupplierContext.Provider>
    );
};

export const useSupplier = () => {
    const context = useContext(SupplierContext);
    if (context === undefined) {
        throw new Error("useSupplier must be used within a SupplierContext");
    }
    return context;
};

