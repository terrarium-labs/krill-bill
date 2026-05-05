import { Routes, Route } from "react-router";
import NewsAdminPage from "./NewsAdminPage";
import { NewsProvider } from "./contexts/NewsContext";
import NewsEditorPage from "./NewsAdminDetailPage/NewsEditorPage";

const NewsAdminRoutes = () => {
    return (
        <Routes>
            <Route index element={<NewsAdminPage />} />
            <Route path=":newsId/*" element={
                <NewsProvider>
                    <NewsEditorPage />
                </NewsProvider>
            } />
        </Routes>
    )
}

export default NewsAdminRoutes;