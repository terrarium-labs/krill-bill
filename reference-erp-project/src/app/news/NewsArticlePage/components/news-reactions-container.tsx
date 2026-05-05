import { useState } from "react";
import { useNews } from "../contexts/NewsContext";
import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SmilePlus } from "lucide-react";
import { postOrgNewsReaction } from "@/api/orgs/news/news";
import { toast } from "sonner";
import {
    EmojiPicker,
    EmojiPickerSearch,
    EmojiPickerContent,
} from "@/components/ui/emoji-picker";
import type { Emoji } from "frimousse";

const NewsReactionsContainer = () => {
    const { reactions, isLoadingReactions, refreshReactions } = useNews();
    const { newsId, orgId } = useParams<{ newsId: string, orgId: string }>();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleReaction = async (emoji: string) => {
        if (!orgId || !newsId || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const response = await postOrgNewsReaction(orgId, newsId, { reaction: emoji });
            if (response.success) {
                refreshReactions();
                setOpen(false);
            } else {
                toast.error("Failed to add reaction");
            }
        } catch (error) {
            console.error("Error handling reaction:", error);
            toast.error("Failed to add reaction");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEmojiSelect = (emoji: Emoji) => {
        handleReaction(emoji.emoji);
    };

    if (isLoadingReactions) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* Existing Reactions */}
            {reactions.map((reaction, index) => (
                <Button
                    key={`${reaction.reaction}-${index}`}
                    variant={reaction.has_reacted ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleReaction(reaction.reaction)}
                    disabled={isSubmitting}
                    className="h-8 px-3 gap-1.5 rounded-full transition-all"
                >
                    <span className="text-base leading-none">{reaction.reaction}</span>
                    <span className="text-xs font-medium">
                        {reaction.number_of_reactions}
                    </span>
                </Button>
            ))}

            {/* Add Reaction Button */}
            <Popover open={open} onOpenChange={setOpen} modal={true}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full"
                        disabled={isSubmitting}
                    >
                        <SmilePlus className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-fit p-0"
                    align="start"
                    side="top"
                >
                    <EmojiPicker
                        onEmojiSelect={handleEmojiSelect}
                        className="h-[368px]"
                    >
                        <EmojiPickerSearch placeholder="Search emoji..." />
                        <EmojiPickerContent />
                    </EmojiPicker>
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default NewsReactionsContainer;

