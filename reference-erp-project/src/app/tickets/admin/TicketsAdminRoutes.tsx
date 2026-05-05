import { Routes, Route } from "react-router";
import TicketsAdminPage from "./TicketsAdminPage";

const TicketsAdminRoutes = () => {
    return (
        <Routes>
            <Route index element={<TicketsAdminPage />} />
        </Routes>
    )
}

export default TicketsAdminRoutes;