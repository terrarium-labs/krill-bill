import { Navigate, Route, Routes, useParams } from "react-router-dom";
import ItemsPage from "./ItemsPage";
import { ItemProvider } from "./contexts/ItemContext";
import ItemDetailPage from "./ItemDetailPage/ItemDetailPage";

const ItemsDetailRoutes = () => {
  const { orgId, itemId } = useParams<{ orgId: string, itemId: string }>();
  return (
    <Routes>
      <Route path="" element={<ItemDetailPage />} />
      <Route path="*" element={<Navigate to={`/${orgId}/items/${itemId}`} replace />} />
    </Routes>
  );
};

const ItemsRoutes = () => {
  return (
    <Routes>
      <Route path="" element={<ItemsPage />} />
      <Route
        path=":itemId/*"
        element={
          <ItemProvider>
            <ItemsDetailRoutes />
          </ItemProvider>
        }
      />
    </Routes>
  );
};

export default ItemsRoutes;

