import PageHeader from "@/app/components/page-header";
import { useTranslation } from "react-i18next";
import { useNews } from "../contexts/NewsContext";
import { Button } from "@/components/ui/button";
import { Save, Eye, Edit, Archive, Loader2, Upload, Plus, Trash2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import CustomActionsDropdown from "@/app/components/custom-actions-dropdown";
import { NewsDeleteModal } from "./components/news-delete-modal";
import { useEffect, useRef, useState } from "react";
import {
    Form,
    FormItem,
    FormLabel,
    FormControl,
    FormField,
    FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { uploadFile } from "@/utils/aws";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate, useParams } from "react-router";
import { NewsEditor } from "@/components/ui/news-editor";
import Tag from "@/app/components/tag/tag";
import { postNews, patchNews, deleteNews, getNewsList } from "@/api/orgs/news/admin/news";
import { postOrgFilesUploader } from "@/api/orgs/files/files";

// Zod schema for news form validation
const newsFormSchema = z.object({
    title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
    summary: z.string().min(1, "Summary is required").max(500, "Summary must be less than 500 characters"),
    cover_image_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    slug: z.string()
        .min(1, "Slug is required")
        .max(100, "Slug must be less than 100 characters")
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
    tags: z.array(z.string()).optional(),
    related_news_ids: z.array(z.string()).optional(),
    content: z.string().min(1, "Content is required"),
    status: z.enum(["draft", "published", "archived"]),
});

type NewsFormData = z.infer<typeof newsFormSchema>;

const NewsEditorPage = () => {
    const { t } = useTranslation();
    const { newsArticle, relatedArticles, refreshNews } = useNews();
    const navigate = useNavigate();
    const { orgId, newsId } = useParams<{ newsId: string; orgId: string }>();

    // Determine if we're in create mode by checking the path
    const isCreateMode = newsId === "create";
    // State for image upload
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [uploading, setUploading] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State for tags input
    const [tagInput, setTagInput] = useState<string>("");

    // State for delete dialog
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [relatedNewsItems, setRelatedNewsItems] = useState<any[]>([]);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isSearching, setIsSearching] = useState(false);

    // Form setup
    const form = useForm<NewsFormData>({
        resolver: zodResolver(newsFormSchema),
        defaultValues: {
            title: "",
            summary: "",
            cover_image_url: "",
            slug: "",
            tags: [],
            content: "",
            status: "draft",
            related_news_ids: [],
        }
    });
    const relatedNewsIds = form.watch("related_news_ids") || [];

    // Update form when news data loads
    useEffect(() => {
        if (newsArticle && !isCreateMode) {
            const relatedIds = (relatedArticles || []).map((r: any) => r.id);
            form.reset({
                title: newsArticle.title || "",
                summary: newsArticle.summary || "",
                cover_image_url: newsArticle.cover_image_url || "",
                slug: newsArticle.slug || "",
                tags: newsArticle.tags || [],
                content: newsArticle.content || "",
                status: newsArticle.status || "draft",
                related_news_ids: relatedIds,
            });
            setPreviewImage(newsArticle.cover_image_url || null);
            setRelatedNewsItems(relatedArticles || []);
        }
    }, [newsArticle, relatedArticles, form, isCreateMode]);

    useEffect(() => {
        if (!orgId || !searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const handler = setTimeout(async () => {
            try {
                setIsSearching(true);
                const response = await getNewsList(orgId, searchQuery.trim(), null, ["published"], newsArticle?.id);
                if (response.success) {
                    const newsList = response.success.news || [];
                    const currentIds = form.getValues("related_news_ids") || [];
                    const filtered = newsList.filter((item: any) => !currentIds.includes(item.id));
                    setSearchResults(filtered);
                }
            } catch (error) {
                console.error("Error searching news:", error);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(handler);
    }, [searchQuery, orgId, relatedNewsIds, form, newsArticle?.id]);

    // Normalize diacritics (é → e, à → a, etc.) so they are included in slug instead of stripped
    const normalizeDiacritics = (str: string): string =>
        str.normalize("NFD").replace(/\p{Mark}/gu, "");

    // Generate slug from title
    const generateSlug = (title: string): string => {
        return normalizeDiacritics(title)
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");
    };

    // Normalize slug input (paste/type): diacritics → ASCII, then allow only [a-z0-9-]
    const normalizeSlugInput = (str: string): string => {
        return normalizeDiacritics(str)
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");
    };

    // Handle title change and auto-generate slug
    const handleTitleChange = (title: string) => {
        form.setValue("title", title);
        if (!form.getValues("slug") || form.getValues("slug") === generateSlug(form.getValues("title"))) {
            form.setValue("slug", generateSlug(title));
        }
    };

    // Handle cover image upload
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                toast.error(t("news.file_too_large", "File size must be less than 10MB"));
                return;
            }

            if (!file.type.startsWith('image/')) {
                toast.error(t("news.invalid_file_type", "Please select an image file"));
                return;
            }

            setUploadProgress(0);
            handleUpload(file);
        }
    };

    const handleUpload = async (file: File) => {
        if (!orgId) return;

        setUploading(true);
        try {
            const response = await postOrgFilesUploader(orgId, {
                path: null,
                entity_id: "news",
                name: file.name,
                content_type: file.type,
                content_length: file.size
            });

            if (response.success) {
                const url = await uploadFile(response.success.uploader, file, (progress: number) => {
                    setUploadProgress(progress);
                });
                if (url) {
                    setPreviewImage(url as string);
                    form.setValue("cover_image_url", url as string);
                    toast.success(t("news.upload_success", "Cover image uploaded successfully"));
                }
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error(t("news.upload_error", "Failed to upload cover image"));
        } finally {
            setUploading(false);
        }
    };

    // Handle tags
    const addTag = () => {
        const trimmedTag = tagInput.trim();
        if (trimmedTag && !form.getValues("tags")?.includes(trimmedTag)) {
            const currentTags = form.getValues("tags");
            if ((currentTags?.length || 0) < 10) {
                form.setValue("tags", [...(currentTags || []), trimmedTag]);
                setTagInput("");
            } else {
                toast.error(t("news.max_tags", "Maximum 10 tags allowed"));
            }
        }
    };

    const removeTag = (tagToRemove: string) => {
        const currentTags = form.getValues("tags");
        form.setValue("tags", (currentTags || []).filter((tag: string) => tag !== tagToRemove));
    };

    const handleTagKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addTag();
        }
    };

    const handleAddRelatedNews = (newsItem: any) => {
        if (!newsItem?.id) return;
        if (relatedNewsIds.includes(newsItem.id)) return;

        const updated = [...relatedNewsIds, newsItem.id];
        form.setValue("related_news_ids", updated, { shouldDirty: true });
        setRelatedNewsItems(prev => [...prev, newsItem]);
        setSearchResults(prev => prev.filter(item => item.id !== newsItem.id));
    };

    const handleRemoveRelatedNews = (newsId: string) => {
        const updated = relatedNewsIds.filter((id: string) => id !== newsId);
        form.setValue("related_news_ids", updated, { shouldDirty: true });
        setRelatedNewsItems(prev => prev.filter(item => item.id !== newsId));
    };

    // Form submission
    const onSubmit = async (data: NewsFormData) => {
        if (!orgId) return;

        try {
            // Convert HTML content to Markdown
            const markdownData = {
                ...data,
                related_news_ids: data.related_news_ids || [],
                content: data.content,
                summary: data.summary, // Summary stays as is since it's plain text
            };

            if (isCreateMode) {
                const response = await postNews(orgId, markdownData);
                if (response.success) {
                    toast.success(t("news.create_success", "News article created successfully"));
                    navigate(`/${orgId}/news-admin/${response.success.news_id}`);
                } else {
                    toast.error(t("news.create_error", "Failed to create news article"));
                }
            } else {
                if (!newsArticle?.id) {
                    toast.error(t("news.no_news_id", "News ID not found"));
                    return;
                }
                const response = await patchNews(orgId, newsArticle.id, markdownData);
                if (response.success) {
                    refreshNews();
                    toast.success(t("news.save_success", "News saved successfully"));
                    navigate(`/${orgId}/news-admin/${newsArticle.id || newsArticle.slug}`);
                } else {
                    toast.error(t("news.save_error", "Failed to save news"));
                }
            }
        } catch (error) {
            console.error("Error saving news:", error);
            const errorMessage = isCreateMode
                ? t("news.create_error", "Failed to create news article")
                : t("news.save_error", "Failed to save news");
            toast.error(errorMessage);
        }
    };

    // Delete news
    const handleDelete = async () => {
        if (!newsArticle?.id || !orgId) return;

        setIsDeleting(true);
        try {
            const response = await deleteNews(orgId, newsArticle.id);
            if (response.success) {
                toast.success(t("news.delete_success", "News deleted successfully"));
                navigate(`/${orgId}/news-admin`);
            } else {
                toast.error(t("news.delete_error", "Failed to delete news"));
            }
        } catch (error) {
            console.error("Error deleting news:", error);
            toast.error(t("news.delete_error", "Failed to delete news"));
        } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
        }
    };

    const statusOptions = [
        { value: "draft" as const, label: t("news.status.draft", "Draft"), icon: Edit },
        { value: "published" as const, label: t("news.status.published", "Published"), icon: Eye },
        { value: "archived" as const, label: t("news.status.archived", "Archived"), icon: Archive }
    ];

    // Show loading only when we're not in create mode and we don't have news data yet
    if (!isCreateMode && !newsArticle) {
        return <div className="flex items-center justify-center h-screen">
            <Loader2 className="w-8 h-8 animate-spin" />
        </div>;
    }

    return (
        <>
            <PageHeader
                title={isCreateMode
                    ? (form.watch("title") || t("news.new_post", "New Article"))
                    : (form.watch("title") || newsArticle?.title || t("news.edit_post", "Edit Article"))
                }
                description={isCreateMode
                    ? (form.watch("summary") || t("news.create_description", "Create and manage your article."))
                    : (form.watch("summary") || newsArticle?.summary || t("news.edit_description", "Edit and manage your article."))
                }
                showBackButton={true}
                action={
                    <div className="flex items-center gap-2">
                        <Select
                            value={form.watch("status")}
                            onValueChange={(value) => {
                                form.setValue("status", value as "draft" | "published" | "archived");
                            }}
                        >
                            <SelectTrigger className="w-32">
                                <SelectValue placeholder={t("news.select_status", "Select status")} />
                            </SelectTrigger>
                            <SelectContent>
                                {statusOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            disabled={uploading}
                            onClick={form.handleSubmit(onSubmit)}
                        >
                            <Save className="w-4 h-4" />
                            {isCreateMode ? t("news.create", "Create") : t("news.save", "Save")}
                        </Button>
                        {!isCreateMode && (
                            <CustomActionsDropdown
                                items={[
                                    {
                                        label: t("news.delete", "Delete"),
                                        icon: "trash-2",
                                        onClick: () => setIsDeleteDialogOpen(true),
                                        variant: "destructive",
                                    },
                                ]}
                            />
                        )}
                    </div>
                }
            />

            <Form {...form}>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Sidebar Column */}
                        <div className="space-y-6">
                            <Card className="shadow-none">
                                <CardContent className="space-y-6">
                                    {/* Cover Image */}
                                    <FormField
                                        control={form.control}
                                        name="cover_image_url"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t("news.cover_image", "Cover Image")}</FormLabel>
                                                <FormControl>
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-center">
                                                            <Avatar
                                                                className="w-full h-48 object-cover rounded-md cursor-pointer"
                                                                onClick={() => fileInputRef.current?.click()}
                                                            >
                                                                <AvatarImage
                                                                    src={previewImage || field.value || ""}
                                                                    className="w-full h-full object-cover rounded-md"
                                                                />
                                                                <AvatarFallback className="w-full h-full object-cover rounded-md flex flex-col items-center justify-center text-gray-500">
                                                                    <Upload className="w-8 h-8 mb-2" />
                                                                    <span className="text-xs text-center">
                                                                        {t("news.upload_cover", "Upload Cover")}
                                                                    </span>
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        </div>

                                                        <input
                                                            ref={fileInputRef}
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleFileSelect}
                                                            className="hidden"
                                                        />

                                                        {uploading && (
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div
                                                                    className="bg-primary h-2 rounded-full transition-all duration-300"
                                                                    style={{ width: `${uploadProgress}%` }}
                                                                />
                                                            </div>
                                                        )}

                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => fileInputRef.current?.click()}
                                                            disabled={uploading}
                                                            className="w-full"
                                                        >
                                                            <Upload className="w-4 h-4 mr-2" />
                                                            {uploading ? t("news.uploading", "Uploading...") : t("news.change_cover", "Change Cover")}
                                                        </Button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="slug"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t("news.slug", "Slug")}</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder={t("news.slug_placeholder", "url-friendly-slug")}
                                                        value={field.value}
                                                        ref={field.ref}
                                                        onBlur={field.onBlur}
                                                        onChange={(e) => field.onChange(normalizeSlugInput(e.target.value))}
                                                        onPaste={(e) => {
                                                            e.preventDefault();
                                                            const pasted = e.clipboardData.getData("text");
                                                            const input = e.currentTarget;
                                                            const start = input.selectionStart ?? 0;
                                                            const end = input.selectionEnd ?? 0;
                                                            const current = field.value ?? "";
                                                            const newValue = current.slice(0, start) + normalizeSlugInput(pasted) + current.slice(end);
                                                            field.onChange(normalizeSlugInput(newValue));
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Tags */}
                                    <FormField
                                        control={form.control}
                                        name="tags"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t("news.tags", "Tags")}</FormLabel>
                                                <FormControl>
                                                    <div className="space-y-3">
                                                        <div className="flex gap-2">
                                                            <Input
                                                                placeholder={t("news.add_tag", "Add a tag")}
                                                                value={tagInput}
                                                                onChange={(e) => setTagInput(e.target.value)}
                                                                onKeyDown={handleTagKeyPress}
                                                                className="flex-1"
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="default"
                                                                onClick={addTag}
                                                                disabled={!tagInput.trim() || (field.value?.length || 0) >= 10}
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                            </Button>
                                                        </div>

                                                        <div className="flex flex-wrap gap-2">
                                                            {field.value?.map((tag: string, index: number) => (
                                                                <div key={index} className="cursor-pointer" onClick={() => removeTag(tag)}>
                                                                    <Tag text={tag} withX={true} />
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {field.value?.length === 0 && (
                                                            <p className="text-sm text-muted-foreground">
                                                                {t("news.no_tags", "No tags added yet")}
                                                            </p>
                                                        )}
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="related_news_ids"
                                        render={() => (
                                            <FormItem>
                                                <FormLabel>{t("news.related_articles", "Related News")}</FormLabel>
                                                <FormControl>
                                                    <div className="space-y-3">
                                                        <div className="relative">
                                                            <Input
                                                                placeholder={t("news.search_news", "Search news to add...")}
                                                                value={searchQuery}
                                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                                className="pr-8"
                                                            />
                                                            {isSearching && (
                                                                <Loader2 className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                                                            )}
                                                        </div>

                                                        {searchQuery && !isSearching && searchResults.length === 0 && (
                                                            <p className="text-sm text-muted-foreground">
                                                                {t("news.search_no_results", "No news found for this search.")}
                                                            </p>
                                                        )}

                                                        {searchResults.length > 0 && (
                                                            <div className="space-y-2 max-h-40 overflow-y-auto border border-border rounded-md p-2">
                                                                {searchResults.map((item) => (
                                                                    <div
                                                                        key={item.id}
                                                                        className="flex items-start gap-2 rounded-md border border-border/50 p-2 hover:bg-muted/50 transition-colors"
                                                                    >
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm font-medium line-clamp-1">{item.title}</p>
                                                                            {item.summary && (
                                                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                                                    {item.summary}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => handleAddRelatedNews(item)}
                                                                            className="shrink-0"
                                                                        >
                                                                            <Plus className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {relatedNewsItems.length > 0 ? (
                                                            <div className="space-y-2">
                                                                <p className="text-sm font-medium">
                                                                    {t("news.selected_related", "Selected related news")}
                                                                </p>
                                                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                                                    {relatedNewsItems.map((item) => (
                                                                        <div
                                                                            key={item.id}
                                                                            className="flex items-start gap-2 rounded-md border border-border/50 p-2"
                                                                        >
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-sm font-medium line-clamp-1">{item.title}</p>
                                                                                {item.summary && (
                                                                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                                                                        {item.summary}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                onClick={() => handleRemoveRelatedNews(item.id)}
                                                                                className="shrink-0 text-destructive"
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-muted-foreground">
                                                                {t("news.no_related_selected", "No related news selected yet.")}
                                                            </p>
                                                        )}
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Content Column */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Title */}
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("news.title_field", "Title")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t("news.title_placeholder", "Enter news article title")}
                                                {...field}
                                                onChange={(e) => handleTitleChange(e.target.value)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Summary */}
                            <FormField
                                control={form.control}
                                name="summary"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("news.summary", "Summary")}</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder={t("news.summary_placeholder", "Brief description of your news article")}
                                                className="min-h-[100px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Content */}
                            <FormField
                                control={form.control}
                                name="content"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("news.content", "Content")}</FormLabel>
                                        <FormControl>
                                            <NewsEditor
                                                content={field.value}
                                                onChange={field.onChange}
                                                placeholder={t("news.content_placeholder", "Write your news article content here...")}
                                                className="min-h-[500px]"
                                                innerClassName="!p-0 !m-0"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>


                    </div>
                </div>
            </Form>

            {!isCreateMode && (
                <NewsDeleteModal
                    isOpen={isDeleteDialogOpen}
                    onClose={() => setIsDeleteDialogOpen(false)}
                    newsArticle={newsArticle ?? null}
                    onConfirm={handleDelete}
                    isDeleting={isDeleting}
                />
            )}
        </>
    );
};

export default NewsEditorPage;

