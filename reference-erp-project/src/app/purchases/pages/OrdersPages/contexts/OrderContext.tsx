import { createContext, useContext, useEffect, useState } from "react";
import { getOrgOrder } from "@/api/orgs/orders/orders";
import { useParams } from "react-router";
import { PageInvoiceSkeleton } from "@/components/ui/page-invoice-skeleton";
import { Order } from "@/types/orders/orders";

interface OrderContextType {
  order: Order;
  setData: (data: Partial<Order>) => void;
  refreshOrder: () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: React.ReactNode }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { orderId, orgId } = useParams<{ orderId: string, orgId: string }>();

  const fetchOrder = async (orderId: string) => {
    if (!orgId) return;
    try {
      const response = await getOrgOrder(orgId || "", orderId);
      if (response.success) {
        setOrder(response.success.order);
      }
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (orgId && orderId) {
      fetchOrder(orderId);
    }
  }, [orgId, orderId]);

  if (isLoading || !order) {
    return <PageInvoiceSkeleton />;
  }

  const refreshOrder = () => {
    if (orgId && orderId) {
      fetchOrder(orderId);
    }
  };

  const setData = (data: Partial<Order>) => {
    if (order) {
      setOrder({ ...order, ...data });
    }
  };

  return (
    <OrderContext.Provider
      value={{
        order,
        setData,
        refreshOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error("useOrder must be used within an OrderContext");
  }
  return context;
};

