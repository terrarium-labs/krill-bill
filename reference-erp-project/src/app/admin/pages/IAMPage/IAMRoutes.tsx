import { Route, Routes } from "react-router";
import IAMPage from "./IAMPage";
import IAMDetailPage from "./IAMDetailPage/IAMDetailPage";
import { RoleProvider } from "./context/RoleContext";

const IAMRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<IAMPage />} />
            <Route
                path="/:roleId"
                element={
                    <RoleProvider>
                        <IAMDetailPage />
                    </RoleProvider>
                }
            />
        </Routes>
    );
};

export default IAMRoutes;

