import { useTranslation } from "react-i18next";
import { NewsArticle } from "@/types/news/news";
import { DeleteModal } from "@/app/components/modals/delete-modal";

interface NewsDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    newsArticle: NewsArticle | null;
    onConfirm: () => Promise<void>;
    isDeleting: boolean;
}

export const NewsDeleteModal = ({
    isOpen,
    onClose,
    newsArticle,
    onConfirm,
    isDeleting,
}: NewsDeleteModalProps) => {
    const { t } = useTranslation();

    if (!newsArticle) return null;

    return (
        <DeleteModal
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            title={t("news.deleteNews", "Delete News Article")}
            description={t(
                "news.deleteNewsConfirmation",
                "Are you sure you want to delete this news article? This action cannot be undone."
            )}
            onConfirm={onConfirm}
            isDeleting={isDeleting}
            contentClassName="max-w-md"
        >
            <div className="mt-2 p-2 bg-muted rounded">
                <strong>{newsArticle.title}</strong>
            </div>
        </DeleteModal>
    );
};

export default NewsDeleteModal;
