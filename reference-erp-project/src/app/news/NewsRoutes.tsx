import { Navigate, Routes, Route, useParams } from "react-router";
import { NewsProvider } from "./NewsArticlePage/contexts/NewsContext";
import NewsArticlePage from "./NewsArticlePage/NewsArticlePage";

const NewsRoutes = () => {
    const { orgId } = useParams<{ orgId: string }>();
    return (
        <Routes>
            {/* Index path will become a page for viewing and navigating all news articles */}
            <Route index element={<Navigate to={`/${orgId}`} replace />} />
            <Route path=":newsId/*" element={
                <NewsProvider>
                    <NewsArticlePage />
                </NewsProvider>
            } />
        </Routes>
    )
}

export default NewsRoutes;