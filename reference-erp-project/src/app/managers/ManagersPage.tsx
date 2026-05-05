import PageHeader from "@/app/components/page-header";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router-dom";


const ManagersPage = () => {
    const { t } = useTranslation();
    return (
        <div className="space-y-6">
            <PageHeader
                title={t("managers.title", "Managers")}
                description={t("managers.description", "Manage your organization's managers")}
            />
            <Outlet />
        </div>
    );
};

export default ManagersPage;