import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { getCharlesConversationRuns } from "@/api/chat/conversations";
import IdBadge from "@/app/components/id-badge";

type ConversationRawSheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: string | undefined;
    groupId: string | null;
};

const ConversationRawSheet = ({
    open,
    onOpenChange,
    orgId,
    groupId,
}: ConversationRawSheetProps) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [raw, setRaw] = useState<unknown>(null);

    useEffect(() => {
        if (!open || !groupId || !orgId) {
            setRaw(null);
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setRaw(null);

        (async () => {
            const response = await getCharlesConversationRuns(orgId, groupId);
            if (!cancelled) {
                setRaw(response);
                setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [open, groupId, orgId]);

    const text =
        raw === null
            ? ""
            : JSON.stringify(raw, null, 2);

    const copy = () => {
        if (!text) return;
        void navigator.clipboard.writeText(text);
        toast.success(
            t("common.copiedToClipboard", "Copied to clipboard"),
        );
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="flex h-dvh max-h-dvh w-full max-w-full flex-col gap-0 border-0 p-0 inset-y-0 inset-x-0 left-0 right-0 rounded-none data-[state=open]:slide-in-from-right-0 sm:max-w-full"
            >
                <SheetHeader className="shrink-0 border-b px-4 py-3 pr-14">
                    <SheetTitle className="text-lg">
                        {t(
                            "conversations.raw.title",
                            "Conversation response",
                        )}
                    </SheetTitle>
                    <SheetDescription className="flex flex-wrap items-center gap-2">
                        {groupId ? (
                            <>
                                <span className="text-muted-foreground">
                                    {t("conversations.raw.groupId", "Group ID")}
                                </span>
                                <IdBadge id={groupId} hideIcon />
                            </>
                        ) : null}
                    </SheetDescription>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 w-fit"
                        disabled={!text || loading}
                        onClick={copy}
                    >
                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                        {t("common.copy", "Copy")}
                    </Button>
                </SheetHeader>

                <div className="min-h-0 flex-1 overflow-auto bg-muted/30 p-4">
                    {loading ? (
                        <div className="flex h-full min-h-[200px] items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <pre className="wrap-break-word whitespace-pre-wrap font-mono text-xs text-foreground">
                            {text || "—"}
                        </pre>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default ConversationRawSheet;
