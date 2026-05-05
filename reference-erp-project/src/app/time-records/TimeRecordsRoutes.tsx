import { Route, Routes } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { TimeRecordsSummaryProvider } from "./contexts/TimeRecordsSummaryContext";
import TimeRecordsPage from "./TimeRecordsPage";
import TimeRecordsDetailPage from "./TimeRecordsDetailPage/TimeRecordsDetailPage";


const TimeRecordsRoutes = () => {
    return (
        <Routes>
            <Route path="" element={
                <TimeRecordsSummaryProvider>
                    <TimeRecordsPage />
                </TimeRecordsSummaryProvider>
            } />
            <Route path="all" element={<TimeRecordsDetailPage />} />
            <Route path="*" element={<Navigate to="/time-records" replace />} />
        </Routes>
    );
};

export default TimeRecordsRoutes;

